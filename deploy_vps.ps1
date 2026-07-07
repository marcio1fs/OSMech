# ============================================================
# OSMECH — Deploy parcial: login + recibo
# Copia os 3 arquivos alterados e reconstroi so o container backend
# ============================================================

$vpsUser = "root"
$vpsHost = "148.230.79.103"
$remote  = "${vpsUser}@${vpsHost}"
$baseDir = "/opt/osmech"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  OSMECH - Deploy parcial: login + recibo" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# ---------- 1. Envia os 3 arquivos corrigidos ----------
Write-Host "[1/3] Enviando arquivos corrigidos para o VPS..." -ForegroundColor Yellow

$transfers = @(
    "backend/src/main/java/com/osmech/auth/service/AuthService.java",
    "frontend/lib/pages/register_page.dart",
    "backend/src/main/java/com/osmech/os/controller/OsWhatsAppController.java",
    "backend/src/main/java/com/osmech/os/service/OrdemServicoService.java",
    "backend/src/main/resources/application.yml",
    "docker-compose.prod.yml",
    "nginx/nginx.conf"
)

foreach ($t in $transfers) {
    Write-Host "  -> $t"
    $remotePath = "$baseDir/$t"
    & scp -o StrictHostKeyChecking=no $t "${remote}:${remotePath}"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERRO] Falha ao enviar $t" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  OK - arquivos enviados!" -ForegroundColor Green
Write-Host ""

# ---------- 2. Envia o script de rebuild ----------
Write-Host "[2/3] Enviando script de rebuild..." -ForegroundColor Yellow
& scp -o StrictHostKeyChecking=no rebuild_backend.sh "${remote}:/opt/osmech/rebuild_backend.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERRO] Falha ao enviar rebuild_backend.sh" -ForegroundColor Red
    exit 1
}
Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# ---------- 3. Executa o rebuild no servidor ----------
Write-Host "[3/3] Reconstruindo backend na VPS (leva ~3 min)..." -ForegroundColor Yellow
Write-Host ""

& ssh -o StrictHostKeyChecking=no $remote "chmod +x /opt/osmech/rebuild_backend.sh && /opt/osmech/rebuild_backend.sh"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Deploy concluido!" -ForegroundColor Green
Write-Host "  Login sem verificacao de email : CORRIGIDO" -ForegroundColor Green
Write-Host "  Recibo de reimpressao OS       : CORRIGIDO" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
