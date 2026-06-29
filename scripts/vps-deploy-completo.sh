#!/bin/bash
# =============================================================
# OSMECH — Deploy completo no VPS Hostinger
# Cole este script inteiro no terminal SSH do VPS
# =============================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         OSMECH — Deploy VPS Hostinger        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── 1. Instalar dependências se necessário ─────────────────
echo "[1/8] Verificando dependências..."

if ! command -v docker &>/dev/null; then
  echo "  → Instalando Docker..."
  apt-get update -y -qq
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "  ✓ Docker: $(docker --version)"
fi

if ! docker compose version &>/dev/null; then
  echo "  → Instalando Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
else
  echo "  ✓ Docker Compose: $(docker compose version)"
fi

if ! command -v git &>/dev/null; then
  apt-get install -y git curl wget unzip
fi

# ─── 2. Preparar pasta do projeto ───────────────────────────
echo ""
echo "[2/8] Preparando pasta do projeto..."
mkdir -p /opt/osmech
cd /opt/osmech

# ─── 3. Instalar Flutter e Node.js ────────────────────────────
echo ""
echo "[3/8] Verificando Flutter e Node.js..."
if ! command -v flutter &>/dev/null; then
  echo "  → Instalando Flutter..."
  if [ ! -d "/opt/flutter" ]; then
    git clone https://github.com/flutter/flutter.git -b stable --depth 1 /opt/flutter
  fi
  export PATH="$PATH:/opt/flutter/bin"
  echo 'export PATH="$PATH:/opt/flutter/bin"' >> /etc/profile.d/flutter.sh
  flutter precache --web
  flutter config --enable-web
else
  export PATH="$PATH:/opt/flutter/bin"
  echo "  ✓ Flutter: $(flutter --version 2>&1 | head -1)"
fi

if ! command -v node &>/dev/null; then
  echo "  → Instalando Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "  ✓ Node.js: $(node --version)"
fi

# ─── 4. Verificar que o projeto existe ──────────────────────
echo ""
echo "[4/8] Verificando arquivos do projeto..."
if [ ! -f "/opt/osmech/docker-compose.prod.yml" ]; then
  echo ""
  echo "  ✗ ERRO: Projeto não encontrado em /opt/osmech"
  echo ""
  echo "  Você precisa enviar o projeto para o VPS primeiro."
  echo "  Execute no seu PC Windows (PowerShell):"
  echo ""
  echo '  scp -r "C:\Users\marci\OneDrive\Desktop\vaniaTR\osmech\backend" root@148.230.79.103:/opt/osmech/'
  echo '  scp -r "C:\Users\marci\OneDrive\Desktop\vaniaTR\osmech\frontend" root@148.230.79.103:/opt/osmech/'
  echo '  scp -r "C:\Users\marci\OneDrive\Desktop\vaniaTR\osmech\landing" root@148.230.79.103:/opt/osmech/'
  echo '  scp -r "C:\Users\marci\OneDrive\Desktop\vaniaTR\osmech\nginx" root@148.230.79.103:/opt/osmech/'
  echo '  scp "C:\Users\marci\OneDrive\Desktop\vaniaTR\osmech\docker-compose.prod.yml" root@148.230.79.103:/opt/osmech/'
  echo '  scp "C:\Users\marci\OneDrive\Desktop\vaniaTR\osmech\.env.prod" root@148.230.79.103:/opt/osmech/'
  echo ""
  exit 1
fi
echo "  ✓ Projeto encontrado"

# ─── 5. Verificar .env.prod ─────────────────────────────────
echo ""
echo "[5/8] Verificando .env.prod..."
if [ ! -f "/opt/osmech/.env.prod" ]; then
  echo "  ✗ ERRO: .env.prod não encontrado!"
  exit 1
fi

set -a
. /opt/osmech/.env.prod
set +a

MISSING=""
for var in DB_USERNAME DB_PASSWORD JWT_SECRET CORS_ORIGINS MERCADOPAGO_ACCESS_TOKEN MERCADOPAGO_PUBLIC_KEY; do
  if [ -z "${!var}" ]; then
    MISSING="$MISSING $var"
  fi
done

if [ -n "$MISSING" ]; then
  echo "  ✗ ERRO: Variáveis obrigatórias ausentes:$MISSING"
  exit 1
fi
echo "  ✓ Variáveis de ambiente OK"

# ─── 6. Gerar SSL se não existir ────────────────────────────
echo ""
echo "[6/8] Verificando certificados SSL..."
mkdir -p /opt/osmech/nginx/ssl

