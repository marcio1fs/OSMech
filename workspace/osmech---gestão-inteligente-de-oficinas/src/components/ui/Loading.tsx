import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 40,
};

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = 'Carregando...', 
  fullScreen = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader size={sizeMap[size]} className="animate-spin text-blue-600" />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton Loader
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

// Card Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
    <Skeleton className="h-4 w-1/3 mb-4" />
    <Skeleton className="h-8 w-2/3 mb-2" />
    <Skeleton className="h-4 w-full" />
  </div>
);

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full" />
    ))}
  </div>
);

export default Loading;
