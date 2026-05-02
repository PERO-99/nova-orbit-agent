from pathlib import Path
import tarfile
import zipfile
import sys

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "main.py"
OUT = ROOT / "submission.tar.gz"
OUT_ZIP = ROOT / "submission.zip"

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
    # Create tar.gz
    with tarfile.open(OUT, "w:gz") as tf:
        tf.add(MAIN, arcname="main.py")
    print(f"✓ Created {OUT}")
    
    # Verify tar.gz archive contents
    with tarfile.open(OUT, "r:gz") as tf:
        members = tf.getnames()
        print(f"  Archive contents: {members}")
        if "main.py" not in members:
            print("  WARNING: main.py not found at root level in tar.gz!")
    
    # Also create ZIP as alternative (Kaggle may prefer ZIP)
    with zipfile.ZipFile(OUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(MAIN, arcname="main.py")
    print(f"✓ Created {OUT_ZIP} (ZIP format - recommended)")
    
    # Verify ZIP archive contents
    with zipfile.ZipFile(OUT_ZIP, 'r') as zf:
        members = zf.namelist()
        print(f"  ZIP contents: {members}")
        if "main.py" not in members:
            print("  WARNING: main.py not found at root level in ZIP!")

def main():
    ok = check_main()
    if not ok:
        sys.exit(2)
    make_archive()
    print("\n✓ Submission packages prepared.")
    print("\nTo submit to Kaggle, use either:")
    print(f"  - {OUT} (tar.gz format)")
    print(f"  - {OUT_ZIP} (ZIP format - recommended for Kaggle)")
    print("\nTo validate locally, run:")
    print("  python scripts/validate_submission.py")

if __name__ == '__main__':
    main()
