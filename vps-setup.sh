#!/bin/bash
# =============================================================
# OSMECH — Setup inicial do VPS Hostinger (Ubuntu 22.04)
# Execute este script uma única vez após criar o VPS
# Uso: bash vps-setup.sh SEU_DOMINIO.COM.BR
# =============================================================
set -e

DOMAIN=${1:-""}

if [ -z "$DOMAIN" ]; then
  echo "ERRO: Informe o dominio."
  echo "Uso: bash vps-setup.sh app.seudominio.com.br"
  exit 1
fi

echo "=========================================="
echo " OSMECH — Setup VPS Hostinger"
echo " Dominio: $DOMAIN"
echo "=========================================="

# 1. Atualizar sistema
echo "[1/7] Atualizando sistema..."
apt-get update -y && apt-get upgrade -y

# 2. Instalar dependências
echo "[2/7] Instalando dependencias (Docker, Git, Certbot)..."
apt-get install -y git curl wget unzip certbot

# Instalar Docker via script oficial
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Docker Compose plugin
apt-get install -y docker-compose-plugin

# 3. Instalar Flutter (para build do frontend no VPS)
echo "[3/7] Instalando Flutter..."
cd /opt
git clone https://github.com/flutter/flutter.git -b stable --depth 1
export PATH="$PATH:/opt/flutter/bin"
echo 'export PATH="$PATH:/opt/flutter/bin"' >> /etc/profile.d/flutter.sh
flutter precache --web
flutter config --enable-web

# 4. Clonar o projeto (se ainda não foi clonado)
echo "[4/7] Preparando diretorio do projeto..."
mkdir -p /opt/osmech
echo ""
echo "→ Agora copie o projeto para /opt/osmech no VPS"
echo "  (via git clone ou scp conforme guia)"
echo ""

# 5. Gerar SSL com Certbot (Let's Encrypt)
echo "[5/7] Gerando certificado SSL para $DOMAIN..."
echo ""
echo "IMPORTANTE: Certifique-se que o DNS do dominio JA aponta para o IP deste VPS!"
echo "Pressione ENTER para continuar ou Ctrl+C para pular este passo..."
read -r

# Para o nginx se estiver rodando (para liberar porta 80)
docker stop osmech-nginx 2>/dev/null || true

certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@$DOMAIN \
  -d $DOMAIN

# 6. Copiar certificados SSL para pasta do projeto
echo "[6/7] Configurando certificados SSL..."
mkdir -p /opt/osmech/nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/osmech/nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem  /opt/osmech/nginx/ssl/
chmod 644 /opt/osmech/nginx/ssl/*.pem

# 7. Configurar renovação automática do SSL
echo "[7/7] Configurando renovacao automatica do SSL..."
cat > /etc/cron.d/certbot-osmech << EOF
# Renova SSL todo dia 1 às 3h da manhã
0 3 1 * * root certbot renew --quiet --pre-hook "docker stop osmech-nginx" --post-hook "cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/osmech/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/osmech/nginx/ssl/ && docker start osmech-nginx"
EOF

echo ""
echo "=========================================="
echo " Setup concluido!"
echo ""
echo " Proximos passos:"
echo " 1. Vá para /opt/osmech"
echo " 2. Copie .env.prod.example para .env.prod e preencha"
echo " 3. Execute: ./deploy.sh $DOMAIN"
echo "=========================================="
