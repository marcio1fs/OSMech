

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
  PlayCircle
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
    ExpenseCategoryLabel
} from './types';
import { getMechanicDiagnosis, getShopAssistantChat, analyzePartImage } from './services/geminiService';
import { Card, StatCard } from './components/Card';
import { StatusBadge } from './components/StatusBadge';

// --- Mock Data ---
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Roberto (Admin)', role: 'ADMIN', avatar: 'RO' },
  { id: 'u2', name: 'Carlos (Mecânico)', role: 'MECHANIC', avatar: 'CA' },
  { id: 'u3', name: 'Jorge (Mecânico)', role: 'MECHANIC', avatar: 'JO' }
];

// Listas separadas para filtragem contextual
const COMMON_PARTS = [
    "ÓLEO MOTOR 5W30", "ÓLEO MOTOR 10W40", "FILTRO DE ÓLEO", "FILTRO DE AR", "FILTRO DE COMBUSTÍVEL",
    "FILTRO DE CABINE", "PASTILHA DE FREIO DIANTEIRA", "PASTILHA DE FREIO TRASEIRA", "DISCO DE FREIO DIANTEIRO",
    "DISCO DE FREIO TRASEIRO", "FLUIDO DE FREIO DOT4", "CORREIA DENTADA", "TENSOR DA CORREIA", "BOMBA D'ÁGUA",
    "VELAS DE IGNIÇÃO", "CABOS DE VELA", "BOBINA DE IGNIÇÃO", "BATERIA 60AH", "BATERIA 70AH",
    "AMORTECEDOR DIANTEIRO", "AMORTECEDOR TRASEIRO", "KIT EMBREAGEM", "ADITIVO RADIADOR",
    "LÂMPADA H4", "LÂMPADA H7", "PALHETA LIMPADOR", "VÁLVULA TERMOSTÁTICA", "SENSOR DE OXIGÊNIO"
];

