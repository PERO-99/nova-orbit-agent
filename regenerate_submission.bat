@echo off
cd c:\kagel project
echo Regenerating submission archive...
python scripts/prepare_submission.py
echo.
echo Verify the ZIP can be opened:
python -c "import zipfile; z = zipfile.ZipFile('submission.zip'); print('✓ ZIP valid'); print('Contents:', z.namelist()); z.close()"