if [ ! -f "/opt/osmech/nginx/ssl/fullchain.pem" ]; then
  echo "  → Certificados SSL não encontrados. Gerando com Let's Encrypt..."
  
  # Para container nginx se estiver rodando (liberar porta 80)
  docker stop osmech-nginx 2>/dev/null || true
  
  # Instala certbot se necessário
  if ! command -v certbot &>/dev/null; then
    apt-get install -y certbot
  fi
  
  echo "  → Gerando certificado para osmech.com.br e app.osmech.com.br..."
  certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --expand \
    --email admin@osmech.com.br \
    -d osmech.com.br \
    -d www.osmech.com.br \
    -d app.osmech.com.br || {
      echo "  ✗ Certbot falhou. Verifique se o DNS já aponta para este IP."
      echo "  Tente manualmente: certbot certonly --standalone -d osmech.com.br -d www.osmech.com.br -d app.osmech.com.br"
      exit 1
    }
  
  cp /etc/letsencrypt/live/osmech.com.br/fullchain.pem /opt/osmech/nginx/ssl/
  cp /etc/letsencrypt/live/osmech.com.br/privkey.pem   /opt/osmech/nginx/ssl/
  chmod 644 /opt/osmech/nginx/ssl/*.pem
  echo "  ✓ SSL gerado com sucesso"
else
  echo "  ✓ Certificados SSL já existem"
fi

# ─── 7. Build Frontend (Flutter e Landing) ────────────────────
echo ""
echo "[7/8] Build estáticos..."

# 7.1 Landing Page
echo "  → Construindo Landing Page (Next.js)..."
cd /opt/osmech/landing
npm install --silent
npm run build

# 7.2 Flutter Web
echo "  → Construindo Flutter Web..."
cd /opt/osmech/frontend
flutter pub get
flutter build web --release --base-href /app/ --dart-define=API_URL=https://www.osmech.com.br

if [ ! -f "build/web/index.html" ]; then
  echo "  ✗ ERRO: Build Flutter falhou!"
  exit 1
fi

# 7.3 Mover arquivos para o Nginx (/var/www/osmech.com.br)
echo "  → Movendo arquivos para o Nginx..."
rm -rf /var/www/osmech.com.br
mkdir -p /var/www/osmech.com.br/app

# Copia Landing Page para a raiz
cp -r /opt/osmech/landing/out/* /var/www/osmech.com.br/

# Copia Flutter para a subpasta /app
cp -r /opt/osmech/frontend/build/web/* /var/www/osmech.com.br/app/

echo "  ✓ Builds concluídos e movidos com sucesso"
cd /opt/osmech

# ─── 8. Subir containers Docker ─────────────────────────────
echo ""
echo "[8/8] Subindo containers..."

# Para containers antigos se existirem
docker compose -f /opt/osmech/docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Sobe tudo
docker compose -f /opt/osmech/docker-compose.prod.yml --env-file /opt/osmech/.env.prod up -d --build

echo ""
echo "  ⏳ Aguardando backend ficar saudável (pode levar até 3 min)..."
for i in $(seq 1 18); do
  if docker exec osmech-backend wget -qO- http://localhost:8080/api/actuator/health 2>/dev/null | grep -q '"UP"'; then
    echo "  ✓ Backend UP!"
    break
  fi
  if [ "$i" -eq 18 ]; then
    echo "  ⚠ Backend ainda não respondeu. Verificando logs..."
    docker logs osmech-backend --tail=30
  fi
  echo "    Aguardando... ($i/18)"
  sleep 10
done

# ─── Configurar renovação SSL ────────────────────────────────
cat > /etc/cron.d/certbot-osmech << 'EOF'
0 3 1 * * root certbot renew --quiet --pre-hook "docker stop osmech-nginx" --post-hook "cp /etc/letsencrypt/live/osmech.com.br/fullchain.pem /opt/osmech/nginx/ssl/ && cp /etc/letsencrypt/live/osmech.com.br/privkey.pem /opt/osmech/nginx/ssl/ && docker start osmech-nginx"
EOF

# ─── Status final ────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
docker compose -f /opt/osmech/docker-compose.prod.yml ps
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         ✅  Deploy Concluído!                ║"
echo "║                                              ║"
echo "║  Landing:  https://www.osmech.com.br         ║"
echo "║  App:      https://www.osmech.com.br/app             ║"
echo "║  API:      https://www.osmech.com.br/api/            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
