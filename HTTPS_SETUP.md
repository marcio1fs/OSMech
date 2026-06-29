# 🚀 Setup HTTPS com Traefik + Let's Encrypt

## 📋 O que foi feito

1. **Adicionado `app.osmech.com.br`** às rotas do Traefik
2. **Criado docker-compose.traefik.yml** para gerenciar o Traefik separadamente
3. **Configurado Let's Encrypt automático** com renovação de certificados
4. **Adicionado redirecionamento HTTP → HTTPS** forçado
5. **Criado arquivo de configuração traefik.yml** com todas as melhores práticas

## ⚙️ Antes de fazer Deploy

### 1. Alterar o Email Let's Encrypt

Edite os arquivos:

#### `traefik/traefik.yml`
```yaml
email: seu-email-real@osmech.com.br  # ← Colocar seu email aqui
```

#### `docker-compose.traefik.yml`
```yaml
TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_EMAIL: "seu-email-real@osmech.com.br"
```

### 2. Garantir DNS Configurado

Os domínios precisam estar apontando para o IP da VPS:
- `osmech.com.br` → `148.230.79.103`
- `www.osmech.com.br` → `148.230.79.103`
- `app.osmech.com.br` → `148.230.79.103`

## 🚀 Para fazer Deploy

```powershell
# No seu PC (Windows)
.\deploy_traefik.ps1
```

O script vai:
1. ✅ Enviar todos os arquivos necessários
2. ✅ Criar rede do Traefik
3. ✅ Iniciar Traefik (port 80 e 443)
4. ✅ Iniciar aplicação (nginx + backend)
5. ✅ Pedir certificado SSL automaticamente ao Let's Encrypt

## 🔍 Verificar Status Após Deploy

Na VPS:
```bash
# Ver containers
docker ps

# Ver logs do Traefik
docker compose -f docker-compose.traefik.yml logs -f

# Ver logs da aplicação
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f backend
```

## 🎯 Acessar o Dashboard do Traefik

Após deploy, você pode acessar:
```
https://traefik.osmech.com.br
```

(Configure HTTP Basic Auth para segurança adicional)

## 🔐 SSL Perfeito

Agora todos os domínios terão:
- ✅ Certificado SSL válido (Let's Encrypt)
- ✅ HTTPS forçado (HTTP → HTTPS 301)
- ✅ Renovação automática de certificados
- ✅ Sem aviso de "conexão não é particular"

## 📝 Domínios Suportados

- `https://osmech.com.br` (redireciona para www)
- `https://www.osmech.com.br`
- `https://app.osmech.com.br`

## ⚠️ Se der erro de certificado

Se ainda vir "Conexão não é particular" após deploy:

1. Aguarde 5-10 minutos (Let's Encrypt está processando)
2. Limpe cache do navegador (Ctrl+Shift+Delete)
3. Tente em navegador anônimo/privado
4. Verifique DNS: `nslookup www.osmech.com.br`

Se persistir, verifique logs:
```bash
ssh root@148.230.79.103
cd /opt/osmech
docker compose -f docker-compose.traefik.yml logs traefik | grep -i "error\|challenge"
```

## 🛠️ Troubleshooting

### Traefik não inicia
```bash
docker compose -f docker-compose.traefik.yml logs traefik
```

### Certificado não é emitido
```bash
# Verificar arquivo acme.json
ls -la acme.json
# Deve ter permissões 600
chmod 600 acme.json
```

### Usar Let's Encrypt Staging (teste)
No `traefik/traefik.yml`, descomente a linha de staging:
```yaml
caServer: https://acme-staging-v02.api.letsencrypt.org/directory
```

Teste assim, depois remova para produção.
