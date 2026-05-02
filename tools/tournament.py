"""Tournament and hyperparameter sweep harness for Orbit Wars.

Usage:
  python tools/tournament.py --rounds 10

This script will run small tournaments using `kaggle_environments` (if installed).
It supports simple hyperparameter sweeps by monkeypatching `main`'s scoring functions
temporarily for the duration of each experiment, then storing the results in the
SQLite DB used by the FastAPI server (`data.sqlite`).
"""
import argparse
import importlib
import json
import time
from statistics import mean

try:
    from kaggle_environments import make
except Exception as e:
    raise SystemExit("kaggle_environments is required for tournament runs. Install with `pip install kaggle_environments`")

DB = "data.sqlite"


def ensure_db():
    import sqlite3
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            mode TEXT,
            created_at TEXT,
            result_json TEXT
        )
    ''')
    conn.commit()
    conn.close()


def run_episode(agent_a, agent_b, seed=None):
    env = make("orbit_wars", debug=True, configuration={"seed": seed} if seed is not None else None)
    res = env.run([agent_a, agent_b])
    final = res[-1]
    # final is list of states for each player
    scores = [s.get("reward", 0) for s in final]
    status = [s.get("status") for s in final]
    return scores, status


def monkeypatch_main(params):
    """Monkeypatch selected behaviors in main.py according to params.

    Supported params keys (optional):
      - discount: float (overrides discount used in planet_npv)
      - reserve_mult: float (multiplies reserve ratio)
      - expand_mult, attack_mult: floats to scale npv for neutral/enemy
    """
    import main
    import types

    orig_planet_npv = getattr(main, "planet_npv")
    orig_phase_weights = getattr(main, "phase_weights")

    def patched_planet_npv(target, source, step, travel_turns, player, fleets):
        # call original but override local discount if provided
        if "discount" in params:
            # replicate original function but replace discount
            discount = float(params["discount"])
            remaining = max(1, 500 - step - travel_turns)
            prod_value = 0
            cap = min(int(remaining), 200)
            for t in range(cap):
                prod_value += target.production * (discount ** t)

            if target.owner == -1:
                garrison_at_arrival = target.ships + 1
            else:
                garrison_at_arrival = target.ships + target.production * travel_turns + 1

            opp_cost = source.production * travel_turns * 0.4
            center_d = main.orbital_dist(target.x, target.y)
            strategic = (1 - center_d / 72) * target.production * 1.5
            neutral_mult = 1.3 if target.owner == -1 else 1.0
            threat = 0
            for f in fleets:
                if f.owner == player:
                    continue
                fa = main.angle_to(f.x, f.y, target.x, target.y)
                diff = abs(main.normalize_angle(f.angle - fa))
                if diff < 0.25:
                    threat += f.ships * 0.4

            score = (prod_value - garrison_at_arrival * 0.8 - opp_cost + strategic - threat) * neutral_mult
            return score
        else:
            return orig_planet_npv(target, source, step, travel_turns, player, fleets)

    def patched_phase_weights(phase):
        base = orig_phase_weights(phase)
        # Apply multipliers if provided
        out = base.copy()
        if "reserve_mult" in params:
            out["reserve"] = out.get("reserve", 0.2) * float(params["reserve_mult"])
        if "expand_mult" in params and "expand" in out:
            out["expand"] = out["expand"] * float(params["expand_mult"])
        if "attack_mult" in params and "attack" in out:
            out["attack"] = out["attack"] * float(params["attack_mult"])
        return out

    main.planet_npv = patched_planet_npv
    main.phase_weights = patched_phase_weights

    return ("planet_npv", orig_planet_npv), ("phase_weights", orig_phase_weights)


def restore_main(orig_list):
    import main
    for name, func in orig_list:
        setattr(main, name, func)


def store_result(name, params, summary):
    # lightweight DB insert to runs table; store summary as JSON
    import sqlite3, datetime
    ensure_db()
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO runs (name, mode, created_at, result_json) VALUES (?, ?, ?, ?)", (
        name, "sweep", datetime.datetime.utcnow().isoformat(), json.dumps({"params": params, "summary": summary})
    ))
    conn.commit()
    rowid = c.lastrowid
    conn.close()
    return rowid


def main_cli():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rounds", type=int, default=8)
    parser.add_argument("--seeds", type=int, default=3)
    args = parser.parse_args()

    # Example sweep (small, intended as a starting point)
    sweep = [
        {"discount": 0.985, "reserve_mult": 1.0, "expand_mult": 1.0, "attack_mult": 1.0},
        {"discount": 0.99, "reserve_mult": 0.9, "expand_mult": 1.1},
        {"discount": 0.98, "reserve_mult": 1.2, "attack_mult": 1.2},
    ]

    results = []
    for i, params in enumerate(sweep):
        wins = []
        scores = []
        times = []
        for seed in range(args.seeds):
            start = time.time()
            # monkeypatch
            orig = monkeypatch_main(params)
            import main as main_agent

            def wrapper_a(obs, config=None):
                return main_agent.agent(obs, config)

            def wrapper_b(obs, config=None):
                return "random"

            sc, status = run_episode(wrapper_a, wrapper_b, seed=seed)
            restore_main(orig)
            elapsed = time.time() - start
            times.append(elapsed)
            scores.append(sc[0])
            wins.append(1 if sc[0] > sc[1] else (0.5 if sc[0] == sc[1] else 0))

        summary = {"mean_score": mean(scores), "win_rate": mean(wins), "avg_time": mean(times)}
        print(f"Sweep {i+1}/{len(sweep)} params={params} -> {summary}")
        rid = store_result(f"sweep-{i+1}", params, summary)
        results.append({"params": params, "summary": summary, "run_id": rid})

    print("Done. Stored results:")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main_cli()
