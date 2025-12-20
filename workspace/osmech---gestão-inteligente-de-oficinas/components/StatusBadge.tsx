import React from 'react';
import { OSStatus } from '../types';

const statusColors: Record<OSStatus, string> = {
  [OSStatus.PENDING]: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/30',
  [OSStatus.DIAGNOSING]: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg shadow-purple-500/30',
  [OSStatus.APPROVAL]: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30',
  [OSStatus.WAITING_PARTS]: 'bg-gradient-to-r from-red-400 to-red-500 text-white shadow-lg shadow-red-500/30',
  [OSStatus.IN_PROGRESS]: 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-500/30',
  [OSStatus.COMPLETED]: 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg shadow-green-500/30',
  [OSStatus.PAID]: 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/30',
};

export const StatusBadge: React.FC<{ status: OSStatus }> = ({ status }) => {
  return (
    <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[status] || 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'} hover:scale-105 transition-transform duration-200`}>
      {status}
    </span>
  );
};