# README - Script de Backup Automático

## Visão Geral
Script de backup automático para banco de dados PostgreSQL do sistema OSMECH.

## Requisitos
- PostgreSQL client (pg_dump) instalado
- Bash 4.0+
- Acesso ao banco de dados PostgreSQL

## Variáveis de Ambiente

### Obrigatórias
```bash
DB_NAME=osmech_db          # Nome do banco de dados
DB_USER=osmech_user        # Usuário do banco
DB_HOST=localhost          # Host do banco
DB_PORT=5432              # Porta do banco
PGPASSWORD=sua_senha      # Senha do banco
```

### Opcionais
```bash
BACKUP_DIR=/var/backups/osmech        # Diretório de backup (padrão: /var/backups/osmech)
RETENTION_DAYS=30                     # Dias de retenção (padrão: 30)
LOG_FILE=/var/log/osmech/backup.log   # Arquivo de log (padrão: /var/log/osmech/backup.log)
ENCRYPTION_ENABLED=false              # Habilitar criptografia (padrão: false)
ENCRYPTION_KEY=sua_chave              # Chave de criptografia GPG
```

### Cloud Storage (Opcional)
```bash
ENABLE_S3_UPLOAD=false                # Habilitar upload S3
S3_BUCKET=meu-bucket                  # Bucket S3
AWS_PROFILE=default                   # Perfil AWS

ENABLE_GCS_UPLOAD=false               # Habilitar upload GCS
GCS_BUCKET=meu-bucket                 # Bucket GCS

ENABLE_NOTIFICATIONS=false            # Habilitar notificações
NOTIFICATION_WEBHOOK=url_webhook      # URL do webhook
```

## Uso

### Execução Manual
```bash
# Configurar variáveis de ambiente
export DB_NAME=osmech_db
export DB_USER=osmech_user
export DB_PASSWORD=minha_senha
export PGPASSWORD=$DB_PASSWORD

# Executar backup
./scripts/backup.sh
```

### Agendamento com Cron (Linux)
```bash
# Editar crontab
crontab -e

# Adicionar backup diário às 2:00 AM
0 2 * * * /workspace/backend/scripts/backup.sh >> /var/log/osmech/backup_cron.log 2>&1
```

### Agendamento com Docker Compose
```yaml
services:
  osmech-backup:
    image: postgres:15
    volumes:
      - ./scripts:/scripts
      - ./backups:/var/backups/osmech
    environment:
      - DB_NAME=osmech_db
      - DB_USER=osmech_user
      - DB_HOST=db
      - PGPASSWORD=${DB_PASSWORD}
    command: >
      bash -c "
        apt-get update && apt-get install -y cron
        echo '0 2 * * * /scripts/backup.sh' | crontab -
        cron -f
      "
```

## Estrutura dos Backups

Os backups são salvos no formato:
```
backup_osmech_db_YYYYMMDD_HHMMSS.sql.gz
```

Se criptografia estiver habilitada:
```
backup_osmech_db_YYYYMMDD_HHMMSS.sql.gz.gpg
```

## Recuperação de Backup

### Restaurar Backup Local
```bash
# Descomprimir (se necessário)
gunzip backup_osmech_db_20250101_020000.sql.gz

# Restaurar
psql -h localhost -U osmech_user -d osmech_db < backup_osmech_db_20250101_020000.sql
```

### Restaurar Backup Criptografado
```bash
# Descriptografar
gpg -d backup_osmech_db_20250101_020000.sql.gz.gpg > backup.sql.gz

# Descomprimir
gunzip backup.sql.gz

# Restaurar
psql -h localhost -U osmech_user -d osmech_db < backup.sql
```

## Logs

Os logs são salvos em `/var/log/osmech/backup.log` e incluem:
- Timestamp de início e fim
- Tamanho do backup
- Status de cada etapa
- Erros e warnings

## Monitoramento

### Verificar Último Backup
```bash
ls -lht /var/backups/osmech/backup_*.sql* | head -1
```

### Verificar Integridade
```bash
# Testar integridade do arquivo gzip
gzip -t backup_osmech_db_20250101_020000.sql.gz

# Se criptografado, testar descriptografia
gpg -d backup_osmech_db_20250101_020000.sql.gz.gpg > /dev/null
```

## Troubleshooting

### Erro: pg_dump não encontrado
```bash
# Instalar PostgreSQL client
sudo apt-get install postgresql-client
# ou
sudo yum install postgresql
```

### Erro: Permissão negada
```bash
# Tornar script executável
chmod +x scripts/backup.sh

# Criar diretório de backup
sudo mkdir -p /var/backups/osmech
sudo chown $USER:$USER /var/backups/osmech
```

### Erro: Conexão com banco falhou
```bash
# Verificar conexão
psql -h localhost -U osmech_user -d osmech_db

# Verificar se banco está no ar
pg_isready -h localhost -p 5432
```

## Segurança

- **Criptografia**: Habilite com `ENCRYPTION_ENABLED=true` para backups sensíveis
- **Permissões**: Restrinja acesso ao diretório de backup (chmod 700)
- **Cloud**: Use IAM roles ou service accounts para uploads S3/GCS
- **Logs**: Monitore logs para detectar falhas ou tentativas de acesso não autorizado

## Melhores Práticas

1. **Teste Restaurações**: Periodicamente teste a restauração de backups
2. **Backup Offsite**: Mantenha cópias em cloud storage (S3, GCS)
3. **Monitoramento**: Configure alertas para falhas de backup
4. **Rotação**: Ajuste `RETENTION_DAYS` conforme necessidade
5. **Documentação**: Mantenha documentação atualizada de procedimentos de recovery
