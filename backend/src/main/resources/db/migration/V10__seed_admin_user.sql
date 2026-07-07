-- ============================================================
-- V10 - Seed admin/owner user 'marciofs426@gmail.com'
-- ============================================================

INSERT INTO usuarios (nome, email, senha, role, plano, ativo, telefone, nome_oficina)
VALUES (
    'Marcio Administrador', 
    'marciofs426@gmail.com', 
    '$2b$12$j2enNOrCVwZuTL7SjkRyHObX5YU9nNv7sDR5qUttiEArgtvNKjkzK', 
    'ADMIN', 
    'PREMIUM', 
    true, 
    '11999999999', 
    'OSMECH Admins'
)
ON CONFLICT (email)
DO UPDATE SET
    senha = EXCLUDED.senha,
    role = EXCLUDED.role,
    plano = EXCLUDED.plano,
    ativo = EXCLUDED.ativo,
    nome = EXCLUDED.nome;
