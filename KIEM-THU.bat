@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
call npm test
if errorlevel 1 (
  echo [LOI] Mot so phep kiem thu khong dat.
) else (
  echo [OK] Cac phep kiem thu dat.
)
pause
