@echo off
git remote remove origin 2>nul || exit /b 0
git remote add origin https://github.com/PERO-99/nova-orbit-agent.git
git fetch origin || echo fetch failed
git add -A
git commit -m "chore: sync repo" || echo No changes to commit
git branch -M main
git push -u origin main
exit /b %ERRORLEVEL%
