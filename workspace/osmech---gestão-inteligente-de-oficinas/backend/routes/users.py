from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import get_session
from models import User, UserCreate, UserRead, UserUpdate, UserRole, AuditLog
from auth import get_current_user, get_current_admin, get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserRead])
async def list_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    active_only: bool = True
):
    """Lista todos os usuários"""
    statement = select(User)
    if active_only:
        statement = statement.where(User.active == True)
    users = session.exec(statement).all()
    return users

@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retorna dados do usuário logado"""
    return current_user

@router.get("/mechanics", response_model=List[UserRead])
async def list_mechanics(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista apenas mecânicos ativos"""
    statement = select(User).where(User.role == UserRole.MECHANIC, User.active == True)
    users = session.exec(statement).all()
    return users

@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Busca usuário por ID"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.post("/", response_model=UserRead)
async def create_user(
    user_data: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Cria novo usuário (apenas admin)"""
    # Verificar se email já existe
    statement = select(User).where(User.email == user_data.email)
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Criar usuário
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        phone=user_data.phone,
        role=user_data.role,
        specialty=user_data.specialty,
        commission_rate=user_data.commission_rate or 0
    )
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Registrar log
    log = AuditLog(
        action="CREATE",
        target_id=str(user.id),
        user_id=current_user.id,
        user_name=current_user.name,
        details=f"Usuário {user.name} criado"
    )
    session.add(log)
    session.commit()
    
    return user

@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Atualiza usuário"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar permissão (admin ou próprio usuário)
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Sem permissão para editar este usuário")
    
    # Atualizar campos
    update_data = user_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Desativa usuário (soft delete) - apenas admin"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Não é possível desativar a si mesmo")
    
    user.active = False
    user.updated_at = datetime.utcnow()
    session.add(user)
    
    # Registrar log
    log = AuditLog(
        action="DELETE",
        target_id=str(user.id),
        user_id=current_user.id,
        user_name=current_user.name,
        details=f"Usuário {user.name} desativado"
    )
    session.add(log)
    session.commit()
    
    return {"message": "Usuário desativado com sucesso"}
