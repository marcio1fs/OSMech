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

// --- Mutation Inputs ---

export interface CreateOSInput {
  customerName: string;
  customerCpf?: string;
  phone: string;
  vehicleModel: string;
  plate: string;
  currentMileage?: number;
  complaint: string;
  acceptsNotifications: boolean;
  aiDiagnosis?: AIDiagnosisResult;
  initialStatus?: OSStatus;
  estimatedLaborCost?: number;
  estimatedPartsCost?: number;
}

export interface PaymentInput {
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
  amount: number;
  notes?: string;
}

// Nova interface para itens individuais
export interface ServiceItem {
  id: string;
  description: string;
  type: 'PART' | 'LABOR'; // Peça ou Mão de Obra
  quantity: number;
  unitPrice: number;
  totalPrice: number; // quantity * unitPrice
}

export interface ServiceOrder {
  id: string;
  customerName: string;
  customerCpf?: string;
  vehicleModel: string;
  plate: string;
  currentMileage?: number;
  phone: string;
  complaint: string;
  
  // AI Data
  aiDiagnosis?: AIDiagnosisResult;
  
  // Execution
  mechanicNotes?: string;
  assignedMechanicId?: string;
  items?: ServiceItem[]; // Lista detalhada de serviços executados
  
  // Financial
  partsCost: number;
  laborCost: number;
  totalCost: number;
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
  paymentDate?: string;
  
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

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'OS_LIST' | 'NEW_OS' | 'OS_DETAILS' | 'AI_CHAT' | 'REPORTS';

export interface DashboardStats {
  totalRevenue: number;
  activeOrders: number;
  completedOrders: number;
  pendingApproval: number;
}