const COMMON_SERVICES = [
    "MÃO DE OBRA (HORA TÉCNICA)", "DIAGNÓSTICO SCANNER", "TROCA DE ÓLEO E FILTRO",
    "SUBSTITUIÇÃO PASTILHAS", "SUBSTITUIÇÃO DISCOS", "SANGRIA DE FREIOS", "ALINHAMENTO 3D",
    "BALANCEAMENTO DE RODAS", "LIMPEZA DE BICOS INJETORES", "SUBSTITUIÇÃO CORREIA DENTADA",
    "REVISÃO SUSPENSÃO", "TROCA DE EMBREAGEM", "HIGIENIZAÇÃO AR CONDICIONADO",
    "REVISÃO ELÉTRICA", "INSTALAÇÃO ACESSÓRIOS", "LAVAGEM DE MOTOR", "REVISÃO GERAL"
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
    { id: 'e1', description: 'ALUGUEL GALPÃO', amount: 2500, category: 'FIXED', date: new Date(Date.now() - 86400000 * 10).toISOString(), userId: 'u1' },
    { id: 'e2', description: 'CONTA DE LUZ', amount: 450, category: 'FIXED', date: new Date(Date.now() - 86400000 * 5).toISOString(), userId: 'u1' },
    { id: 'e3', description: 'LOTE DE ÓLEO 5W30', amount: 800, category: 'PARTS', date: new Date(Date.now() - 86400000 * 2).toISOString(), userId: 'u1' },
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
            {users.map(u => (
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

const AIDiagnosisPanel = ({ order, onUpdate, onLog }: { order: ServiceOrder, onUpdate: (o: ServiceOrder) => void, onLog: any }) => {
    const [isLoading, setIsLoading] = useState(false);

    const runDiagnosis = async () => {
        setIsLoading(true);
        const result = await getMechanicDiagnosis(
            `${order.vehicleManufacturer} ${order.vehicleModel} ${order.vehicleYear || ''}`,
            order.complaint,
            order.currentMileage
        );
        if (result) {
            onUpdate({ ...order, aiDiagnosis: result });
            onLog('UPDATE', `Executou Diagnóstico IA na OS ${order.id}`);
        } else {
            alert("Não foi possível gerar o diagnóstico. Tente novamente.");
        }
        setIsLoading(false);
    };

    const addPart = (part: { name: string, estimatedCost: number }) => {
        const newItem: ServiceItem = {
            id: Date.now().toString(),
            description: part.name.toUpperCase(),
            type: 'PART',
            quantity: 1,
            unitPrice: part.estimatedCost,
            totalPrice: part.estimatedCost
        };
        const updatedItems = [...(order.items || []), newItem];
        const subTotal = (order.laborCost) + (order.partsCost + newItem.totalPrice);
        
        onUpdate({
            ...order,
            items: updatedItems,
            partsCost: order.partsCost + newItem.totalPrice,
            totalCost: subTotal - (subTotal * ((order.discountPercentage || 0) / 100))
        });
        onLog('UPDATE', `Adicionou peça sugerida pela IA: ${part.name}`);
    };

    const addLabor = (hours: number) => {
        const hourlyRate = 150; // Valor hora padrão
        const cost = hours * hourlyRate;
        const newItem: ServiceItem = {
            id: Date.now().toString(),
            description: `MÃO DE OBRA (${hours}H ESTIMADAS)`,
            type: 'LABOR',
            quantity: 1,
            unitPrice: cost,
            totalPrice: cost,
            status: 'PENDING'
        };
        const updatedItems = [...(order.items || []), newItem];
        const subTotal = (order.laborCost + cost) + order.partsCost;

        onUpdate({
            ...order,
            items: updatedItems,
            laborCost: order.laborCost + cost,
            totalCost: subTotal - (subTotal * ((order.discountPercentage || 0) / 100))
        });
        onLog('UPDATE', `Adicionou Mão de Obra sugerida pela IA: ${hours}h`);
    };

    if (!order.aiDiagnosis && !isLoading) {
        return (
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-lg mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2"><Bot size={24} className="animate-pulse"/> Assistente de Diagnóstico (IA)</h3>
                    <p className="text-indigo-100 mt-1 max-w-xl">
                        Utilize nossa inteligência artificial para analisar os sintomas relatados, sugerir diagnósticos prováveis e recomendar peças e serviços para este veículo.
                    </p>
                </div>
                <button 
                    onClick={runDiagnosis}
                    className="px-6 py-3 bg-white text-indigo-700 rounded-lg font-bold shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
                >
                    <PlayCircle size={20}/> Iniciar Diagnóstico
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white border border-indigo-100 rounded-xl p-8 shadow-sm mb-6 flex flex-col items-center justify-center text-center">
                <Loader size={48} className="text-indigo-600 animate-spin mb-4"/>
                <h3 className="text-lg font-bold text-slate-800">Analisando Sintomas...</h3>
                <p className="text-slate-500">Consultando base de conhecimento mecânica e defeitos crônicos do modelo.</p>
            </div>
        );
    }

    const result = order.aiDiagnosis!;

    return (
        <Card className="mb-6 border-indigo-200 shadow-indigo-100">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center -mt-6 -mx-6 rounded-t-xl mb-6">
                <h3 className="text-indigo-900 font-bold flex items-center gap-2"><Bot size={20}/> Diagnóstico Inteligente</h3>
                <button onClick={runDiagnosis} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline">Refazer Análise</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Esquerda: Diagnóstico */}
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 uppercase mb-3 flex items-center gap-2"><AlertTriangle size={16}/> Causas Prováveis</h4>
                        <div className="flex flex-wrap gap-2">
                            {result.possibleCauses.map((cause, idx) => (
                                <span key={idx} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm border border-red-100 font-medium">
                                    {cause}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 uppercase mb-3 flex items-center gap-2"><CheckSquare size={16}/> Passos para Diagnóstico</h4>
                        <ul className="space-y-2">
                            {result.diagnosisSteps.map((step, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-slate-700 text-sm bg-white p-2 rounded border border-slate-100">
                                    <span className="bg-indigo-100 text-indigo-700 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0">{idx + 1}</span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Direita: Ações Recomendadas */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2"><Wrench size={16}/> Sugestão de Reparo</h4>
                    
                    <div className="space-y-3 mb-4">
                        {result.recommendedParts.map((part, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200 shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{part.name}</p>
                                    <p className="text-xs text-slate-500">Est. {formatCurrency(part.estimatedCost)}</p>
                                </div>
                                <button onClick={() => addPart(part)} className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100" title="Adicionar ao Orçamento">
                                    <PlusCircle size={18}/>
                                </button>
                            </div>
                        ))}
                    </div>

                    {result.estimatedLaborHours > 0 && (
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-100">
                             <div>
                                <p className="font-bold text-blue-900 text-sm">Mão de Obra Estimada</p>
                                <p className="text-xs text-blue-600">{result.estimatedLaborHours} Horas Técnicas</p>
                            </div>
                            <button onClick={() => addLabor(result.estimatedLaborHours)} className="p-2 bg-white text-blue-600 rounded hover:bg-blue-50 border border-blue-200">
                                <PlusCircle size={18}/>
                            </button>
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Manutenção Preventiva</p>
                        <p className="text-xs text-slate-600 italic">"{result.preventiveMaintenance}"</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const ServiceItemsEditor = ({ order, onUpdate, readOnly = false, users }: { order: ServiceOrder, onUpdate: (o: ServiceOrder) => void, readOnly?: boolean, users: User[] }) => {
    const [activeTab, setActiveTab] = useState<'services' | 'parts'>('services');
    
    // New Item States
    const [newService, setNewService] = useState({ description: '', price: 0, notes: '', mechanicId: '' });
    const [newPart, setNewPart] = useState({ code: '', description: '', qty: 1, unitPrice: 0 });

    const calculateTotals = (items: ServiceItem[]) => {
        const parts = items.filter(i => i.type === 'PART').reduce((acc, i) => acc + i.totalPrice, 0);
        const labor = items.filter(i => i.type === 'LABOR').reduce((acc, i) => acc + i.totalPrice, 0);
        return { parts, labor };
    };

    const updateOrder = (items: ServiceItem[]) => {
        const { parts, labor } = calculateTotals(items);
        const subTotal = parts + labor;
        const discountVal = subTotal * ((order.discountPercentage || 0) / 100);
        
        onUpdate({
            ...order,
            items,
            partsCost: parts,
            laborCost: labor,
            totalCost: subTotal - discountVal
        });
    };

    const addService = () => {
        if(!newService.description || newService.price < 0) return;
        const item: ServiceItem = {
            id: Date.now().toString(),
            description: newService.description.toUpperCase(),
            type: 'LABOR',
            quantity: 1,
            unitPrice: newService.price,
            totalPrice: newService.price,
            status: 'PENDING',
            notes: newService.notes.toUpperCase(),
            mechanicId: newService.mechanicId || order.assignedMechanicId
        };
        updateOrder([...(order.items || []), item]);
        setNewService({ description: '', price: 0, notes: '', mechanicId: '' });
    };

    const addPart = () => {
        if(!newPart.description || newPart.qty <= 0) return;
        const item: ServiceItem = {
            id: Date.now().toString(),
            code: newPart.code.toUpperCase(),
            description: newPart.description.toUpperCase(),
            type: 'PART',
            quantity: newPart.qty,
            unitPrice: newPart.unitPrice,
            totalPrice: newPart.qty * newPart.unitPrice
        };
        updateOrder([...(order.items || []), item]);
        setNewPart({ code: '', description: '', qty: 1, unitPrice: 0 });
    };

    const removeItem = (id: string) => {
        updateOrder((order.items || []).filter(i => i.id !== id));
    };

    const updateItemStatus = (id: string, newStatus: ServiceItem['status']) => {
        const items = (order.items || []).map(i => i.id === id ? { ...i, status: newStatus } : i);
        updateOrder(items);
    }
    
    const handleDiscountChange = (percentage: number) => {
        const subTotal = order.partsCost + order.laborCost;
        const discountVal = subTotal * (percentage / 100);
        onUpdate({
            ...order,
            discountPercentage: percentage,
            totalCost: subTotal - discountVal
        });
    };

    const serviceItems = (order.items || []).filter(i => i.type === 'LABOR');
    const partItems = (order.items || []).filter(i => i.type === 'PART');

    return (
        <Card className="overflow-visible">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200">
                <button 
                    className={`flex-1 py-4 text-sm font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'services' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => setActiveTab('services')}
                >
                    <Wrench size={18}/> Serviços e Mão de Obra ({serviceItems.length})
                </button>
                <button 
                    className={`flex-1 py-4 text-sm font-bold uppercase flex items-center justify-center gap-2 ${activeTab === 'parts' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => setActiveTab('parts')}
                >
                    <Package size={18}/> Grade de Peças ({partItems.length})
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        {/* Service List */}
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-3">Descrição</th>
                                        <th className="p-3">Mecânico</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Valor</th>
                                        {!readOnly && <th className="p-3 text-center w-16"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {serviceItems.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400 italic">Nenhum serviço registrado.</td></tr>}
                                    {serviceItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="p-3">
                                                <p className="font-medium text-slate-800">{item.description}</p>
                                                {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
                                            </td>
                                            <td className="p-3 text-slate-600 text-xs">
                                                {users.find(u => u.id === item.mechanicId)?.name || 'N/A'}
                                            </td>
                                            <td className="p-3 text-center">
                                                <select 
                                                    disabled={readOnly}
                                                    value={item.status || 'PENDING'}
                                                    onChange={(e) => updateItemStatus(item.id, e.target.value as any)}
                                                    className={`text-xs font-bold px-2 py-1 rounded border outline-none ${
                                                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                        item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                                        'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}
                                                >
                                                    <option value="PENDING">PENDENTE</option>
                                                    <option value="IN_PROGRESS">EM ANDAMENTO</option>
                                                    <option value="COMPLETED">CONCLUÍDO</option>
                                                </select>
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(item.totalPrice)}</td>
                                            {!readOnly && (
                                                <td className="p-3 text-center">
                                                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Service Form */}
                        {!readOnly && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Adicionar Novo Serviço</h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-5">
                                        <input 
                                            className="w-full p-2 border border-slate-300 rounded text-sm uppercase outline-none focus:border-blue-500"
                                            placeholder="DESCRIÇÃO DO SERVIÇO"
                                            value={newService.description}
                                            onChange={(e) => setNewService({...newService, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                         <select 
                                            className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                                            value={newService.mechanicId}
                                            onChange={(e) => setNewService({...newService, mechanicId: e.target.value})}
                                        >
                                            <option value="">Mecânico Resp.</option>
                                            {users.filter(u => u.role === 'MECHANIC').map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <input 
                                            type="number"
                                            className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500"
                                            placeholder="PREÇO"
                                            value={newService.price || ''}
                                            onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <button onClick={addService} className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center justify-center gap-2">
                                            <Plus size={18}/> Adicionar
                                        </button>
                                    </div>
                                    <div className="md:col-span-12">
                                        <input 
                                            className="w-full p-2 border border-slate-300 rounded text-sm uppercase outline-none focus:border-blue-500"
                                            placeholder="Observações Técnicas (Opcional)"
                                            value={newService.notes}
                                            onChange={(e) => setNewService({...newService, notes: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'parts' && (
                    <div className="space-y-6">
                        {/* Parts List */}
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-3">Código</th>
                                        <th className="p-3">Descrição da Peça</th>
                                        <th className="p-3 text-center">Qtd</th>
                                        <th className="p-3 text-right">Unitário</th>
                                        <th className="p-3 text-right">Total</th>
                                        {!readOnly && <th className="p-3 text-center w-16"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {partItems.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-400 italic">Nenhuma peça registrada.</td></tr>}
                                    {partItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-xs text-slate-500">{item.code || '-'}</td>
                                            <td className="p-3 font-medium text-slate-800">{item.description}</td>
                                            <td className="p-3 text-center">{item.quantity}</td>
                                            <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(item.totalPrice)}</td>
                                            {!readOnly && (
                                                <td className="p-3 text-center">
                                                    <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Part Form */}
                        {!readOnly && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Lançamento de Peças</h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-2">
                                        <input 
                                            className="w-full p-2 border border-slate-300 rounded text-sm uppercase outline-none focus:border-blue-500 font-mono"
                                            placeholder="CÓDIGO"
                                            value={newPart.code}
                                            onChange={(e) => setNewPart({...newPart, code: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-5">
                                        <input 
                                            className="w-full p-2 border border-slate-300 rounded text-sm uppercase outline-none focus:border-blue-500"
                                            placeholder="DESCRIÇÃO DA PEÇA"
                                            value={newPart.description}
                                            onChange={(e) => setNewPart({...newPart, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <input 
                                            type="number"
                                            min="1"
                                            className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500 text-center"
                                            placeholder="QTD"
                                            value={newPart.qty}
                                            onChange={(e) => setNewPart({...newPart, qty: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500 text-right"
                                            placeholder="R$ UNIT"
                                            value={newPart.unitPrice || ''}
                                            onChange={(e) => setNewPart({...newPart, unitPrice: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <button onClick={addPart} className="w-full h-full bg-orange-600 hover:bg-orange-700 text-white rounded font-bold flex items-center justify-center gap-2">
                                            <Plus size={18}/> Adicionar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex flex-col items-end bg-slate-50/50">
                 <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Total Mão de Obra</span>
                        <span>{formatCurrency(order.laborCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Total Peças</span>
                        <span>{formatCurrency(order.partsCost)}</span>
                    </div>
                     {!readOnly ? (
                        <div className="flex justify-between items-center text-sm text-green-600">
                            <span>Desconto (%)</span>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                className="w-16 p-1 border border-green-200 rounded text-right text-sm outline-none focus:border-green-500"
                                value={order.discountPercentage || 0}
                                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                            />
                        </div>
                    ) : (
                         order.discountPercentage ? (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Desconto ({order.discountPercentage}%)</span>
                                <span>- {formatCurrency((order.laborCost + order.partsCost) * (order.discountPercentage/100))}</span>
                            </div>
                         ) : null
                    )}
                    <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2">
                        <span>TOTAL GERAL</span>
                        <span>{formatCurrency(order.totalCost)}</span>
                    </div>
                 </div>
            </div>
        </Card>
    );
};

const OSDetailView = ({ order, currentUser, company, onUpdate, onBack, onLog, users }: any) => {
    const [showPayment, setShowPayment] = useState(false);
    const [showDoc, setShowDoc] = useState<'RECEIPT' | 'QUOTE' | null>(null);

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-4"><ArrowRight className="rotate-180"/> Voltar</button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">OS #{order.id} <StatusBadge status={order.status} /></h2>
                    <p className="text-slate-500 text-sm">Criado em {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowDoc('QUOTE')} className="px-4 py-2 bg-blue-100 text-blue-800 rounded font-medium hover:bg-blue-200 transition-colors">Orçamento</button>
                    <button onClick={() => setShowDoc('RECEIPT')} className="px-4 py-2 bg-green-100 text-green-800 rounded font-medium hover:bg-green-200 transition-colors">Recibo</button>
                    {order.status !== OSStatus.PAID && <button onClick={() => setShowPayment(true)} className="px-4 py-2 bg-green-600 text-white rounded font-bold shadow hover:bg-green-700 transition-colors">Registrar Pagamento</button>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Dados do Cliente" className="h-full">
                     <div className="space-y-2">
                        <p className="text-sm text-slate-500 uppercase font-bold text-xs">Nome</p>
                        <p className="font-bold text-lg">{order.customerName}</p>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <p className="text-sm text-slate-500 uppercase font-bold text-xs">Telefone</p>
                        <p className="font-mono">{order.phone}</p>
                     </div>
                </Card>

                <Card title="Dados do Veículo" className="h-full">
                     <div className="space-y-2">
                        <div className="flex justify-between">
                             <div>
                                <p className="text-sm text-slate-500 uppercase font-bold text-xs">Modelo/Montadora</p>
                                <p className="font-bold">{order.vehicleManufacturer} - {order.vehicleModel}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-sm text-slate-500 uppercase font-bold text-xs">Placa</p>
                                <span className="bg-slate-100 px-2 py-1 rounded font-mono border border-slate-200">{order.plate}</span>
                             </div>
                        </div>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <div className="flex gap-4">
                            <div>
                                <p className="text-sm text-slate-500 uppercase font-bold text-xs">Ano</p>
                                <p>{order.vehicleYear || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase font-bold text-xs">Cor</p>
                                <p>{order.vehicleColor || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase font-bold text-xs">KM</p>
                                <p>{order.currentMileage ? `${order.currentMileage} km` : '-'}</p>
                            </div>
                        </div>
                     </div>
                </Card>

                 <Card title="Status Financeiro" className="h-full">
                     <div className="flex flex-col h-full justify-between">
                        <div>
                             <p className="text-sm text-slate-500 uppercase font-bold text-xs mb-1">Situação Atual</p>
                             <div className="text-lg text-slate-700">{order.status === OSStatus.PAID ? 'Pago / Finalizado' : 'Em Aberto'}</div>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm text-slate-500 uppercase font-bold text-xs">Valor Total da OS</p>
                            <p className="text-3xl font-bold text-slate-800">{formatCurrency(order.totalCost)}</p>
                        </div>
                     </div>
                </Card>
            </div>
            
            {/* AI Diagnosis Section */}
            <AIDiagnosisPanel order={order} onUpdate={onUpdate} onLog={onLog} />
            
            {/* Detailed Service & Parts Editor */}
            <ServiceItemsEditor order={order} onUpdate={onUpdate} readOnly={order.status === OSStatus.PAID} users={users} />

            <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} total={order.totalCost} onConfirm={(payment) => onUpdate({...order, status: OSStatus.PAID, paymentMethod: payment.method, paymentDate: new Date().toISOString()})} />
            
            {showDoc && <DocumentModal order={order} isOpen={true} onClose={() => setShowDoc(null)} company={company} onLog={onLog} mode={showDoc} />}
        </div>
    );
};

const FinanceView = ({ expenses, orders, onAddExpense }: any) => (
    <Card title="Financeiro">
        <div className="p-4 text-center text-slate-500">Módulo Financeiro Simplificado</div>
        {/* Implementation omitted for brevity but placeholder exists */}
    </Card>
);

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

const SettingsView = ({ company, onUpdate }: any) => (
    <Card title="Configurações">
        <div className="p-4">
            <p>Nome: {company.name}</p>
            <p>CNPJ: {company.cnpj}</p>
        </div>
    </Card>
);

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

const App = () => {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_DATA);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
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
  if (!currentUser) return <LoginView users={INITIAL_USERS} onLogin={setCurrentUser} />;

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
                users={INITIAL_USERS}
                onUpdate={(updated: ServiceOrder) => {
                    setOrders(orders.map(o => o.id === updated.id ? updated : o));
                    addLog('UPDATE', `Atualizou OS ${updated.id}`, updated.id);
                }}
                onBack={() => setCurrentView('OS_LIST')}
                onLog={addLog}
            />;
          case 'FINANCE': return <FinanceView expenses={expenses} orders={orders} onAddExpense={(e: Expense) => { setExpenses([e, ...expenses]); addLog('FINANCE', `Despesa: ${e.description}`); }} />;
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
                <NavItem icon={<DollarSign size={20}/>} label="Financeiro" active={currentView === 'FINANCE'} onClick={() => setCurrentView('FINANCE')} />
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
