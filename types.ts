export enum OSStatus {
  PENDING = 'Pendente',
  DIAGNOSING = 'Em Diagnóstico',
  APPROVAL = 'Aguardando Aprovação',
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

export interface ServiceOrder {
  id: string;
  customerName: string;
  customerCpf?: string; // Added for Advanced Search (Identification)
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
  
  // Financial
  partsCost: number;
  laborCost: number;
  totalCost: number;
  paymentMethod?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
  
  status: OSStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  targetId?: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'OS_LIST' | 'NEW_OS' | 'OS_DETAILS' | 'AI_CHAT' | 'REPORTS';

export interface DashboardStats {
  totalRevenue: number;
  activeOrders: number;
  completedOrders: number;
  pendingApproval: number;
}