import React, { useMemo } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Trash2, 
  Check,
  Wrench,
  DollarSign,
  Package,
  User,
  Settings,
  ExternalLink,
  Clock
} from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '../contexts/NotificationContext';
import { formatDistanceToNow } from '../utils/helpers';

const typeIcons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="text-green-500" size={20} />,
  error: <XCircle className="text-red-500" size={20} />,
  warning: <AlertTriangle className="text-yellow-500" size={20} />,
  info: <Info className="text-blue-500" size={20} />,
  system: <Settings className="text-slate-500" size={20} />,
};

const categoryIcons: Record<string, React.ReactNode> = {
  order: <Wrench className="text-blue-600" size={18} />,
  payment: <DollarSign className="text-green-600" size={18} />,
  inventory: <Package className="text-orange-600" size={18} />,
  customer: <User className="text-purple-600" size={18} />,
  system: <Settings className="text-slate-600" size={18} />,
};

const priorityColors: Record<string, string> = {
  low: 'border-l-slate-300',
  normal: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onRemove: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onRemove }) => {
  const { type, priority, title, message, category, read, createdAt, actionUrl, actionLabel, icon } = notification;

  return (
    <div 
      className={`
        p-4 border-l-4 ${priorityColors[priority]} 
        bg-white hover:bg-slate-50 transition-colors
        ${!read ? 'bg-blue-50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Ícone do tipo */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || typeIcons[type]}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {category && categoryIcons[category]}
              <h4 className={`text-sm font-semibold ${!read ? 'text-slate-900' : 'text-slate-700'}`}>
                {title}
              </h4>
            </div>
            <span className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
              <Clock size={12} />
              {formatDistanceToNow(new Date(createdAt))}
            </span>
          </div>

          {message && (
            <p className="text-sm text-slate-600 mt-1 break-words">
              {message}
            </p>
          )}

          {/* Ações */}
          <div className="flex items-center gap-2 mt-2">
            {actionUrl && (
              <button
                onClick={() => {
                  onMarkAsRead();
                  window.location.href = actionUrl;
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                {actionLabel || 'Ver detalhes'}
                <ExternalLink size={12} />
              </button>
            )}
            
            {!read && (
              <button
                onClick={onMarkAsRead}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                <Check size={12} />
                Marcar como lida
              </button>
            )}
          </div>
        </div>

        {/* Botão remover */}
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-slate-400 hover:text-red-600 transition-colors"
          title="Remover notificação"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    showCenter, 
    toggleCenter, 
    markAsRead, 
    markAllAsRead,
    removeNotification,
    clearAll 
  } = useNotifications();

  // Filtrar apenas notificações persistentes
  const persistentNotifications = useMemo(() => {
    return notifications.filter(n => n.persistent);
  }, [notifications]);

  const unreadNotifications = useMemo(() => {
    return persistentNotifications.filter(n => !n.read);
  }, [persistentNotifications]);

  if (!showCenter) {
    return (
      <button
        onClick={toggleCenter}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        title="Central de Notificações"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      {/* Botão do sino com contador */}
      <button
        onClick={toggleCenter}
        className="relative p-2 bg-blue-100 rounded-lg transition-colors"
        title="Fechar Central de Notificações"
      >
        <Bell size={20} className="text-blue-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel deslizante */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell size={24} />
              <h2 className="text-lg font-bold">Notificações</h2>
            </div>
            <button
              onClick={toggleCenter}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {unreadCount > 0 && (
            <p className="text-sm text-blue-100">
              {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
            </p>
          )}
        </div>

        {/* Ações rápidas */}
        {persistentNotifications.length > 0 && (
          <div className="p-3 bg-slate-50 border-b flex gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Check size={14} />
              Marcar todas como lidas
            </button>
            <button
              onClick={clearAll}
              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 size={14} />
              Limpar tudo
            </button>
          </div>
        )}

        {/* Lista de notificações */}
        <div className="flex-1 overflow-y-auto">
          {persistentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
              <Bell size={48} className="mb-3" />
              <p className="text-center">Nenhuma notificação</p>
              <p className="text-xs text-center mt-1">
                Você está em dia!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Não lidas primeiro */}
              {unreadNotifications.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-blue-50 text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    Não lidas ({unreadNotifications.length})
                  </div>
                  {unreadNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => markAsRead(notification.id)}
                      onRemove={() => removeNotification(notification.id)}
                    />
                  ))}
                </>
              )}

              {/* Lidas */}
              {persistentNotifications.filter(n => n.read).length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Anteriores
                  </div>
                  {persistentNotifications
                    .filter(n => n.read)
                    .map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead(notification.id)}
                        onRemove={() => removeNotification(notification.id)}
                      />
                    ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={toggleCenter}
      />
    </>
  );
};

export default NotificationCenter;
