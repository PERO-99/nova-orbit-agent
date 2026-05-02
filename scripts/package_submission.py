import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "submission.tar.gz"

def make_submission():
    # Include main.py at the archive root
    with tarfile.open(OUT, "w:gz") as tf:
        tf.add(ROOT / "main.py", arcname="main.py")
    print(f"Created {OUT}")

if __name__ == "__main__":
    make_submission()
