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
  CheckSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

import { ServiceOrder, OSStatus, ViewState, User, AIDiagnosisResult, UserRole, AuditLogEntry } from './types';
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
    phone: '(11) 99999-9999',
    complaint: 'Motor perdendo potência em subidas.',
    status: OSStatus.PAID,
    assignedMechanicId: 'u2',
    partsCost: 1200,
    laborCost: 450,
    totalCost: 1650,
    aiDiagnosis: {
        possibleCauses: ['Filtro de diesel obstruído', 'Problema na válvula EGR', 'Turbina com baixa pressão'],
        diagnosisSteps: ['Verificar pressão da turbina', 'Scanear códigos de injeção', 'Inspecionar filtro de ar e diesel'],
        recommendedParts: [{ name: 'Filtro Diesel', estimatedCost: 150 }, { name: 'Válvula EGR', estimatedCost: 900 }],
        estimatedLaborHours: 3,
        preventiveMaintenance: 'Recomendar limpeza do sistema de injeção a cada 40.000km.'
    },
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
    phone: '(11) 98888-8888',
    complaint: 'Barulho na suspensão dianteira.',
    status: OSStatus.PENDING,
    assignedMechanicId: 'u3',
    partsCost: 0,
    laborCost: 0,
    totalCost: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_LOGS: AuditLogEntry[] = [
    { id: 'log1', action: 'CREATE', userId: 'u1', userName: 'Roberto (Admin)', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), details: 'Criou OS-1001' },
    { id: 'log2', action: 'UPDATE', userId: 'u2', userName: 'Carlos (Mecânico)', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), details: 'Atualizou status OS-1001 para Em Execução' },
];

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
    const totalRevenue = orders
      .filter(o => o.status === OSStatus.COMPLETED || o.status === OSStatus.PAID)
      .reduce((acc, curr) => acc + curr.totalCost, 0);
    
    const active = orders.filter(o => o.status !== OSStatus.COMPLETED && o.status !== OSStatus.PAID).length;
    const pending = orders.filter(o => o.status === OSStatus.APPROVAL).length;
    
    // Only count truly paid/finished for a specific "Completed" metric
    const completed = orders.filter(o => o.status === OSStatus.PAID || o.status === OSStatus.COMPLETED).length;

    // Conversion Rate: (Approved + In Progress + Completed + Paid) / Total
    const converted = orders.filter(o => o.status !== OSStatus.PENDING && o.status !== OSStatus.DIAGNOSING).length;
    const conversionRate = orders.length > 0 ? (converted / orders.length) * 100 : 0;

    return { totalRevenue, active, pending, completed, conversionRate };
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

  const chartMechanicPerformance = useMemo(() => {
      const counts: Record<string, number> = {};
      orders.forEach(o => {
          if (o.assignedMechanicId) {
              const mechName = MOCK_USERS.find(u => u.id === o.assignedMechanicId)?.name.split(' ')[0] || 'Desc.';
              counts[mechName] = (counts[mechName] || 0) + 1;
          } else {
              counts['Não Atribuído'] = (counts['Não Atribuído'] || 0) + 1;
          }
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count }));
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
            <StatCard title="Receita (Finalizada)" value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign size={24} />} color="bg-emerald-500" />
        )}
        <StatCard title="OS em Andamento" value={stats.active} icon={<Wrench size={24} />} color="bg-blue-500" />
        <StatCard title="Taxa de Conversão" value={`${stats.conversionRate.toFixed(0)}%`} icon={<Activity size={24} />} color="bg-purple-500" />
        <StatCard title="Serviços Finalizados" value={stats.completed} icon={<CheckCircle size={24} />} color="bg-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Volume de OS por Status">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={60}/>
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartDataStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#f59e0b', '#a855f7', '#f97316', '#3b82f6', '#22c55e', '#64748b'][index % 6]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Produtividade por Mecânico">
            <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMechanicPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            </div>
        </Card>
      </div>
    </div>
  );

  const ReportsView = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Composição de Faturamento (Peças vs MO)">
                  <div className="h-64 w-full flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie
                                data={chartRevenueBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                <Cell key="cell-0" fill="#3b82f6" />
                                <Cell key="cell-1" fill="#f59e0b" />
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RePieChart>
                    </ResponsiveContainer>
                  </div>
              </Card>
              <Card title="Logs de Auditoria (Segurança)" className="overflow-hidden">
                  <div className="h-64 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                  <th className="p-2 border-b">Data</th>
                                  <th className="p-2 border-b">Usuário</th>
                                  <th className="p-2 border-b">Ação</th>
                                  <th className="p-2 border-b">Detalhes</th>
                              </tr>
                          </thead>
                          <tbody>
                              {logs.map(log => (
                                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                                      <td className="p-2 text-slate-500">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString().slice(0,5)}</td>
                                      <td className="p-2 font-medium text-slate-700">{log.userName}</td>
                                      <td className="p-2">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                              log.action === 'DELETE' ? 'bg-red-100 text-red-700' : 
                                              log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                              'bg-blue-100 text-blue-700'
                                          }`}>
                                              {log.action}
                                          </span>
                                      </td>
                                      <td className="p-2 text-slate-600 truncate max-w-[150px]" title={log.details}>{log.details}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
      </div>
  );

  const OSListView = () => {
    // -- Advanced Search State --
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<OSStatus[]>([]);
    const [mechanicId, setMechanicId] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    // Initialize Mechanic Filter based on Role
    useEffect(() => {
        if (!isAdmin && user) {
            setMechanicId(user.id);
        }
    }, [user, isAdmin]);

    const setDatePreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    }

    const toggleStatus = (status: OSStatus) => {
        setSelectedStatuses(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    }
    
    // -- Filter Logic --
    const filteredOrders = orders.filter(o => {
      // 1. Identification Search (Name, Plate, ID, CPF)
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        o.customerName.toLowerCase().includes(term) ||
        o.plate.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term) ||
        (o.customerCpf && o.customerCpf.includes(term));
      
      // 2. Status (Multiple)
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(o.status);
      
      // 3. Mechanic (Responsible)
      const matchesMechanic = mechanicId === 'ALL' || o.assignedMechanicId === mechanicId;

      // 4. Period (Creation Date)
      const targetDate = new Date(o.createdAt);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      if (end) end.setHours(23, 59, 59); // Include full end day

      const matchesDate = (!start || targetDate >= start) && (!end || targetDate <= end);
      
      return matchesSearch && matchesStatus && matchesMechanic && matchesDate;
    });

    const handleOpenOS = (os: ServiceOrder) => {
        setSelectedOS(os);
        setCurrentView('OS_DETAILS');
    }

    // -- Secure Deletion (UC004) --
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!isAdmin) {
            alert("Apenas administradores podem excluir ordens.");
            return;
        }
        
        const osToDelete = orders.find(o => o.id === id);
        if (!osToDelete) return;

        // Step 1: Status Validation
        if (osToDelete.status === OSStatus.PAID) {
             alert("ERRO DE SEGURANÇA: Não é possível excluir OS com status 'Finalizado/Pago' para manter a integridade fiscal.");
             return;
        }

        // Step 2: Access Confirmation (Password)
        const pwd = prompt("ÁREA DE SEGURANÇA (UC004)\n\nDigite a senha de administrador para confirmar a exclusão permanente:");
        if (pwd === "admin123") {
             // Step 3: Audit Log
             const logId = Math.random().toString(36).substr(2, 9).toUpperCase();
             addLog('DELETE', `Exclusão Segura da OS ${id}`, id, logId);
             
             // Step 4: Execution
             setOrders(prev => prev.filter(o => o.id !== id));
             
             // Step 5: Notification
             alert(`SUCESSO: Ordem de Serviço excluída.\n\nUm registro de auditoria foi criado.\nID do Log: ${logId}`);
        } else if (pwd !== null) {
            alert("Senha incorreta. Ação bloqueada.");
        }
    }

    const handleExport = () => {
        const header = "ID,Cliente,CPF,Veiculo,Placa,Status,Mecânico,Total,Data\n";
        const rows = filteredOrders.map(o => {
            const mech = MOCK_USERS.find(u => u.id === o.assignedMechanicId)?.name || 'N/A';
            return `${o.id},"${o.customerName}","${o.customerCpf || ''}","${o.vehicleModel}","${o.plate}",${o.status},"${mech}",${o.totalCost},${new Date(o.createdAt).toLocaleDateString()}`
        }).join("\n");
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `os_relatorio_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        addLog('LOGIN', `Exportou lista filtrada de OS.`);
    }

    return (
      <div className="space-y-4 animate-fade-in">
        {/* Advanced Filter Panel */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="flex flex-col md:flex-row gap-4 mb-4">
               {/* Search Bar */}
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por Placa, CPF, Cliente ou ID..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               
               {/* Mechanic Filter (Role Aware) */}
               <div className="relative md:w-64">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    disabled={!isAdmin}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    value={mechanicId}
                    onChange={(e) => setMechanicId(e.target.value)}
                  >
                      <option value="ALL">Todos os Mecânicos</option>
                      {MOCK_USERS.filter(u => u.role === 'MECHANIC').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                  </select>
               </div>

               <button 
                 onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm border ${isFilterExpanded ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
               >
                  <Filter size={16} /> Filtros Avançados
               </button>

               <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap text-sm border border-slate-200"
               >
                 <FileSpreadsheet size={16} /> Exportar
               </button>
               <button 
                onClick={() => setCurrentView('NEW_OS')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap text-sm"
               >
                 <PlusCircle size={16} /> Nova OS
               </button>
           </div>

           {/* Expanded Filters */}
           {isFilterExpanded && (
               <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                   {/* Date Filter */}
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2"><Calendar size={14}/> Período (Abertura)</label>
                       <div className="flex gap-2 mb-2">
                           <button onClick={() => setDatePreset(0)} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">Hoje</button>
                           <button onClick={() => setDatePreset(7)} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">7 Dias</button>
                           <button onClick={() => setDatePreset(30)} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">30 Dias</button>
                           <button onClick={() => setDateRange({start: '', end: ''})} className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-red-500">Limpar</button>
                       </div>
                       <div className="flex gap-2 items-center">
                           <input type="date" className="text-sm border border-slate-300 rounded p-1" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                           <span className="text-slate-400">-</span>
                           <input type="date" className="text-sm border border-slate-300 rounded p-1" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                       </div>
                   </div>

                   {/* Status Filter (Multiple) */}
                   <div>
                       <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2"><CheckSquare size={14}/> Status (Múltipla Escolha)</label>
                       <div className="flex flex-wrap gap-2">
                           {Object.values(OSStatus).map(status => {
                               const isSelected = selectedStatuses.includes(status);
                               return (
                                   <button 
                                     key={status}
                                     onClick={() => toggleStatus(status)}
                                     className={`text-xs px-2 py-1 rounded-full border transition-all ${
                                         isSelected 
                                         ? 'bg-blue-100 border-blue-300 text-blue-700 font-semibold' 
                                         : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                     }`}
                                   >
                                       {status}
                                   </button>
                               )
                           })}
                           {selectedStatuses.length > 0 && (
                               <button onClick={() => setSelectedStatuses([])} className="text-xs px-2 py-1 text-red-500 underline">Limpar</button>
                           )}
                       </div>
                   </div>
               </div>
           )}
        </div>

        {/* List Results */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold tracking-wider">
                  <th className="p-4 border-b border-slate-100">OS / Data</th>
                  <th className="p-4 border-b border-slate-100">Veículo / Cliente</th>
                  <th className="p-4 border-b border-slate-100">Status</th>
                  <th className="p-4 border-b border-slate-100">Mecânico</th>
                  <th className="p-4 border-b border-slate-100">Total</th>
                  {isAdmin && <th className="p-4 border-b border-slate-100 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map(order => (
                  <tr key={order.id} onClick={() => handleOpenOS(order)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="p-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{order.id}</div>
                        <div className="text-xs text-slate-500 flex flex-col">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span>{new Date(order.createdAt).toLocaleTimeString().slice(0,5)}</span>
                        </div>
                    </td>
                    <td className="p-4">
                       <div className="font-medium text-slate-800">{order.vehicleModel}</div>
                       <div className="flex flex-col gap-0.5 mt-1">
                           <span className="text-xs text-slate-500 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200 w-fit">{order.plate}</span>
                           <span className="text-xs text-slate-600 font-medium">{order.customerName}</span>
                           {order.customerCpf && <span className="text-[10px] text-slate-400">CPF: {order.customerCpf}</span>}
                       </div>
                    </td>
                    <td className="p-4"><StatusBadge status={order.status} /></td>
                    <td className="p-4 text-slate-500">
                        {order.assignedMechanicId ? (
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold">
                                    {MOCK_USERS.find(u => u.id === order.assignedMechanicId)?.avatar}
                                </span>
                                <span className="text-xs">{MOCK_USERS.find(u => u.id === order.assignedMechanicId)?.name.split(' ')[0]}</span>
                            </div>
                        ) : <span className="text-xs italic text-slate-400">Pendente</span>}
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-700">
                      {order.totalCost > 0 ? `R$ ${order.totalCost.toFixed(2)}` : '-'}
                    </td>
                    {isAdmin && (
                        <td className="p-4 text-right">
                        <button 
                            onClick={(e) => handleDelete(e, order.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Exclusão Segura"
                        >
                            <Trash2 size={16} />
                        </button>
                        </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                    <Search size={48} className="text-slate-200 mb-4" />
                    <p>Nenhuma ordem de serviço encontrada com os critérios selecionados.</p>
                </div>
            )}
        </div>
      </div>
    );
  };

  const NewOSView = () => {
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AIDiagnosisResult | null>(null);
    
    const [formData, setFormData] = useState<Partial<ServiceOrder>>({
      customerName: '',
      customerCpf: '',
      phone: '',
      vehicleModel: '',
      plate: '',
      currentMileage: undefined,
      complaint: '',
      status: OSStatus.PENDING,
      laborCost: 0,
      partsCost: 0
    });

    const handleDiagnose = async () => {
      if (!formData.vehicleModel || !formData.complaint) {
        alert("Preencha o modelo do veículo e a reclamação para usar a IA.");
        return;
      }
      setLoading(true);
      // Pass mileage to AI service
      const result = await getMechanicDiagnosis(formData.vehicleModel, formData.complaint, formData.currentMileage);
      
      if (result) {
        setAiResult(result);
        
        // Auto-fill suggestions
        const suggestedPartsCost = result.recommendedParts.reduce((acc, p) => acc + p.estimatedCost, 0);
        const suggestedLaborCost = result.estimatedLaborHours * 100; // Assumption: 100 R$/h
        
        setFormData(prev => ({ 
            ...prev, 
            status: OSStatus.DIAGNOSING,
            partsCost: suggestedPartsCost,
            laborCost: suggestedLaborCost,
            aiDiagnosis: result
        }));
      } else {
          alert("Não foi possível gerar diagnóstico. Tente novamente.");
      }
      setLoading(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newOS: ServiceOrder = {
        id: `OS-${new Date().getFullYear()}-${1000 + orders.length + 1}`,
        customerName: formData.customerName || 'Cliente',
        customerCpf: formData.customerCpf,
        phone: formData.phone || '',
        vehicleModel: formData.vehicleModel || '',
        plate: formData.plate || '',
        currentMileage: formData.currentMileage,
        complaint: formData.complaint || '',
        status: formData.status || OSStatus.PENDING,
        aiDiagnosis: aiResult || undefined,
        mechanicNotes: '',
        laborCost: Number(formData.laborCost) || 0,
        partsCost: Number(formData.partsCost) || 0,
        totalCost: (Number(formData.laborCost) || 0) + (Number(formData.partsCost) || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setOrders(prev => [newOS, ...prev]);
      addLog('CREATE', `Criou OS ${newOS.id}`, newOS.id);
      setSelectedOS(newOS);
      setCurrentView('OS_DETAILS'); // Go to details immediately
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        <Card title="Nova Ordem de Serviço (UC001)">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Dados do Veículo</label>
                  <div className="grid grid-cols-3 gap-4 mt-1">
                      <div className="col-span-2">
                        <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Ex: VW Gol 1.6 2018" 
                            value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})}
                        />
                      </div>
                      <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg uppercase font-mono text-sm" placeholder="ABC-1234" 
                          value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})}
                      />
                      <div className="col-span-3">
                         <input type="number" className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Quilometragem Atual (km) - Opcional" 
                            value={formData.currentMileage || ''} onChange={e => setFormData({...formData, currentMileage: Number(e.target.value)})}
                         />
                         <p className="text-[10px] text-slate-400 mt-1">* Importante para Sugestão de Manutenção Preventiva (IA)</p>
                      </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Cliente</label>
                  <div className="grid grid-cols-2 gap-4 mt-1">
                      <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Nome completo" 
                          value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})}
                      />
                      <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="CPF (000.000.000-00)" 
                          value={formData.customerCpf || ''} onChange={e => setFormData({...formData, customerCpf: e.target.value})}
                      />
                      <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm col-span-2" placeholder="Telefone" 
                          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Reclamação Principal</label>
                <textarea required className="w-full p-3 border border-slate-300 rounded-lg h-24 mt-1 text-sm" placeholder="Descreva o problema relatado..."
                   value={formData.complaint} onChange={e => setFormData({...formData, complaint: e.target.value})}
                ></textarea>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={handleDiagnose} disabled={loading} className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg transition-all disabled:opacity-50 font-medium text-sm shadow-md shadow-purple-200">
                    {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <Bot size={18} />}
                    Analisar com IA
                  </button>
                  <button type="submit" className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg transition-all font-medium text-sm shadow-md">
                    <Save size={18} /> Criar OS
                  </button>
              </div>
            </form>
        </Card>

        {aiResult ? (
            <Card title="Análise IA (Pré-Diagnóstico)" className="border-purple-200 shadow-lg shadow-purple-50/50">
               <div className="space-y-4 text-sm">
                   <div>
                       <h4 className="font-bold text-purple-900 flex items-center gap-2"><AlertTriangle size={16}/> Causas Prováveis (Ordenadas por Probabilidade)</h4>
                       <ol className="list-decimal list-inside text-slate-700 ml-1">
                           {aiResult.possibleCauses.map((c, i) => <li key={i}>{c}</li>)}
                       </ol>
                   </div>
                   <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                       <h4 className="font-bold text-purple-900 mb-1">Passos para Diagnóstico</h4>
                       <ol className="list-decimal list-inside text-slate-700 space-y-1">
                           {aiResult.diagnosisSteps.map((s, i) => <li key={i}>{s}</li>)}
                       </ol>
                   </div>
                   
                   {/* Preventive Maintenance Highlight */}
                   <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                       <h4 className="font-bold text-indigo-900 flex items-center gap-2"><ShieldCheck size={16}/> Recomendação Preventiva (Upsell)</h4>
                       <p className="text-indigo-800 mt-1">{aiResult.preventiveMaintenance}</p>
                   </div>

                   <div>
                       <h4 className="font-bold text-slate-800">Estimativa de Peças</h4>
                       <div className="flex flex-wrap gap-2 mt-1">
                           {aiResult.recommendedParts.map((p, i) => (
                               <span key={i} className="px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200">
                                   {p.name} (~R$ {p.estimatedCost})
                               </span>
                           ))}
                       </div>
                   </div>
                   <div className="flex justify-between items-center text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
                        <span>Mão de Obra Est.: {aiResult.estimatedLaborHours}h</span>
                   </div>
               </div>
            </Card>
        ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-8 h-full bg-slate-50">
                <Bot size={48} className="mb-2 opacity-20" />
                <p>Preencha os dados e clique em "Analisar com IA" para obter sugestões de diagnóstico e manutenção preventiva.</p>
            </div>
        )}
      </div>
    );
  };

  const OSDetailsView = () => {
      if (!selectedOS) return null;

      const [os, setOs] = useState<ServiceOrder>(selectedOS);
      const [editMode, setEditMode] = useState(false);

      const handleSave = () => {
          const updated: ServiceOrder = {
              ...os,
              totalCost: os.laborCost + os.partsCost,
              updatedAt: new Date().toISOString()
          };
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
          addLog('UPDATE', `Editou OS ${updated.id}`, updated.id);
          setSelectedOS(updated);
          setEditMode(false);
          alert('OS Atualizada com sucesso!');
      };

      const changeStatus = (newStatus: OSStatus) => {
          setOs({...os, status: newStatus});
      };

      return (
          <div className="space-y-6 animate-fade-in pb-10">
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
                            <button onClick={() => setEditMode(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2"><Save size={18}/> Salvar</button>
                          </>
                      ) : (
                          <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"><Wrench size={18}/> Editar OS</button>
                      )}
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                        onChange={e => setOs({...os, assignedMechanicId: e.target.value})}
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
                                 {[OSStatus.PENDING, OSStatus.DIAGNOSING, OSStatus.APPROVAL, OSStatus.IN_PROGRESS, OSStatus.COMPLETED].map(s => (
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
                                  {editMode && isAdmin ? (
                                      <input type="number" className="w-24 p-1 text-right border rounded" value={os.laborCost} onChange={e => setOs({...os, laborCost: Number(e.target.value)})} />
                                  ) : (
                                      <span className="font-mono">R$ {os.laborCost.toFixed(2)}</span>
                                  )}
                              </div>
                              <div className="flex justify-between items-center">
                                  <span className="text-slate-600 text-sm">Peças</span>
                                  {editMode && isAdmin ? (
                                      <input type="number" className="w-24 p-1 text-right border rounded" value={os.partsCost} onChange={e => setOs({...os, partsCost: Number(e.target.value)})} />
                                  ) : (
                                      <span className="font-mono">R$ {os.partsCost.toFixed(2)}</span>
                                  )}
                              </div>
                              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                  <span className="font-bold text-slate-800">TOTAL</span>
                                  <span className="font-bold text-xl text-green-600">R$ {(os.laborCost + os.partsCost).toFixed(2)}</span>
                              </div>

                              {/* Payment Section - Admin Only */}
                              {isAdmin && (
                                  <div className="pt-4 mt-4 border-t border-slate-100 bg-slate-50 -mx-6 px-6 -mb-6 pb-6">
                                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><CreditCard size={14}/> Pagamento</h4>
                                      {os.status === OSStatus.PAID ? (
                                          <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center text-sm font-medium border border-green-200">
                                              Pagamento Confirmado
                                          </div>
                                      ) : (
                                          <button 
                                            disabled={!editMode}
                                            onClick={() => changeStatus(OSStatus.PAID)}
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
          </div>
      )
  }

  const ChatView = () => {
      const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
          {role: 'model', text: 'Olá! Sou o especialista técnico da OSMech. Posso ajudar com diagnósticos, consultar códigos de erro ou sugerir preços de peças.'}
      ]);
      const [input, setInput] = useState('');
      const [loading, setLoading] = useState(false);

      const send = async () => {
          if(!input.trim()) return;
          const userMsg = input;
          setInput('');
          setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
          setLoading(true);

          const response = await getShopAssistantChat(messages, userMsg);
          
          setMessages(prev => [...prev, {role: 'model', text: response}]);
          setLoading(false);
      };

      return (
          <div className="h-[calc(100vh-10rem)] flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden animate-fade-in shadow-sm">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                  {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                              {m.role === 'model' ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
                          </div>
                      </div>
                  ))}
                  {loading && (
                      <div className="flex justify-start">
                          <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                      </div>
                  )}
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                  <input 
                      type="text" 
                      className="flex-1 border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="Digite sua dúvida técnica..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && send()}
                  />
                  <button onClick={send} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg transition-colors disabled:opacity-50">
                      <ArrowRight />
                  </button>
              </div>
          </div>
      )
  }

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