@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ================================================
echo     DIEU LIEN DAI - CAI DAT
echo ================================================
where node >nul 2>&1
if errorlevel 1 (
  echo [LOI] Chua co Node.js. Can cai Node.js 20 tro len.
  pause
  exit /b 1
)
call npm ci
if errorlevel 1 goto fail
where uv >nul 2>&1
if errorlevel 1 (
  echo [LUU Y] Chua co uv. Giọng doc ZeroTTS chua the cai dat.
  echo Cai uv va chay lai de co giong doc tieng Viet.
  pause
  exit /b 0
)
if not exist ".venv\Scripts\python.exe" (
  uv venv --python 3.11 .venv
  if errorlevel 1 goto fail
)
uv pip install --python ".venv\Scripts\python.exe" zerotts pillow
if errorlevel 1 goto fail
".venv\Scripts\python.exe" tools\chuan-bi-mo-hinh.py
if errorlevel 1 goto fail
echo.
echo [OK] Da cai dat xong. Chay CHAY-DIEU-LIEN-DAI.bat de khoi dong.
pause
exit /b 0
:fail
echo [LOI] Cai dat chua hoan tat. Xem thong bao phia tren.
pause
exit /b 1
