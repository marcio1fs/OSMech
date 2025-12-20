@echo off
echo ========================================
echo OSMech - Iniciando Servidores
echo ========================================
echo.

echo [1/2] Iniciando Backend (porta 8000)...
start "OSMech Backend" cmd /k "cd /d %~dp0backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend (porta 3001)...
start "OSMech Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo Servidores iniciados!
echo.
echo Frontend: http://localhost:3001
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
pause
