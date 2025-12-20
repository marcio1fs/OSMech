#!/bin/bash
echo "========================================"
echo "   OSMech - Backend Server"
echo "========================================"
echo

cd "$(dirname "$0")"

echo "Verificando dependencias..."
if ! pip show fastapi > /dev/null 2>&1; then
    echo "Instalando dependencias..."
    pip install -r requirements.txt
fi

echo
echo "Iniciando servidor em http://localhost:8000"
echo "Documentacao: http://localhost:8000/docs"
echo
echo "Pressione Ctrl+C para encerrar"
echo "========================================"
echo

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
