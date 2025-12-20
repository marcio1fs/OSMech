export enum OSStatus {
  PENDING = 'Pendente',
  DIAGNOSING = 'Em Diagnóstico',
  APPROVAL = 'Aguardando Aprovação',
  WAITING_PARTS = 'Aguardando Peças',
  IN_PROGRESS = 'Em Execução',
  COMPLETED = 'Concluído',
  PAID = 'Finalizado/Pago'
}

export type UserRole = 'ADMIN' | 'MECHANIC';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  specialty?: string;
  commissionRate?: number;
  active: boolean;
  passwordHash?: string; // Para autenticação real
}

export interface CompanySettings {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email?: string;
  subtitle?: string;
  logo?: string;
}

export interface AIDiagnosisResult {
  possibleCauses: string[];
  diagnosisSteps: string[];
  recommendedParts: { name: string; estimatedCost: number }[];
  estimatedLaborHours: number;
  preventiveMaintenance: string;
}

export interface CustomerNotification {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  title: string;
  message: string;
  sentAt: string;
  read: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE' | 'PAYROLL' | 'PARTS' | 'TAXES';
  date: string;
  dueDate?: string;
  status?: 'PAID' | 'PENDING';
  userId: string;
}

export type ExpenseCategoryLabel = {
  [key in Expense['category']]: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  manufacturer?: string;
  costPrice: number;
  sellPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  category: string;
}

export interface CreateOSInput {
  customerName: string;
  customerCpf?: string;
  phone: string;
  vehicleModel: string;
  vehicleManufacturer?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  plate: string;
  currentMileage?: number;
  complaint: string;
  acceptsNotifications: boolean;
  aiDiagnosis?: AIDiagnosisResult;
  initialStatus?: OSStatus;
  estimatedLaborCost?: number;
  estimatedPartsCost?: number;
  images?: string[];
}

export interface PaymentInput {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
  amount: number;
  notes?: string;
}

export interface ServiceItem {
  id: string;
  code?: string;
  description: string;
  type: 'PART' | 'LABOR';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryItemId?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  mechanicId?: string;
}

export interface ServiceOrder {
  id: string;
  customerName: string;
  customerCpf?: string;
  vehicleModel: string;
  vehicleManufacturer?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  plate: string;
  currentMileage?: number;
  phone: string;
  complaint: string;
  aiDiagnosis?: AIDiagnosisResult;
  images?: string[];
  mechanicNotes?: string;
  assignedMechanicId?: string;
  items?: ServiceItem[];
  partsCost: number;
  laborCost: number;
  discountPercentage?: number;
  totalCost: number;
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
  paymentDate?: string;
  fiscalNotes?: string;
  status: OSStatus;
  notifications?: CustomerNotification[];
  acceptsNotifications?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'FINANCE';
  targetId?: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
  snapshot?: ServiceOrder;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'OS_LIST' | 'NEW_OS' | 'OS_DETAILS' | 'AI_CHAT' | 'REPORTS' | 'TEAM' | 'FINANCE' | 'SETTINGS';

export interface DashboardStats {
  totalRevenue: number;
  activeOrders: number;
  completedOrders: number;
  pendingApproval: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}
