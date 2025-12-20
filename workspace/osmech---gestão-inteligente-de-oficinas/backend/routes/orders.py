from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
import json

from database import get_session
from models import (
    ServiceOrder, ServiceOrderCreate, ServiceOrderRead, ServiceOrderUpdate,
    OSStatus, ServiceItem, User, AuditLog
)
from auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Service Orders"])

def generate_order_number(session: Session) -> str:
    """Gera número da OS no formato OS-XXXX"""
    statement = select(func.max(ServiceOrder.id))
    max_id = session.exec(statement).first() or 0
    return f"OS-{1001 + max_id}"

@router.get("/", response_model=List[ServiceOrderRead])
async def list_orders(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    status: Optional[OSStatus] = None,
    plate: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0
):
    """Lista ordens de serviço com filtros"""
    statement = select(ServiceOrder)
    
    if status:
        statement = statement.where(ServiceOrder.status == status)
    if plate:
        statement = statement.where(ServiceOrder.plate.contains(plate.upper()))
    
    statement = statement.order_by(ServiceOrder.created_at.desc())
    statement = statement.offset(offset).limit(limit)
    
    orders = session.exec(statement).all()
    
    # Converter AI diagnosis
    result = []
    for order in orders:
        order_dict = order.model_dump()
        if order.ai_diagnosis_json:
            order_dict['ai_diagnosis'] = json.loads(order.ai_diagnosis_json)
        else:
            order_dict['ai_diagnosis'] = None
        result.append(order_dict)
    
    return result

@router.get("/stats")
async def get_orders_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Retorna estatísticas das ordens de serviço"""
    total = session.exec(select(func.count(ServiceOrder.id))).first()
    
    # Contagem por status
    status_counts = {}
    for status in OSStatus:
        count = session.exec(
            select(func.count(ServiceOrder.id)).where(ServiceOrder.status == status)
        ).first()
        status_counts[status.value] = count or 0
    
    # Total faturado (status PAID)
    total_revenue = session.exec(
        select(func.sum(ServiceOrder.total_cost)).where(ServiceOrder.status == OSStatus.PAID)
    ).first() or 0
    
    return {
        "total": total,
        "by_status": status_counts,
        "total_revenue": total_revenue
    }

@router.get("/{order_id}")
async def get_order(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Busca ordem de serviço por ID"""
    order = session.get(ServiceOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    
    # Buscar itens de serviço
    items_statement = select(ServiceItem).where(ServiceItem.order_id == order_id)
    items = session.exec(items_statement).all()
    
    # Buscar mecânico atribuído
    mechanic = None
    if order.assigned_mechanic_id:
        mechanic = session.get(User, order.assigned_mechanic_id)
    
    order_dict = order.model_dump()
    if order.ai_diagnosis_json:
        order_dict['ai_diagnosis'] = json.loads(order.ai_diagnosis_json)
    else:
        order_dict['ai_diagnosis'] = None
    
    order_dict['items'] = [item.model_dump() for item in items]
    order_dict['assigned_mechanic'] = mechanic.model_dump() if mechanic else None
    
    return order_dict

@router.post("/", response_model=dict)
async def create_order(
    order_data: ServiceOrderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Cria nova ordem de serviço"""
    order_number = generate_order_number(session)
    
    order = ServiceOrder(
        order_number=order_number,
        customer_name=order_data.customer_name,
        customer_cpf=order_data.customer_cpf,
        phone=order_data.phone,
        vehicle_model=order_data.vehicle_model,
        vehicle_manufacturer=order_data.vehicle_manufacturer,
        vehicle_year=order_data.vehicle_year,
        vehicle_color=order_data.vehicle_color,
        plate=order_data.plate.upper(),
        current_mileage=order_data.current_mileage,
        complaint=order_data.complaint,
        accepts_notifications=order_data.accepts_notifications
    )
    
    if order_data.ai_diagnosis:
        order.ai_diagnosis_json = json.dumps(order_data.ai_diagnosis)
    
    session.add(order)
    session.commit()
    session.refresh(order)
    
    # Registrar log
    log = AuditLog(
        action="CREATE",
        target_id=order.order_number,
        user_id=current_user.id,
        user_name=current_user.name,
        details=f"OS {order.order_number} criada - {order.customer_name} - {order.plate}"
    )
    session.add(log)
    session.commit()
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "message": "Ordem de serviço criada com sucesso"
    }

@router.patch("/{order_id}")
async def update_order(
    order_id: int,
    order_data: ServiceOrderUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Atualiza ordem de serviço"""
    order = session.get(ServiceOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    
    old_status = order.status
    
    # Atualizar campos
    update_data = order_data.model_dump(exclude_unset=True)
    
    # Tratar ai_diagnosis separadamente
    if 'ai_diagnosis' in update_data:
        ai_diag = update_data.pop('ai_diagnosis')
        order.ai_diagnosis_json = json.dumps(ai_diag) if ai_diag else None
    
    for key, value in update_data.items():
        setattr(order, key, value)
    
    order.updated_at = datetime.utcnow()
    session.add(order)
    
    # Registrar log se status mudou
    if order_data.status and order_data.status != old_status:
        log = AuditLog(
            action="UPDATE",
            target_id=order.order_number,
            user_id=current_user.id,
            user_name=current_user.name,
            details=f"OS {order.order_number} - Status alterado de {old_status.value} para {order.status.value}"
        )
        session.add(log)
    
    session.commit()
    session.refresh(order)
    
    return {"message": "Ordem de serviço atualizada"}

@router.post("/{order_id}/items")
async def add_order_item(
    order_id: int,
    item_data: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Adiciona item à ordem de serviço"""
    order = session.get(ServiceOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    
    item = ServiceItem(
        order_id=order_id,
        code=item_data.get('code'),
        description=item_data['description'],
        item_type=item_data['item_type'],
        quantity=item_data.get('quantity', 1),
        unit_price=item_data['unit_price'],
        total_price=item_data['unit_price'] * item_data.get('quantity', 1),
        inventory_item_id=item_data.get('inventory_item_id'),
        mechanic_id=item_data.get('mechanic_id')
    )
    
    session.add(item)
    
    # Atualizar custo total da OS
    if item_data['item_type'] == 'PART':
        order.parts_cost += item.total_price
    else:
        order.labor_cost += item.total_price
    
    discount = order.discount_percentage / 100 if order.discount_percentage else 0
    order.total_cost = (order.parts_cost + order.labor_cost) * (1 - discount)
    order.updated_at = datetime.utcnow()
    
    session.add(order)
    session.commit()
    
    return {"message": "Item adicionado com sucesso"}

@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Remove ordem de serviço"""
    order = session.get(ServiceOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    
    if order.status == OSStatus.PAID:
        raise HTTPException(status_code=400, detail="Não é possível excluir OS já finalizada")
    
    # Remover itens associados
    items = session.exec(select(ServiceItem).where(ServiceItem.order_id == order_id)).all()
    for item in items:
        session.delete(item)
    
    # Registrar log antes de deletar
    log = AuditLog(
        action="DELETE",
        target_id=order.order_number,
        user_id=current_user.id,
        user_name=current_user.name,
        details=f"OS {order.order_number} removida - {order.customer_name}"
    )
    session.add(log)
    
    session.delete(order)
    session.commit()
    
    return {"message": "Ordem de serviço removida"}
