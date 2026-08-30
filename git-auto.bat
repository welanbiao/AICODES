@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".cursor\hooks\auto-commit-push.ps1"
echo.
echo Done. Check git log / GitHub for the latest push.
pause
