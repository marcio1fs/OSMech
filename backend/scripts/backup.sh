#!/bin/bash

# Script de Backup Automático do Banco de Dados PostgreSQL
# OSMECH - Sistema de Gestão para Oficinas Mecânicas

# Configurações
DB_NAME="${DB_NAME:-osmech_db}"
DB_USER="${DB_USER:-osmech_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/osmech}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="${LOG_FILE:-/var/log/osmech/backup.log}"
ENCRYPTION_ENABLED="${ENCRYPTION_ENABLED:-false}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-}"

# Criar diretórios se não existirem
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Timestamp para o nome do arquivo
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
ENCRYPTED_FILE="${COMPRESSED_FILE}.gpg"

# Função de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função de erro
error_exit() {
    log "ERRO: $1"
    exit 1
}

# Iniciar backup
log "=========================================="
log "Iniciando backup do banco: $DB_NAME"
log "=========================================="

# Verificar se pg_dump está disponível
if ! command -v pg_dump &> /dev/null; then
    error_exit "pg_dump não encontrado. Instale o PostgreSQL client."
fi

# Exportar senha do banco (se PGPASSWORD estiver definido)
if [ -n "$PGPASSWORD" ]; then
    export PGPASSWORD
fi

# Realizar dump do banco
log "Realizando dump do banco de dados..."
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    log "Dump realizado com sucesso: $BACKUP_FILE"
else
    error_exit "Falha ao realizar dump do banco de dados"
fi

# Comprimir backup
log "Comprimindo backup..."
if gzip -c "$BACKUP_FILE" > "$COMPRESSED_FILE"; then
    rm "$BACKUP_FILE"
    log "Backup comprimido: $COMPRESSED_FILE"
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log "Tamanho do backup: $BACKUP_SIZE"
else
    error_exit "Falha ao comprimir backup"
fi

# Criptografar backup (opcional)
if [ "$ENCRYPTION_ENABLED" = "true" ] && [ -n "$ENCRYPTION_KEY" ]; then
    log "Criptografando backup..."
    echo "$ENCRYPTION_KEY" | gpg --batch --yes --passphrase-fd 0 -c "$COMPRESSED_FILE" 2>> "$LOG_FILE"
    if [ $? -eq 0 ]; then
        rm "$COMPRESSED_FILE"
        log "Backup criptografado: $ENCRYPTED_FILE"
        FINAL_FILE="$ENCRYPTED_FILE"
    else
        log "AVISO: Falha na criptografia, mantendo backup comprimido"
        FINAL_FILE="$COMPRESSED_FILE"
    fi
else
    FINAL_FILE="$COMPRESSED_FILE"
fi

# Verificar integridade do backup
log "Verificando integridade do backup..."
if [ -f "$FINAL_FILE" ] && [ -s "$FINAL_FILE" ]; then
    log "Backup verificado com sucesso"
else
    error_exit "Backup corrompido ou vazio"
fi

# Remover backups antigos
log "Removendo backups mais antigos que $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql*" -type f -mtime +$RETENTION_DAYS -delete 2>> "$LOG_FILE"
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql*" -type f | wc -l)
log "Backups restantes: $REMAINING_BACKUPS"

# Upload para cloud storage (opcional - AWS S3)
if [ "$ENABLE_S3_UPLOAD" = "true" ]; then
    log "Upload para S3..."
    if command -v aws &> /dev/null; then
        aws s3 cp "$FINAL_FILE" "s3://${S3_BUCKET}/backups/" 2>> "$LOG_FILE"
        if [ $? -eq 0 ]; then
            log "Backup enviado para S3 com sucesso"
        else
            log "AVISO: Falha no upload para S3"
        fi
    else
        log "AVISO: AWS CLI não instalado, pulando upload S3"
    fi
fi

# Upload para cloud storage (opcional - Google Cloud Storage)
if [ "$ENABLE_GCS_UPLOAD" = "true" ]; then
    log "Upload para Google Cloud Storage..."
    if command -v gsutil &> /dev/null; then
        gsutil cp "$FINAL_FILE" "gs://${GCS_BUCKET}/backups/" 2>> "$LOG_FILE"
        if [ $? -eq 0 ]; then
            log "Backup enviado para GCS com sucesso"
        else
            log "AVISO: Falha no upload para GCS"
        fi
    else
        log "AVISO: gsutil não instalado, pulando upload GCS"
    fi
fi

# Enviar notificação (opcional)
if [ "$ENABLE_NOTIFICATIONS" = "true" ]; then
    log "Enviando notificação..."
    # Exemplo: enviar email ou webhook
    # curl -X POST "$NOTIFICATION_WEBHOOK" -d "{\"status\":\"success\",\"backup\":\"$FINAL_FILE\",\"size\":\"$BACKUP_SIZE\"}"
fi

log "=========================================="
log "Backup concluído com sucesso!"
log "Arquivo: $FINAL_FILE"
log "Tamanho: $BACKUP_SIZE"
log "=========================================="

exit 0
