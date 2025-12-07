

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
  role: UserRole;
  avatar?: string;
  email?: string;
  phone?: string;
  specialty?: string; // Ex: Elétrica, Suspensão, Geral
  commissionRate?: number; // Porcentagem de comissão sobre mão de obra (0-100)
  active: boolean;
}

export interface CompanySettings {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email?: string;
  subtitle?: string; // Slogan ou Subtítulo (ex: Centro Automotivo)
  logo?: string; // Base64 image string
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

// --- Finance Types ---

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE' | 'PAYROLL' | 'PARTS' | 'TAXES';
  date: string; // Data de competência/lançamento
  dueDate?: string; // Data de Vencimento
  status?: 'PAID' | 'PENDING';
  userId: string; // Quem registrou
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
    costPrice: number; // Preço de Custo
    sellPrice: number; // Preço de Venda
    stockQuantity: number;
    minStockLevel: number; // Estoque mínimo para alerta
    category: string;
}

// --- Mutation Inputs ---

export interface CreateOSInput {
  customerName: string;
  customerCpf?: string;
  phone: string;
  vehicleModel: string;
  vehicleManufacturer?: string;
  vehicleYear?: number;
  vehicleColor?: string; // Added field
  plate: string;
  currentMileage?: number;
  complaint: string;
  acceptsNotifications: boolean;
  aiDiagnosis?: AIDiagnosisResult;
  initialStatus?: OSStatus;
  estimatedLaborCost?: number;
  estimatedPartsCost?: number;
  images?: string[]; // Base64 Images
}

export interface PaymentInput {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
  amount: number;
  notes?: string;
}

// Nova interface para itens individuais
export interface ServiceItem {
  id: string;
  code?: string; // Código da peça/serviço
  description: string;
  type: 'PART' | 'LABOR'; // Peça ou Mão de Obra
  quantity: number;
  unitPrice: number;
  totalPrice: number; // quantity * unitPrice
  inventoryItemId?: string; // Link para o item de estoque para controle de baixa/estorno
  
  // Detalhamento de Serviços
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'; 
  notes?: string; // Observações técnicas
  mechanicId?: string; // Mecânico responsável pelo item
}

export interface ServiceOrder {
  id: string;
  customerName: string;
  customerCpf?: string;
  vehicleModel: string;
  vehicleManufacturer?: string;
  vehicleYear?: number;
  vehicleColor?: string; // Added field
  plate: string;
  currentMileage?: number;
  phone: string;
  complaint: string;
  
  // AI Data
  aiDiagnosis?: AIDiagnosisResult;
  images?: string[]; // Array de strings Base64 para evidências visuais
  
  // Execution
  mechanicNotes?: string;
  assignedMechanicId?: string;
  items?: ServiceItem[]; // Lista detalhada de serviços executados
  
  // Financial
  partsCost: number;
  laborCost: number;
  discountPercentage?: number; // Novo campo: 0 a 10%
  totalCost: number;
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
  paymentDate?: string;
  fiscalNotes?: string; // Observações Fiscais para Nota Fiscal
  
  status: OSStatus;
  
  // Communications
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
  snapshot?: ServiceOrder; // UC004: Snapshot for Audit/Recovery
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'OS_LIST' | 'NEW_OS' | 'OS_DETAILS' | 'AI_CHAT' | 'REPORTS' | 'TEAM' | 'FINANCE' | 'SETTINGS';

export interface DashboardStats {
  totalRevenue: number;
  activeOrders: number;
  completedOrders: number;
  pendingApproval: number;
}