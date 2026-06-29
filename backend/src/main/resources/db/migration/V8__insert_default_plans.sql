-- ============================================================
-- V8 - Insere os planos padrão e categorias do sistema
-- ============================================================

-- Insere os planos se não existirem
INSERT INTO planos (codigo, nome, preco, limite_os, limite_usuarios, whatsapp_habilitado, ia_habilitada, descricao, ativo)
VALUES 
('FREE', 'GRATUITO', 0.00, 10, 1, FALSE, FALSE, 'Até 10 OS/mês e 1 mecânico. Ideal para começar.', TRUE),
('BASICO', 'BÁSICO', 49.90, 0, 3, FALSE, FALSE, 'Ordens ilimitadas e até 3 mecânicos.', TRUE),
('PRO', 'PRO', 79.90, 0, 6, TRUE, FALSE, 'Dashboard completo, suporte e até 6 mecânicos.', TRUE),
('PRO_PLUS', 'PRO+', 149.90, 0, 15, TRUE, TRUE, 'Recursos avançados, IA e até 15 mecânicos.', TRUE)
ON CONFLICT (codigo) DO UPDATE SET
    limite_os = EXCLUDED.limite_os,
    limite_usuarios = EXCLUDED.limite_usuarios,
    descricao = EXCLUDED.descricao;

-- Insere categorias financeiras do sistema se a tabela estiver vazia
INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Serviço OS', 'ENTRADA', 'build', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Venda Balcão', 'ENTRADA', 'storefront', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Venda Balcão' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Outros Recebimentos', 'ENTRADA', 'attach_money', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Outros Recebimentos' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Peças e Materiais', 'SAIDA', 'settings', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Peças e Materiais' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Salários', 'SAIDA', 'people', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Salários' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Aluguel', 'SAIDA', 'home', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Aluguel' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Energia Elétrica', 'SAIDA', 'bolt', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Energia Elétrica' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Água', 'SAIDA', 'water_drop', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Água' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Internet/Telefone', 'SAIDA', 'wifi', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Internet/Telefone' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Impostos', 'SAIDA', 'receipt_long', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Impostos' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Manutenção', 'SAIDA', 'handyman', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Manutenção' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Combustível', 'SAIDA', 'local_gas_station', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Combustível' AND sistema = TRUE);

INSERT INTO categorias_financeiras (nome, tipo, icone, sistema, criado_em)
SELECT 'Outras Despesas', 'SAIDA', 'money_off', TRUE, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras WHERE nome = 'Outras Despesas' AND sistema = TRUE);
