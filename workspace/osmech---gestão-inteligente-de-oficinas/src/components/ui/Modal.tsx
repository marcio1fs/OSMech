import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  headerClassName?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleIcon,
  children,
  size = 'md',
  showCloseButton = true,
  headerClassName = 'bg-slate-50',
}) => {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-xl shadow-xl w-full ${sizeStyles[size]} overflow-hidden animate-scale-in`}>
        <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${headerClassName}`}>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {titleIcon}
            {title}
          </h3>
          {showCloseButton && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded transition-colors"
            >
              <X size={20}/>
            </button>
          )}
        </div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
