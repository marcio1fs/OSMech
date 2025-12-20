# OSMech - Gestão Inteligente de Oficinas

## Architecture Overview

**Stack**: React 19 + TypeScript (frontend) / FastAPI + SQLModel (backend)
- Frontend: Vite dev server, Tailwind CSS, Lucide icons
- Backend: Python 3.10+, SQLite database, JWT auth
- AI: Google Gemini API for vehicle diagnostics
- State: React Context + localStorage persistence (legacy) + REST API migration

**Dual State Pattern**: The app is in transition from localStorage-based state to backend API. Some features use `AppContext` (local) while others use API calls via `src/services/api.ts`. When adding features, prefer API-based state management.

## Project Structure

```
App.tsx              # 3000+ line monolith (intentional - legacy design)
types.ts             # Shared types between contexts
backend/
  ├── main.py        # FastAPI app with lifespan startup
  ├── models.py      # SQLModel tables (User, ServiceOrder, etc.)
  ├── auth.py        # JWT token handling
  ├── database.py    # SQLite session management
  └── routes/        # Modular API routes
src/
  ├── components/    # UI primitives + layout + modals
  ├── contexts/      # AuthContext (API) + AppContext (localStorage)
  ├── hooks/         # usePersistentState, useApi, useDebounce
  ├── schemas/       # Zod validation (CPF/CNPJ validators)
  └── services/      # api.ts wrapper + geminiService.ts
```

## Development Workflow

### Running Locally
```bash
# Backend (Terminal 1) - Windows
cd backend && start.bat

# Backend (Terminal 1) - Unix
cd backend && sh start.sh

# Frontend (Terminal 2)
npm run dev
```

**Port Configuration**: Frontend runs on `3001` (not 3000), backend on `8000`. Vite proxy at `/api` → `http://localhost:8000`.

### Environment Variables
Required in `.env.local`:
```env
GEMINI_API_KEY=your_key_here
VITE_API_URL=http://localhost:8000
```

**Critical**: Gemini API key is exposed to browser via `vite.config.ts` define as `process.env.API_KEY`. This is intentional for demo purposes.

### Testing
```bash
npm test              # Vitest watch mode
npm run test:coverage # Coverage report
npm run typecheck     # TSC no-emit
```

Tests use `@testing-library/react` + `vitest`. See `src/test/setup.ts` for global config.

## Code Conventions

### TypeScript Patterns
- **Enums**: Shared between frontend/backend (e.g., `OSStatus`, `UserRole` in both `types.ts` and `models.py`)
- **Optional Chaining**: Extensive use throughout for safe navigation
- **Type Imports**: Use `import type` for type-only imports
- **Path Aliases**: `@/`, `@components/`, `@hooks/`, etc. (see `vite.config.ts`)

### Component Patterns
```tsx
// StatusBadge - Status-to-color mapping
<StatusBadge status={order.status} />

// Modal Pattern - Centralized in src/components/modals/
import { ConfirmationModal, PaymentModal } from '@components/modals';
```

### API Communication
```typescript
// Authentication required for all /users, /orders, etc.
import { apiFetch, setAuthToken } from '@services/api';

const { data, error } = await apiFetch<OrderResponse>('/orders/', {
  method: 'POST',
  body: JSON.stringify(orderData)
});

// Token stored in localStorage as 'osmech_token'
// Auto-redirect to /login on 401
```

### Backend Patterns
```python
# Dependency injection for DB session
@router.get("/orders/")
async def get_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(ServiceOrder)).all()

# Role-based access
from auth import get_current_user, require_admin
user: User = Depends(get_current_user)  # Any authenticated
admin: User = Depends(require_admin)     # Admin only
```

### Database Schema
- **SQLModel** = Pydantic + SQLAlchemy (single class definition)
- **Migrations**: None - SQLModel.metadata.create_all() on startup
- **Default Users**: Created in `main.py` lifespan (admin@osmech.com / admin123)
- **SQLite Path**: `backend/osmech.db` (absolute path to avoid Docker issues)

## Domain-Specific Patterns

### Service Orders (OS)
Status flow: `PENDING → DIAGNOSING → APPROVAL → WAITING_PARTS → IN_PROGRESS → COMPLETED → PAID`

Items structure:
```typescript
{
  type: 'service' | 'part',
  description: string,
  quantity: number,
  unitPrice: number,
  total: number,
  profitMargin?: number  // Parts only
}
```

### Gemini AI Integration
Located in `services/geminiService.ts`:
- Prompt engineering for structured JSON responses
- Vehicle + complaint + mileage → diagnosis with parts/labor estimates
- Model: `gemini-2.5-flash`
- Error handling: Returns `null` on failure (graceful degradation)

### Financial Module
- **Expenses**: Categories (FIXED, VARIABLE, PAYROLL, PARTS, TAXES)
- **Payments**: Methods (CREDIT_CARD, DEBIT_CARD, CASH, PIX)
- **Commissions**: Mechanic commission_rate stored in User model

### Validation Schemas
Custom Zod validators in `src/schemas/validation.ts`:
- Brazilian CPF/CNPJ validation with checksum
- Phone number formatting (BR format)
- Vehicle plate validation (Mercosul + legacy formats)

## Common Tasks

### Adding a New API Endpoint
1. Define model in `backend/models.py` (SQLModel class)
2. Create route in `backend/routes/yourmodule.py`
3. Import router in `backend/main.py`: `app.include_router(yourmodule_router)`
4. Add TypeScript types in `src/types/index.ts`
5. Create API wrapper in `src/services/api.ts`

### Creating UI Components
- Place in `src/components/ui/` for reusable primitives
- Export from `src/components/ui/index.ts`
- Use Tailwind + Lucide icons (already imported)
- Add tests alongside (e.g., `Button.test.tsx`)

### Persistent State
```typescript
// Legacy approach (localStorage)
import { usePersistentState } from '@hooks';
const [data, setData] = usePersistentState('key', initialValue);

// Modern approach (API + React Query pattern)
import { useApi } from '@hooks';
const { data, loading, error, refetch } = useApi(() => api.getOrders());
```

## Known Issues & Quirks

- **App.tsx Monolith**: Intentionally kept as single file (3000+ lines) for rapid prototyping. Future: Split into feature modules.
- **Type Synchronization**: Enums duplicated in TS/Python. Update both when changing statuses.
- **CORS**: Backend allows `localhost:3000/3001/5173` - add ports if needed in `main.py`
- **Docker Volumes**: Backend data persists in `backend-data` volume - SQLite file location
- **Test Coverage**: Currently minimal - focus on validation schemas and UI components

## References
- API Docs: http://localhost:8000/docs (when backend running)
- [Main README](../README.md) - Setup instructions
- [Backend README](../backend/README.md) - API endpoints reference
