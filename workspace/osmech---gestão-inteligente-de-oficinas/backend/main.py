from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from sqlmodel import Session, select
from contextlib import asynccontextmanager

from database import create_db_and_tables, get_session, engine
from models import User, UserRole, CompanySettings
from auth import (
    LoginRequest, LoginResponse, Token,
    authenticate_user, create_access_token, get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
)

# Import routers
from routes.users import router as users_router
from routes.orders import router as orders_router
from routes.finance import router as finance_router
from routes.inventory import router as inventory_router
from routes.logs import router as logs_router
from routes.notifications import router as notifications_router

# ==================== STARTUP ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialização e finalização do app"""
    # Startup
    create_db_and_tables()
    
    # Criar usuário admin padrão se não existir
    with Session(engine) as session:
        admin = session.exec(select(User).where(User.email == "admin@osmech.com")).first()
        if not admin:
            admin_user = User(
                name="Administrador",
                email="admin@osmech.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                phone="(11) 99999-9999",
                specialty="Gestão"
            )
            session.add(admin_user)
            
            # Criar mecânicos padrão
            mecanicos = [
                {"name": "Carlos Silva", "email": "carlos@osmech.com", "specialty": "Motor", "commission_rate": 15},
                {"name": "João Santos", "email": "joao@osmech.com", "specialty": "Elétrica", "commission_rate": 12},
                {"name": "Pedro Lima", "email": "pedro@osmech.com", "specialty": "Suspensão", "commission_rate": 10},
            ]
            
            for mec in mecanicos:
                user = User(
                    name=mec["name"],
                    email=mec["email"],
                    password_hash=get_password_hash("123456"),
                    role=UserRole.MECHANIC,
                    specialty=mec["specialty"],
                    commission_rate=mec["commission_rate"]
                )
                session.add(user)
            
            session.commit()
            print("✅ Usuários padrão criados!")
        
        # Criar configurações da empresa se não existir
        company = session.exec(select(CompanySettings)).first()
        if not company:
            company_settings = CompanySettings(
                name="OSMech Oficina",
                cnpj="00.000.000/0001-00",
                address="Rua das Oficinas, 123 - Centro",
                phone="(11) 3333-3333",
                email="contato@osmech.com",
                subtitle="Gestão Inteligente de Oficinas"
            )
            session.add(company_settings)
            session.commit()
            print("✅ Configurações da empresa criadas!")
    
    yield
    # Shutdown
    print("Encerrando aplicação...")

# ==================== APP ====================

app = FastAPI(
    title="OSMech API",
    description="API para gestão inteligente de oficinas mecânicas",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(orders_router)
app.include_router(finance_router)
app.include_router(inventory_router)
app.include_router(logs_router)
app.include_router(notifications_router)

# ==================== AUTH ROUTES ====================

@app.post("/auth/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    session: Session = Depends(get_session)
):
    """Autenticação de usuário"""
    user = authenticate_user(session, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )
    
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar": user.avatar,
            "specialty": user.specialty
        }
    )

@app.post("/auth/register", response_model=dict)
async def register(
    user_data: dict,
    session: Session = Depends(get_session)
):
    """Registro de novo usuário (apenas para desenvolvimento)"""
    # Verificar se email já existe
    existing = session.exec(select(User).where(User.email == user_data['email'])).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        name=user_data['name'],
        email=user_data['email'],
        password_hash=get_password_hash(user_data['password']),
        role=UserRole.MECHANIC,
        phone=user_data.get('phone'),
        specialty=user_data.get('specialty')
    )
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return {"message": "Usuário criado com sucesso", "id": user.id}

@app.get("/auth/verify")
async def verify_token(current_user: User = Depends(get_current_user)):
    """Verifica se o token é válido"""
    return {
        "valid": True,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        }
    }

# ==================== COMPANY ROUTES ====================

@app.get("/company")
async def get_company(session: Session = Depends(get_session)):
    """Retorna configurações da empresa"""
    company = session.exec(select(CompanySettings)).first()
    if not company:
        return {}
    return company.model_dump()

@app.patch("/company")
async def update_company(
    company_data: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Atualiza configurações da empresa"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores podem editar")
    
    company = session.exec(select(CompanySettings)).first()
    if not company:
        company = CompanySettings(**company_data)
        session.add(company)
    else:
        for key, value in company_data.items():
            if hasattr(company, key):
                setattr(company, key, value)
        session.add(company)
    
    session.commit()
    return {"message": "Configurações atualizadas"}

# ==================== ROOT ====================

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "online",
        "service": "OSMech API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Health check detalhado"""
    return {
        "status": "healthy",
        "database": "connected",
        "service": "OSMech API"
    }

# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
