from pathlib import Path
import zipfile
import sys
import os

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "main.py"
OUT_ZIP = ROOT / "submission.zip"

def check_main():
    if not MAIN.exists():
        print(f"ERROR: main.py not found at {MAIN}")
        return False
    try:
        content = MAIN.read_text(encoding='utf-8')
        if 'def agent(' not in content:
            print("WARNING: no top-level `def agent(` found in main.py")
        else:
            print(f"✓ Found `agent()` in main.py ({len(content)} bytes)")
        return True
    except Exception as e:
        print(f"ERROR reading main.py: {e}")
        return False

def make_zip():
    """Create submission.zip with main.py at root level."""
    try:
        # Remove old archive if exists
        if OUT_ZIP.exists():
            os.remove(OUT_ZIP)
            print(f"Removed old {OUT_ZIP}")
        
        # Create fresh ZIP with main.py at root
        with zipfile.ZipFile(OUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Read main.py content as bytes
            main_content = MAIN.read_bytes()
            # Write directly to ZIP root with name "main.py"
            zf.writestr("main.py", main_content)
        
        print(f"✓ Created {OUT_ZIP}")
        
        # Verify ZIP structure
        with zipfile.ZipFile(OUT_ZIP, 'r') as zf:
            names = zf.namelist()
            print(f"  ZIP contents: {names}")
            
            # Check if main.py is exactly at root
            if "main.py" not in names:
                print("  ❌ ERROR: main.py NOT in archive!")
                return False
            
            # Verify no subdirectories
            if any('/' in name for name in names):
                print(f"  ❌ ERROR: Files in subdirectories found: {names}")
                return False
            
            # Verify content matches
            archived_content = zf.read("main.py")
            if archived_content == main_content:
                print(f"  ✓ Verified: main.py content matches ({len(archived_content)} bytes)")
            else:
                print(f"  ❌ ERROR: Content mismatch!")
                return False
        
        return True
    except Exception as e:
        print(f"❌ ERROR creating archive: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=== NOVA Agent Submission Package ===\n")
    
    if not check_main():
        sys.exit(1)
    
    print("\nCreating submission archive...")
    if not make_zip():
        sys.exit(1)
    
    print(f"\n✅ READY FOR SUBMISSION!")
    print(f"\nSubmit to Kaggle: {OUT_ZIP}")
    print(f"File size: {OUT_ZIP.stat().st_size} bytes")

if __name__ == '__main__':
    main()
