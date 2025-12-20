from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from database import get_session
from models import (
    Expense, ExpenseCategory, ExpenseStatus,
    ServiceOrder, OSStatus, User, AuditLog
)
from auth import get_current_user, get_current_admin

router = APIRouter(prefix="/finance", tags=["Finance"])

# ==================== EXPENSES ====================

@router.get("/expenses", response_model=List[dict])
async def list_expenses(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    category: Optional[ExpenseCategory] = None,
    status: Optional[ExpenseStatus] = None,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Lista despesas com filtros"""
    statement = select(Expense)
    
    if category:
        statement = statement.where(Expense.category == category)
    if status:
        statement = statement.where(Expense.status == status)
    if month and year:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        statement = statement.where(Expense.date >= start_date, Expense.date < end_date)
    
    statement = statement.order_by(Expense.date.desc())
    expenses = session.exec(statement).all()
    
    return [exp.model_dump() for exp in expenses]

@router.post("/expenses")
async def create_expense(
    expense_data: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Cria nova despesa (apenas admin)"""
    expense = Expense(
        description=expense_data['description'],
        amount=expense_data['amount'],
        category=ExpenseCategory(expense_data['category']),
        date=datetime.fromisoformat(expense_data['date']),
        due_date=datetime.fromisoformat(expense_data['due_date']) if expense_data.get('due_date') else None,
        status=ExpenseStatus(expense_data.get('status', 'PENDING')),
        user_id=current_user.id
    )
    
    session.add(expense)
    
    # Log
    log = AuditLog(
        action="FINANCE",
        target_id=None,
        user_id=current_user.id,
        user_name=current_user.name,
        details=f"Despesa criada: {expense.description} - R$ {expense.amount:.2f}"
    )
    session.add(log)
    session.commit()
    session.refresh(expense)
    
    return {"id": expense.id, "message": "Despesa criada com sucesso"}

@router.patch("/expenses/{expense_id}")
async def update_expense(
    expense_id: int,
    expense_data: dict,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Atualiza despesa"""
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    
    if 'description' in expense_data:
        expense.description = expense_data['description']
    if 'amount' in expense_data:
        expense.amount = expense_data['amount']
    if 'category' in expense_data:
        expense.category = ExpenseCategory(expense_data['category'])
    if 'status' in expense_data:
        expense.status = ExpenseStatus(expense_data['status'])
    if 'date' in expense_data:
        expense.date = datetime.fromisoformat(expense_data['date'])
    if 'due_date' in expense_data:
        expense.due_date = datetime.fromisoformat(expense_data['due_date']) if expense_data['due_date'] else None
    
    session.add(expense)
    session.commit()
    
    return {"message": "Despesa atualizada"}

@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Remove despesa"""
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    
    log = AuditLog(
        action="FINANCE",
        target_id=str(expense_id),
        user_id=current_user.id,
        user_name=current_user.name,
        details=f"Despesa removida: {expense.description}"
    )
    session.add(log)
    
    session.delete(expense)
    session.commit()
    
    return {"message": "Despesa removida"}

# ==================== DASHBOARD ====================

@router.get("/dashboard")
async def get_finance_dashboard(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Retorna dados do dashboard financeiro"""
    now = datetime.now()
    target_month = month or now.month
    target_year = year or now.year
    
    # Período do mês
    start_date = datetime(target_year, target_month, 1)
    if target_month == 12:
        end_date = datetime(target_year + 1, 1, 1)
    else:
        end_date = datetime(target_year, target_month + 1, 1)
    
    # Receitas (OS finalizadas no período)
    revenue = session.exec(
        select(func.sum(ServiceOrder.total_cost))
        .where(
            ServiceOrder.status == OSStatus.PAID,
            ServiceOrder.payment_date >= start_date,
            ServiceOrder.payment_date < end_date
        )
    ).first() or 0
    
    # Despesas do período
    expenses = session.exec(
        select(func.sum(Expense.amount))
        .where(
            Expense.date >= start_date,
            Expense.date < end_date
        )
    ).first() or 0
    
    # Despesas pagas
    paid_expenses = session.exec(
        select(func.sum(Expense.amount))
        .where(
            Expense.date >= start_date,
            Expense.date < end_date,
            Expense.status == ExpenseStatus.PAID
        )
    ).first() or 0
    
    # Despesas pendentes
    pending_expenses = session.exec(
        select(func.sum(Expense.amount))
        .where(
            Expense.date >= start_date,
            Expense.date < end_date,
            Expense.status == ExpenseStatus.PENDING
        )
    ).first() or 0
    
    # Despesas por categoria
    expenses_by_category = {}
    for category in ExpenseCategory:
        total = session.exec(
            select(func.sum(Expense.amount))
            .where(
                Expense.category == category,
                Expense.date >= start_date,
                Expense.date < end_date
            )
        ).first() or 0
        expenses_by_category[category.value] = total
    
    # Contas a receber (OS concluídas mas não pagas)
    receivables = session.exec(
        select(func.sum(ServiceOrder.total_cost))
        .where(ServiceOrder.status == OSStatus.COMPLETED)
    ).first() or 0
    
    # Quantidade de OS por status
    orders_completed = session.exec(
        select(func.count(ServiceOrder.id))
        .where(
            ServiceOrder.payment_date >= start_date,
            ServiceOrder.payment_date < end_date,
            ServiceOrder.status == OSStatus.PAID
        )
    ).first() or 0
    
    return {
        "period": {
            "month": target_month,
            "year": target_year
        },
        "revenue": float(revenue),
        "total_expenses": float(expenses),
        "paid_expenses": float(paid_expenses),
        "pending_expenses": float(pending_expenses),
        "profit": float(revenue) - float(expenses),
        "expenses_by_category": expenses_by_category,
        "receivables": float(receivables),
        "orders_completed": orders_completed
    }

# ==================== REPORTS ====================

@router.get("/reports/monthly")
async def get_monthly_report(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    year: int = Query(default=None)
):
    """Relatório mensal do ano"""
    target_year = year or datetime.now().year
    
    monthly_data = []
    
    for month in range(1, 13):
        start_date = datetime(target_year, month, 1)
        if month == 12:
            end_date = datetime(target_year + 1, 1, 1)
        else:
            end_date = datetime(target_year, month + 1, 1)
        
        revenue = session.exec(
            select(func.sum(ServiceOrder.total_cost))
            .where(
                ServiceOrder.status == OSStatus.PAID,
                ServiceOrder.payment_date >= start_date,
                ServiceOrder.payment_date < end_date
            )
        ).first() or 0
        
        expenses = session.exec(
            select(func.sum(Expense.amount))
            .where(
                Expense.date >= start_date,
                Expense.date < end_date
            )
        ).first() or 0
        
        orders_count = session.exec(
            select(func.count(ServiceOrder.id))
            .where(
                ServiceOrder.payment_date >= start_date,
                ServiceOrder.payment_date < end_date,
                ServiceOrder.status == OSStatus.PAID
            )
        ).first() or 0
        
        monthly_data.append({
            "month": month,
            "revenue": float(revenue),
            "expenses": float(expenses),
            "profit": float(revenue) - float(expenses),
            "orders_count": orders_count
        })
    
    return {
        "year": target_year,
        "monthly_data": monthly_data,
        "total_revenue": sum(m['revenue'] for m in monthly_data),
        "total_expenses": sum(m['expenses'] for m in monthly_data),
        "total_profit": sum(m['profit'] for m in monthly_data)
    }
