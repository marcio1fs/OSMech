import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  PlusCircle, 
  Bot, 
  Search, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Car, 
  User as UserIcon,
  Save,
  ArrowRight,
  Trash2,
  Menu,
  X,
  LogOut,
  Filter,
  AlertTriangle,
  CreditCard,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  FileSpreadsheet,
  PieChart,
  Activity,
  History,
  Calendar,
  CheckSquare,
  MessageCircle,
  Mail,
  Smartphone,
  Send,
  Bell,
  ExternalLink,
  Copy,
  Wallet,
  Printer,
  FileText,
  TrendingUp,
  Database,
  Plus,
  MinusCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

import { 
    ServiceOrder, 
    OSStatus, 
    ViewState, 
    User, 
    AIDiagnosisResult, 
    UserRole, 
    AuditLogEntry, 
    CustomerNotification,
    CreateOSInput,
    PaymentInput,
    ServiceItem 
} from './types';
import { getMechanicDiagnosis, getShopAssistantChat } from './services/geminiService';
import { Card, StatCard } from './components/Card';
import { StatusBadge } from './components/StatusBadge';

// --- Mock Data ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Roberto (Admin)', role: 'ADMIN', avatar: 'RO' },
  { id: 'u2', name: 'Carlos (Mecânico)', role: 'MECHANIC', avatar: 'CA' },
  { id: 'u3', name: 'Jorge (Mecânico)', role: 'MECHANIC', avatar: 'JO' }
];

