@echo off
cd c:\kagel project
git add -A
git commit -m "fix: ensure main.py at archive root and add ZIP format support"
git push origin main
echo Push completed
