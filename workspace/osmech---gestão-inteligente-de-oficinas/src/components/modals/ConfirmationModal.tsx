import React from 'react';
import { AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const iconMap = {
  danger: <Trash2 className="text-red-500" size={24} />,
  warning: <AlertTriangle className="text-yellow-500" size={24} />,
  success: <CheckCircle className="text-green-500" size={24} />,
  info: <AlertTriangle className="text-blue-500" size={24} />,
};

const buttonVariantMap = {
  danger: 'danger' as const,
  warning: 'primary' as const,
  success: 'success' as const,
  info: 'primary' as const,
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Ação',
  message,
  type = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} titleIcon={iconMap[type]} size="sm">
      <div className="p-6">
        <p className="text-slate-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            <X size={18} />
            {cancelText}
          </Button>
          <Button 
            variant={buttonVariantMap[type]} 
            onClick={onConfirm} 
            isLoading={isLoading}
            leftIcon={iconMap[type]}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
