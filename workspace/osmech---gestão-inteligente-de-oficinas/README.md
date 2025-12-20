<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# OSMech - Gestão Inteligente de Oficinas 🔧

Sistema completo para gestão de oficinas mecânicas com diagnóstico por IA.

## 🚀 Tecnologias

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Recharts (gráficos)
- Lucide React (ícones)
- Google Gemini AI (diagnósticos)

**Design system:** See `docs/DESIGN.md` for colors, spacing, button variants and pagination guidelines.

### Backend
- FastAPI (Python)
- SQLModel + SQLite
- JWT Authentication
- Bcrypt (hash de senhas)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- Python 3.10+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repo-url>
cd osmech---gestão-inteligente-de-oficinas
```

### 2. Configure o Frontend
```bash
npm install
```

### 3. Configure o Backend
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz:
```env
GEMINI_API_KEY=sua_chave_api_gemini
VITE_API_URL=http://localhost:8000
```

## ▶️ Executar

### Backend (Terminal 1)
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
# ou no Windows:
start.bat
```

### Frontend (Terminal 2)
```bash
npm run dev
```

## 🔑 Usuários Padrão

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@osmech.com | admin123 | Administrador |
| carlos@osmech.com | 123456 | Mecânico |
| joao@osmech.com | 123456 | Mecânico |
| pedro@osmech.com | 123456 | Mecânico |

## 📚 API Documentation

Com o backend rodando, acesse:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📁 Estrutura do Projeto

```
osmech/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/            # Componentes base (Card, Badge)
│   │   └── views/         # Views/páginas
│   ├── contexts/          # Contextos React (Auth, App)
│   ├── hooks/             # Hooks customizados
│   ├── services/          # Serviços (API)
│   ├── types/             # Tipos TypeScript
│   └── utils/             # Funções utilitárias
├── backend/               # Backend FastAPI
│   ├── routes/           # Rotas da API
│   ├── models.py         # Modelos SQLModel
│   ├── auth.py           # Autenticação JWT
│   ├── database.py       # Conexão SQLite
│   └── main.py           # App principal
├── App.tsx               # Componente principal
└── package.json          # Dependências Node
```

## ✨ Funcionalidades

- ✅ Dashboard com métricas em tempo real
- ✅ Gestão de Ordens de Serviço (OS)
- ✅ Diagnóstico por IA (Google Gemini)
- ✅ Controle financeiro (receitas/despesas)
- ✅ Gestão de equipe e comissões
- ✅ Controle de estoque
- ✅ Logs de auditoria
- ✅ Geração de PDFs e relatórios
- ✅ Autenticação com JWT
- ✅ Backup/exportação de dados

## 📄 Licença

MIT License
