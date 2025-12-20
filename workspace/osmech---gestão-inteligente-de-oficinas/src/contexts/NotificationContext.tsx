import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Bell } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  category?: 'order' | 'payment' | 'system' | 'customer' | 'inventory';
  relatedId?: string; // ID da OS, pagamento, etc.
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  read: boolean;
  persistent: boolean; // Se deve aparecer no centro de notificações
  sound?: boolean;
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showCenter: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleCenter: () => void;
  // Helpers rápidos
  notifyOrderStatus: (orderNumber: string, status: string, message?: string) => void;
  notifyPayment: (orderNumber: string, amount: number, method: string) => void;
  notifyError: (title: string, message?: string, persistent?: boolean) => void;
  notifySuccess: (title: string, message?: string, persistent?: boolean) => void;
  notifyWarning: (title: string, message?: string, persistent?: boolean) => void;
  notifyInfo: (title: string, message?: string, persistent?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Sons de notificação (usando Web Audio API)
const playNotificationSound = (type: NotificationType) => {
  if (!('AudioContext' in window)) return;
  
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Frequências diferentes por tipo
    const frequencies: Record<NotificationType, number> = {
      success: 800,
      error: 400,
      warning: 600,
      info: 700,
      system: 750,
    };
    
    oscillator.frequency.value = frequencies[type];
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.warn('Não foi possível reproduzir som de notificação:', error);
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Carregar notificações persistentes do localStorage
    try {
      const stored = localStorage.getItem('osmech_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [showCenter, setShowCenter] = useState(false);

  // Salvar notificações persistentes no localStorage
  useEffect(() => {
    const persistent = notifications.filter(n => n.persistent);
    localStorage.setItem('osmech_notifications', JSON.stringify(persistent));
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read && n.persistent).length;
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Tocar som se configurado
    if (notification.sound !== false) {
      playNotificationSound(notification.type);
    }

    // Auto-remover notificações não persistentes após 5 segundos
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }

    return id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleCenter = useCallback(() => {
    setShowCenter(prev => !prev);
  }, []);

  // Helpers específicos
  const notifyOrderStatus = useCallback((orderNumber: string, status: string, message?: string) => {
    const statusMessages: Record<string, { type: NotificationType; title: string }> = {
      DIAGNOSING: { type: 'info', title: 'Diagnóstico Iniciado' },
      APPROVAL: { type: 'warning', title: 'Aguardando Aprovação' },
      WAITING_PARTS: { type: 'info', title: 'Aguardando Peças' },
      IN_PROGRESS: { type: 'info', title: 'Em Andamento' },
      COMPLETED: { type: 'success', title: 'Serviço Concluído' },
      PAID: { type: 'success', title: 'Pagamento Recebido' },
    };

    const config = statusMessages[status] || { type: 'info', title: 'Status Atualizado' };

    addNotification({
      type: config.type,
      priority: 'normal',
      title: config.title,
      message: message || `OS ${orderNumber} - ${status}`,
      category: 'order',
      relatedId: orderNumber,
      persistent: true,
      actionUrl: `/orders/${orderNumber}`,
      actionLabel: 'Ver OS',
    });
  }, [addNotification]);

  const notifyPayment = useCallback((orderNumber: string, amount: number, method: string) => {
    addNotification({
      type: 'success',
      priority: 'high',
      title: '💰 Pagamento Recebido',
      message: `OS ${orderNumber} - R$ ${amount.toFixed(2)} via ${method}`,
      category: 'payment',
      relatedId: orderNumber,
      persistent: true,
      sound: true,
      actionUrl: `/orders/${orderNumber}`,
      actionLabel: 'Ver Recibo',
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message?: string, persistent = false) => {
    addNotification({
      type: 'error',
      priority: 'high',
      title,
      message: message || '',
      persistent,
      sound: true,
    });
  }, [addNotification]);

  const notifySuccess = useCallback((title: string, message?: string, persistent = false) => {
    addNotification({
      type: 'success',
      priority: 'normal',
      title,
      message: message || '',
      persistent,
      sound: false,
    });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message?: string, persistent = false) => {
    addNotification({
      type: 'warning',
      priority: 'normal',
      title,
      message: message || '',
      persistent,
      sound: true,
    });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message?: string, persistent = false) => {
    addNotification({
      type: 'info',
      priority: 'low',
      title,
      message: message || '',
      persistent,
      sound: false,
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showCenter,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        toggleCenter,
        notifyOrderStatus,
        notifyPayment,
        notifyError,
        notifySuccess,
        notifyWarning,
        notifyInfo,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
