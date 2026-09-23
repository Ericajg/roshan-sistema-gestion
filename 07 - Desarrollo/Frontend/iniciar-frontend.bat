@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
if not exist ".output\server\index.mjs" (
    echo No existe la version de produccion todavia. Generandola...
    call npm run build
)
set PORT=8080
node .output\server\index.mjs
pause
