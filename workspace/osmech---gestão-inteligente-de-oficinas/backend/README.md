# OSMech Backend

## Requisitos

- Python 3.10+
- pip

## Instalação

```bash
cd backend
pip install -r requirements.txt
```

## Executar

```bash
# Desenvolvimento
uvicorn main:app --reload --port 8000

# Ou simplesmente
python main.py
```

## API Docs

Após iniciar, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Usuários Padrão

Ao iniciar pela primeira vez, são criados automaticamente:

| Email | Senha | Role |
|-------|-------|------|
| admin@osmech.com | admin123 | ADMIN |
| carlos@osmech.com | 123456 | MECHANIC |
| joao@osmech.com | 123456 | MECHANIC |
| pedro@osmech.com | 123456 | MECHANIC |

## Endpoints

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /auth/verify` - Verificar token

### Usuários
- `GET /users/` - Listar usuários
- `GET /users/me` - Dados do usuário logado
- `GET /users/mechanics` - Listar mecânicos
- `POST /users/` - Criar usuário (admin)
- `PATCH /users/{id}` - Atualizar usuário
- `DELETE /users/{id}` - Desativar usuário

### Ordens de Serviço
- `GET /orders/` - Listar OS
- `GET /orders/stats` - Estatísticas
- `GET /orders/{id}` - Detalhes da OS
- `POST /orders/` - Criar OS
- `PATCH /orders/{id}` - Atualizar OS
- `DELETE /orders/{id}` - Remover OS
- `POST /orders/{id}/items` - Adicionar item

### Finanças
- `GET /finance/dashboard` - Dashboard financeiro
- `GET /finance/expenses` - Listar despesas
- `POST /finance/expenses` - Criar despesa
- `PATCH /finance/expenses/{id}` - Atualizar despesa
- `DELETE /finance/expenses/{id}` - Remover despesa
- `GET /finance/reports/monthly` - Relatório mensal

### Estoque
- `GET /inventory/` - Listar itens
- `GET /inventory/categories` - Listar categorias
- `GET /inventory/low-stock` - Itens com estoque baixo
- `POST /inventory/` - Criar item
- `PATCH /inventory/{id}` - Atualizar item
- `POST /inventory/{id}/adjust-stock` - Ajustar estoque
- `DELETE /inventory/{id}` - Remover item

### Logs
- `GET /logs/` - Listar logs (admin)
- `GET /logs/actions` - Tipos de ações
- `GET /logs/by-order/{order_number}` - Logs por OS

### Empresa
- `GET /company` - Configurações
- `PATCH /company` - Atualizar configurações
