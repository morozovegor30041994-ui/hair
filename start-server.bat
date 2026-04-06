@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Velvet Hair — сайт из этой папки:
echo  %CD%
echo  Адрес: http://127.0.0.1:8765/
echo  Остановка: закройте это окно или Ctrl+C
echo.
start "" "http://127.0.0.1:8765/?v=%RANDOM%"
python -m http.server 8765 --bind 127.0.0.1 --directory "%~dp0"
pause
