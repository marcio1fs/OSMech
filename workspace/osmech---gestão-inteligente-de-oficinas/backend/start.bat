@echo off
echo ========================================
echo    OSMech - Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando dependencias...
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando dependencias...
    pip install -r requirements.txt
)

echo.
echo Iniciando servidor em http://localhost:8000
echo Documentacao: http://localhost:8000/docs
echo.
echo Pressione Ctrl+C para encerrar
echo ========================================
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
