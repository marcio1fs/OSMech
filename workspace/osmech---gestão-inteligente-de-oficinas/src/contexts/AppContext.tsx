import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ServiceOrder, User, Expense, InventoryItem, AuditLogEntry, CompanySettings } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { INITIAL_USERS, INITIAL_DATA, INITIAL_EXPENSES, INITIAL_INVENTORY, INITIAL_LOGS } from '../data/initialData';

interface AppState {
  companySettings: CompanySettings | null;
  users: User[];
  orders: ServiceOrder[];
  expenses: Expense[];
  inventory: InventoryItem[];
  logs: AuditLogEntry[];
}

interface AppContextType extends AppState {
  setCompanySettings: (settings: CompanySettings) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addLog: (action: AuditLogEntry['action'], details: string, userId: string, userName: string, targetId?: string) => void;
  deductStock: (itemId: string, qty: number) => void;
  returnStock: (itemId: string, qty: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [companySettings, setCompanySettings] = usePersistentState<CompanySettings | null>('osmech_company', null);
  const [users, setUsers] = usePersistentState<User[]>('osmech_users', INITIAL_USERS);
  const [orders, setOrders] = usePersistentState<ServiceOrder[]>('osmech_orders', INITIAL_DATA);
  const [expenses, setExpenses] = usePersistentState<Expense[]>('osmech_expenses', INITIAL_EXPENSES);
  const [inventory, setInventory] = usePersistentState<InventoryItem[]>('osmech_inventory', INITIAL_INVENTORY);
  const [logs, setLogs] = usePersistentState<AuditLogEntry[]>('osmech_logs', INITIAL_LOGS);

  const addLog = useCallback((
    action: AuditLogEntry['action'], 
    details: string, 
    userId: string, 
    userName: string, 
    targetId?: string
  ) => {
    const newLog: AuditLogEntry = {
      id: Date.now().toString(),
      action,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      details,
      targetId
    };
    setLogs(prev => [newLog, ...prev]);
  }, [setLogs]);

  const deductStock = useCallback((itemId: string, qty: number) => {
    setInventory(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, stockQuantity: i.stockQuantity - qty };
      }
      return i;
    }));
  }, [setInventory]);

  const returnStock = useCallback((itemId: string, qty: number) => {
    setInventory(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, stockQuantity: i.stockQuantity + qty };
      }
      return i;
    }));
  }, [setInventory]);

  const value: AppContextType = {
    companySettings,
    users,
    orders,
    expenses,
    inventory,
    logs,
    setCompanySettings,
    setUsers,
    setOrders,
    setExpenses,
    setInventory,
    addLog,
    deductStock,
    returnStock,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
