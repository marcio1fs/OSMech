

import React, { useState, useEffect, useMemo, useRef } from 'react';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from "jspdf";
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
  ChevronRight,
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
  MinusCircle,
  Share2,
  ImageIcon,
  Loader,
  Gauge,
  ListPlus,
  Edit3,
  Building2,
  MapPin,
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Percent,
  CalendarDays,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Columns,
  Camera,
  Upload,
  Download,
  Share,
  FileCheck,
  Settings,
  Trash,
  Palette,
  Brain,
  Package,
  AlertCircle,
  PlayCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileBarChart,
  UserCog,
  Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Legend, AreaChart, Area } from 'recharts';
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
    ServiceItem,
    CompanySettings,
    Expense,
    ExpenseCategoryLabel,
    InventoryItem
} from './types';
import { getMechanicDiagnosis, getShopAssistantChat, analyzePartImage } from './services/geminiService';
import { Card, StatCard } from './components/Card';
import { StatusBadge } from './components/StatusBadge';

// --- Mock Data ---
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Roberto (Admin)', role: 'ADMIN', avatar: 'RO', specialty: 'Gestão', active: true, email: 'roberto@osmech.com', phone: '(11) 99999-0001' },
  { id: 'u2', name: 'Carlos (Mecânico)', role: 'MECHANIC', avatar: 'CA', specialty: 'Motor Diesel', commissionRate: 30, active: true, email: 'carlos@osmech.com', phone: '(11) 99999-0002' },
  { id: 'u3', name: 'Jorge (Mecânico)', role: 'MECHANIC', avatar: 'JO', specialty: 'Suspensão e Freios', commissionRate: 30, active: true, email: 'jorge@osmech.com', phone: '(11) 99999-0003' }
];

const COMMON_MANUFACTURERS = [
    "FIAT", "VOLKSWAGEN", "CHEVROLET", "FORD", "TOYOTA", 
    "HYUNDAI", "HONDA", "RENAULT", "JEEP", "NISSAN", "PEUGEOT", "CITROEN", "MITSUBISHI", "BMW", "MERCEDES-BENZ", "KIA", "AUDI", "VOLVO"
];

const EXPENSE_CATEGORIES: ExpenseCategoryLabel = {
    FIXED: 'Custos Fixos (Aluguel/Luz)',
    VARIABLE: 'Custos Variáveis',
    PAYROLL: 'Folha de Pagamento',
    PARTS: 'Compra de Peças',
    TAXES: 'Impostos e Taxas'
};

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', description: 'ALUGUEL GALPÃO', amount: 2500, category: 'FIXED', date: new Date(Date.now() - 86400000 * 10).toISOString(), dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'PAID', userId: 'u1' },
    { id: 'e2', description: 'CONTA DE LUZ', amount: 450, category: 'FIXED', date: new Date(Date.now() - 86400000 * 5).toISOString(), dueDate: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'PAID', userId: 'u1' },
    { id: 'e3', description: 'LOTE DE ÓLEO 5W30', amount: 800, category: 'PARTS', date: new Date(Date.now() - 86400000 * 2).toISOString(), dueDate: new Date(Date.now() + 86400000 * 20).toISOString(), status: 'PENDING', userId: 'u1' },
];

const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'i1', code: 'OLEO-5W30', name: 'ÓLEO MOTOR 5W30 SINTÉTICO', manufacturer: 'SHELL', category: 'LUBRIFICANTES', costPrice: 35.00, sellPrice: 65.00, stockQuantity: 45, minStockLevel: 10 },
    { id: 'i2', code: 'FIL-AR-01', name: 'FILTRO DE AR GOL/VOYAGE', manufacturer: 'TECFIL', category: 'FILTROS', costPrice: 15.00, sellPrice: 35.00, stockQuantity: 8, minStockLevel: 5 },
    { id: 'i3', code: 'PAST-D-01', name: 'PASTILHA FREIO DIANT. PALIO', manufacturer: 'COBREQ', category: 'FREIOS', costPrice: 60.00, sellPrice: 120.00, stockQuantity: 2, minStockLevel: 4 },
];

const INITIAL_DATA: ServiceOrder[] = [
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
        { id: 'n1', channel: 'WHATSAPP', title: 'Abertura da OS', message: 'Sua OS #OS-1001 foi aberta! O problema relatado foi: Motor perdendo potência em subidas. Você será notificado sobre o orçamento.', sentAt: new Date(Date.now() - 86400000 * 5).toISOString(), read: true },
        { id: 'n2', channel: 'EMAIL', title: 'Emissão de Recibo/NF', message: 'Obrigado por escolher a OSMech! Sua Nota Fiscal/Recibo da OS #OS-1001 foi enviada para o seu e-mail.', sentAt: new Date().toISOString(), read: false }
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

// --- Helper Functions ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const handleUppercaseChange = (setter: (val: any) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value.toUpperCase());
};

const formatDateInput = (dateStr: string) => {
    return dateStr.split('T')[0];
}

// --- Mask Helpers ---
const formatCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const formatCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, ''); 
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    v = v.replace(/(\d)(\d{4})$/, '$1-$2'); 
    return v.slice(0, 15); 
};

const formatPlate = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
};

