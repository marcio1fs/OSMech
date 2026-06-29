# ============================================================
# OSMECH — Deploy Traefik + HTTPS Automático (CORRIGIDO)
# ============================================================

$vpsUser = "root"
$vpsHost = "148.230.79.103"
$remote  = "${vpsUser}@${vpsHost}"
$baseDir = "/opt/osmech"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  OSMECH - Migração para Traefik (Tentativa 2)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# ---------- 1. Envia arquivos de configuração ----------
Write-Host "[1/3] Enviando arquivos de configuração..." -ForegroundColor Yellow

$transfers = @(
    "docker-compose.traefik.yml",
    "docker-compose.prod.yml",
    "nginx/nginx.conf",
    "traefik/traefik.yml",
    "acme.json"
)

foreach ($t in $transfers) {
    Write-Host "  -> $t"
    $remotePath = "$baseDir/$t"
    & scp -o StrictHostKeyChecking=no $t "${remote}:${remotePath}"
}

# ---------- 2. Envia script de reinicialização CORRIGIDO ----------
Write-Host "[2/3] Enviando script de aplicação..." -ForegroundColor Yellow
$scriptContent = @"
#!/bin/bash
set -e
cd /opt/osmech

echo "=========================================="
echo "  OSMECH - Deploy com Traefik + HTTPS"
echo "=========================================="
echo ""

# Criar pastas necessárias
echo "[1/5] Criando estrutura de diretórios..."
mkdir -p traefik
mkdir -p nginx
mkdir -p /var/www/osmech.com.br

# Criar rede do traefik se não existir
echo "[2/5] Garantindo que a rede traefik-proxy existe..."
docker network create traefik-proxy 2>/dev/null || true

# Preparar arquivo acme.json com permissões corretas
echo "[3/5] Preparando arquivo de certificados..."
if [ ! -f acme.json ]; then
  echo '{}' > acme.json
fi
chmod 600 acme.json

# Iniciar Traefik
echo "[4/5] Iniciando Traefik..."
docker compose -f docker-compose.traefik.yml pull traefik
docker compose -f docker-compose.traefik.yml up -d --remove-orphans

# Aguardar Traefik ficar pronto
echo "[5/5] Aguardando Traefik ficar pronto..."
sleep 10

# Iniciar aplicação (nginx + backend)
echo ""
echo "Iniciando aplicação..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --remove-orphans

echo ""
echo "=========================================="
echo "  Deploy concluído!"
echo "=========================================="
echo ""
echo "Verifique os containers:"
docker compose -f docker-compose.traefik.yml ps
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Acesse:"
echo "  - App: https://www.osmech.com.br"
echo "  - App SubDomínio: https://app.osmech.com.br"
echo "  - Dashboard Traefik: https://traefik.osmech.com.br"
"@

$scriptContent | Out-File -FilePath "apply_traefik_v2.sh" -Encoding ascii
& scp -o StrictHostKeyChecking=no apply_traefik_v2.sh "${remote}:/opt/osmech/apply_traefik_v2.sh"
Remove-Item "apply_traefik_v2.sh"

# ---------- 3. Executa a migração no servidor ----------
Write-Host "[3/3] Aplicando mudanças na VPS..." -ForegroundColor Yellow
& ssh -o StrictHostKeyChecking=no $remote "chmod +x /opt/osmech/apply_traefik_v2.sh && /opt/osmech/apply_traefik_v2.sh"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Migração concluída! Verifique seu site." -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
