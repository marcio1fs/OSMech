-- ============================================================
-- V7 - Adiciona campos de verificação de email e recuperação de senha
-- ============================================================

ALTER TABLE usuarios ADD COLUMN email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN reset_password_token VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN reset_password_token_expiry TIMESTAMP;
