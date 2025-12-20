import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

export const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all relative
        ${isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
      `}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`
          absolute right-3 px-2 py-0.5 text-xs font-bold rounded-full
          ${isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}
        `}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

export default NavItem;
