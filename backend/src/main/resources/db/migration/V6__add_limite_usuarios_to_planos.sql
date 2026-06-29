-- ============================================================
-- V6 - Adiciona limite de usuários aos planos
-- ============================================================

ALTER TABLE planos ADD COLUMN limite_usuarios INTEGER DEFAULT 0;

-- Atualiza limites existentes se necessário
UPDATE planos SET limite_usuarios = 1 WHERE codigo = 'FREE';
UPDATE planos SET limite_usuarios = 3 WHERE codigo = 'BASICO';
UPDATE planos SET limite_usuarios = 6 WHERE codigo = 'PRO';
UPDATE planos SET limite_usuarios = 15 WHERE codigo = 'EMPRESARIAL' OR codigo = 'PRO_PLUS';
