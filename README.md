# NOVA Agent — Submission-Ready Developer Guide

This repository contains the NOVA Agent for the Orbit Wars Kaggle competition along with a lightweight React demo UI and a small FastAPI backend for local validation and replay storage.

Repository overview
- `main.py` — single-file Kaggle agent (entrypoint: `agent(obs, config)`).
- `server.py` — FastAPI backend exposing run/replay endpoints and lightweight persistence (`data.sqlite`).
- `src/` — React + Vite frontend demo (quick-run button, minimal inspector).
- `scripts/` — helper tools for packaging and local validation (see `prepare_submission.py`, `validate_submission.py`).

Quickstart

1. Create/activate a Python environment (optional but recommended):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

2. Start the backend (port 8000):

```powershell
uvicorn server:app --reload --port 8000
```

3. Start the frontend (separate terminal):

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` to the backend — open the UI and use the footer "Run Quick Test" button to persist a mock run.

API summary
- `GET /api/runs` — list runs (id, name, mode, created_at).
- `GET /api/runs/{id}` — fetch run details (includes `result` with `turns` and `actions`).
- `POST /api/runs/mock` — run a fast local simulation (no Kaggle env required) and persist result.
- `POST /api/runs/upload` — upload and persist an existing replay/result JSON.

Preparing a Kaggle submission

1. Package `main.py` for submission:

```powershell
python scripts/prepare_submission.py
# -> submission.tar.gz
```

2. (Optional) Validate the package locally — requires `kaggle_environments` in the Python interpreter you use:

```powershell
python scripts/validate_submission.py
```

Windows long-path note

On Windows, some Python packages unpack deeply nested files during installation which can trigger an OSError when long-path support is disabled. If you see errors mentioning long paths during `pip install`, either:

- Enable Windows long-path support (Admin + reboot):

```powershell
# Run as Administrator
New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled' -Value 1 -PropertyType DWORD -Force
```

- Or use WSL/Ubuntu for heavy package installs and validation.

Testing and debugging

- Local agent checks: `python test_agent.py` — runs the included validation harness (uses `kaggle_environments` when available).
- API smoke test: `python scripts/test_api_mock.py` — POSTs to `/api/runs/mock` and prints raw response for debugging.
- The backend stores normalized `turns` and `actions` in `data.sqlite` for inspection.

Troubleshooting

- If the UI reports `Unexpected end of JSON input`, ensure the backend is running and reachable at `http://localhost:8000` and that the Vite proxy is active.
- Check `scripts/mock_out.txt` for captured raw responses when debugging the mock API.

Extras

If you want, I can add a small UI view to browse stored runs, a `Makefile` with common tasks, or a CI step that packages and validates the submission automatically.

License & contributors

This project is prepared as a Kaggle competition submission. Feel free to fork and iterate; keep `main.py` self-contained for submission.

---

