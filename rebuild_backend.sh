#!/bin/bash
# Script executado no VPS para reconstruir APENAS o backend
# Correcoes: usa --env-file, --no-cache, e nao toca no postgres
set -e
cd /opt/osmech

echo ""
echo "=== OSMECH: Rebuild parcial do backend ==="
echo ""

# Verifica se o .env.prod existe
if [ ! -f ".env.prod" ]; then
  echo "ERRO: .env.prod nao encontrado em /opt/osmech!"
  exit 1
fi

# Sobe o postgres se estiver parado (sem recriar)
echo "[0] Garantindo que o postgres esta rodando..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres
echo "    Aguardando postgres ficar saudavel..."
for i in $(seq 1 12); do
  if docker exec osmech-postgres pg_isready -q 2>/dev/null; then
    echo "    Postgres OK!"
    break
  fi
  echo "    Aguardando postgres... ($i/12)"
  sleep 5
done

# Para apenas o backend (sem mexer no postgres)
echo ""
echo "[1] Parando container backend..."
docker compose -f docker-compose.prod.yml --env-file .env.prod stop backend
docker compose -f docker-compose.prod.yml --env-file .env.prod rm -f backend

# Reconstroi a imagem forcando recompilacao (--no-cache)
echo ""
echo "[2] Reconstruindo imagem backend (--no-cache, leva ~3-5 min)..."
docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache backend

# Sobe o backend novo
echo ""
echo "[3] Subindo novo backend..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d backend

# Aguarda ficar saudavel
echo ""
echo "[4] Aguardando backend ficar saudavel (max 3 min)..."
for i in $(seq 1 18); do
  if docker exec osmech-backend wget -qO- http://localhost:8080/api/actuator/health 2>/dev/null | grep -q '"UP"'; then
    echo "    Backend UP!"
    break
  fi
  if [ "$i" -eq 18 ]; then
    echo "    AVISO: Backend nao respondeu em 3 min. Verificando logs..."
    docker logs osmech-backend --tail=30
  fi
  echo "    Aguardando... ($i/18)"
  sleep 10
done

echo ""
echo "=== Status final ==="
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
echo ""
echo "=== Deploy concluido! ==="
