"""
Rotas para gerenciamento de notificações no sistema
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, or_
from pydantic import BaseModel

from database import get_session
from models import User, Notification, NotificationType, NotificationPriority, NotificationCategory
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notificações"])


class NotificationCreate(BaseModel):
    type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    category: Optional[NotificationCategory] = None
    related_id: Optional[str] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    user_id: Optional[int] = None  # Se None, envia para todos


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


class NotificationStats(BaseModel):
    total: int
    unread: int
    by_type: dict
    by_category: dict


@router.get("/", response_model=List[Notification])
async def get_notifications(
    unread_only: bool = Query(False, description="Mostrar apenas não lidas"),
    category: Optional[NotificationCategory] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Listar notificações do usuário logado"""
    query = select(Notification).where(
        or_(
            Notification.user_id == current_user.id,
            Notification.user_id == None  # Notificações globais
        )
    )
    
    if unread_only:
        query = query.where(Notification.read == False)
    
    if category:
        query = query.where(Notification.category == category)
    
    query = query.order_by(Notification.created_at.desc())
    query = query.offset(offset).limit(limit)
    
    notifications = session.exec(query).all()
    return notifications


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Estatísticas de notificações"""
    # Total de notificações
    total_query = select(func.count(Notification.id)).where(
        or_(
            Notification.user_id == current_user.id,
            Notification.user_id == None
        )
    )
    total = session.exec(total_query).first() or 0
    
    # Não lidas
    unread_query = select(func.count(Notification.id)).where(
        or_(
            Notification.user_id == current_user.id,
            Notification.user_id == None
        ),
        Notification.read == False
    )
    unread = session.exec(unread_query).first() or 0
    
    # Por tipo
    by_type_query = select(
        Notification.type,
        func.count(Notification.id)
    ).where(
        or_(
            Notification.user_id == current_user.id,
            Notification.user_id == None
        )
    ).group_by(Notification.type)
    by_type = {row[0]: row[1] for row in session.exec(by_type_query).all()}
    
    # Por categoria
    by_category_query = select(
        Notification.category,
        func.count(Notification.id)
    ).where(
        or_(
            Notification.user_id == current_user.id,
            Notification.user_id == None
        ),
        Notification.category != None
    ).group_by(Notification.category)
    by_category = {row[0]: row[1] for row in session.exec(by_category_query).all()}
    
    return NotificationStats(
        total=total,
        unread=unread,
        by_type=by_type,
        by_category=by_category
    )


@router.post("/", response_model=Notification)
async def create_notification(
    notification: NotificationCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Criar nova notificação (apenas admin pode criar para outros usuários)"""
    # Verificar se está tentando criar para outro usuário
    if notification.user_id and notification.user_id != current_user.id:
        if current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Apenas administradores podem criar notificações para outros usuários")
    
    db_notification = Notification(
        type=notification.type,
        priority=notification.priority,
        title=notification.title,
        message=notification.message,
        category=notification.category,
        related_id=notification.related_id,
        action_url=notification.action_url,
        action_label=notification.action_label,
        user_id=notification.user_id,
        created_at=datetime.utcnow()
    )
    
    session.add(db_notification)
    session.commit()
    session.refresh(db_notification)
    
    return db_notification


@router.patch("/{notification_id}", response_model=Notification)
async def update_notification(
    notification_id: int,
    update_data: NotificationUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Atualizar notificação (marcar como lida/não lida)"""
    notification = session.get(Notification, notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    # Verificar se a notificação pertence ao usuário
    if notification.user_id and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para atualizar esta notificação")
    
    if update_data.read is not None:
        notification.read = update_data.read
        notification.read_at = datetime.utcnow() if update_data.read else None
    
    session.add(notification)
    session.commit()
    session.refresh(notification)
    
    return notification


@router.post("/mark-all-read")
async def mark_all_as_read(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Marcar todas as notificações como lidas"""
    notifications = session.exec(
        select(Notification).where(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id == None
            ),
            Notification.read == False
        )
    ).all()
    
    count = 0
    for notification in notifications:
        notification.read = True
        notification.read_at = datetime.utcnow()
        session.add(notification)
        count += 1
    
    session.commit()
    
    return {"message": f"{count} notificações marcadas como lidas"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Deletar notificação"""
    notification = session.get(Notification, notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    # Verificar se a notificação pertence ao usuário
    if notification.user_id and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você não tem permissão para deletar esta notificação")
    
    session.delete(notification)
    session.commit()
    
    return {"message": "Notificação removida"}


@router.delete("/")
async def clear_all_notifications(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Limpar todas as notificações do usuário"""
    notifications = session.exec(
        select(Notification).where(
            or_(
                Notification.user_id == current_user.id,
                Notification.user_id == None
            )
        )
    ).all()
    
    count = 0
    for notification in notifications:
        session.delete(notification)
        count += 1
    
    session.commit()
    
    return {"message": f"{count} notificações removidas"}
