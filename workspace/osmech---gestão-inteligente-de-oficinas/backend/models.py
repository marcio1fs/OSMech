from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from enum import Enum
from pydantic import EmailStr
import json

# ==================== ENUMS ====================

class OSStatus(str, Enum):
    PENDING = 'Pendente'
    DIAGNOSING = 'Em Diagnóstico'
    APPROVAL = 'Aguardando Aprovação'
    WAITING_PARTS = 'Aguardando Peças'
    IN_PROGRESS = 'Em Execução'
    COMPLETED = 'Concluído'
    PAID = 'Finalizado/Pago'

class UserRole(str, Enum):
    ADMIN = 'ADMIN'
    MECHANIC = 'MECHANIC'

class PaymentMethod(str, Enum):
    CREDIT_CARD = 'CREDIT_CARD'
    DEBIT_CARD = 'DEBIT_CARD'
    CASH = 'CASH'
    PIX = 'PIX'

class ExpenseCategory(str, Enum):
    FIXED = 'FIXED'
    VARIABLE = 'VARIABLE'
    PAYROLL = 'PAYROLL'
    PARTS = 'PARTS'
    TAXES = 'TAXES'

class ExpenseStatus(str, Enum):
    PAID = 'PAID'
    PENDING = 'PENDING'

class NotificationType(str, Enum):
    SUCCESS = 'success'
    ERROR = 'error'
    WARNING = 'warning'
    INFO = 'info'
    SYSTEM = 'system'

class NotificationPriority(str, Enum):
    LOW = 'low'
    NORMAL = 'normal'
    HIGH = 'high'
    URGENT = 'urgent'

class NotificationCategory(str, Enum):
    ORDER = 'order'
    PAYMENT = 'payment'
    SYSTEM = 'system'
    CUSTOMER = 'customer'
    INVENTORY = 'inventory'

# ==================== USER ====================

class UserBase(SQLModel):
    name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.MECHANIC)
    avatar: Optional[str] = None
    specialty: Optional[str] = None
    commission_rate: Optional[float] = Field(default=0)
    active: bool = Field(default=True)

class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(SQLModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.MECHANIC
    specialty: Optional[str] = None
    commission_rate: Optional[float] = 0

class UserRead(UserBase):
    id: int
    created_at: datetime

class UserUpdate(SQLModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    avatar: Optional[str] = None
    specialty: Optional[str] = None
    commission_rate: Optional[float] = None
    active: Optional[bool] = None

# ==================== COMPANY ====================

class CompanySettings(SQLModel, table=True):
    __tablename__ = "company_settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    cnpj: str
    address: str
    phone: str
    email: Optional[str] = None
    subtitle: Optional[str] = None
    logo: Optional[str] = None  # Base64

# ==================== CUSTOMER ====================

class Customer(SQLModel, table=True):
    __tablename__ = "customers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    cpf: Optional[str] = Field(default=None, unique=True, index=True)
    phone: str
    email: Optional[str] = None
    accepts_notifications: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== VEHICLE ====================

class Vehicle(SQLModel, table=True):
    __tablename__ = "vehicles"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customers.id")
    manufacturer: Optional[str] = None
    model: str
    year: Optional[int] = None
    color: Optional[str] = None
    plate: str = Field(unique=True, index=True)
    current_mileage: Optional[int] = None

# ==================== SERVICE ORDER ====================

class ServiceOrderBase(SQLModel):
    customer_name: str
    customer_cpf: Optional[str] = None
    phone: str
    vehicle_model: str
    vehicle_manufacturer: Optional[str] = None
    vehicle_year: Optional[int] = None
    vehicle_color: Optional[str] = None
    plate: str = Field(index=True)
    current_mileage: Optional[int] = None
    complaint: str
    accepts_notifications: bool = Field(default=True)

class ServiceOrder(ServiceOrderBase, table=True):
    __tablename__ = "service_orders"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    order_number: str = Field(unique=True, index=True)  # OS-1001
    status: OSStatus = Field(default=OSStatus.PENDING)
    assigned_mechanic_id: Optional[int] = Field(default=None, foreign_key="users.id")
    
    # Financial
    parts_cost: float = Field(default=0)
    labor_cost: float = Field(default=0)
    discount_percentage: float = Field(default=0)
    total_cost: float = Field(default=0)
    payment_method: Optional[PaymentMethod] = None
    payment_date: Optional[datetime] = None
    fiscal_notes: Optional[str] = None
    
    # AI Diagnosis (stored as JSON string)
    ai_diagnosis_json: Optional[str] = None
    mechanic_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def ai_diagnosis(self):
        if self.ai_diagnosis_json:
            return json.loads(self.ai_diagnosis_json)
        return None
    
    @ai_diagnosis.setter
    def ai_diagnosis(self, value):
        if value:
            self.ai_diagnosis_json = json.dumps(value)
        else:
            self.ai_diagnosis_json = None

class ServiceOrderCreate(ServiceOrderBase):
    ai_diagnosis: Optional[dict] = None

class ServiceOrderRead(ServiceOrderBase):
    id: int
    order_number: str
    status: OSStatus
    assigned_mechanic_id: Optional[int]
    parts_cost: float
    labor_cost: float
    discount_percentage: float
    total_cost: float
    payment_method: Optional[PaymentMethod]
    payment_date: Optional[datetime]
    ai_diagnosis: Optional[dict]
    created_at: datetime
    updated_at: datetime

class ServiceOrderUpdate(SQLModel):
    status: Optional[OSStatus] = None
    assigned_mechanic_id: Optional[int] = None
    parts_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    discount_percentage: Optional[float] = None
    total_cost: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    payment_date: Optional[datetime] = None
    fiscal_notes: Optional[str] = None
    mechanic_notes: Optional[str] = None
    ai_diagnosis: Optional[dict] = None

# ==================== SERVICE ITEM ====================

class ServiceItem(SQLModel, table=True):
    __tablename__ = "service_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="service_orders.id")
    code: Optional[str] = None
    description: str
    item_type: str  # 'PART' or 'LABOR'
    quantity: int = Field(default=1)
    unit_price: float
    total_price: float
    inventory_item_id: Optional[int] = Field(default=None, foreign_key="inventory_items.id")
    status: str = Field(default='PENDING')  # PENDING, IN_PROGRESS, COMPLETED
    mechanic_id: Optional[int] = Field(default=None, foreign_key="users.id")
    notes: Optional[str] = None

# ==================== INVENTORY ====================

class InventoryItem(SQLModel, table=True):
    __tablename__ = "inventory_items"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    category: str
    cost_price: float
    sell_price: float
    stock_quantity: int = Field(default=0)
    min_stock_level: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== EXPENSE ====================

class Expense(SQLModel, table=True):
    __tablename__ = "expenses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str
    amount: float
    category: ExpenseCategory
    date: datetime
    due_date: Optional[datetime] = None
    status: ExpenseStatus = Field(default=ExpenseStatus.PENDING)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== AUDIT LOG ====================

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    action: str  # CREATE, UPDATE, DELETE, LOGIN, FINANCE
    target_id: Optional[str] = None
    user_id: int = Field(foreign_key="users.id")
    user_name: str
    details: str
    snapshot_json: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ==================== NOTIFICATION ====================

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    type: NotificationType
    priority: NotificationPriority = Field(default=NotificationPriority.NORMAL)
    title: str
    message: str
    category: Optional[NotificationCategory] = None
    related_id: Optional[str] = None  # ID da OS, pagamento, etc.
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")  # None = notificação global
    read: bool = Field(default=False)
    read_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
