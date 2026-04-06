@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Velvet Hair — React (Vite), режим разработки:
echo  %CD%
echo  Адрес: http://127.0.0.1:8765/
echo  Остановка: закройте окно или Ctrl+C
echo.
start "" "http://127.0.0.1:8765/?v=%RANDOM%"
call npm run dev -- --port 8765 --host 127.0.0.1
pause
