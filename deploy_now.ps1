# =================================================================
# OSMECH — Deploy dos fixes: nginx logo + impressao iframe
# Execute: .\deploy_now.ps1
# Sera pedida a senha do VPS (root@148.230.79.103) algumas vezes.
# =================================================================

$VPS      = "148.230.79.103"
$USER     = "root"
$REMOTE   = "${USER}@${VPS}"
$SSH      = "C:\Windows\System32\OpenSSH\ssh.exe"
$SCP      = "C:\Windows\System32\OpenSSH\scp.exe"
$SSH_OPTS = "-o StrictHostKeyChecking=no"

$BuildSrc = ".\frontend\build\web\*"
$RemoteApp = "/var/www/osmech.com.br/app"
$NginxConf = ".\nginx\nginx.conf"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OSMECH Deploy - Fixes de logo/impressao" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Envia o nginx.conf corrigido ──────────────────────────────
Write-Host "[1/4] Enviando nginx.conf corrigido para o VPS..." -ForegroundColor Yellow
Write-Host "      (sera pedida a senha do root)" -ForegroundColor Gray
& $SCP $SSH_OPTS $NginxConf "${REMOTE}:/etc/nginx/nginx.conf.tmp"
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no scp do nginx.conf" -ForegroundColor Red; exit 1 }

# ── 2. Substitui o nginx.conf e recarrega o nginx ────────────────
Write-Host ""
Write-Host "[2/4] Aplicando nginx.conf e recarregando nginx..." -ForegroundColor Yellow
Write-Host "      (sera pedida a senha do root)" -ForegroundColor Gray
& $SSH $SSH_OPTS $REMOTE "cp /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf ; docker exec osmech-nginx nginx -t ; docker exec osmech-nginx nginx -s reload"
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO ao recarregar nginx" -ForegroundColor Red; exit 1 }
Write-Host "   Nginx recarregado!" -ForegroundColor Green

# ── 3. Envia o build Flutter para /var/www/osmech.com.br/app ─────
Write-Host ""
Write-Host "[3/4] Enviando build Flutter (fix da impressao) para o VPS..." -ForegroundColor Yellow
Write-Host "      (sera pedida a senha do root - pode demorar alguns minutos)" -ForegroundColor Gray
& $SCP $SSH_OPTS -r $BuildSrc "${REMOTE}:${RemoteApp}/"
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no envio do build Flutter" -ForegroundColor Red; exit 1 }

# ── 4. Ajusta permissoes ─────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Ajustando permissoes no VPS..." -ForegroundColor Yellow
& $SSH $SSH_OPTS $REMOTE "chown -R www-data:www-data ${RemoteApp} 2>/dev/null || true ; chmod -R 755 ${RemoteApp}"
if ($LASTEXITCODE -ne 0) { Write-Host "AVISO: erro nas permissoes (nao critico)" -ForegroundColor Yellow }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deploy concluido com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Fixes aplicados:" -ForegroundColor White
Write-Host "  - Logo no recibo PDF: nginx corrigido (^~ /uploads/)" -ForegroundColor White
Write-Host "  - Impressao em branco: iframe 800x600 no Flutter" -ForegroundColor White
Write-Host ""
Write-Host "  Teste em: https://www.osmech.com.br/app/" -ForegroundColor Cyan
Write-Host ""
