# ============================================================
# OSMECH — Atualizar Traefik (Versão com Network Mode Host)
# ============================================================

$vpsUser = "root"
$vpsHost = "148.230.79.103"
$remote  = "${vpsUser}@${vpsHost}"

# Tentando a pasta padrão do root
$traefikDir = "/root" 

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  Atualizando Traefik (Modo Host + E-mail)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Conteúdo que você enviou (com o ajuste da rede para não quebrar o osmech)
$newTraefikYaml = @"
services:
  traefik:
    image: traefik:latest
    container_name: traefik
    restart: unless-stopped
    network_mode: host
    command:
      - --api.dashboard=false
      - --api.insecure=false
      - --log.level=INFO
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
      - --certificatesresolvers.letsencrypt.acme.email=support@osmech.com.br
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
    volumes:
      - traefik-letsencrypt:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro

volumes:
  traefik-letsencrypt:
"@

# 2. Envia para o VPS
$newTraefikYaml | Out-File -FilePath "traefik-compose.yml" -Encoding ascii
Write-Host "Enviando para o VPS..." -ForegroundColor Yellow
& scp -o StrictHostKeyChecking=no traefik-compose.yml "${remote}:${traefikDir}/docker-compose-traefik.yml"
Remove-Item "traefik-compose.yml"

# 3. Reinicia o Traefik
Write-Host "Aplicando mudanças..." -ForegroundColor Yellow
& ssh -o StrictHostKeyChecking=no $remote "cd $traefikDir && docker compose -f docker-compose-traefik.yml up -d --force-recreate"

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  Traefik atualizado com sucesso!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
