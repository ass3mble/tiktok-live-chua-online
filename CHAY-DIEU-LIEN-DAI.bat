@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
if not exist "node_modules\express" (
  echo Chua cai dat thu vien. Chay CAI-DAT.bat truoc.
  pause
  exit /b 1
)
set "HOST=127.0.0.1"
set "PORT=3000"
echo ================================================
echo    DIEU LIEN DAI - PHAT TRUC TIEP
echo ================================================
echo Dieu khien: http://127.0.0.1:3000
echo Chanh dien: http://127.0.0.1:3000/?obs=1
echo Dao trang: http://127.0.0.1:3000/?obs=1^&scene=dao
echo Quan tri: http://127.0.0.1:3000/admin
echo.
echo Bam Ctrl+C de dung may chu.
echo.
node server.js
if errorlevel 1 (
  echo.
  echo [LOI] May chu dung bat thuong, kiem tra thong bao phia tren.
  pause
)
