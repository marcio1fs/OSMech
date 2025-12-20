from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from database import get_session
from models import InventoryItem, User
from auth import get_current_user, get_current_admin

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/", response_model=List[dict])
async def list_inventory(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = None,
    low_stock: bool = False,
    search: Optional[str] = None
):
    """Lista itens do estoque"""
    statement = select(InventoryItem)
    
    if category:
        statement = statement.where(InventoryItem.category == category)
    if low_stock:
        statement = statement.where(InventoryItem.stock_quantity <= InventoryItem.min_stock_level)
    if search:
        statement = statement.where(
            (InventoryItem.name.contains(search)) | 
            (InventoryItem.code.contains(search))
        )
    
    statement = statement.order_by(InventoryItem.name)
    items = session.exec(statement).all()
    
    return [item.model_dump() for item in items]

@router.get("/categories")
async def list_categories(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista categorias únicas do estoque"""
    items = session.exec(select(InventoryItem)).all()
    categories = list(set(item.category for item in items if item.category))
    return sorted(categories)

@router.get("/low-stock")
async def list_low_stock(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lista itens com estoque baixo"""
    statement = select(InventoryItem).where(
        InventoryItem.stock_quantity <= InventoryItem.min_stock_level
    )
    items = session.exec(statement).all()
    return [item.model_dump() for item in items]

@router.get("/{item_id}")
async def get_inventory_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Busca item do estoque por ID"""
    item = session.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item.model_dump()

@router.post("/")
async def create_inventory_item(
    item_data: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Cria novo item no estoque"""
    # Verificar se código já existe
    existing = session.exec(
        select(InventoryItem).where(InventoryItem.code == item_data['code'])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código já existe no estoque")
    
    item = InventoryItem(
        code=item_data['code'],
        name=item_data['name'],
        description=item_data.get('description'),
        manufacturer=item_data.get('manufacturer'),
        category=item_data['category'],
        cost_price=item_data['cost_price'],
        sell_price=item_data['sell_price'],
        stock_quantity=item_data.get('stock_quantity', 0),
        min_stock_level=item_data.get('min_stock_level', 0)
    )
    
    session.add(item)
    session.commit()
    session.refresh(item)
    
    return {"id": item.id, "message": "Item criado com sucesso"}

@router.patch("/{item_id}")
async def update_inventory_item(
    item_id: int,
    item_data: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Atualiza item do estoque"""
    item = session.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    for key, value in item_data.items():
        if hasattr(item, key):
            setattr(item, key, value)
    
    session.add(item)
    session.commit()
    
    return {"message": "Item atualizado"}

@router.post("/{item_id}/adjust-stock")
async def adjust_stock(
    item_id: int,
    adjustment: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Ajusta quantidade em estoque"""
    item = session.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    quantity = adjustment.get('quantity', 0)
    operation = adjustment.get('operation', 'add')  # 'add' ou 'remove'
    
    if operation == 'add':
        item.stock_quantity += quantity
    elif operation == 'remove':
        if item.stock_quantity < quantity:
            raise HTTPException(status_code=400, detail="Estoque insuficiente")
        item.stock_quantity -= quantity
    else:
        raise HTTPException(status_code=400, detail="Operação inválida")
    
    session.add(item)
    session.commit()
    
    return {"new_quantity": item.stock_quantity, "message": "Estoque ajustado"}

@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Remove item do estoque"""
    item = session.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    session.delete(item)
    session.commit()
    
    return {"message": "Item removido"}