const INITIAL_DATA: ServiceOrder[] = [
  {
    id: 'OS-1001',
    customerName: 'Transportadora Silva',
    customerCpf: '123.456.789-00',
    vehicleModel: 'Fiat Ducato 2.3 2019',
    plate: 'ABC-1234',
    currentMileage: 125000,
    phone: '11999999999',
    complaint: 'Motor perdendo potência em subidas.',
    status: OSStatus.PAID,
    assignedMechanicId: 'u2',
    acceptsNotifications: true,
    // Items populated manually to match costs
    items: [
        { id: '1', description: 'Diagnóstico Scanner Diesel', type: 'LABOR', quantity: 1, unitPrice: 150, totalPrice: 150 },
        { id: '2', description: 'Limpeza Válvula EGR', type: 'LABOR', quantity: 1, unitPrice: 300, totalPrice: 300 },
        { id: '3', description: 'Filtro de Combustível', type: 'PART', quantity: 1, unitPrice: 150, totalPrice: 150 },
        { id: '4', description: 'Válvula EGR Nova', type: 'PART', quantity: 1, unitPrice: 1050, totalPrice: 1050 },
    ],
    partsCost: 1200,
    laborCost: 450,
    totalCost: 1650,
    paymentMethod: 'PIX',
    paymentDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    aiDiagnosis: {
        possibleCauses: ['Filtro de diesel obstruído', 'Problema na válvula EGR', 'Turbina com baixa pressão'],
        diagnosisSteps: ['Verificar pressão da turbina', 'Scanear códigos de injeção', 'Inspecionar filtro de ar e diesel'],
        recommendedParts: [{ name: 'Filtro Diesel', estimatedCost: 150 }, { name: 'Válvula EGR', estimatedCost: 900 }],
        estimatedLaborHours: 3,
        preventiveMaintenance: 'Recomendar limpeza do sistema de injeção a cada 40.000km.'
    },
    notifications: [
        { id: 'n1', channel: 'WHATSAPP', title: 'Abertura da OS', message: 'Sua OS #OS-1001 foi aberta! O problema relatado foi: Motor perdendo potência em subidas. Você será notificado sobre o orçamento.', sentAt: new Date(Date.now() - 86400000 * 5).toISOString(), read: true },
        { id: 'n2', channel: 'EMAIL', title: 'Emissão de Recibo/NF', message: 'Obrigado por escolher a OSMech! Sua Nota Fiscal/Recibo da OS #OS-1001 foi enviada para o seu e-mail.', sentAt: new Date().toISOString(), read: false }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'OS-1002',
    customerName: 'Ana Souza',
    customerCpf: '987.654.321-99',
    vehicleModel: 'Hyundai HB20 1.0',
    plate: 'XYZ-9876',
    currentMileage: 45000,
    phone: '11988888888',
    complaint: 'Barulho na suspensão dianteira.',
    status: OSStatus.PENDING,
    assignedMechanicId: 'u3',
    acceptsNotifications: true,
    items: [],
    partsCost: 0,
    laborCost: 0,
    totalCost: 0,
    notifications: [
         { id: 'n3', channel: 'WHATSAPP', title: 'Abertura da OS', message: 'Sua OS #OS-1002 foi aberta! O problema relatado foi: Barulho na suspensão dianteira. Você será notificado sobre o orçamento.', sentAt: new Date().toISOString(), read: true }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_LOGS: AuditLogEntry[] = [
    { id: 'log1', action: 'CREATE', userId: 'u1', userName: 'Roberto (Admin)', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), details: 'Criou OS-1001' },
    { id: 'log2', action: 'UPDATE', userId: 'u2', userName: 'Carlos (Mecânico)', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), details: 'Atualizou status OS-1001 para Em Execução' },
];

// --- Modals ---
const PaymentModal = ({ isOpen, onClose, onConfirm, total }: { isOpen: boolean, onClose: () => void, onConfirm: (data: PaymentInput) => void, total: number }) => {
    const [method, setMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX'>('PIX');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({ method, amount: total, notes });
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><CreditCard size={18}/> Registrar Pagamento</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="text-center mb-6">
                        <p className="text-sm text-slate-500 mb-1">Valor Total</p>
                        <p className="text-3xl font-bold text-green-600">R$ {total.toFixed(2)}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Método de Pagamento</label>
                        <select 
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white outline-none focus:border-blue-500"
                            value={method}
                            onChange={(e) => setMethod(e.target.value as any)}
                        >
                            <option value="PIX">Pix (Instantâneo)</option>
                            <option value="CREDIT_CARD">Cartão de Crédito</option>
                            <option value="DEBIT_CARD">Cartão de Débito</option>
                            <option value="CASH">Dinheiro / Espécie</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Observações (Opcional)</label>
                        <textarea 
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                            rows={3}
                            placeholder="Ex: Parcelado em 3x..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors flex justify-center items-center gap-2">
                        <CheckCircle size={18}/> Confirmar Recebimento
                    </button>
                </form>
            </div>
        </div>
    )
}

const ReceiptModal = ({ order, isOpen, onClose }: { order: ServiceOrder, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><FileText size={18}/> Recibo de Serviço</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <div id="print-area" className="p-8 space-y-6 bg-white">
            <div className="text-center border-b-2 border-dashed border-slate-200 pb-6">
                <div className="flex justify-center mb-2">
                     <div className="bg-slate-900 p-2 rounded text-white"><Wrench size={24}/></div>
                </div>
                <h2 className="font-bold text-xl uppercase tracking-widest text-slate-800">OSMech</h2>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Gestão de Oficinas Especializadas</p>
                <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
            
             <div className="text-sm space-y-1 text-slate-600">
                <p><strong className="text-slate-800">OS:</strong> #{order.id}</p>
                <p><strong className="text-slate-800">Cliente:</strong> {order.customerName}</p>
                <p><strong className="text-slate-800">CPF:</strong> {order.customerCpf || 'N/A'}</p>
                <p><strong className="text-slate-800">Veículo:</strong> {order.vehicleModel} <span className="text-xs bg-slate-100 px-1 rounded border">{order.plate}</span></p>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100 text-left">
                        <th className="py-2 font-normal uppercase">Qtd</th>
                        <th className="py-2 font-normal uppercase">Descrição</th>
                        <th className="py-2 font-normal uppercase text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {order.items && order.items.length > 0 ? (
                        order.items.map(item => (
                            <tr key={item.id} className="border-b border-slate-50 last:border-0">
                                <td className="py-2">{item.quantity}</td>
                                <td className="py-2">
                                    {item.description}
                                    <span className="text-[10px] ml-2 text-slate-400 border border-slate-200 px-1 rounded uppercase">{item.type === 'PART' ? 'Peça' : 'Serv'}</span>
                                </td>
                                <td className="text-right font-mono">R$ {item.totalPrice.toFixed(2)}</td>
                            </tr>
                        ))
                    ) : (
                        <>
                            <tr><td className="py-2">1</td><td className="py-2">Mão de Obra (Geral)</td><td className="text-right font-mono">R$ {order.laborCost.toFixed(2)}</td></tr>
                            <tr><td className="py-2">1</td><td className="py-2">Peças (Geral)</td><td className="text-right font-mono">R$ {order.partsCost.toFixed(2)}</td></tr>
                        </>
                    )}
                    <tr className="font-bold border-t-2 border-slate-800 text-lg"><td colSpan={2} className="py-3">TOTAL</td><td className="text-right py-3">R$ {order.totalCost.toFixed(2)}</td></tr>
                </tbody>
            </table>

            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                <p className="font-bold text-green-800 text-sm mb-1 flex items-center justify-center gap-1"><CheckCircle size={14}/> PAGAMENTO CONFIRMADO</p>
                <p className="text-xs text-green-700">Via {order.paymentMethod} em {order.paymentDate ? new Date(order.paymentDate).toLocaleDateString() : '-'}</p>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 pt-4">Obrigado pela preferência!</p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
             <button onClick={() => window.print()} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors">
                <Printer size={18}/> Imprimir
            </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_DATA);
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);

  // --- Helpers ---
  const addLog = (action: AuditLogEntry['action'], details: string, targetId?: string, forceId?: string) => {
      if (!user) return;
      const newLog: AuditLogEntry = {
          id: forceId || Math.random().toString(36).substr(2, 9),
          action,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
          details,
          targetId
      };
      setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (selectedUser: User) => {
    setUser(selectedUser);
    addLog('LOGIN', `Usuário ${selectedUser.name} acessou o sistema.`);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('LOGIN');
    setSelectedOS(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  // --- Automated Notifications Helper ---
  const generateNotification = (os: ServiceOrder, type: OSStatus | 'CREATED' | 'PREVENTIVE'): CustomerNotification | null => {
      if (!os.acceptsNotifications) return null; // LGPD Compliance Check

      const id = Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toISOString();
      const mechanicName = os.assignedMechanicId ? MOCK_USERS.find(u => u.id === os.assignedMechanicId)?.name.split(' ')[0] : 'nossa equipe';

      // Templates UC 4.2
      let notif: Partial<CustomerNotification> = { id, sentAt: timestamp, read: false };

      if (type === 'CREATED') {
          notif = {
              channel: 'WHATSAPP',
              title: 'Abertura da OS',
              message: `Olá ${os.customerName}! Sua OS #${os.id} foi aberta na OSMech. Problema: "${os.complaint}". Te avisaremos assim que o orçamento estiver pronto.`
          };
      } else if (type === OSStatus.APPROVAL) {
          notif = {
              channel: 'WHATSAPP',
              title: 'Orçamento Pronto',
              message: `Olá! O orçamento da OS #${os.id} está pronto. Valor Total: R$ ${os.totalCost.toFixed(2)}. Responda para aprovar ou clique no link: https://osmech.app/ap/${os.id}`
          };
      } else if (type === OSStatus.COMPLETED) {
          notif = {
              channel: 'WHATSAPP',
              title: 'Serviço Concluído',
              message: `Ótima notícia, ${os.customerName}! O serviço da OS #${os.id} foi concluído. Seu veículo está pronto para retirada.`
          };
      } else if (type === OSStatus.IN_PROGRESS) {
          const laborHours = os.aiDiagnosis?.estimatedLaborHours || 2;
          const deliveryTime = new Date(Date.now() + (laborHours + 2) * 3600000);
          notif = {
              channel: 'WHATSAPP',
              title: 'Início do Serviço',
              message: `Iniciamos a manutenção (OS #${os.id}) com o mecânico ${mechanicName}. Previsão de entrega: ${deliveryTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`
          };
      } else if (type === OSStatus.PAID) {
          notif = {
              channel: 'EMAIL',
              title: 'Emissão de Recibo/NF',
              message: `Obrigado por escolher a OSMech! Sua Nota Fiscal/Recibo da OS #${os.id} segue em anexo.`
          };
      } else if (type === OSStatus.WAITING_PARTS) {
           const partName = os.aiDiagnosis?.recommendedParts[0]?.name || "peças";
          notif = {
              channel: 'WHATSAPP',
              title: 'Aguardando Peças',
              message: `Aviso OS #${os.id}: Estamos aguardando a chegada da peça [${partName}]. Avisaremos sobre a retomada.`
          };
      } else if (type === 'PREVENTIVE') {
          const item = os.aiDiagnosis?.preventiveMaintenance || "manutenção preventiva";
          notif = {
              channel: 'WHATSAPP',
              title: 'Lembrete de Manutenção (IA)',
              message: `Lembrete OSMech: Baseado na KM do seu veículo, recomendamos realizar: "${item}". Vamos agendar?`
          };
      } else {
          return null;
      }

      return { ...notif, title: notif.title || 'Notificação', message: notif.message || '', channel: notif.channel || 'SMS' } as CustomerNotification;
  };

  // --- MUTATIONS IMPLEMENTATION (Controller Layer) ---

  // UC001: criarOS
  const createServiceOrder = (input: CreateOSInput) => {
    const newOS: ServiceOrder = {
        id: `OS-${new Date().getFullYear()}-${1000 + orders.length + 1}`,
        customerName: input.customerName || 'Cliente',
        customerCpf: input.customerCpf,
        phone: input.phone || '',
        vehicleModel: input.vehicleModel || '',
        plate: input.plate || '',
        currentMileage: input.currentMileage,
        complaint: input.complaint || '',
        status: input.initialStatus || OSStatus.PENDING,
        aiDiagnosis: input.aiDiagnosis, 
        mechanicNotes: '',
        items: [], // Start empty, populate later
        laborCost: input.estimatedLaborCost || 0,
        partsCost: input.estimatedPartsCost || 0,
        totalCost: (input.estimatedLaborCost || 0) + (input.estimatedPartsCost || 0),
        acceptsNotifications: input.acceptsNotifications,
        notifications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Trigger Notification
    const initialNotif = generateNotification(newOS, 'CREATED');
    if (initialNotif) {
        newOS.notifications = [initialNotif];
    }
    
    setOrders(prev => [newOS, ...prev]);
    addLog('CREATE', `Criou OS ${newOS.id} - ${newOS.vehicleModel}`, newOS.id);
    return newOS;
  };

  // UC003: atualizarStatusOS
  const updateServiceOrderStatus = (osId: string, newStatus: OSStatus) => {
    let updatedOS: ServiceOrder | null = null;

    setOrders(prev => prev.map(o => {
        if (o.id === osId) {
            updatedOS = { ...o, status: newStatus, updatedAt: new Date().toISOString() };
            // Generate notification
            const notification = generateNotification(updatedOS, newStatus);
            if (notification) {
                updatedOS.notifications = [notification, ...(o.notifications || [])];
            }
            return updatedOS;
        }
        return o;
    }));

    if(updatedOS) {
        addLog('UPDATE', `Alterou status OS ${osId} para ${newStatus}`, osId);
        // If current selected is this one, update it
        if(selectedOS?.id === osId) {
            setSelectedOS(updatedOS);
        }
    }
  };

  // UC003: atribuirMecanico
  const assignMechanic = (osId: string, mechanicId: string) => {
      setOrders(prev => prev.map(o => {
          if (o.id === osId) {
             return { ...o, assignedMechanicId: mechanicId, updatedAt: new Date().toISOString() };
          }
          return o;
      }));
      const mechName = MOCK_USERS.find(u => u.id === mechanicId)?.name || mechanicId;
      addLog('UPDATE', `Atribuiu mecânico ${mechName} à OS ${osId}`, osId);
  };

  // UC005: registrarPagamento
  const registerPayment = (osId: string, input: PaymentInput) => {
      let updatedOS: ServiceOrder | null = null;
      setOrders(prev => prev.map(o => {
          if (o.id === osId) {
              updatedOS = { 
                  ...o, 
                  status: OSStatus.PAID, 
                  paymentMethod: input.method,
                  paymentDate: new Date().toISOString(),
                  updatedAt: new Date().toISOString() 
              };
               // Generate notification (NF/Receipt)
               const notification = generateNotification(updatedOS, OSStatus.PAID);
               if (notification) {
                   updatedOS.notifications = [notification, ...(o.notifications || [])];
               }
               return updatedOS;
          }
          return o;
      }));
      
      if(updatedOS && selectedOS?.id === osId) {
          setSelectedOS(updatedOS);
      }

      const noteDetails = input.notes ? ` Obs: ${input.notes}` : '';
      addLog('FINANCE', `Recebeu pagamento R$ ${input.amount.toFixed(2)} (${input.method}) da OS ${osId}.${noteDetails}`, osId);
  };

  // UC004: excluirOS (Secure Deletion Flow)
  const deleteServiceOrder = (osId: string, adminPassword: string): { success: boolean, logId?: string, error?: string } => {
      // Passo 1: Re-autenticação
      if (adminPassword !== "admin123") {
          return { success: false, error: "Senha de administrador incorreta." };
      }

      const orderToDelete = orders.find(o => o.id === osId);
      if (!orderToDelete) {
          return { success: false, error: "Ordem de serviço não encontrada." };
      }

      // Passo 2: Validação de Estado (Integridade Financeira)
      if (orderToDelete.status === OSStatus.PAID) {
          return { success: false, error: "SEGURANÇA: Não é possível excluir uma OS com status 'Finalizado/Pago' devido à integridade fiscal." };
      }

      // Passo 3: Snapshot (Auditoria)
      const snapshot = JSON.parse(JSON.stringify(orderToDelete)) as ServiceOrder;

      // Passo 4: Criação do Log
      const logId = Math.random().toString(36).substr(2, 9).toUpperCase();
      const logEntry: AuditLogEntry = {
          id: logId,
          action: 'DELETE',
          userId: user?.id || 'admin',
          userName: user?.name || 'Admin',
          timestamp: new Date().toISOString(),
          targetId: osId,
          details: `Exclusão Segura da OS ${osId}. Backup (Snapshot) realizado.`,
          snapshot: snapshot // Attached backup
      };

      // Passo 5: Exclusão em Lote
      setOrders(prev => prev.filter(o => o.id !== osId));
      setLogs(prev => [logEntry, ...prev]);

      // Passo 6: Retorno
      return { success: true, logId };
  };

  // --- Interaction Helpers ---
  const openWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/55${cleanPhone}?text=${encodedText}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Texto copiado para a área de transferência! (Use para SMS)");
  }

  // --- Navigation Items ---
  const navItems = useMemo(() => {
    const items = [
      { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'OS_LIST', label: 'Ordens de Serviço', icon: <ClipboardList size={20} /> },
      { id: 'NEW_OS', label: 'Nova OS', icon: <PlusCircle size={20} /> },
      { id: 'AI_CHAT', label: 'Assistente IA', icon: <Bot size={20} /> },
    ];
    if (isAdmin) {
        items.push({ id: 'REPORTS', label: 'Relatórios & Auditoria', icon: <PieChart size={20} /> });
    }
    return items;
  }, [isAdmin]);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = orders
      .filter(o => {
          if (o.status !== OSStatus.PAID && o.status !== OSStatus.COMPLETED) return false;
          
          const d = o.paymentDate ? new Date(o.paymentDate) : new Date(o.updatedAt);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.totalCost, 0);
    
    const active = orders.filter(o => o.status !== OSStatus.COMPLETED && o.status !== OSStatus.PAID).length;
    
    const completed = orders.filter(o => o.status === OSStatus.PAID || o.status === OSStatus.COMPLETED).length;

    const converted = orders.filter(o => o.status !== OSStatus.PENDING && o.status !== OSStatus.DIAGNOSING).length;
    const conversionRate = orders.length > 0 ? (converted / orders.length) * 100 : 0;

    return { monthlyRevenue, active, completed, conversionRate };
  }, [orders]);

  const chartOpenVsClosed = useMemo(() => {
      const openCount = orders.filter(o => ![OSStatus.COMPLETED, OSStatus.PAID, 'Cancelada'].includes(o.status)).length;
      const closedCount = orders.filter(o => [OSStatus.COMPLETED, OSStatus.PAID].includes(o.status)).length;
      const total = openCount + closedCount;

      return [
          { name: 'Abertas', value: openCount, percent: total > 0 ? (openCount/total*100).toFixed(0) : 0 },
          { name: 'Fechadas', value: closedCount, percent: total > 0 ? (closedCount/total*100).toFixed(0) : 0 }
      ];
  }, [orders]);

  const chartDataStatus = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(OSStatus).map(key => ({
      name: OSStatus[key as keyof typeof OSStatus],
      count: statusCounts[OSStatus[key as keyof typeof OSStatus]] || 0
    }));
  }, [orders]);

  const chartRevenueBreakdown = useMemo(() => {
      const completedOrders = orders.filter(o => o.status === OSStatus.PAID || o.status === OSStatus.COMPLETED);
      const laborTotal = completedOrders.reduce((acc, o) => acc + o.laborCost, 0);
      const partsTotal = completedOrders.reduce((acc, o) => acc + o.partsCost, 0);

      return [
          { name: 'Mão de Obra', value: laborTotal },
          { name: 'Peças', value: partsTotal }
      ];
  }, [orders]);

  const chartMechanicTMA = useMemo(() => {
      const stats: Record<string, { totalHours: number; count: number }> = {};
      
      orders.forEach(o => {
          if ((o.status === OSStatus.COMPLETED || o.status === OSStatus.PAID) && o.assignedMechanicId) {
              const mech = MOCK_USERS.find(u => u.id === o.assignedMechanicId);
              const name = mech?.name.split(' ')[0] || 'Desconhecido';
              
              const estimatedHours = o.laborCost > 0 ? o.laborCost / 120 : 1; 

              if (!stats[name]) stats[name] = { totalHours: 0, count: 0 };
              stats[name].totalHours += estimatedHours;
              stats[name].count++;
          }
      });

      return Object.entries(stats).map(([name, data]) => ({
          name,
          tma: parseFloat((data.totalHours / data.count).toFixed(1))
      }));
  }, [orders]);

  // --- Components ---

  const LoginView = () => (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg">
                <Wrench className="text-white w-10 h-10" />
            </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">OSMech</h1>
        <p className="text-slate-500 mb-8">Sistema de Gestão Inteligente</p>
        
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Selecione seu perfil</p>
          {MOCK_USERS.map(u => (
            <button
              key={u.id}
              onClick={() => handleLogin(u)}
              className="w-full flex items-center p-4 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold mr-4 group-hover:bg-blue-100 group-hover:text-blue-600">
                {u.avatar}
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-800">{u.name}</p>
                <p className="text-xs text-slate-500">{u.role === 'ADMIN' ? 'Gerente / Financeiro' : 'Técnico / Operacional'}</p>
              </div>
              <ArrowRight className="ml-auto text-slate-300 group-hover:text-blue-500" size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
            <StatCard 
                title="Faturamento (Mês Atual)" 
                value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                icon={<DollarSign size={24} />} 
                color="bg-emerald-500" 
            />
        )}
        <StatCard title="OS em Andamento" value={stats.active} icon={<Wrench size={24} />} color="bg-blue-500" />
        <StatCard title="Taxa de Conversão" value={`${stats.conversionRate.toFixed(0)}%`} icon={<Activity size={24} />} color="bg-purple-500" />
        <StatCard title="Serviços Finalizados" value={stats.completed} icon={<CheckCircle size={24} />} color="bg-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Status Geral (Abertas vs Fechadas)">
            <div className="h-64 w-full flex justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={chartOpenVsClosed}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, percent}) => `${name} ${percent}%`}
                        >
                            <Cell key="cell-0" fill="#3b82f6" /> 
                            <Cell key="cell-1" fill="#64748b" /> 
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card title="Volume de OS por Status Detalhado">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60}/>
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartDataStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#f59e0b', '#a855f7', '#f97316', '#dc2626', '#3b82f6', '#22c55e', '#64748b'][index % 7] || '#888'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
          <Card title="Tempo Médio de Serviço (TMA) por Mecânico (Horas)">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMechanicTMA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis unit="h" />
                  <Tooltip 
                      cursor={{fill: 'transparent'}} 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      formatter={(value) => [`${value} horas`, 'Tempo Médio']}
                  />
                  <Bar dataKey="tma" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
      </div>
    </div>
  );

  const OSDetailsView = () => {
      if (!selectedOS) return null;

      const [os, setOs] = useState<ServiceOrder>(selectedOS);
      const [editMode, setEditMode] = useState(false);
      const [activeTab, setActiveTab] = useState<'DETAILS' | 'MESSAGES'>('DETAILS');
      const [showPaymentModal, setShowPaymentModal] = useState(false);
      const [showReceiptModal, setShowReceiptModal] = useState(false);
      
      // Item Management State
      const [items, setItems] = useState<ServiceItem[]>(selectedOS.items || []);
      const [newItem, setNewItem] = useState<Partial<ServiceItem>>({
          description: '', type: 'LABOR', quantity: 1, unitPrice: 0
      });

      // Recalculate costs whenever items change
      useEffect(() => {
          const labor = items.filter(i => i.type === 'LABOR').reduce((acc, i) => acc + i.totalPrice, 0);
          const parts = items.filter(i => i.type === 'PART').reduce((acc, i) => acc + i.totalPrice, 0);
          const total = labor + parts;
          
          setOs(prev => ({
              ...prev,
              items: items,
              laborCost: labor,
              partsCost: parts,
              totalCost: total
          }));
      }, [items]);

      const handleAddItem = () => {
          if (!newItem.description || !newItem.unitPrice) return;
          const qty = newItem.quantity || 1;
          const price = newItem.unitPrice || 0;
          
          const item: ServiceItem = {
              id: Math.random().toString(36).substr(2, 9),
              description: newItem.description,
              type: newItem.type as 'LABOR' | 'PART',
              quantity: qty,
              unitPrice: price,
              totalPrice: qty * price
          };
          
          setItems([...items, item]);
          setNewItem({ description: '', type: 'LABOR', quantity: 1, unitPrice: 0 });
      };

      const handleRemoveItem = (id: string) => {
          setItems(items.filter(i => i.id !== id));
      };

      // Call Mutation: updateServiceOrderStatus
      const handleSave = () => {
          setOrders(prev => prev.map(o => o.id === os.id ? os : o));
          setSelectedOS(os);
          addLog('UPDATE', `Editou Detalhes OS ${os.id}`, os.id);
          setEditMode(false);
          alert('OS Atualizada com sucesso!');
      };

      const changeStatus = (newStatus: OSStatus) => {
         updateServiceOrderStatus(os.id, newStatus);
      };

      const handleAssignMechanic = (e: React.ChangeEvent<HTMLSelectElement>) => {
         assignMechanic(os.id, e.target.value);
      }

      const handlePaymentConfirm = (input: PaymentInput) => {
          registerPayment(os.id, input);
      }

      const sendPreventiveReminder = () => {
          const notification = generateNotification(os, 'PREVENTIVE');
          if (notification) {
              const updated = { ...os, notifications: [notification, ...(os.notifications || [])] };
              setOrders(prev => prev.map(o => o.id === os.id ? updated : o));
              setSelectedOS(updated);
              alert("Lembrete Preventivo enviado com sucesso!");
          } else {
              alert("Cliente não autorizou notificações ou não há dados preventivos.");
          }
      }

      return (
          <div className="space-y-6 animate-fade-in pb-10">
              <PaymentModal 
                 isOpen={showPaymentModal} 
                 onClose={() => setShowPaymentModal(false)} 
                 total={os.totalCost}
                 onConfirm={handlePaymentConfirm}
              />
              
              <ReceiptModal
                 isOpen={showReceiptModal}
                 onClose={() => setShowReceiptModal(false)}
                 order={os}
              />

              <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setCurrentView('OS_LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                      <ChevronLeft />
                  </button>
                  <div>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                          {os.id} <StatusBadge status={os.status} />
                      </h2>
                  </div>
                  <div className="ml-auto flex gap-2">
                      {editMode ? (
                          <>
                            <button onClick={() => {setEditMode(false); setItems(selectedOS.items || [])}} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2"><Save size={18}/> Salvar</button>
                          </>
                      ) : (
                          <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"><Wrench size={18}/> Editar OS</button>
                      )}
                  </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-6">
                  <button 
                    onClick={() => setActiveTab('DETAILS')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DETAILS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                      Detalhes do Serviço
                  </button>
                  <button 
                    onClick={() => setActiveTab('MESSAGES')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'MESSAGES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                      Comunicação com Cliente <span className="bg-slate-100 text-slate-600 px-1.5 rounded-full text-xs">{os.notifications?.length || 0}</span>
                  </button>
              </div>

              {activeTab === 'DETAILS' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Left Column: Details & Technical */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Dados do Serviço">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Cliente</label>
                                    <div className="text-slate-800 font-medium text-lg">{os.customerName}</div>
                                    <div className="text-slate-500">{os.phone}</div>
                                    {os.customerCpf && <div className="text-xs text-slate-400 mt-1">CPF: {os.customerCpf}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Veículo</label>
                                    <div className="text-slate-800 font-medium text-lg">{os.vehicleModel}</div>
                                    <div className="flex gap-2">
                                    <div className="text-slate-500 font-mono bg-slate-100 inline-block px-1 rounded">{os.plate}</div>
                                    {os.currentMileage && <div className="text-slate-500 bg-slate-100 inline-block px-1 rounded">{os.currentMileage} km</div>}
                                    </div>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reclamação do Cliente</label>
                                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{os.complaint}"</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notas do Mecânico (Técnico)</label>
                                    {editMode ? (
                                        <textarea 
                                            className="w-full p-3 border border-slate-300 rounded-lg"
                                            rows={4}
                                            value={os.mechanicNotes || ''}
                                            onChange={e => setOs({...os, mechanicNotes: e.target.value})}
                                            placeholder="Descreva o serviço realizado, observações técnicas..."
                                        />
                                    ) : (
                                        <p className="text-slate-700 whitespace-pre-wrap">{os.mechanicNotes || 'Nenhuma observação registrada.'}</p>
                                    )}
                                </div>
                                
                                <div className="col-span-2 border-t border-slate-100 pt-4">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mecânico Responsável</label>
                                    {editMode ? (
                                        <select 
                                            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                                            value={os.assignedMechanicId || ''}
                                            onChange={handleAssignMechanic}
                                        >
                                            <option value="">Selecione...</option>
                                            {MOCK_USERS.filter(u => u.role === 'MECHANIC').map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {os.assignedMechanicId ? (
                                                <>
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                                        {MOCK_USERS.find(u => u.id === os.assignedMechanicId)?.avatar}
                                                    </div>
                                                    <span>{MOCK_USERS.find(u => u.id === os.assignedMechanicId)?.name}</span>
                                                </>
                                            ) : <span className="text-slate-400 italic">Não atribuído</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* ITEMS TABLE */}
                        <Card title="Itens do Serviço (Peças e Mão de Obra)">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                        <tr>
                                            <th className="p-3">Descrição</th>
                                            <th className="p-3">Tipo</th>
                                            <th className="p-3 w-20">Qtd</th>
                                            <th className="p-3 w-28">Unit. (R$)</th>
                                            <th className="p-3 w-28 text-right">Total</th>
                                            {editMode && <th className="p-3 w-10"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="p-3 font-medium text-slate-700">{item.description}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${item.type === 'PART' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                        {item.type === 'PART' ? 'Peça' : 'Serviço'}
                                                    </span>
                                                </td>
                                                <td className="p-3">{item.quantity}</td>
                                                <td className="p-3">R$ {item.unitPrice.toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold text-slate-700">R$ {item.totalPrice.toFixed(2)}</td>
                                                {editMode && (
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600">
                                                            <MinusCircle size={18} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {editMode && (
                                            <tr className="bg-slate-50 border-t border-slate-200">
                                                <td className="p-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Descrição do item..." 
                                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                                        value={newItem.description}
                                                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <select 
                                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                                        value={newItem.type}
                                                        onChange={e => setNewItem({...newItem, type: e.target.value as any})}
                                                    >
                                                        <option value="LABOR">Serviço</option>
                                                        <option value="PART">Peça</option>
                                                    </select>
                                                </td>
                                                <td className="p-2">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                                        value={newItem.quantity}
                                                        onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                                        value={newItem.unitPrice}
                                                        onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                                                    />
                                                </td>
                                                <td className="p-2 text-right font-mono text-slate-400">
                                                    R$ {((newItem.quantity || 0) * (newItem.unitPrice || 0)).toFixed(2)}
                                                </td>
                                                <td className="p-2">
                                                    <button 
                                                        onClick={handleAddItem}
                                                        disabled={!newItem.description || !newItem.unitPrice}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-full"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {items.length === 0 && !editMode && (
                                    <p className="p-4 text-center text-slate-400 text-sm italic">Nenhum item adicionado. Clique em "Editar OS" para adicionar serviços e peças.</p>
                                )}
                            </div>
                        </Card>

                        {os.aiDiagnosis && (
                            <Card title="Inteligência Preditiva (IA)" className="border-l-4 border-l-purple-500">
                                <div className="flex gap-4 items-start">
                                    <div className="bg-purple-100 p-2 rounded-full text-purple-600 mt-1"><ShieldCheck size={20}/></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-1">Recomendação de Manutenção Preventiva (UC006)</h4>
                                        <p className="text-slate-600 text-sm leading-relaxed">{os.aiDiagnosis.preventiveMaintenance}</p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Status & Finance */}
                    <div className="space-y-6">
                        <Card title="Fluxo de Trabalho">
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 uppercase font-bold">Alterar Status</p>
                                <div className="flex flex-col gap-2">
                                    {[OSStatus.PENDING, OSStatus.DIAGNOSING, OSStatus.APPROVAL, OSStatus.WAITING_PARTS, OSStatus.IN_PROGRESS, OSStatus.COMPLETED].map(s => (
                                        <button 
                                            key={s} 
                                            disabled={!editMode}
                                            onClick={() => changeStatus(s)}
                                            className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${os.status === s ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card title="Financeiro (UC005)">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 text-sm">Mão de Obra</span>
                                    <span className="font-mono">R$ {os.laborCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600 text-sm">Peças</span>
                                    <span className="font-mono">R$ {os.partsCost.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">TOTAL</span>
                                    <span className="font-bold text-xl text-green-600">R$ {os.totalCost.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-slate-400 text-center">* Valores calculados automaticamente com base na lista de itens.</p>

                                {/* Payment Section - Admin Only */}
                                {isAdmin && (
                                    <div className="pt-4 mt-4 border-t border-slate-100 bg-slate-50 -mx-6 px-6 -mb-6 pb-6">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Wallet size={14}/> Pagamento</h4>
                                        {os.status === OSStatus.PAID ? (
                                            <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center text-sm font-medium border border-green-200">
                                                <p className="flex items-center justify-center gap-1"><CheckCircle size={14}/> Pagamento Confirmado</p>
                                                {os.paymentMethod && <p className="text-xs opacity-75 mt-1">Via {os.paymentMethod}</p>}
                                                <button 
                                                    onClick={() => setShowReceiptModal(true)} 
                                                    className="mt-3 text-xs bg-white border border-green-200 text-green-700 px-3 py-1.5 rounded-full flex items-center justify-center gap-1 mx-auto hover:bg-green-50 transition-colors"
                                                >
                                                    <FileText size={12} /> Ver Recibo
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                disabled={!editMode}
                                                onClick={() => setShowPaymentModal(true)}
                                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                            >
                                                Registrar Pagamento
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
              ) : (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                    {/* Message List */}
                    <Card title="Histórico de Notificações (UC 4.2)" className="md:col-span-2 h-full flex flex-col relative">
                        {(!os.notifications || os.notifications.length === 0) ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <MessageCircle size={48} className="mb-2 opacity-20" />
                                <p>Nenhuma notificação enviada para este cliente.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {os.notifications.map(n => (
                                    <div key={n.id} className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50 relative group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                            n.channel === 'WHATSAPP' ? 'bg-green-100 text-green-600' : 
                                            n.channel === 'EMAIL' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                        }`}>
                                            {n.channel === 'WHATSAPP' ? <MessageCircle size={20} /> : n.channel === 'EMAIL' ? <Mail size={20} /> : <Smartphone size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                    {n.title}
                                                    {['Abertura da OS', 'Orçamento Pronto', 'Serviço Concluído'].includes(n.title) && (
                                                        <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Importante</span>
                                                    )}
                                                </h4>
                                                <span className="text-[10px] text-slate-400">{new Date(n.sentAt).toLocaleDateString()} {new Date(n.sentAt).toLocaleTimeString().slice(0,5)}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed mb-2">{n.message}</p>
                                            
                                            <div className="flex gap-2">
                                                {n.channel === 'WHATSAPP' && (
                                                    <button 
                                                        onClick={() => openWhatsApp(os.phone, n.message)}
                                                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm"
                                                    >
                                                        <ExternalLink size={12} /> Enviar WhatsApp
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => copyToClipboard(n.message)}
                                                    className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1.5 rounded flex items-center gap-1 transition-colors"
                                                    title="Copiar texto para SMS ou outro app"
                                                >
                                                    <Copy size={12} /> Copiar Texto
                                                </button>
                                            </div>

                                            <div className="mt-2 flex gap-2">
                                                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                                     {n.channel}
                                                 </span>
                                                 {n.read && <span className="text-[10px] text-blue-500 font-medium flex items-center gap-1"><CheckCircle size={10}/> Lido</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100 flex items-center gap-2">
                            <Bot size={16} />
                            Notificações de Abertura, Orçamento e Conclusão são geradas automaticamente.
                        </div>
                    </Card>

                    {/* Actions Panel */}
                    <div className="space-y-6">
                        <Card title="Ações de Comunicação">
                             <div className="space-y-4">
                                 <div className={`p-3 rounded-lg border text-sm ${os.acceptsNotifications ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                     <strong>Status LGPD:</strong> {os.acceptsNotifications ? 'Cliente Autorizou Notificações' : 'Cliente NÃO Autorizou Notificações'}
                                 </div>
                                 
                                 {os.aiDiagnosis && (
                                     <button 
                                        onClick={sendPreventiveReminder}
                                        disabled={!os.acceptsNotifications}
                                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
                                     >
                                         <Bell size={16}/> Enviar Lembrete Preventivo (IA)
                                     </button>
                                 )}

                                 <p className="text-xs text-slate-500 text-center pt-2 border-t border-slate-100">
                                     O lembrete preventivo usa a sugestão da IA para criar uma mensagem personalizada.
                                 </p>
                             </div>
                        </Card>

                        <Card title="Envio Manual">
                             <div className="space-y-3">
                                 <textarea className="w-full p-3 border border-slate-300 rounded-lg text-sm h-24" placeholder="Digite a mensagem..."></textarea>
                                 <div className="flex gap-2">
                                     <button 
                                        disabled={!os.acceptsNotifications} 
                                        onClick={() => openWhatsApp(os.phone, "Olá, mensagem manual da oficina.")}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                     >
                                         <MessageCircle size={16}/> WhatsApp
                                     </button>
                                     <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                                         <Mail size={16}/> E-mail
                                     </button>
                                 </div>
                             </div>
                        </Card>
                    </div>
                </div>
              )}
          </div>
      )
  }

  const OSListView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OSStatus | 'ALL'>('ALL');

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              o.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              o.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDelete = (id: string) => {
        if(!window.confirm("Tem certeza que deseja excluir esta OS?")) return;
        const pwd = prompt("Senha de Administrador necessária para exclusão segura:");
        if(pwd) {
            const result = deleteServiceOrder(id, pwd);
            if(result.success) {
                alert(`OS Excluída. ID do Log de Auditoria: ${result.logId}`);
            } else {
                alert(`Erro: ${result.error}`);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <Card>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente, veículo ou ID..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="w-full md:w-48 p-2 border border-slate-300 rounded-lg bg-white"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">Todos os Status</option>
                        {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-500 text-sm border-b border-slate-200">
                                <th className="p-3 font-medium">OS ID</th>
                                <th className="p-3 font-medium">Cliente</th>
                                <th className="p-3 font-medium">Veículo</th>
                                <th className="p-3 font-medium">Status</th>
                                <th className="p-3 font-medium">Mecânico</th>
                                <th className="p-3 font-medium">Total</th>
                                <th className="p-3 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-3 font-bold text-blue-600">#{order.id}</td>
                                    <td className="p-3">
                                        <div className="font-medium text-slate-800">{order.customerName}</div>
                                        <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-3">{order.vehicleModel} <br/><span className="text-xs text-slate-400 bg-slate-100 px-1 rounded">{order.plate}</span></td>
                                    <td className="p-3"><StatusBadge status={order.status} /></td>
                                    <td className="p-3 text-slate-600">{order.assignedMechanicId ? MOCK_USERS.find(u => u.id === order.assignedMechanicId)?.name.split(' ')[0] : '-'}</td>
                                    <td className="p-3 font-mono">R$ {order.totalCost.toFixed(2)}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setSelectedOS(order); setCurrentView('OS_DETAILS'); }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Ver Detalhes"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(order.id)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredOrders.length === 0 && <p className="text-center text-slate-400 py-8">Nenhuma ordem de serviço encontrada.</p>}
                </div>
             </Card>
        </div>
    );
  };

  const NewOSView = () => {
      const [formData, setFormData] = useState<CreateOSInput>({
          customerName: '', phone: '', vehicleModel: '', plate: '', complaint: '', acceptsNotifications: true
      });
      const [loadingAI, setLoadingAI] = useState(false);
      const [aiResult, setAiResult] = useState<AIDiagnosisResult | null>(null);

      const handleAnalyze = async () => {
          if(!formData.vehicleModel || !formData.complaint) {
              alert("Informe o veículo e a reclamação para diagnóstico.");
              return;
          }
          setLoadingAI(true);
          const result = await getMechanicDiagnosis(formData.vehicleModel, formData.complaint, formData.currentMileage);
          setLoadingAI(false);
          if(result) {
              setAiResult(result);
              setFormData(prev => ({
                 ...prev,
                 aiDiagnosis: result,
                 estimatedLaborCost: result.estimatedLaborHours * 150, // Mock rate R$150/h
                 estimatedPartsCost: result.recommendedParts.reduce((acc, p) => acc + p.estimatedCost, 0)
              }));
          } else {
              alert("Não foi possível gerar diagnóstico. Tente novamente.");
          }
      };

      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const newOS = createServiceOrder(formData);
          alert(`OS #${newOS.id} criada com sucesso!`);
          setSelectedOS(newOS);
          setCurrentView('OS_DETAILS');
      };

      return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <div className="space-y-6">
                  <Card title="Dados do Cliente e Veículo">
                      <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente *</label>
                              <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone *</label>
                                  <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(11) 99999-9999" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">CPF (Opcional)</label>
                                  <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.customerCpf || ''} onChange={e => setFormData({...formData, customerCpf: e.target.value})} />
                              </div>
                          </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Veículo *</label>
                                  <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} placeholder="Ex: Honda Civic 2015" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Placa *</label>
                                  <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Quilometragem</label>
                              <input type="number" className="w-full p-2 border border-slate-300 rounded-lg" value={formData.currentMileage || ''} onChange={e => setFormData({...formData, currentMileage: Number(e.target.value)})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Reclamação do Cliente *</label>
                              <textarea required className="w-full p-2 border border-slate-300 rounded-lg h-24" value={formData.complaint} onChange={e => setFormData({...formData, complaint: e.target.value})} placeholder="Descreva o problema..." />
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                             <input type="checkbox" id="notif" checked={formData.acceptsNotifications} onChange={e => setFormData({...formData, acceptsNotifications: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                             <label htmlFor="notif" className="text-sm text-slate-600 cursor-pointer">Cliente autoriza receber notificações (WhatsApp/Email)</label>
                          </div>

                          <div className="pt-4 flex gap-4">
                              <button type="button" onClick={handleAnalyze} disabled={loadingAI || !formData.vehicleModel || !formData.complaint} className="flex-1 bg-purple-100 text-purple-700 hover:bg-purple-200 py-3 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50">
                                  {loadingAI ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div> : <Bot size={20} />}
                                  Diagnosticar com IA
                              </button>
                              <button type="submit" className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-lg font-bold shadow-lg shadow-blue-200">
                                  Criar Ordem de Serviço
                              </button>
                          </div>
                      </form>
                  </Card>
              </div>

              <div className="space-y-6">
                  {aiResult ? (
                      <Card title="Pré-Diagnóstico IA" className="bg-gradient-to-br from-white to-purple-50 border-purple-100">
                          <div className="space-y-4">
                              <div>
                                  <h4 className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-2"><Activity size={14}/> Causas Prováveis</h4>
                                  <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                                      {aiResult.possibleCauses.map((c, i) => <li key={i}>{c}</li>)}
                                  </ul>
                              </div>
                               <div>
                                  <h4 className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-2"><CheckSquare size={14}/> Passos de Diagnóstico</h4>
                                  <ul className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                                      {aiResult.diagnosisSteps.map((c, i) => <li key={i}>{c}</li>)}
                                  </ul>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                                      <p className="text-xs text-slate-500">Estimativa Peças</p>
                                      <p className="font-bold text-slate-800">R$ {formData.estimatedPartsCost?.toFixed(2)}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded-lg border border-purple-100">
                                      <p className="text-xs text-slate-500">Estimativa Mão de Obra</p>
                                      <p className="font-bold text-slate-800">R$ {formData.estimatedLaborCost?.toFixed(2)}</p>
                                      <p className="text-[10px] text-slate-400">~{aiResult.estimatedLaborHours} horas</p>
                                  </div>
                              </div>
                          </div>
                      </Card>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50">
                          <Bot size={48} className="mb-4 opacity-20" />
                          <p className="text-center text-sm">Preencha os dados do veículo e clique em "Diagnosticar com IA" para receber sugestões técnicas antes de abrir a OS.</p>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const ChatView = () => {
      const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
          { role: 'model', text: 'Olá! Sou o assistente técnico da OSMech. Como posso ajudar com diagnósticos, normas ou gestão hoje?' }
      ]);
      const [input, setInput] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      
      const bottomRef = React.useRef<HTMLDivElement>(null);

      useEffect(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);

      const handleSend = async () => {
          if(!input.trim()) return;
          const userMsg = input;
          setInput('');
          setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
          setIsLoading(true);

          const response = await getShopAssistantChat(messages, userMsg);
          
          setMessages(prev => [...prev, { role: 'model', text: response }]);
          setIsLoading(false);
      };

      return (
          <div className="max-w-4xl mx-auto h-[600px] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg text-white"><Bot size={20}/></div>
                  <div>
                      <h3 className="font-bold text-slate-800">Assistente Técnico IA</h3>
                      <p className="text-xs text-slate-500">Gemini 2.5 Flash</p>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              m.role === 'user' 
                                  ? 'bg-blue-600 text-white rounded-br-none' 
                                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                          }`}>
                              <ReactMarkdown>{m.text}</ReactMarkdown>
                          </div>
                      </div>
                  ))}
                  {isLoading && (
                      <div className="flex justify-start">
                          <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-2 items-center">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                      </div>
                  )}
                  <div ref={bottomRef} />
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                  <input 
                      type="text" 
                      className="flex-1 p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
                      placeholder="Digite sua dúvida técnica..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                  />
                  <button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-lg transition-colors"
                  >
                      <Send size={20} />
                  </button>
              </div>
          </div>
      )
  };

  const ReportsView = () => {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Receita por Categoria">
                      <div className="h-64 w-full flex justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={chartRevenueBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    <Cell key="cell-0" fill="#3b82f6" /> 
                                    <Cell key="cell-1" fill="#f59e0b" /> 
                                </Pie>
                                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`}/>
                                <Legend />
                            </RePieChart>
                         </ResponsiveContainer>
                      </div>
                  </Card>
                   <Card title="Performance Operacional">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                                <span className="text-sm text-slate-600">Total de OS</span>
                                <span className="font-bold text-slate-800">{orders.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                                <span className="text-sm text-slate-600">Ticket Médio</span>
                                <span className="font-bold text-slate-800">R$ {(stats.monthlyRevenue / (stats.completed || 1)).toFixed(2)}</span>
                            </div>
                        </div>
                  </Card>
              </div>

              <Card title="Logs de Auditoria do Sistema" className="overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0">
                              <tr>
                                  <th className="p-3">Data/Hora</th>
                                  <th className="p-3">Usuário</th>
                                  <th className="p-3">Ação</th>
                                  <th className="p-3">Detalhes</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {logs.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50">
                                      <td className="p-3 font-mono text-xs text-slate-500">
                                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                                      </td>
                                      <td className="p-3 font-medium text-slate-700">{log.userName}</td>
                                      <td className="p-3">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                              log.action === 'CREATE' ? 'bg-green-50 text-green-700 border-green-200' :
                                              log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                                              log.action === 'FINANCE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                              'bg-blue-50 text-blue-700 border-blue-200'
                                          }`}>{log.action}</span>
                                      </td>
                                      <td className="p-3 text-slate-600">{log.details}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      );
  };

  // --- Main Render ---

  if (currentView === 'LOGIN') {
      return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col shadow-xl z-20 fixed md:relative h-full`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800 h-20">
          {isSidebarOpen && <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2"><Wrench className="text-blue-500" fill="currentColor" size={24}/> OSMech</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white hidden md:block">
             {isSidebarOpen ? <ChevronLeft size={20}/> : <Menu size={20}/>}
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <div className={`${!isSidebarOpen ? 'mx-auto' : ''}`}>{item.icon}</div>
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           {isSidebarOpen ? (
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {user?.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate w-24">{user?.name}</p>
                      <p className="text-[10px] text-blue-400 uppercase tracking-wider">{user?.role === 'ADMIN' ? 'Administrador' : 'Mecânico'}</p>
                    </div>
                 </div>
                 <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Sair">
                     <LogOut size={16} />
                 </button>
             </div>
           ) : (
             <button onClick={handleLogout} className="w-8 h-8 mx-auto rounded flex items-center justify-center text-slate-500 hover:text-red-400">
                 <LogOut size={18} />
             </button>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto flex flex-col bg-slate-100 transition-all duration-300 relative`}>
        {/* Topbar Mobile */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
           <h2 className="font-bold flex items-center gap-2"><Wrench size={18}/> OSMech</h2>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full pb-20">
          {currentView !== 'OS_DETAILS' && (
             <header className="mb-8 flex justify-between items-center animate-fade-in-down">
                <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                    {navItems.find(n => n.id === currentView)?.label}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    {currentView === 'DASHBOARD' && `Bem-vindo, ${user?.name}.`}
                    {currentView === 'OS_LIST' && 'Gerencie o fluxo de trabalho da oficina.'}
                    {currentView === 'NEW_OS' && 'Inicie um novo diagnóstico com auxílio de IA.'}
                    {currentView === 'REPORTS' && 'Análise de performance e auditoria.'}
                    {currentView === 'AI_CHAT' && 'Assistente especialista técnico disponível 24h.'}
                </p>
                </div>
            </header>
          )}

          {currentView === 'DASHBOARD' && <DashboardView />}
          {currentView === 'OS_LIST' && <OSListView />}
          {currentView === 'NEW_OS' && <NewOSView />}
          {currentView === 'AI_CHAT' && <ChatView />}
          {currentView === 'OS_DETAILS' && <OSDetailsView />}
          {currentView === 'REPORTS' && <ReportsView />}
        </div>
      </main>
    </div>
  );
}