// --- Helper: Convert File to Base64 ---
const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Setup View Component (Onboarding) ---
const SetupView = ({ onSave }: { onSave: (settings: CompanySettings) => void }) => {
    const [settings, setSettings] = useState<CompanySettings>({
        name: '',
        cnpj: '',
        address: '',
        phone: '',
        email: '',
        subtitle: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!settings.name || !settings.address) {
            alert("Preencha ao menos o nome e endereço da empresa.");
            return;
        }
        onSave(settings);
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
                <div className="bg-blue-600 p-8 text-white text-center">
                    <div className="flex justify-center mb-4">
                         <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                            <Building2 size={48} className="text-white" />
                         </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Bem-vindo ao OSMech</h1>
                    <p className="text-blue-100">Vamos configurar os dados da sua oficina para começar.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome da Empresa / Oficina</label>
                             <input 
                                required
                                type="text"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                                placeholder="EX: AUTO CENTER SILVA"
                                value={settings.name}
                                onChange={handleUppercaseChange(val => setSettings({...settings, name: val}))}
                             />
                        </div>
                        
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Slogan / Subtítulo (Opcional)</label>
                             <input 
                                type="text"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                                placeholder="EX: ESPECIALIZADO EM IMPORTADOS"
                                value={settings.subtitle || ''}
                                onChange={handleUppercaseChange(val => setSettings({...settings, subtitle: val}))}
                             />
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CNPJ</label>
                             <input 
                                required
                                type="text"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                placeholder="00.000.000/0000-00"
                                value={settings.cnpj}
                                onChange={e => setSettings({...settings, cnpj: formatCNPJ(e.target.value)})}
                             />
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Telefone Comercial</label>
                             <input 
                                required
                                type="text"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                placeholder="(00) 00000-0000"
                                value={settings.phone}
                                onChange={e => setSettings({...settings, phone: formatPhone(e.target.value)})}
                             />
                        </div>

                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Endereço Completo</label>
                             <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-slate-400" size={18}/>
                                <input 
                                    required
                                    type="text"
                                    className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                                    placeholder="RUA EXEMPLO, 123 - CENTRO, CIDADE - UF"
                                    value={settings.address}
                                    onChange={handleUppercaseChange(val => setSettings({...settings, address: val}))}
                                />
                             </div>
                        </div>
                        
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail de Contato (Opcional)</label>
                             <input 
                                type="email"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm lowercase"
                                placeholder="contato@suaoficina.com.br"
                                value={settings.email || ''}
                                onChange={e => setSettings({...settings, email: e.target.value})}
                             />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                            <Save size={20}/> Salvar Configurações e Iniciar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- Modals ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
                    <h3 className="font-bold text-red-800 flex items-center gap-2"><Trash2 size={18}/> {title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 mb-6">{message}</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-900/20 transition-colors">Confirmar Exclusão</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

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
                        <p className="text-3xl font-bold text-green-600">{formatCurrency(total)}</p>
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
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 uppercase"
                            rows={3}
                            placeholder="EX: PARCELADO EM 3X..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value.toUpperCase())}
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

const DocumentModal = ({ order, isOpen, onClose, company, onLog, mode = 'RECEIPT' }: { order: ServiceOrder, isOpen: boolean, onClose: () => void, company: CompanySettings, onLog: (action: AuditLogEntry['action'], details: string, targetId: string) => void, mode: 'RECEIPT' | 'QUOTE' }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendPhone, setSendPhone] = useState(order.phone.replace(/\D/g, ''));
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useEffect(() => {
    if(isOpen) {
        setSendPhone(order.phone.replace(/\D/g, ''));
        setHasConfirmed(false);
    }
  }, [isOpen, order]);

  if (!isOpen) return null;

  const subTotal = order.laborCost + order.partsCost;
  const discountValue = subTotal * ((order.discountPercentage || 0) / 100);

  const documentTitle = mode === 'RECEIPT' ? 'RECIBO / FATURA' : 'ORÇAMENTO DE SERVIÇO';
  const fileName = mode === 'RECEIPT' ? `Recibo-${order.id}.pdf` : `Orcamento-${order.id}.pdf`;

  const generatePDFBlob = async (): Promise<Blob | null> => {
      const element = document.getElementById('print-area');
      if(!element) return null;
      
      try {
          const canvas = await html2canvas(element, { 
              scale: 2, 
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          return pdf.output('blob');
      } catch (e) {
          console.error("PDF Gen Error", e);
          return null;
      }
  }

  const handleDownloadPDF = async () => {
      setIsGenerating(true);
      const blob = await generatePDFBlob();
      if(blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          onLog('FINANCE', `Baixou PDF (${mode}) da OS ${order.id}`, order.id);
          setHasConfirmed(true);
      }
      setIsGenerating(false);
  }

  const handleSendWhatsapp = async () => {
      if (!sendPhone || sendPhone.length < 10) {
          alert("Por favor, verifique o número de WhatsApp (DDD + Número).");
          return;
      }
      
      const confirmSend = window.confirm(`Confirmar envio para o número: ${formatPhone(sendPhone)}?`);
      if(!confirmSend) return;

      setIsGenerating(true);
      const blob = await generatePDFBlob();
      
      if(blob) {
          const file = new File([blob], fileName, { type: 'application/pdf' });
          
          // Template de mensagem
          let message = "";
          if (mode === 'RECEIPT') {
               message = `Olá ${order.customerName}, aqui está o recibo referente ao serviço no veículo ${order.vehicleModel}. Total: ${formatCurrency(order.totalCost)}. Obrigado pela preferência!`;
          } else {
               message = `Olá ${order.customerName}, segue o orçamento solicitado para o veículo ${order.vehicleModel}. Total Estimado: ${formatCurrency(order.totalCost)}. Fico no aguardo da aprovação!`;
          }

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                  await navigator.share({
                      files: [file],
                      title: documentTitle,
                      text: message
                  });
                  onLog('FINANCE', `Enviou ${mode} via Share Nativo OS ${order.id}`, order.id);
                  setHasConfirmed(true);
              } catch (err) {
                  console.log("Share cancelled/failed", err);
              }
          } else {
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.click();

              const fullMessage = `${message} (Anexe o PDF baixado nesta conversa)`;
              window.open(`https://wa.me/55${sendPhone}?text=${encodeURIComponent(fullMessage)}`, '_blank');
              onLog('FINANCE', `Enviou ${mode} via WhatsApp para ${order.customerName}`, order.id);
              setHasConfirmed(true);
          }
      } else {
          alert("Erro ao gerar PDF.");
      }
      setIsGenerating(false);
  }

  return (
    <div className="fixed inset-0 bg-slate-800/80 z-50 flex items-center justify-center p-4 animate-fade-in z-[100] overflow-y-auto">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              min-height: 297mm;
              margin: 0;
              padding: 15mm;
              background: white;
              color: black;
              border: none;
              box-shadow: none;
              transform: none !important;
              scale: 1 !important;
            }
            .no-print { display: none !important; }
            @page { size: A4; margin: 0; }
          }
        `}
      </style>

      <div className="flex flex-col items-center max-h-full w-full">
          {/* Controls - Assistant Panel */}
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl mb-4 flex flex-col no-print w-full max-w-2xl overflow-hidden sticky top-4 z-50 border border-slate-700">
               <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                   <div className="flex items-center gap-2">
                       <div className="bg-green-500/10 p-2 rounded-lg text-green-500">
                           <Bot size={20}/>
                       </div>
                       <div>
                           <h3 className="font-bold text-white text-sm">Painel de Envio de {mode === 'RECEIPT' ? 'Recibo' : 'Orçamento'}</h3>
                           <p className="text-[10px] text-slate-400">Verifique os dados abaixo antes de enviar.</p>
                       </div>
                   </div>
                   <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"><X size={20}/></button>
               </div>
               
               <div className="p-4 bg-slate-900 space-y-4">
                   {/* Step 1: Identify */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-slate-800 p-3 rounded border border-slate-700">
                           <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1 flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> Cliente Identificado</label>
                           <p className="text-white font-medium truncate flex items-center gap-2"><UserIcon size={14} className="text-slate-500"/> {order.customerName}</p>
                           <p className="text-xs text-slate-500 mt-1">CPF: {order.customerCpf || 'N/A'}</p>
                       </div>
                       {/* Step 2: Locate/Verify */}
                       <div className="bg-slate-800 p-3 rounded border border-slate-700">
                           <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1 flex items-center gap-1">
                               <CheckCircle size={10} className="text-green-500"/> {mode === 'RECEIPT' ? 'Pagamento Verificado' : 'Valores Conferidos'}
                            </label>
                           <p className="text-green-400 font-bold">Total: {formatCurrency(order.totalCost)}</p>
                           {mode === 'RECEIPT' && <p className="text-xs text-slate-500 mt-1 capitalize">Método: {order.paymentMethod === 'CREDIT_CARD' ? 'Cartão Crédito' : order.paymentMethod}</p>}
                           {mode === 'QUOTE' && <p className="text-xs text-slate-500 mt-1">Itens: {order.items?.length || 0}</p>}
                       </div>
                   </div>
                   
                   <div className="bg-slate-800 p-3 rounded border border-slate-700">
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">WhatsApp de Envio (Confirme o Número)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-sm font-mono">+55</span>
                            <input 
                                type="text" 
                                value={sendPhone}
                                onChange={(e) => setSendPhone(e.target.value.replace(/\D/g, ''))}
                                className="bg-transparent border-none text-white font-mono w-full focus:ring-0 p-0 placeholder-slate-600"
                                placeholder="DDD + Número"
                            />
                            <Edit3 size={14} className="text-slate-500"/>
                        </div>
                    </div>

                   {/* Alerts */}
                   {hasConfirmed && (
                        <div className="bg-green-500/20 border border-green-500/50 p-2 rounded text-xs text-green-400 flex items-center gap-2 animate-pulse">
                            <CheckCircle size={14}/> Ação registrada no sistema!
                        </div>
                   )}

                   {/* Step 3: Action */}
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                       {!hasConfirmed ? (
                           <button 
                                onClick={handleSendWhatsapp} 
                                disabled={isGenerating}
                                className="col-span-2 md:col-span-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/50"
                           >
                               {isGenerating ? <Loader className="animate-spin" size={18}/> : <Share2 size={18}/>} 
                               Gerar PDF e Enviar
                           </button>
                       ) : (
                           <button 
                                onClick={onClose} 
                                className="col-span-2 md:col-span-1 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg border border-slate-500"
                           >
                               <X size={18}/> Fechar Janela
                           </button>
                       )}
                       
                       <button 
                            onClick={handleDownloadPDF} 
                            disabled={isGenerating}
                            className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
                       >
                           <Download size={18}/> Baixar
                       </button>

                       <button 
                            onClick={() => {
                                window.print();
                                setHasConfirmed(true);
                            }} 
                            className="col-span-2 md:col-span-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
                       >
                           <Printer size={18}/> Imprimir
                       </button>
                   </div>
                   
                   {hasConfirmed && (
                        <div className="text-center pt-1">
                           <button 
                               onClick={() => setHasConfirmed(false)} 
                               className="text-[10px] text-slate-500 hover:text-slate-300 underline uppercase tracking-wider"
                           >
                               Enviar novamente
                           </button>
                        </div>
                   )}
               </div>
          </div>
        
        {/* Área de Impressão - Formato A4 */}
        <div id="print-area" className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[15mm] text-slate-800 relative flex flex-col origin-top scale-50 sm:scale-75 md:scale-100 transition-transform uppercase">
            
            {/* Cabeçalho */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div className="flex gap-4 items-center">
                    <div className="bg-slate-900 text-white p-3 rounded-lg">
                        <Wrench size={32}/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight uppercase">{company.name}</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{company.subtitle || 'Centro Automotivo'}</p>
                        <p className="text-xs text-slate-500 mt-1">CNPJ: {company.cnpj}</p>
                        <p className="text-xs text-slate-500">{company.address}</p>
                        <p className="text-xs text-slate-500">Tel: {company.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-800">{documentTitle}</h2>
                    <p className="text-sm font-mono text-slate-500 mt-1">#{order.id}</p>
                    <p className="text-xs text-slate-400 mt-1">Emissão: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Dados Cliente e Veículo */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Dados do Cliente</h3>
                    <p className="font-bold text-sm uppercase">{order.customerName}</p>
                    <p className="text-xs text-slate-600 mt-1 uppercase">CPF: {order.customerCpf || 'NÃO INFORMADO'}</p>
                    <p className="text-xs text-slate-600 uppercase">TEL: {order.phone}</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Dados do Veículo</h3>
                    <p className="font-bold text-sm uppercase">
                        {order.vehicleManufacturer && <span className="text-slate-500 mr-1">{order.vehicleManufacturer}</span>}
                        {order.vehicleModel}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">PLACA: <span className="font-mono bg-white border border-slate-300 px-1 rounded uppercase">{order.plate}</span></p>
                    <div className="flex gap-4 mt-1 flex-wrap">
                        {order.vehicleYear && <p className="text-xs text-slate-600 uppercase">ANO: {order.vehicleYear}</p>}
                        {order.vehicleColor && <p className="text-xs text-slate-600 uppercase">COR: {order.vehicleColor}</p>}
                        <p className="text-xs text-slate-600 uppercase">KM: {order.currentMileage || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Tabela de Itens */}
            <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-2 border-l-4 border-slate-800 pl-2">Detalhamento dos Serviços</h3>
                <table className="w-full text-sm mb-8">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase">
                            <th className="py-3 px-2 text-left">Código</th>
                            <th className="py-3 px-2 text-left">Descrição</th>
                            <th className="py-3 px-2 text-center w-24">Tipo</th>
                            <th className="py-3 px-2 text-center w-16">Qtd</th>
                            <th className="py-3 px-2 text-right w-28">Unitário</th>
                            <th className="py-3 px-2 text-right w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 uppercase">
                        {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                                <tr key={item.id} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="py-3 px-2 text-xs text-slate-500 font-mono">{item.code || '-'}</td>
                                    <td className="py-3 px-2">{item.description}</td>
                                    <td className="py-3 px-2 text-center">
                                        <span className="text-[10px] border border-slate-200 px-1 rounded uppercase">{item.type === 'PART' ? 'Peça' : 'Serv'}</span>
                                    </td>
                                    <td className="py-3 px-2 text-center">{item.quantity}</td>
                                    <td className="py-3 px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-3 px-2 text-right font-mono font-medium">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                            ))
                        ) : (
                            <>
                                <tr className="border-b border-slate-100"><td className="py-3 px-2">-</td><td className="py-3 px-2">Mão de Obra (Geral)</td><td className="text-center">SERV</td><td className="text-center">1</td><td className="text-right">{formatCurrency(order.laborCost)}</td><td className="text-right">{formatCurrency(order.laborCost)}</td></tr>
                                <tr className="border-b border-slate-100"><td className="py-3 px-2">-</td><td className="py-3 px-2">Peças (Geral)</td><td className="text-center">PEÇA</td><td className="text-center">1</td><td className="text-right">{formatCurrency(order.partsCost)}</td><td className="text-right">{formatCurrency(order.partsCost)}</td></tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>

             {/* Observações Fiscais */}
             {order.fiscalNotes && (
                <div className="mb-6 border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Observações</h3>
                    <p className="text-xs text-slate-700 uppercase whitespace-pre-wrap leading-relaxed">{order.fiscalNotes}</p>
                </div>
            )}

            {/* Totais e Pagamento */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2">
                    <div className="flex justify-between py-2 border-b border-slate-100 text-sm text-slate-600 uppercase">
                        <span>Subtotal Serviços</span>
                        <span>{formatCurrency(order.laborCost)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100 text-sm text-slate-600 uppercase">
                        <span>Subtotal Peças</span>
                        <span>{formatCurrency(order.partsCost)}</span>
                    </div>
                    {(order.discountPercentage && order.discountPercentage > 0) && (
                        <div className="flex justify-between py-2 border-b border-slate-100 text-sm text-green-600 font-medium uppercase">
                            <span>Desconto Promocional ({order.discountPercentage}%)</span>
                            <span>- {formatCurrency(discountValue)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-3 text-lg font-bold text-slate-900 border-b-2 border-slate-900 mt-2 uppercase">
                        <span>TOTAL {mode === 'QUOTE' ? 'ESTIMADO' : 'A PAGAR'}</span>
                        <span>{formatCurrency(order.totalCost)}</span>
                    </div>
                    
                    {mode === 'RECEIPT' && (
                        <div className="mt-4 bg-green-50 border border-green-100 p-3 rounded text-center">
                            <p className="text-green-800 font-bold text-sm uppercase flex items-center justify-center gap-2">
                                <CheckCircle size={16}/> Pagamento Confirmado
                            </p>
                            <p className="text-xs text-green-700 mt-1 uppercase">
                                Método: {order.paymentMethod} | Data: {order.paymentDate ? new Date(order.paymentDate).toLocaleDateString() : '-'}
                            </p>
                        </div>
                    )}

                    {mode === 'QUOTE' && (
                        <div className="mt-4 bg-slate-50 border border-slate-100 p-3 rounded text-center">
                            <p className="text-slate-600 font-bold text-xs uppercase">
                                Orçamento válido por 10 dias.
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Sujeito a alteração caso sejam encontrados novos defeitos.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rodapé / Assinatura */}
            <div className="mt-auto pt-12 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-12 text-center">
                    <div>
                        <div className="border-b border-slate-400 mb-2"></div>
                        <p className="text-xs text-slate-500 uppercase">Assinatura da Oficina</p>
                    </div>
                    <div>
                        <div className="border-b border-slate-400 mb-2"></div>
                        <p className="text-xs text-slate-500 uppercase">
                            {mode === 'RECEIPT' ? 'Assinatura do Cliente' : 'Aprovo este orçamento'}
                        </p>
                    </div>
                </div>
                <div className="text-center mt-8 text-[10px] text-slate-400">
                    <p>Garantia de serviços de 90 dias conforme lei vigente.</p>
                    <p>Sistema OSMech - Gestão Inteligente</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}

const LoginView = ({ users, onLogin }: { users: User[], onLogin: (u: User) => void }) => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
     <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                <Wrench size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">OSMech Login</h1>
            <p className="text-slate-500">Selecione seu usuário para entrar</p>
        </div>
        <div className="space-y-3">
            {users.filter(u => u.active).map(u => (
                <button key={u.id} onClick={() => onLogin(u)} className="w-full flex items-center p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:bg-blue-200 group-hover:text-blue-700">
                        {u.avatar}
                    </div>
                    <div className="ml-4 text-left">
                        <p className="font-bold text-slate-800 group-hover:text-blue-800">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.role === 'ADMIN' ? 'Administrador' : 'Mecânico'}</p>
                    </div>
                    <ArrowRight className="ml-auto text-slate-300 group-hover:text-blue-500" size={20}/>
                </button>
            ))}
        </div>
     </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all mb-1 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}>
        {icon}
        <span className="text-sm">{label}</span>
    </button>
);

const FinanceView = ({ expenses, orders, onAddExpense, inventory, onUpdateInventory, onAddInventory }: { expenses: Expense[], orders: ServiceOrder[], onAddExpense: (e: Expense) => void, inventory: InventoryItem[], onUpdateInventory: (item: InventoryItem) => void, onAddInventory: (item: InventoryItem) => void }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'ENTRIES' | 'INVENTORY' | 'REPORTS'>('DASHBOARD');
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({ description: '', amount: 0, category: 'VARIABLE', date: new Date().toISOString().split('T')[0], status: 'PENDING' });
    const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ code: '', name: '', costPrice: 0, sellPrice: 0, stockQuantity: 0, minStockLevel: 0, category: 'GERAL' });

    // Financial Calculation Logic
    const paidOrders = orders.filter(o => o.status === OSStatus.PAID);
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalCost, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    // Alert Logic
    const overdueExpenses = expenses.filter(e => e.status === 'PENDING' && new Date(e.dueDate || '') < new Date());
    const lowStockItems = inventory.filter(i => i.stockQuantity <= i.minStockLevel);

    const handleAddExpense = () => {
        if (!newExpense.description || !newExpense.amount) return;
        onAddExpense({
            id: Date.now().toString(),
            userId: 'u1', // Mock user
            description: newExpense.description.toUpperCase(),
            amount: Number(newExpense.amount),
            category: newExpense.category as any,
            date: newExpense.date as string,
            dueDate: newExpense.date as string, // Simplification
            status: newExpense.status as any
        });
        setNewExpense({ description: '', amount: 0, category: 'VARIABLE', date: new Date().toISOString().split('T')[0], status: 'PENDING' });
    };

    const handleAddItem = () => {
        if (!newItem.name || !newItem.code) return;
        onAddInventory({
            id: Date.now().toString(),
            code: newItem.code.toUpperCase(),
            name: newItem.name.toUpperCase(),
            costPrice: Number(newItem.costPrice),
            sellPrice: Number(newItem.sellPrice),
            stockQuantity: Number(newItem.stockQuantity),
            minStockLevel: Number(newItem.minStockLevel),
            category: newItem.category?.toUpperCase() || 'GERAL'
        });
        setNewItem({ code: '', name: '', costPrice: 0, sellPrice: 0, stockQuantity: 0, minStockLevel: 0, category: 'GERAL' });
    };

    const generateDRE = () => {
        const partsRevenue = paidOrders.reduce((acc, o) => acc + o.partsCost, 0);
        const laborRevenue = paidOrders.reduce((acc, o) => acc + o.laborCost, 0);
        const grossRevenue = partsRevenue + laborRevenue;
        
        const variableCosts = expenses.filter(e => e.category === 'PARTS' || e.category === 'VARIABLE').reduce((acc, e) => acc + e.amount, 0);
        const taxes = expenses.filter(e => e.category === 'TAXES').reduce((acc, e) => acc + e.amount, 0);
        const fixedCosts = expenses.filter(e => e.category === 'FIXED' || e.category === 'PAYROLL').reduce((acc, e) => acc + e.amount, 0);
        
        const netOperatingProfit = grossRevenue - variableCosts - taxes - fixedCosts;

        return { partsRevenue, laborRevenue, grossRevenue, variableCosts, taxes, fixedCosts, netOperatingProfit };
    };

    const dreData = generateDRE();

    const chartData = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']; // Simplificação mock
        return months.map((m, i) => ({
            name: m,
            receita: i === 5 ? totalRevenue : Math.random() * 5000,
            despesa: i === 5 ? totalExpenses : Math.random() * 3000,
        }));
    }, [totalRevenue, totalExpenses]);

    const pieData = Object.keys(EXPENSE_CATEGORIES).map(cat => ({
        name: EXPENSE_CATEGORIES[cat as keyof ExpenseCategoryLabel],
        value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
    })).filter(d => d.value > 0);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-6">
            {/* Alerts Banner */}
            {overdueExpenses.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 animate-pulse">
                    <AlertTriangle size={20}/>
                    <span className="font-bold">Atenção: Existem {overdueExpenses.length} contas vencidas pendentes de pagamento!</span>
                </div>
            )}
            {lowStockItems.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg flex items-center gap-3">
                    <Package size={20}/>
                    <span className="font-bold">Estoque: {lowStockItems.length} itens abaixo do nível mínimo.</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
                <button onClick={() => setActiveTab('DASHBOARD')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'DASHBOARD' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <LayoutDashboard size={18}/> Visão Geral
                </button>
                <button onClick={() => setActiveTab('ENTRIES')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'ENTRIES' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Banknote size={18}/> Lançamentos
                </button>
                <button onClick={() => setActiveTab('INVENTORY')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'INVENTORY' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Package size={18}/> Estoque
                </button>
                <button onClick={() => setActiveTab('REPORTS')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'REPORTS' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <FileBarChart size={18}/> Relatórios
                </button>
            </div>

            {/* DASHBOARD TAB */}
            {activeTab === 'DASHBOARD' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard title="Receita Total" value={formatCurrency(totalRevenue)} icon={<TrendingUp size={24}/>} color="bg-green-500" />
                        <StatCard title="Despesas Totais" value={formatCurrency(totalExpenses)} icon={<TrendingDown size={24}/>} color="bg-red-500" />
                        <StatCard title="Saldo Líquido" value={formatCurrency(netProfit)} icon={<Wallet size={24}/>} color={netProfit >= 0 ? "bg-blue-500" : "bg-red-600"} />
                        <StatCard title="A Pagar (Hoje)" value={formatCurrency(0)} icon={<CalendarDays size={24}/>} color="bg-orange-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title="Fluxo de Caixa (Semestral)">
                             <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                        <Bar dataKey="receita" fill="#22c55e" name="Receitas" />
                                        <Bar dataKey="despesa" fill="#ef4444" name="Despesas" />
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                        </Card>
                        <Card title="Despesas por Categoria">
                            <div className="h-64 flex justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name}) => name}>
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* ENTRIES TAB */}
            {activeTab === 'ENTRIES' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                         <Card title="Histórico de Despesas">
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="p-3">Descrição</th>
                                            <th className="p-3">Categoria</th>
                                            <th className="p-3">Vencimento</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {expenses.map(expense => (
                                            <tr key={expense.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-medium">{expense.description}</td>
                                                <td className="p-3 text-xs text-slate-500">{EXPENSE_CATEGORIES[expense.category]}</td>
                                                <td className="p-3 text-slate-600">{new Date(expense.dueDate || expense.date).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${expense.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                        {expense.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-mono text-red-600">- {formatCurrency(expense.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                         </Card>

                         <Card title="Últimas Receitas (OS Finalizadas)">
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                        <tr>
                                            <th className="p-3">OS #</th>
                                            <th className="p-3">Cliente</th>
                                            <th className="p-3">Data Pagto</th>
                                            <th className="p-3">Método</th>
                                            <th className="p-3 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paidOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-mono">{order.id}</td>
                                                <td className="p-3 font-medium">{order.customerName}</td>
                                                <td className="p-3 text-slate-600">{order.paymentDate ? new Date(order.paymentDate).toLocaleDateString() : '-'}</td>
                                                <td className="p-3 text-xs uppercase">{order.paymentMethod}</td>
                                                <td className="p-3 text-right font-mono text-green-600">+ {formatCurrency(order.totalCost)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                         </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card title="Nova Despesa">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                    <input className="w-full p-2 border border-slate-300 rounded outline-none uppercase text-sm" value={newExpense.description} onChange={handleUppercaseChange(v => setNewExpense({...newExpense, description: v}))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                                    <input type="number" className="w-full p-2 border border-slate-300 rounded outline-none text-sm" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                    <select className="w-full p-2 border border-slate-300 rounded outline-none text-sm bg-white" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})}>
                                        {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimento</label>
                                    <input type="date" className="w-full p-2 border border-slate-300 rounded outline-none text-sm" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value, dueDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Pagamento</label>
                                    <select className="w-full p-2 border border-slate-300 rounded outline-none text-sm bg-white" value={newExpense.status} onChange={e => setNewExpense({...newExpense, status: e.target.value as any})}>
                                        <option value="PENDING">PENDENTE</option>
                                        <option value="PAID">PAGO</option>
                                    </select>
                                </div>
                                <button onClick={handleAddExpense} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                                    <PlusCircle size={18}/> Registrar Despesa
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'INVENTORY' && (
                <div className="space-y-6">
                    <Card title="Gestão de Estoque" action={<button className="text-blue-600 font-bold text-sm flex items-center gap-1"><Download size={16}/> Exportar Lista</button>}>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-3">Código</th>
                                        <th className="p-3">Produto / Peça</th>
                                        <th className="p-3">Categoria</th>
                                        <th className="p-3 text-right">Custo</th>
                                        <th className="p-3 text-right">Venda</th>
                                        <th className="p-3 text-center">Estoque</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {inventory.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-xs">{item.code}</td>
                                            <td className="p-3 font-medium">
                                                {item.name}
                                                <p className="text-[10px] text-slate-400">{item.manufacturer}</p>
                                            </td>
                                            <td className="p-3 text-xs">{item.category}</td>
                                            <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(item.costPrice)}</td>
                                            <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(item.sellPrice)}</td>
                                            <td className="p-3 text-center font-bold">{item.stockQuantity}</td>
                                            <td className="p-3 text-center">
                                                {item.stockQuantity <= item.minStockLevel ? (
                                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200 font-bold">BAIXO</span>
                                                ) : (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 font-bold">OK</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit3 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </Card>

                    <Card title="Adicionar Novo Item">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                                <input className="w-full p-2 border border-slate-300 rounded outline-none uppercase text-sm" value={newItem.code} onChange={handleUppercaseChange(v => setNewItem({...newItem, code: v}))} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Produto</label>
                                <input className="w-full p-2 border border-slate-300 rounded outline-none uppercase text-sm" value={newItem.name} onChange={handleUppercaseChange(v => setNewItem({...newItem, name: v}))} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                <input className="w-full p-2 border border-slate-300 rounded outline-none uppercase text-sm" value={newItem.category} onChange={handleUppercaseChange(v => setNewItem({...newItem, category: v}))} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço Custo</label>
                                <input type="number" className="w-full p-2 border border-slate-300 rounded outline-none text-sm" value={newItem.costPrice || ''} onChange={e => setNewItem({...newItem, costPrice: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço Venda</label>
                                <input type="number" className="w-full p-2 border border-slate-300 rounded outline-none text-sm" value={newItem.sellPrice || ''} onChange={e => setNewItem({...newItem, sellPrice: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qtd Inicial</label>
                                <input type="number" className="w-full p-2 border border-slate-300 rounded outline-none text-sm" value={newItem.stockQuantity || ''} onChange={e => setNewItem({...newItem, stockQuantity: Number(e.target.value)})} />
                            </div>
                            <div>
                                <button onClick={handleAddItem} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 h-[38px]">
                                    <Plus size={18}/> Cadastrar
                                </button>
                            </div>
                         </div>
                    </Card>
                </div>
            )}

            {/* REPORTS TAB (DRE) */}
            {activeTab === 'REPORTS' && (
                <div className="space-y-6">
                    <Card title="DRE Gerencial (Demonstração do Resultado)">
                        <div className="bg-white p-6 rounded-lg max-w-3xl mx-auto border border-slate-200 shadow-sm">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800">DRE - Mês Atual</h2>
                                <p className="text-sm text-slate-500">Visão sintética do resultado operacional</p>
                            </div>

                            <div className="space-y-1 font-mono text-sm">
                                {/* Receitas */}
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-600 font-bold">(+) RECEITA BRUTA</span>
                                    <span className="text-slate-800 font-bold">{formatCurrency(dreData.grossRevenue)}</span>
                                </div>
                                <div className="flex justify-between pl-4 text-xs text-slate-500">
                                    <span>Receita de Serviços</span>
                                    <span>{formatCurrency(dreData.laborRevenue)}</span>
                                </div>
                                <div className="flex justify-between pl-4 text-xs text-slate-500 pb-2">
                                    <span>Receita de Peças</span>
                                    <span>{formatCurrency(dreData.partsRevenue)}</span>
                                </div>

                                {/* Custos Variáveis */}
                                <div className="flex justify-between py-2 border-b border-slate-100 text-red-600">
                                    <span className="font-bold">(-) CUSTOS VARIÁVEIS / PEÇAS</span>
                                    <span>{formatCurrency(dreData.variableCosts)}</span>
                                </div>

                                {/* Impostos */}
                                <div className="flex justify-between py-2 border-b border-slate-100 text-red-600">
                                    <span className="font-bold">(-) IMPOSTOS</span>
                                    <span>{formatCurrency(dreData.taxes)}</span>
                                </div>

                                {/* Margem de Contribuição */}
                                <div className="flex justify-between py-3 bg-slate-50 font-bold border-y border-slate-200">
                                    <span className="text-slate-800">(=) MARGEM DE CONTRIBUIÇÃO</span>
                                    <span className="text-blue-600">{formatCurrency(dreData.grossRevenue - dreData.variableCosts - dreData.taxes)}</span>
                                </div>

                                {/* Despesas Fixas */}
                                <div className="flex justify-between py-2 border-b border-slate-100 text-red-600">
                                    <span className="font-bold">(-) DESPESAS FIXAS / PESSOAL</span>
                                    <span>{formatCurrency(dreData.fixedCosts)}</span>
                                </div>

                                {/* Resultado Final */}
                                <div className="flex justify-between py-4 mt-4 border-t-2 border-slate-800 text-lg font-bold">
                                    <span>(=) RESULTADO LÍQUIDO</span>
                                    <span className={dreData.netOperatingProfit >= 0 ? "text-green-600" : "text-red-600"}>
                                        {formatCurrency(dreData.netOperatingProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 gap-4">
                            <button 
                                onClick={() => {
                                    const csvContent = "data:text/csv;charset=utf-8," 
                                        + "CONCEITO,VALOR\n"
                                        + `RECEITA BRUTA,${dreData.grossRevenue}\n`
                                        + `CUSTOS VARIAVEIS,${dreData.variableCosts}\n`
                                        + `IMPOSTOS,${dreData.taxes}\n`
                                        + `DESPESAS FIXAS,${dreData.fixedCosts}\n`
                                        + `LUCRO LIQUIDO,${dreData.netOperatingProfit}\n`;
                                    downloadCSV(encodeURI(csvContent), "DRE_Relatorio.csv");
                                }}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold transition-colors"
                            >
                                <FileSpreadsheet size={18}/> Exportar CSV
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 font-bold transition-colors"
                            >
                                <Printer size={18}/> Imprimir Relatório
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const TeamView = ({ users, orders, onUpdateUsers }: { users: User[], orders: ServiceOrder[], onUpdateUsers: (users: User[]) => void }) => {
    const [activeTab, setActiveTab] = useState<'MEMBERS' | 'PERFORMANCE'>('MEMBERS');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        role: 'MECHANIC',
        specialty: '',
        email: '',
        phone: '',
        commissionRate: 0,
        avatar: ''
    });

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData(user);
        } else {
            setEditingUser(null);
            setFormData({ name: '', role: 'MECHANIC', specialty: '', email: '', phone: '', commissionRate: 0, avatar: '', active: true });
        }
        setShowModal(true);
    };

    const handleSaveUser = () => {
        if (!formData.name) return;

        let updatedList = [...users];
        if (editingUser) {
            updatedList = updatedList.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u);
        } else {
            const newUser: User = {
                id: `u${Date.now()}`,
                active: true,
                avatar: formData.name?.substring(0, 2).toUpperCase(),
                ...formData
            } as User;
            updatedList.push(newUser);
        }
        onUpdateUsers(updatedList);
        setShowModal(false);
    };

    const handleDeleteUser = (id: string) => {
        if(window.confirm("Tem certeza que deseja desativar este usuário?")) {
            onUpdateUsers(users.map(u => u.id === id ? { ...u, active: false } : u));
        }
    };

    // Metrics Calculation
    const mechanicsMetrics = useMemo(() => {
        return users.filter(u => u.role === 'MECHANIC').map(m => {
            const mechanicOrders = orders.filter(o => o.assignedMechanicId === m.id && (o.status === OSStatus.COMPLETED || o.status === OSStatus.PAID));
            const totalLabor = mechanicOrders.reduce((sum, o) => sum + o.laborCost, 0);
            const commission = totalLabor * ((m.commissionRate || 0) / 100);
            return {
                ...m,
                completedOrders: mechanicOrders.length,
                totalLabor,
                commission
            };
        });
    }, [users, orders]);

    return (
        <div className="space-y-6">
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
                <button onClick={() => setActiveTab('MEMBERS')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'MEMBERS' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Users size={18}/> Membros da Equipe
                </button>
                <button onClick={() => setActiveTab('PERFORMANCE')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'PERFORMANCE' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Award size={18}/> Desempenho & Comissões
                </button>
            </div>

            {activeTab === 'MEMBERS' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                            <UserPlus size={18}/> Adicionar Membro
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.filter(u => u.active).map(user => (
                            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow relative group">
                                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-600 mb-4 uppercase">
                                    {user.avatar || user.name.substring(0, 2)}
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg">{user.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-bold mt-1 ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {user.role === 'ADMIN' ? 'Administrador' : 'Mecânico'}
                                </span>
                                
                                <div className="mt-4 w-full space-y-2 text-sm text-slate-500">
                                    <p className="flex items-center justify-center gap-2"><Briefcase size={14}/> {user.specialty || 'Geral'}</p>
                                    <p className="flex items-center justify-center gap-2"><Smartphone size={14}/> {user.phone || '-'}</p>
                                    <p className="flex items-center justify-center gap-2"><Mail size={14}/> {user.email || '-'}</p>
                                </div>

                                <div className="mt-6 flex gap-2 w-full">
                                    <button onClick={() => handleOpenModal(user)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 text-xs flex items-center justify-center gap-1">
                                        <UserCog size={14}/> Editar
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'PERFORMANCE' && (
                <Card title="Relatório de Comissões (Mês Atual)" action={<button className="text-blue-600 font-bold text-sm flex items-center gap-1"><Download size={16}/> Exportar</button>}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-3">Mecânico</th>
                                    <th className="p-3">Especialidade</th>
                                    <th className="p-3 text-center">OS Finalizadas</th>
                                    <th className="p-3 text-right">Faturamento (Mão de Obra)</th>
                                    <th className="p-3 text-right">Comissão (%)</th>
                                    <th className="p-3 text-right">A Pagar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mechanicsMetrics.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {m.avatar}
                                            </div>
                                            {m.name}
                                        </td>
                                        <td className="p-3 text-slate-500 text-xs">{m.specialty || '-'}</td>
                                        <td className="p-3 text-center font-bold text-slate-700">{m.completedOrders}</td>
                                        <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(m.totalLabor)}</td>
                                        <td className="p-3 text-right font-mono text-slate-500">{m.commissionRate}%</td>
                                        <td className="p-3 text-right font-mono font-bold text-green-600">{formatCurrency(m.commission)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">{editingUser ? 'Editar Membro' : 'Novo Membro'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                <input className="w-full p-2 border border-slate-300 rounded outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Função</label>
                                    <select className="w-full p-2 border border-slate-300 rounded outline-none bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                                        <option value="MECHANIC">Mecânico</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Iniciais (Avatar)</label>
                                    <input className="w-full p-2 border border-slate-300 rounded outline-none uppercase" maxLength={2} value={formData.avatar} onChange={handleUppercaseChange(v => setFormData({...formData, avatar: v}))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Especialidade</label>
                                <input className="w-full p-2 border border-slate-300 rounded outline-none" placeholder="Ex: Motor, Elétrica" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                    <input className="w-full p-2 border border-slate-300 rounded outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Comissão (%)</label>
                                    <input type="number" className="w-full p-2 border border-slate-300 rounded outline-none" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                <input type="email" className="w-full p-2 border border-slate-300 rounded outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <button onClick={handleSaveUser} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mt-2">
                                Salvar Dados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AIChatView = ({ history }: any) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');

    const send = async () => {
        if(!input) return;
        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        const response = await getShopAssistantChat(messages, input);
        setMessages(prev => [...prev, { role: 'model', text: response }]);
    };

    return (
        <Card title="Mecânico Virtual IA" className="h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t flex gap-2">
                <input className="flex-1 p-2 border rounded" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Digite sua dúvida..." />
                <button onClick={send} className="bg-blue-600 text-white p-2 rounded"><Send size={20}/></button>
            </div>
        </Card>
    );
};

const SettingsView = ({ company, onUpdate }: { company: CompanySettings, onUpdate: (c: CompanySettings) => void }) => {
    const [activeTab, setActiveTab] = useState<'COMPANY' | 'NOTIFICATIONS' | 'SYSTEM'>('COMPANY');
    const [formData, setFormData] = useState<CompanySettings>(company);
    const [notificationTemplates, setNotificationTemplates] = useState({
        whatsapp_os_created: "Sua OS #{id} foi aberta! Problema relatado: {complaint}. Aguarde nosso contato.",
        whatsapp_os_completed: "Olá! O serviço no veículo {vehicle} foi concluído. Total: {total}. Venha retirar!",
    });

    // Sync form data if company prop changes (though usually it won't change externally while editing)
    useEffect(() => {
        setFormData(company);
    }, [company]);

    const handleSaveCompany = () => {
        onUpdate(formData);
        alert("Configurações da empresa salvas com sucesso!");
    };

    const handleExportData = () => {
        const data = JSON.stringify({ company, date: new Date().toISOString() }, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-osmech-${Date.now()}.json`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
                 <button onClick={() => setActiveTab('COMPANY')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'COMPANY' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Building2 size={18}/> Dados da Oficina
                </button>
                <button onClick={() => setActiveTab('NOTIFICATIONS')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'NOTIFICATIONS' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <MessageCircle size={18}/> Mensagens & Notificações
                </button>
                <button onClick={() => setActiveTab('SYSTEM')} className={`flex-1 py-4 font-bold text-sm uppercase flex items-center justify-center gap-2 ${activeTab === 'SYSTEM' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <Database size={18}/> Sistema & Backup
                </button>
            </div>

            {activeTab === 'COMPANY' && (
                <Card title="Dados Cadastrais da Oficina" action={<button onClick={handleSaveCompany} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2"><Save size={16}/> Salvar Alterações</button>}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome Fantasia</label>
                             <input 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                                value={formData.name}
                                onChange={handleUppercaseChange(val => setFormData({...formData, name: val}))}
                             />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subtítulo / Slogan</label>
                             <input 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                                value={formData.subtitle || ''}
                                onChange={handleUppercaseChange(val => setFormData({...formData, subtitle: val}))}
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CNPJ</label>
                             <input 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                value={formData.cnpj}
                                onChange={e => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Telefone Principal</label>
                             <input 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})}
                             />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Endereço Completo</label>
                             <input 
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm"
                                value={formData.address}
                                onChange={handleUppercaseChange(val => setFormData({...formData, address: val}))}
                             />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-mail de Contato</label>
                             <input 
                                type="email"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm lowercase"
                                value={formData.email || ''}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                             />
                        </div>
                   </div>
                </Card>
            )}

            {activeTab === 'NOTIFICATIONS' && (
                <Card title="Modelos de Mensagens Automáticas">
                    <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-4">
                            <p className="font-bold flex items-center gap-2"><AlertTriangle size={16}/> Variáveis Disponíveis:</p>
                            <p className="mt-1">{`{id}, {customer}, {vehicle}, {plate}, {total}, {complaint}`}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mensagem de Abertura de OS</label>
                            <textarea 
                                rows={3}
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={notificationTemplates.whatsapp_os_created}
                                onChange={(e) => setNotificationTemplates({...notificationTemplates, whatsapp_os_created: e.target.value})}
                            />
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mensagem de Conclusão / Retirada</label>
                            <textarea 
                                rows={3}
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={notificationTemplates.whatsapp_os_completed}
                                onChange={(e) => setNotificationTemplates({...notificationTemplates, whatsapp_os_completed: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs">Salvar Modelos</button>
                        </div>
                    </div>
                </Card>
            )}

            {activeTab === 'SYSTEM' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Backup de Dados">
                        <p className="text-sm text-slate-600 mb-4">Exporte todos os dados da oficina (clientes, OSs, financeiro) para um arquivo JSON seguro.</p>
                        <button onClick={handleExportData} className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                            <Download size={18}/> Fazer Backup Agora
                        </button>
                    </Card>

                    <Card title="Zona de Perigo">
                        <p className="text-sm text-slate-600 mb-4">Ações irreversíveis para resetar o sistema.</p>
                        <button onClick={() => alert("Funcionalidade bloqueada na demonstração.")} className="w-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                            <Trash2 size={18}/> Resetar Configurações de Fábrica
                        </button>
                    </Card>
                </div>
            )}
        </div>
    );
};

const DashboardView = ({ orders, expenses, logs, onViewOS, onNewOS }: { orders: ServiceOrder[], expenses: Expense[], logs: AuditLogEntry[], onViewOS: (id: string) => void, onNewOS: () => void }) => {
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);
  const activeOrders = orders.filter(o => o.status !== OSStatus.COMPLETED && o.status !== OSStatus.PAID).length;
  const completedOrders = orders.filter(o => o.status === OSStatus.COMPLETED || o.status === OSStatus.PAID).length;
  const pendingOrders = orders.filter(o => o.status === OSStatus.PENDING || o.status === OSStatus.APPROVAL).length;

  const statusData = [
      { name: 'Pendentes', value: orders.filter(o => o.status === OSStatus.PENDING).length, color: '#fbbf24' },
      { name: 'Em Execução', value: orders.filter(o => o.status === OSStatus.IN_PROGRESS).length, color: '#3b82f6' },
      { name: 'Finalizados', value: orders.filter(o => o.status === OSStatus.PAID || o.status === OSStatus.COMPLETED).length, color: '#22c55e' },
  ];

  return (
      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Faturamento Total" value={formatCurrency(totalRevenue)} icon={<DollarSign size={24}/>} color="bg-green-500" />
              <StatCard title="OS em Aberto" value={activeOrders} icon={<Wrench size={24}/>} color="bg-blue-500" />
              <StatCard title="Finalizadas" value={completedOrders} icon={<CheckCircle size={24}/>} color="bg-slate-500" />
              <StatCard title="Aguardando Aprovação" value={pendingOrders} icon={<Clock size={24}/>} color="bg-orange-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="Status das Ordens" className="lg:col-span-1">
                  <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {statusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                          </RePieChart>
                      </ResponsiveContainer>
                  </div>
              </Card>
              <Card title="Atividade Recente" className="lg:col-span-2">
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                      {logs.slice(0, 10).map(log => (
                          <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                              <div className={`p-2 rounded-full ${log.action === 'CREATE' ? 'bg-green-100 text-green-600' : log.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                  {log.action === 'CREATE' ? <PlusCircle size={14}/> : log.action === 'UPDATE' ? <Edit3 size={14}/> : <Activity size={14}/>}
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-slate-800">{log.details}</p>
                                  <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()} • {log.userName}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </Card>
          </div>
          
          <div className="flex justify-end">
              <button onClick={onNewOS} className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 font-bold flex items-center gap-2 transition-transform hover:scale-105">
                  <PlusCircle size={20}/> Nova Ordem de Serviço
              </button>
          </div>
      </div>
  );
};

const OSListView = ({ orders, onViewOS }: { orders: ServiceOrder[], onViewOS: (id: string) => void }) => {
  const [filter, setFilter] = useState('');

  const filteredOrders = orders.filter(o => 
      o.customerName.toLowerCase().includes(filter.toLowerCase()) || 
      o.plate.toLowerCase().includes(filter.toLowerCase()) || 
      o.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
      <Card title="Ordens de Serviço" action={
          <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
              <input 
                  type="text" 
                  placeholder="Buscar OS, Cliente ou Placa..." 
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 w-64"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
              />
          </div>
      }>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                      <tr>
                          <th className="p-4">OS #</th>
                          <th className="p-4">Cliente / Veículo</th>
                          <th className="p-4">Entrada</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Valor</th>
                          <th className="p-4 text-center">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-slate-700">{order.id}</td>
                              <td className="p-4">
                                  <p className="font-bold text-slate-800">{order.customerName}</p>
                                  <p className="text-xs text-slate-500">{order.vehicleModel} • {order.plate}</p>
                              </td>
                              <td className="p-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="p-4"><StatusBadge status={order.status} /></td>
                              <td className="p-4 text-right font-medium text-slate-700">{formatCurrency(order.totalCost)}</td>
                              <td className="p-4 text-center">
                                  <button onClick={() => onViewOS(order.id)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                      <ArrowRight size={20}/>
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {filteredOrders.length === 0 && <div className="p-8 text-center text-slate-500">Nenhuma OS encontrada.</div>}
          </div>
      </Card>
  );
};

const NewOSView = ({ onSave, onCancel }: { onSave: (os: ServiceOrder) => void, onCancel: () => void }) => {
  const [form, setForm] = useState<Partial<ServiceOrder>>({
      customerName: '',
      customerCpf: '',
      phone: '',
      vehicleModel: '',
      vehicleManufacturer: '',
      vehicleYear: new Date().getFullYear(),
      vehicleColor: '',
      plate: '',
      currentMileage: 0,
      complaint: '',
      acceptsNotifications: true
  });
  
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<{diagnosis: AIDiagnosisResult, description: string} | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          try {
              const base64 = await convertFileToBase64(file);
              setImage(base64);
              
              if (form.vehicleModel) {
                   setIsAnalyzingImage(true);
                   const result = await analyzePartImage(base64, `${form.vehicleManufacturer || ''} ${form.vehicleModel}`);
                   if (result) {
                       setImageAnalysis(result);
                       setForm(prev => ({
                           ...prev, 
                           complaint: prev.complaint ? prev.complaint + '\n' + result.description : result.description,
                           aiDiagnosis: result.diagnosis
                       }));
                   }
                   setIsAnalyzingImage(false);
              }
          } catch (error) {
              console.error("Error processing image", error);
              setIsAnalyzingImage(false);
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.customerName || !form.vehicleModel || !form.plate || !form.complaint) {
          alert('Preencha os campos obrigatórios.');
          return;
      }

      const newOS: ServiceOrder = {
          id: `OS-${Math.floor(Math.random() * 10000)}`,
          status: OSStatus.PENDING,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [],
          partsCost: 0,
          laborCost: 0,
          totalCost: 0,
          ...form as any
      };

      if (imageAnalysis?.diagnosis && !newOS.aiDiagnosis) {
          newOS.aiDiagnosis = imageAnalysis.diagnosis;
      }
      
      onSave(newOS);
  };

  return (
      <Card title="Nova Ordem de Serviço">
          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2"><UserIcon size={16}/> Dados do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                          <input required className="w-full p-2 border border-slate-300 rounded uppercase outline-none focus:border-blue-500" value={form.customerName} onChange={handleUppercaseChange(v => setForm({...form, customerName: v}))} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
                          <input className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500" value={form.customerCpf} onChange={e => setForm({...form, customerCpf: formatCPF(e.target.value)})} placeholder="000.000.000-00" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone / WhatsApp *</label>
                          <input required className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500" value={form.phone} onChange={e => setForm({...form, phone: formatPhone(e.target.value)})} placeholder="(00) 00000-0000" />
                      </div>
                      <div className="flex items-center mt-6">
                           <input type="checkbox" checked={form.acceptsNotifications} onChange={e => setForm({...form, acceptsNotifications: e.target.checked})} className="mr-2" />
                           <label className="text-sm text-slate-600">Aceita receber notificações via WhatsApp</label>
                      </div>
                  </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2"><Car size={16}/> Dados do Veículo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montadora</label>
                           <input list="manufacturers" className="w-full p-2 border border-slate-300 rounded uppercase outline-none focus:border-blue-500" value={form.vehicleManufacturer} onChange={handleUppercaseChange(v => setForm({...form, vehicleManufacturer: v}))} />
                           <datalist id="manufacturers">{COMMON_MANUFACTURERS.map(m => <option key={m} value={m} />)}</datalist>
                      </div>
                      <div className="md:col-span-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo *</label>
                           <input required className="w-full p-2 border border-slate-300 rounded uppercase outline-none focus:border-blue-500" value={form.vehicleModel} onChange={handleUppercaseChange(v => setForm({...form, vehicleModel: v}))} />
                      </div>
                      <div className="md:col-span-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Placa *</label>
                           <input required className="w-full p-2 border border-slate-300 rounded uppercase font-mono outline-none focus:border-blue-500" value={form.plate} onChange={handleUppercaseChange(v => setForm({...form, plate: formatPlate(v)}))} placeholder="ABC1234" maxLength={7} />
                      </div>
                      <div className="md:col-span-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor</label>
                           <input className="w-full p-2 border border-slate-300 rounded uppercase outline-none focus:border-blue-500" value={form.vehicleColor} onChange={handleUppercaseChange(v => setForm({...form, vehicleColor: v}))} />
                      </div>
                      <div className="md:col-span-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ano</label>
                           <input type="number" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500" value={form.vehicleYear} onChange={e => setForm({...form, vehicleYear: Number(e.target.value)})} />
                      </div>
                      <div className="md:col-span-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">KM Atual</label>
                           <input type="number" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-blue-500" value={form.currentMileage} onChange={e => setForm({...form, currentMileage: Number(e.target.value)})} />
                      </div>
                  </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2"><AlertCircle size={16}/> Relato do Problema / Queixa</h3>
                  <textarea 
                      required 
                      rows={4} 
                      className="w-full p-3 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="Descreva os sintomas relatados pelo cliente..."
                      value={form.complaint}
                      onChange={handleUppercaseChange(v => setForm({...form, complaint: v}))}
                  />
                  
                  <div className="mt-4 pt-4 border-t border-slate-200">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Anexar Foto da Peça / Defeito (Opcional - IA)</label>
                       <div className="flex items-center gap-4">
                           <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors">
                               <Camera size={18}/> Escolher Imagem
                               <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                           </label>
                           {image && (
                               <div className="relative group">
                                   <img src={image} alt="Preview" className="h-16 w-16 object-cover rounded border border-slate-200" />
                                   <button type="button" onClick={() => { setImage(null); setImageAnalysis(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                               </div>
                           )}
                           {isAnalyzingImage && <span className="text-sm text-blue-600 flex items-center gap-2"><Loader size={14} className="animate-spin"/> Analisando com IA...</span>}
                           {imageAnalysis && <span className="text-sm text-green-600 flex items-center gap-2"><CheckCircle size={14}/> Foto processada com sucesso!</span>}
                       </div>
                       {imageAnalysis && (
                           <div className="mt-2 bg-blue-50 p-3 rounded text-xs text-blue-800 border border-blue-100">
                               <strong>IA Detectou:</strong> {imageAnalysis.description}
                           </div>
                       )}
                  </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={onCancel} className="px-6 py-3 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center gap-2">
                      <Save size={20}/> Criar Ordem de Serviço
                  </button>
              </div>
          </form>
      </Card>
  );
}

const OSDetailView = ({ order, currentUser, company, users, onUpdate, onBack, onLog }: { order: ServiceOrder, currentUser: User, company: CompanySettings, users: User[], onUpdate: (o: ServiceOrder) => void, onBack: () => void, onLog: (a: any, d: string, t: string) => void }) => {
    const [newItem, setNewItem] = useState<Partial<ServiceItem>>({ description: '', type: 'LABOR', quantity: 1, unitPrice: 0 });
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [docMode, setDocMode] = useState<'RECEIPT' | 'QUOTE'>('RECEIPT');

    const handleStatusChange = (newStatus: OSStatus) => {
        onUpdate({ ...order, status: newStatus, updatedAt: new Date().toISOString() });
    };

    const handleRunDiagnosis = async () => {
        setIsDiagnosing(true);
        const result = await getMechanicDiagnosis(order.vehicleModel, order.complaint, order.currentMileage);
        if (result) {
            onUpdate({ ...order, aiDiagnosis: result, status: OSStatus.APPROVAL, updatedAt: new Date().toISOString() });
            onLog('UPDATE', 'Executou Diagnóstico AI', order.id);
        }
        setIsDiagnosing(false);
    };

    const handleAddItem = () => {
        if (!newItem.description || !newItem.unitPrice) return;
        const item: ServiceItem = {
            id: Date.now().toString(),
            description: newItem.description!.toUpperCase(),
            type: newItem.type || 'LABOR',
            quantity: Number(newItem.quantity),
            unitPrice: Number(newItem.unitPrice),
            totalPrice: Number(newItem.quantity) * Number(newItem.unitPrice),
            status: 'PENDING'
        };

        const updatedItems = [...(order.items || []), item];
        recalculateTotals(updatedItems);
        setNewItem({ description: '', type: 'LABOR', quantity: 1, unitPrice: 0 });
    };

    const handleRemoveItem = (itemId: string) => {
        const updatedItems = (order.items || []).filter(i => i.id !== itemId);
        recalculateTotals(updatedItems);
    };

    const recalculateTotals = (items: ServiceItem[]) => {
        const parts = items.filter(i => i.type === 'PART').reduce((acc, i) => acc + i.totalPrice, 0);
        const labor = items.filter(i => i.type === 'LABOR').reduce((acc, i) => acc + i.totalPrice, 0);
        const total = parts + labor; // Discount logic could be added here
        
        onUpdate({
            ...order,
            items: items,
            partsCost: parts,
            laborCost: labor,
            totalCost: total, // simplified, should handle discount
            updatedAt: new Date().toISOString()
        });
    };

    const handlePayment = (payment: PaymentInput) => {
        onUpdate({
            ...order,
            status: OSStatus.PAID,
            paymentMethod: payment.method,
            paymentDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        onLog('FINANCE', `Recebeu Pagamento: ${formatCurrency(payment.amount)}`, order.id);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Header */}
             <div className="flex items-center justify-between">
                 <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
                     <ArrowRight className="rotate-180" size={20}/> Voltar
                 </button>
                 <div className="flex items-center gap-3">
                     <StatusBadge status={order.status} />
                     {order.status !== OSStatus.PAID && order.status !== OSStatus.COMPLETED && (
                         <select 
                             className="bg-white border border-slate-300 text-sm rounded-lg p-2 outline-none"
                             value={order.status}
                             onChange={(e) => handleStatusChange(e.target.value as OSStatus)}
                         >
                             {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                     )}
                     <button onClick={() => { setDocMode('QUOTE'); setShowDocModal(true); }} className="p-2 bg-slate-200 rounded text-slate-600 hover:bg-slate-300" title="Gerar Orçamento"><FileText size={20}/></button>
                     <button onClick={() => { setDocMode('RECEIPT'); setShowDocModal(true); }} className="p-2 bg-slate-200 rounded text-slate-600 hover:bg-slate-300" title="Gerar Recibo"><Printer size={20}/></button>
                 </div>
             </div>

             {/* Main Content */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left Column: Details & AI */}
                 <div className="lg:col-span-2 space-y-6">
                     <Card title={`OS #${order.id} - ${order.vehicleModel}`}>
                         <div className="grid grid-cols-2 gap-4 mb-6">
                             <div>
                                 <label className="text-xs text-slate-500 font-bold uppercase">Cliente</label>
                                 <p className="font-bold">{order.customerName}</p>
                                 <p className="text-sm text-slate-600">{order.phone}</p>
                             </div>
                             <div>
                                 <label className="text-xs text-slate-500 font-bold uppercase">Veículo</label>
                                 <p className="font-bold">{order.vehicleModel} ({order.vehicleYear})</p>
                                 <p className="text-sm text-slate-600 font-mono bg-slate-100 inline-block px-2 rounded border border-slate-200">{order.plate}</p>
                             </div>
                             <div className="col-span-2">
                                 <label className="text-xs text-slate-500 font-bold uppercase">Reclamação</label>
                                 <p className="bg-red-50 text-red-800 p-3 rounded border border-red-100 text-sm whitespace-pre-wrap">{order.complaint}</p>
                             </div>
                         </div>
                         
                         {/* AI Section */}
                         <div className="border-t border-slate-100 pt-4">
                             <div className="flex justify-between items-center mb-4">
                                 <h4 className="font-bold text-slate-700 flex items-center gap-2"><Bot size={18} className="text-purple-600"/> Diagnóstico IA</h4>
                                 {!order.aiDiagnosis && (
                                     <button 
                                         onClick={handleRunDiagnosis} 
                                         disabled={isDiagnosing}
                                         className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-bold hover:bg-purple-700 flex items-center gap-1"
                                     >
                                         {isDiagnosing ? <Loader className="animate-spin" size={12}/> : <Bot size={12}/>} Gerar Diagnóstico
                                     </button>
                                 )}
                             </div>
                             
                             {order.aiDiagnosis ? (
                                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4">
                                     <div>
                                         <p className="text-xs font-bold text-purple-800 uppercase mb-1">Causas Prováveis</p>
                                         <ul className="list-disc list-inside text-sm text-slate-700">
                                             {order.aiDiagnosis.possibleCauses.map((c, i) => <li key={i}>{c}</li>)}
                                         </ul>
                                     </div>
                                     <div>
                                         <p className="text-xs font-bold text-purple-800 uppercase mb-1">Passos Recomendados</p>
                                         <div className="flex flex-wrap gap-2">
                                             {order.aiDiagnosis.diagnosisSteps.map((s, i) => (
                                                 <span key={i} className="bg-white border border-purple-200 px-2 py-1 rounded text-xs text-purple-900">{s}</span>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                     Nenhum diagnóstico gerado ainda.
                                 </div>
                             )}
                         </div>
                     </Card>

                     <Card title="Serviços e Peças">
                         <div className="overflow-x-auto mb-6">
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase">
                                     <tr>
                                         <th className="p-3">Tipo</th>
                                         <th className="p-3">Descrição</th>
                                         <th className="p-3 text-center">Qtd</th>
                                         <th className="p-3 text-right">Unitário</th>
                                         <th className="p-3 text-right">Total</th>
                                         <th className="p-3 text-center"></th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {(order.items || []).map(item => (
                                         <tr key={item.id}>
                                             <td className="p-3">
                                                 <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${item.type === 'PART' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                                     {item.type === 'PART' ? 'PEÇA' : 'SERV'}
                                                 </span>
                                             </td>
                                             <td className="p-3 font-medium uppercase">{item.description}</td>
                                             <td className="p-3 text-center">{item.quantity}</td>
                                             <td className="p-3 text-right text-slate-500">{formatCurrency(item.unitPrice)}</td>
                                             <td className="p-3 text-right font-bold">{formatCurrency(item.totalPrice)}</td>
                                             <td className="p-3 text-center">
                                                 {order.status !== OSStatus.PAID && (
                                                     <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                                 )}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             {(order.items || []).length === 0 && <div className="text-center text-slate-400 py-4 text-sm">Nenhum item adicionado.</div>}
                         </div>

                         {order.status !== OSStatus.PAID && (
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                 <div className="md:col-span-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                                     <select 
                                         className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                         value={newItem.type} 
                                         onChange={e => setNewItem({...newItem, type: e.target.value as any})}
                                     >
                                         <option value="LABOR">Serviço</option>
                                         <option value="PART">Peça</option>
                                     </select>
                                 </div>
                                 <div className="md:col-span-5">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                                     <input 
                                         className="w-full p-2 border border-slate-300 rounded text-sm uppercase outline-none focus:border-blue-500"
                                         value={newItem.description} 
                                         onChange={handleUppercaseChange(v => setNewItem({...newItem, description: v}))}
                                         placeholder="EX: TROCA DE ÓLEO"
                                     />
                                 </div>
                                 <div className="md:col-span-1">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase">Qtd</label>
                                     <input 
                                         type="number"
                                         className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                                         value={newItem.quantity} 
                                         onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                                     />
                                 </div>
                                 <div className="md:col-span-2">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Unit.</label>
                                     <input 
                                         type="number"
                                         className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                                         value={newItem.unitPrice || ''} 
                                         onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                                         placeholder="0.00"
                                     />
                                 </div>
                                 <div className="md:col-span-2">
                                     <button onClick={handleAddItem} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-1">
                                         <Plus size={16}/> Adicionar
                                     </button>
                                 </div>
                             </div>
                         )}
                     </Card>
                 </div>

                 {/* Right Column: Summary & Actions */}
                 <div className="space-y-6">
                     <Card title="Resumo Financeiro">
                         <div className="space-y-3">
                             <div className="flex justify-between text-sm text-slate-600">
                                 <span>Serviços</span>
                                 <span>{formatCurrency(order.laborCost)}</span>
                             </div>
                             <div className="flex justify-between text-sm text-slate-600">
                                 <span>Peças</span>
                                 <span>{formatCurrency(order.partsCost)}</span>
                             </div>
                             <div className="pt-3 border-t border-slate-200 flex justify-between text-lg font-bold text-slate-800">
                                 <span>Total</span>
                                 <span>{formatCurrency(order.totalCost)}</span>
                             </div>

                             {order.status === OSStatus.PAID ? (
                                 <div className="bg-green-100 border border-green-200 text-green-800 p-3 rounded-lg text-center font-bold text-sm mt-4">
                                     <CheckCircle className="inline-block mr-2 mb-1" size={16}/> 
                                     PAGO ({order.paymentMethod})
                                 </div>
                             ) : (
                                 <button 
                                     onClick={() => setShowPaymentModal(true)} 
                                     disabled={order.totalCost === 0}
                                     className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     <DollarSign size={20}/> Registrar Pagamento
                                 </button>
                             )}
                         </div>
                     </Card>

                     <Card title="Mecânico Responsável">
                         <select 
                             className="w-full p-2 border border-slate-300 rounded bg-white outline-none"
                             value={order.assignedMechanicId || ''}
                             onChange={(e) => onUpdate({...order, assignedMechanicId: e.target.value})}
                         >
                             <option value="">Selecione...</option>
                             {users.filter(u => u.role === 'MECHANIC' && u.active).map(u => (
                                 <option key={u.id} value={u.id}>{u.name}</option>
                             ))}
                         </select>
                     </Card>
                 </div>
             </div>

             <PaymentModal 
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                total={order.totalCost}
                onConfirm={handlePayment}
             />

             <DocumentModal 
                 isOpen={showDocModal}
                 onClose={() => setShowDocModal(false)}
                 order={order}
                 company={company}
                 onLog={onLog}
                 mode={docMode}
             />
        </div>
    );
};

const App = () => {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_DATA);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [selectedOSId, setSelectedOSId] = useState<string | null>(null);

  const addLog = (action: AuditLogEntry['action'], details: string, targetId?: string) => {
      if(!currentUser) return;
      const newLog: AuditLogEntry = {
          id: Date.now().toString(),
          action,
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: new Date().toISOString(),
          details,
          targetId
      };
      setLogs(prev => [newLog, ...prev]);
  };

  if (!company) return <SetupView onSave={setCompany} />;
  if (!currentUser) return <LoginView users={users} onLogin={setCurrentUser} />;

  const renderContent = () => {
      switch(currentView) {
          case 'DASHBOARD': return <DashboardView orders={orders} expenses={expenses} logs={logs} onViewOS={(id: string) => { setSelectedOSId(id); setCurrentView('OS_DETAILS'); }} onNewOS={() => setCurrentView('NEW_OS')} />;
          case 'OS_LIST': return <OSListView orders={orders} onViewOS={(id: string) => { setSelectedOSId(id); setCurrentView('OS_DETAILS'); }} />;
          case 'NEW_OS': return <NewOSView onSave={(os: ServiceOrder) => { setOrders([os, ...orders]); addLog('CREATE', `Criou OS ${os.id}`, os.id); setCurrentView('OS_LIST'); }} onCancel={() => setCurrentView('DASHBOARD')} />;
          case 'OS_DETAILS': 
            const os = orders.find(o => o.id === selectedOSId);
            if(!os) return <div>OS não encontrada</div>;
            return <OSDetailView 
                order={os} 
                currentUser={currentUser}
                company={company}
                users={users}
                onUpdate={(updated: ServiceOrder) => {
                    setOrders(orders.map(o => o.id === updated.id ? updated : o));
                    addLog('UPDATE', `Atualizou OS ${updated.id}`, updated.id);
                }}
                onBack={() => setCurrentView('OS_LIST')}
                onLog={addLog}
            />;
          case 'FINANCE': return (
            <FinanceView 
                expenses={expenses} 
                orders={orders} 
                inventory={inventory}
                onAddExpense={(e: Expense) => { setExpenses([e, ...expenses]); addLog('FINANCE', `Despesa: ${e.description}`); }} 
                onUpdateInventory={(item: InventoryItem) => { setInventory(inventory.map(i => i.id === item.id ? item : i)); addLog('UPDATE', `Atualizou Estoque: ${item.code}`); }}
                onAddInventory={(item: InventoryItem) => { setInventory([...inventory, item]); addLog('UPDATE', `Novo Item Estoque: ${item.code}`); }}
            />
          );
          case 'TEAM': return (
              <TeamView 
                  users={users} 
                  orders={orders} 
                  onUpdateUsers={(updatedUsers: User[]) => { setUsers(updatedUsers); addLog('UPDATE', 'Atualizou Cadastro de Equipe'); }} 
              />
          );
          case 'AI_CHAT': return <AIChatView history={[]} />;
          case 'SETTINGS': return <SettingsView company={company} onUpdate={(c: CompanySettings) => { setCompany(c); addLog('UPDATE', 'Atualizou Configurações da Empresa'); }} />;
          default: return <div className="p-8">Em construção...</div>;
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3 text-white mb-1">
                    <div className="bg-blue-600 p-2 rounded-lg"><Wrench size={20}/></div>
                    <span className="font-bold text-lg tracking-tight">OSMech</span>
                </div>
                <p className="text-xs text-slate-500 uppercase truncate">{company.name}</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} />
                <NavItem icon={<ClipboardList size={20}/>} label="Ordens de Serviço" active={currentView === 'OS_LIST'} onClick={() => setCurrentView('OS_LIST')} />
                <NavItem icon={<PlusCircle size={20}/>} label="Nova OS" active={currentView === 'NEW_OS'} onClick={() => setCurrentView('NEW_OS')} />
                <div className="pt-4 pb-2 text-xs font-bold text-slate-600 uppercase px-4">Gestão</div>
                <NavItem icon={<DollarSign size={20}/>} label="Financeiro & Estoque" active={currentView === 'FINANCE'} onClick={() => setCurrentView('FINANCE')} />
                <NavItem icon={<Users size={20}/>} label="Equipe" active={currentView === 'TEAM'} onClick={() => setCurrentView('TEAM')} />
                <div className="pt-4 pb-2 text-xs font-bold text-slate-600 uppercase px-4">Ferramentas</div>
                <NavItem icon={<Bot size={20}/>} label="Mecânico Virtual (IA)" active={currentView === 'AI_CHAT'} onClick={() => setCurrentView('AI_CHAT')} />
                <NavItem icon={<Settings size={20}/>} label="Configurações" active={currentView === 'SETTINGS'} onClick={() => setCurrentView('SETTINGS')} />
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <button onClick={() => setCurrentUser(null)} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {currentUser.avatar}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                        <p className="text-sm font-medium truncate text-white">{currentUser.name}</p>
                        <p className="text-[10px] truncate">{currentUser.role === 'ADMIN' ? 'Administrador' : 'Mecânico'}</p>
                    </div>
                    <LogOut size={16} />
                </button>
            </div>
        </aside>

        <main className="flex-1 overflow-hidden relative flex flex-col">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {currentView === 'DASHBOARD' && <><LayoutDashboard size={24} className="text-blue-600"/> Visão Geral</>}
                    {currentView === 'OS_LIST' && <><ClipboardList size={24} className="text-blue-600"/> Ordens de Serviço</>}
                    {currentView === 'NEW_OS' && <><PlusCircle size={24} className="text-blue-600"/> Nova Ordem de Serviço</>}
                    {currentView === 'OS_DETAILS' && <><FileText size={24} className="text-blue-600"/> Detalhes da OS</>}
                    {currentView === 'FINANCE' && <><DollarSign size={24} className="text-blue-600"/> Gestão Financeira</>}
                    {currentView === 'TEAM' && <><Users size={24} className="text-blue-600"/> Gestão de Equipe</>}
                    {currentView === 'AI_CHAT' && <><Bot size={24} className="text-blue-600"/> Mecânico Virtual IA</>}
                    {currentView === 'SETTINGS' && <><Settings size={24} className="text-blue-600"/> Configurações da Oficina</>}
                </h2>
                <div className="flex items-center gap-4">
                     <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
                     <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                     </button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                {renderContent()}
            </div>
        </main>
    </div>
  );
};

export default App;
