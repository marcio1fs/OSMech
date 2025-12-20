from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from database import get_session
from models import AuditLog, User
from auth import get_current_user, get_current_admin

router = APIRouter(prefix="/logs", tags=["Audit Logs"])

@router.get("/", response_model=List[dict])
async def list_logs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin),
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0
):
    """Lista logs de auditoria (apenas admin)"""
    statement = select(AuditLog)
    
    if action:
        statement = statement.where(AuditLog.action == action)
    if user_id:
        statement = statement.where(AuditLog.user_id == user_id)
    
    statement = statement.order_by(AuditLog.timestamp.desc())
    statement = statement.offset(offset).limit(limit)
    
    logs = session.exec(statement).all()
    return [log.model_dump() for log in logs]

@router.get("/actions")
async def list_action_types(
    current_user: User = Depends(get_current_admin)
):
    """Lista tipos de ações disponíveis"""
    return ["CREATE", "UPDATE", "DELETE", "LOGIN", "FINANCE"]

@router.get("/by-order/{order_number}")
async def get_logs_by_order(
    order_number: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista logs de uma ordem de serviço específica"""
    statement = select(AuditLog).where(AuditLog.target_id == order_number)
    statement = statement.order_by(AuditLog.timestamp.desc())
    logs = session.exec(statement).all()
    return [log.model_dump() for log in logs]
