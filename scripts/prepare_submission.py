from pathlib import Path
import tarfile
import sys

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "main.py"
OUT = ROOT / "submission.tar.gz"

def check_main():
    if not MAIN.exists():
        print("ERROR: main.py not found in project root.")
        return False
    text = MAIN.read_text(encoding='utf-8')
    if 'def agent(' not in text:
        print("WARNING: no top-level `def agent(` found in main.py — ensure your Kaggle entrypoint is named `agent`.")
    else:
        print("Found `agent` in main.py.")
    return True

def make_archive():
    with tarfile.open(OUT, "w:gz") as tf:
        tf.add(MAIN, arcname="main.py")
    print(f"Wrote {OUT}")

def main():
    ok = check_main()
    if not ok:
        sys.exit(2)
    make_archive()
    print("Submission package prepared. To validate locally, run the validate script with a Python that has `kaggle_environments` installed:")
    print("  python scripts/validate_submission.py")

if __name__ == '__main__':
    main()
