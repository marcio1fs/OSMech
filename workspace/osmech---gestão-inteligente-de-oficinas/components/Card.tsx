import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = "", action }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden backdrop-blur-sm hover:shadow-xl transition-all duration-300 ${className}`}>
      {(title || action) && (
        <div className="px-6 py-5 border-b border-slate-100/80 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          {title && <h3 className="font-bold text-slate-800 text-lg tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/60 flex items-center space-x-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
    <div className={`p-4 rounded-xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h4>
    </div>
  </div>
);