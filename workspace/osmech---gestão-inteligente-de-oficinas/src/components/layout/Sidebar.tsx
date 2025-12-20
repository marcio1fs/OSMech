import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  DollarSign, 
  Users, 
  Settings, 
  Bot,
  LogOut,
  Wrench,
  Package,
} from 'lucide-react';
import NavItem from './NavItem';

export type ViewType = 
  | 'dashboard' 
  | 'os-list' 
  | 'new-os' 
  | 'finance' 
  | 'inventory'
  | 'team' 
  | 'settings' 
  | 'ai-chat';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  userName?: string;
  companyName?: string;
  pendingOSCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onLogout,
  userName = 'Usuário',
  companyName = 'Minha Oficina',
  pendingOSCount = 0,
  lowStockCount = 0,
}) => {
  const menuItems = [
    { view: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Dashboard' },
    { view: 'os-list' as ViewType, icon: FileText, label: 'Ordens de Serviço', badge: pendingOSCount },
    { view: 'new-os' as ViewType, icon: PlusCircle, label: 'Nova OS' },
    { view: 'finance' as ViewType, icon: DollarSign, label: 'Financeiro' },
    { view: 'inventory' as ViewType, icon: Package, label: 'Estoque', badge: lowStockCount },
    { view: 'team' as ViewType, icon: Users, label: 'Equipe' },
    { view: 'settings' as ViewType, icon: Settings, label: 'Configurações' },
    { view: 'ai-chat' as ViewType, icon: Bot, label: 'Assistente IA' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
            <Wrench size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">OSMech</h1>
            <p className="text-xs text-slate-400">{companyName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavItem
            key={item.view}
            icon={item.icon}
            label={item.label}
            isActive={currentView === item.view}
            onClick={() => onViewChange(item.view)}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">
              {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{companyName}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
