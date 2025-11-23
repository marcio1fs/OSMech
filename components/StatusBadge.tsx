import React from 'react';
import { OSStatus } from '../types';

const statusColors: Record<OSStatus, string> = {
  [OSStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [OSStatus.DIAGNOSING]: 'bg-purple-100 text-purple-800 border-purple-200',
  [OSStatus.APPROVAL]: 'bg-orange-100 text-orange-800 border-orange-200',
  [OSStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OSStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [OSStatus.PAID]: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const StatusBadge: React.FC<{ status: OSStatus }> = ({ status }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status] || 'bg-gray-100'}`}>
      {status}
    </span>
  );
};