import { User, ServiceOrder, Expense, InventoryItem, AuditLogEntry, OSStatus } from '../types';

export const INITIAL_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Roberto (Admin)', 
    role: 'ADMIN', 
    avatar: 'RO', 
    specialty: 'Gestão', 
    active: true, 
    email: 'admin@osmech.com', 
    phone: '(11) 99999-0001',
    // Senha: admin123 (hash bcrypt)
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcQw.rCwqE7IG'
  },
  { 
    id: 'u2', 
    name: 'Carlos (Mecânico)', 
    role: 'MECHANIC', 
    avatar: 'CA', 
    specialty: 'Motor Diesel', 
    commissionRate: 30, 
    active: true, 
    email: 'carlos@osmech.com', 
    phone: '(11) 99999-0002',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcQw.rCwqE7IG'
  },
  { 
    id: 'u3', 
    name: 'Jorge (Mecânico)', 
    role: 'MECHANIC', 
    avatar: 'JO', 
    specialty: 'Suspensão e Freios', 
    commissionRate: 30, 
    active: true, 
    email: 'jorge@osmech.com', 
    phone: '(11) 99999-0003',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKxcQw.rCwqE7IG'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', description: 'ALUGUEL GALPÃO', amount: 2500, category: 'FIXED', date: new Date(Date.now() - 86400000 * 10).toISOString(), dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'PAID', userId: 'u1' },
  { id: 'e2', description: 'CONTA DE LUZ', amount: 450, category: 'FIXED', date: new Date(Date.now() - 86400000 * 5).toISOString(), dueDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'PAID', userId: 'u1' },
  { id: 'e3', description: 'LOTE DE ÓLEO 5W30', amount: 800, category: 'PARTS', date: new Date(Date.now() - 86400000 * 2).toISOString(), dueDate: new Date(Date.now() + 86400000 * 20).toISOString(), status: 'PENDING', userId: 'u1' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'i1', code: 'OLEO-5W30', name: 'ÓLEO MOTOR 5W30 SINTÉTICO', manufacturer: 'SHELL', category: 'LUBRIFICANTES', costPrice: 35.00, sellPrice: 65.00, stockQuantity: 45, minStockLevel: 10 },
  { id: 'i2', code: 'FIL-AR-01', name: 'FILTRO DE AR GOL/VOYAGE', manufacturer: 'TECFIL', category: 'FILTROS', costPrice: 15.00, sellPrice: 35.00, stockQuantity: 8, minStockLevel: 5 },
  { id: 'i3', code: 'PAST-D-01', name: 'PASTILHA FREIO DIANT. PALIO', manufacturer: 'COBREQ', category: 'FREIOS', costPrice: 60.00, sellPrice: 120.00, stockQuantity: 2, minStockLevel: 4 },
];

export const INITIAL_DATA: ServiceOrder[] = [
  {
    id: 'OS-1001',
    customerName: 'TRANSPORTADORA SILVA',
    customerCpf: '123.456.789-00',
    vehicleManufacturer: 'FIAT',
    vehicleModel: 'DUCATO 2.3',
    vehicleYear: 2019,
    vehicleColor: 'BRANCO',
    plate: 'ABC1234',
    currentMileage: 125000,
    phone: '(11) 99999-9999',
    complaint: 'MOTOR PERDENDO POTÊNCIA EM SUBIDAS.',
    status: OSStatus.PAID,
    assignedMechanicId: 'u2',
    acceptsNotifications: true,
    items: [
      { id: '1', description: 'DIAGNÓSTICO SCANNER DIESEL', type: 'LABOR', quantity: 1, unitPrice: 150, totalPrice: 150, status: 'COMPLETED', mechanicId: 'u2' },
      { id: '2', description: 'LIMPEZA VÁLVULA EGR', type: 'LABOR', quantity: 1, unitPrice: 300, totalPrice: 300, status: 'COMPLETED', mechanicId: 'u2' },
      { id: '3', code: 'FIL-998', description: 'FILTRO DE COMBUSTÍVEL', type: 'PART', quantity: 1, unitPrice: 150, totalPrice: 150 },
      { id: '4', code: 'EGR-200', description: 'VÁLVULA EGR NOVA', type: 'PART', quantity: 1, unitPrice: 1050, totalPrice: 1050 },
    ],
    partsCost: 1200,
    laborCost: 450,
    discountPercentage: 0,
    totalCost: 1650,
    paymentMethod: 'PIX',
    paymentDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    fiscalNotes: 'CLIENTE SOLICITOU ENVIO IMEDIATO DO RECIBO APÓS PAGAMENTO.',
    aiDiagnosis: {
      possibleCauses: ['Filtro de diesel obstruído', 'Problema na válvula EGR', 'Turbina com baixa pressão'],
      diagnosisSteps: ['Verificar pressão da turbina', 'Scanear códigos de injeção', 'Inspecionar filtro de ar e diesel'],
      recommendedParts: [{ name: 'Filtro Diesel', estimatedCost: 150 }, { name: 'Válvula EGR', estimatedCost: 900 }],
      estimatedLaborHours: 3,
      preventiveMaintenance: 'Recomendar limpeza do sistema de injeção a cada 40.000km.'
    },
    notifications: [
      { id: 'n1', channel: 'WHATSAPP', title: 'Abertura da OS', message: 'Sua OS #OS-1001 foi aberta!', sentAt: new Date(Date.now() - 86400000 * 5).toISOString(), read: true },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'OS-1002',
    customerName: 'ANA SOUZA',
    customerCpf: '987.654.321-99',
    vehicleManufacturer: 'HYUNDAI',
    vehicleModel: 'HB20 1.0',
    vehicleYear: 2021,
    vehicleColor: 'PRATA',
    plate: 'XYZ9876',
    currentMileage: 45000,
    phone: '(11) 98888-8888',
    complaint: 'BARULHO NA SUSPENSÃO DIANTEIRA.',
    status: OSStatus.PENDING,
    assignedMechanicId: 'u3',
    acceptsNotifications: true,
    items: [],
    partsCost: 0,
    laborCost: 0,
    discountPercentage: 0,
    totalCost: 0,
    notifications: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_LOGS: AuditLogEntry[] = [
  { id: 'log1', action: 'CREATE', userId: 'u1', userName: 'Roberto (Admin)', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), details: 'Criou OS-1001' },
  { id: 'log2', action: 'UPDATE', userId: 'u2', userName: 'Carlos (Mecânico)', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), details: 'Atualizou status OS-1001 para Em Execução' },
];
