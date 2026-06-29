# ============================================================
# OSMECH — Deploy: Logo no recibo + botao Copiar corrigido
# Arquivos alterados (apenas frontend):
#   - frontend/lib/pages/os_detail_page.dart
#   - frontend/lib/utils/receipt_print_web.dart
#   - frontend/lib/utils/receipt_print_stub.dart
#
# SEM alteracoes em: backend, banco, nginx, docker
# Execute: .\deploy_logo_recibo.ps1
# ============================================================

$vpsUser = "root"
$vpsHost = "148.230.79.103"
$remote  = "${vpsUser}@${vpsHost}"
$baseDir = "/opt/osmech"
$appDir  = "/var/www/osmech.com.br/app"
$apiUrl  = "https://www.osmech.com.br"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  OSMECH - Deploy: Logo no Recibo + Copiar fix" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Escopo: apenas frontend (3 arquivos Dart)" -ForegroundColor Gray
Write-Host "  Sem restart de backend ou banco de dados." -ForegroundColor Gray
Write-Host ""

# ── 1. Envia os 3 arquivos Dart alterados ──────────────────────
Write-Host "[1/4] Enviando arquivos Dart corrigidos para o VPS..." -ForegroundColor Yellow

$files = @(
    "frontend/lib/pages/os_detail_page.dart",
    "frontend/lib/utils/receipt_print_web.dart",
    "frontend/lib/utils/receipt_print_stub.dart"
)

foreach ($f in $files) {
    Write-Host "  -> $f" -ForegroundColor Gray
    & scp -o StrictHostKeyChecking=no $f "${remote}:${baseDir}/$f"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERRO] Falha ao enviar $f" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  Arquivos enviados com sucesso!" -ForegroundColor Green
Write-Host ""

# ── 2. Build do Flutter Web no VPS ────────────────────────────
Write-Host "[2/4] Executando 'flutter build web' no VPS (~2-3 min)..." -ForegroundColor Yellow

$buildCmd = @'
set -e
cd /opt/osmech/frontend
export PATH="$PATH:/opt/flutter/bin"
flutter pub get --no-precompile 2>&1 | tail -5
flutter build web --release --base-href /app/ --dart-define=API_URL=https://www.osmech.com.br 2>&1 | tail -20
echo "Build OK"
'@

& ssh -o StrictHostKeyChecking=no $remote $buildCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  [ERRO] Falha no build Flutter no VPS." -ForegroundColor Red
    Write-Host "  Verifique o log acima e rode:" -ForegroundColor Yellow
    Write-Host "    ssh root@${vpsHost} 'cd /opt/osmech/frontend && flutter build web --release'" -ForegroundColor White
    exit 1
}

Write-Host "  Build concluido!" -ForegroundColor Green
Write-Host ""

# ── 3. Atualiza os arquivos no webroot ────────────────────────
Write-Host "[3/4] Publicando novo build em ${appDir}..." -ForegroundColor Yellow

$deployCmd = @'
set -e
rm -rf /var/www/osmech.com.br/app/*
cp -r /opt/osmech/frontend/build/web/* /var/www/osmech.com.br/app/
chown -R www-data:www-data /var/www/osmech.com.br/app 2>/dev/null || true
chmod -R 755 /var/www/osmech.com.br/app
echo "Publicado OK"
'@

& ssh -o StrictHostKeyChecking=no $remote $deployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERRO] Falha ao publicar os arquivos no webroot." -ForegroundColor Red
    exit 1
}

Write-Host "  Arquivos publicados!" -ForegroundColor Green
Write-Host ""

# ── 4. Reload do nginx (sem derrubar o backend) ───────────────
Write-Host "[4/4] Recarregando Nginx (sem downtime)..." -ForegroundColor Yellow

& ssh -o StrictHostKeyChecking=no $remote "docker exec osmech-nginx nginx -s reload"

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [AVISO] nginx reload falhou, tentando restart..." -ForegroundColor Yellow
    & ssh -o StrictHostKeyChecking=no $remote "docker restart osmech-nginx"
}

Write-Host "  Nginx recarregado!" -ForegroundColor Green
Write-Host ""

# ── Resumo ────────────────────────────────────────────────────
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Deploy concluido com sucesso!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  O que foi publicado:" -ForegroundColor White
Write-Host "  [+] Logo da oficina aparece no modal 'Ver Recibo'" -ForegroundColor White
Write-Host "  [+] Logo aparece na impressao do recibo (HTML)" -ForegroundColor White
Write-Host "  [+] Botao 'Copiar' agora copia o recibo de verdade" -ForegroundColor White
Write-Host ""
Write-Host "  Teste em: https://www.osmech.com.br/app/" -ForegroundColor Cyan
Write-Host ""
