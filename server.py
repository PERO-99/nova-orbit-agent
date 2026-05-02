from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import json
import datetime

DB_PATH = "data.sqlite"


MIGRATIONS = [
    (1, '''
        CREATE TABLE IF NOT EXISTS runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            mode TEXT,
            created_at TEXT,
            result_json TEXT
        )
    '''),
    (2, '''
        CREATE TABLE IF NOT EXISTS turns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL,
            step INTEGER,
            raw_json TEXT,
            FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE
        )
    '''),
    (3, '''
        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            turn_id INTEGER NOT NULL,
            from_planet INTEGER,
            angle REAL,
            ships INTEGER,
            raw_json TEXT,
            FOREIGN KEY(turn_id) REFERENCES turns(id) ON DELETE CASCADE
        )
    '''),
]


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        '''
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            migration_id INTEGER UNIQUE,
            applied_at TEXT
        )
        '''
    )
    conn.commit()

    # Apply migrations in order
    c.execute("SELECT migration_id FROM migrations")
    applied = {r[0] for r in c.fetchall()}
    for mid, sql in MIGRATIONS:
        if mid in applied:
            continue
        c.executescript(sql)
        c.execute("INSERT INTO migrations (migration_id, applied_at) VALUES (?, ?)", (mid, datetime.datetime.utcnow().isoformat()))
        conn.commit()

    conn.close()


init_db()

app = FastAPI(title="NOVA Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunCreate(BaseModel):
    name: str = "quick-run"


def insert_run(name: str, mode: str, result: dict):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO runs (name, mode, created_at, result_json) VALUES (?, ?, ?, ?)",
        (name, mode, datetime.datetime.utcnow().isoformat(), json.dumps(result)),
    )
    conn.commit()
    run_id = c.lastrowid

    # If result contains turns, store them normalized
    turns = result.get("turns") if isinstance(result, dict) else None
    if isinstance(turns, list):
        for tr in turns:
            step = tr.get("step") if isinstance(tr, dict) else None
            raw_turn = json.dumps(tr)
            c.execute("INSERT INTO turns (run_id, step, raw_json) VALUES (?, ?, ?)", (run_id, step, raw_turn))
            turn_id = c.lastrowid
            actions = tr.get("actions") if isinstance(tr, dict) else None
            if isinstance(actions, list):
                for a in actions:
                    try:
                        # Expect [from_planet, angle, ships]
                        if isinstance(a, (list, tuple)) and len(a) >= 3:
                            from_pid = int(a[0])
                            angle = float(a[1])
                            ships = int(a[2])
                            raw_a = json.dumps(a)
                            c.execute("INSERT INTO actions (turn_id, from_planet, angle, ships, raw_json) VALUES (?, ?, ?, ?, ?)", (turn_id, from_pid, angle, ships, raw_a))
                        else:
                            # store raw representation
                            c.execute("INSERT INTO actions (turn_id, raw_json) VALUES (?, ?)", (turn_id, json.dumps(a)))
                    except Exception:
                        c.execute("INSERT INTO actions (turn_id, raw_json) VALUES (?, ?)", (turn_id, json.dumps(a)))

    conn.commit()
    conn.close()
    return run_id


@app.get("/api/runs")
def list_runs():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, mode, created_at FROM runs ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "mode": r[2], "created_at": r[3]} for r in rows]


@app.get("/api/runs/{run_id}")
def get_run(run_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, mode, created_at, result_json FROM runs WHERE id = ?", (run_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"id": row[0], "name": row[1], "mode": row[2], "created_at": row[3], "result": json.loads(row[4])}


@app.post("/api/runs/mock")
def create_mock_run(payload: RunCreate):
    """Run a quick local agent simulation (no kaggle env required) and store the actions."""
    try:
        # Import agent and run a few turns with a mock observation
        from main import agent

        mock_obs = {
            "player": 0,
            "step": 0,
            "angular_velocity": 0.035,
            "planets": [
                [0, 0, 20.0, 20.0, 2.6, 10, 3],
                [1, -1, 50.0, 30.0, 1.7, 25, 2],
                [2, -1, 35.0, 50.0, 2.1, 15, 3],
                [3, 1, 80.0, 80.0, 2.6, 10, 3],
                [4, -1, 65.0, 45.0, 1.0, 40, 1],
                [5, -1, 50.0, 70.0, 2.6, 8, 4],
            ],
            "fleets": [],
            "initial_planets": [],
            "comet_planet_ids": [],
            "comets": [],
            "remainingOverageTime": 60.0,
        }

        mock_config = {
            "episodeSteps": 500,
            "actTimeout": 1,
            "shipSpeed": 6.0,
            "sunRadius": 10.0,
            "boardSize": 100.0,
            "cometSpeed": 4.0,
        }

        turns = []
        for t in range(6):
            mock_obs["step"] = t
            # simple production tick for owned planets
            for p in mock_obs["planets"]:
                if p[1] == 0:
                    p[5] += p[6]
            try:
                actions = agent(mock_obs, mock_config)
            except Exception as e:
                actions = []
            turns.append({"step": t, "actions": actions})

        result = {"turns": turns}
        run_id = insert_run(payload.name, "mock", result)
        return {"id": run_id, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/runs/upload")
def upload_run(payload: dict):
    """Store an uploaded replay/result JSON into the DB."""
    name = payload.get("name", "upload")
    result = payload.get("result", payload)
    run_id = insert_run(name, "upload", result)
    return {"id": run_id}
