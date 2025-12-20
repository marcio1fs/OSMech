import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  showProgress?: boolean;
}

interface ToastConfig {
  position?: ToastPosition;
  defaultDuration?: number;
  maxToasts?: number;
  soundEnabled?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  config: ToastConfig;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  updateConfig: (newConfig: Partial<ToastConfig>) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="text-green-500" size={20} />,
  error: <XCircle className="text-red-500" size={20} />,
  warning: <AlertTriangle className="text-yellow-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
};

const toastStyles: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 shadow-green-100',
  error: 'border-red-200 bg-red-50 shadow-red-100',
  warning: 'border-yellow-200 bg-yellow-50 shadow-yellow-100',
  info: 'border-blue-200 bg-blue-50 shadow-blue-100',
};

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const ToastItem: React.FC<{ 
  toast: Toast; 
  onRemove: () => void;
  showProgress?: boolean;
}> = ({ toast, onRemove, showProgress = true }) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(onRemove, duration);
    
    // Animação de progresso
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 50));
          return newProgress > 0 ? newProgress : 0;
        });
      }, 50);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }

    return () => clearTimeout(timer);
  }, [duration, onRemove, showProgress]);

  return (
    <div 
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border shadow-lg 
        ${toastStyles[toast.type]} 
        animate-slide-in-right hover:scale-105 transition-all
        min-w-[320px] max-w-[420px]
      `}
      role="alert"
    >
      {/* Barra de progresso */}
      {showProgress && toast.showProgress !== false && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-slate-400/30 rounded-b-lg transition-all"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Ícone */}
      <div className="flex-shrink-0 mt-0.5">
        {toastIcons[toast.type]}
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-800 text-sm">{toast.title}</p>
        {toast.message && <p className="text-xs text-slate-600 mt-1">{toast.message}</p>}
      </div>
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-600">
        <X size={18} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ 
  children: React.ReactNode;
  defaultConfig?: ToastConfig;
}> = ({ children, defaultConfig }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [config, setConfig] = useState<ToastConfig>({
    position: 'top-right',
    defaultDuration: 5000,
    maxToasts: 5,
    soundEnabled: false,
    ...defaultConfig,
  });

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts(prev => {
      const newToasts = [{ ...toast, id }, ...prev];
      // Limitar número máximo de toasts
      return newToasts.slice(0, config.maxToasts || 5);
    });

    return id;
  }, [config.maxToasts]);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = React.useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ 
      type: 'success', 
      title, 
      message,
      duration: duration || config.defaultDuration,
    });
  }, [addToast, config.defaultDuration]);

  const error = React.useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ 
      type: 'error', 
      title, 
      message,
      duration: duration || config.defaultDuration || 7000, // Erros ficam mais tempo
    });
  }, [addToast, config.defaultDuration]);

  const warning = React.useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ 
      type: 'warning', 
      title, 
      message,
      duration: duration || config.defaultDuration,
    });
  }, [addToast, config.defaultDuration]);

  const info = React.useCallback((title: string, message?: string, duration?: number) => {
    return addToast({ 
      type: 'info', 
      title, 
      message,
      duration: duration || config.defaultDuration,
    });
  }, [addToast, config.defaultDuration]);

  const updateConfig = React.useCallback((newConfig: Partial<ToastConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <ToastContext.Provider 
      value={{ 
        toasts, 
        config,
        addToast, 
        removeToast, 
        success, 
        error, 
        warning, 
        info,
        updateConfig,
      }}
    >
      {children}
      
      {/* Container de toasts */}
      <div 
        className={`fixed z-[100] space-y-2 ${positionStyles[config.position || 'top-right']}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onRemove={() => removeToast(toast.id)}
            showProgress={toast.showProgress}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
