@echo off
cd /d "%~dp0"

echo Iniciando el sistema ROSHAN...
echo.

start "ROSHAN - Backend" cmd /k "07 - Desarrollo\Backend\iniciar-backend.bat"
timeout /t 3 /nobreak >nul

start "ROSHAN - Frontend" cmd /k "07 - Desarrollo\Frontend\iniciar-frontend.bat"
timeout /t 4 /nobreak >nul

start "" "http://localhost:8080"

echo.
echo Listo. Se abrieron dos ventanas negras (Backend y Frontend): dejalas
echo abiertas mientras uses el sistema. Para cerrar el sistema, simplemente
echo cerra esas dos ventanas.
echo.
pause
