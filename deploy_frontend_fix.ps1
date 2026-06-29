# ============================================================
# OSMECH — Deploy Correcão de Impressão (Frontend)
# Envia os arquivos corrigidos e reconstrói o Flutter Web no VPS
# ============================================================

$vpsUser = "root"
$vpsHost = "148.230.79.103"
$remote  = "${vpsUser}@${vpsHost}"
$baseDir = "/opt/osmech"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  OSMECH - Deploy: Correção de Impressão" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Enviar arquivos corrigidos
Write-Host "[1/3] Enviando arquivos corrigidos..." -ForegroundColor Yellow

$files = @(
    "frontend/lib/pages/os_detail_page.dart",
    "frontend/lib/utils/receipt_print_web.dart"
)

foreach ($f in $files) {
    Write-Host "  -> $f"
    & scp -o StrictHostKeyChecking=no $f "${remote}:${baseDir}/$f"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERRO] Falha ao enviar $f" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  OK" -ForegroundColor Green
Write-Host ""

# 2. Executar build e atualização no VPS
Write-Host "[2/3] Executando build do Flutter no VPS (isso pode levar ~2 min)..." -ForegroundColor Yellow

$buildCmd = "cd ${baseDir}/frontend && " +
            "export PATH=`"PATH:/opt/flutter/bin`" && " +
            "flutter build web --release --base-href /app/ --dart-define=API_URL=https://www.osmech.com.br && " +
            "rm -rf /var/www/osmech.com.br/app/* && " +
            "cp -r build/web/* /var/www/osmech.com.br/app/"

& ssh -o StrictHostKeyChecking=no $remote $buildCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERRO] Falha no build ou na cópia dos arquivos no VPS" -ForegroundColor Red
    exit 1
}

Write-Host "  OK - Frontend atualizado!" -ForegroundColor Green
Write-Host ""

# 3. Limpar cache do Nginx (opcional, mas recomendado)
Write-Host "[3/3] Reiniciando Nginx para garantir aplicação..." -ForegroundColor Yellow
& ssh -o StrictHostKeyChecking=no $remote "docker restart osmech-nginx"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Deploy Concluído com Sucesso!" -ForegroundColor Green
Write-Host "  A correção de impressão já está online." -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
