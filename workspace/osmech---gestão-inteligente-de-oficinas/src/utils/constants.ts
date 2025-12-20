import { ExpenseCategoryLabel } from '../types';

export const COMMON_MANUFACTURERS = [
  "FIAT", "VOLKSWAGEN", "CHEVROLET", "FORD", "TOYOTA",
  "HYUNDAI", "HONDA", "RENAULT", "JEEP", "NISSAN", 
  "PEUGEOT", "CITROEN", "MITSUBISHI", "BMW", "MERCEDES-BENZ", 
  "KIA", "AUDI", "VOLVO"
];

export const EXPENSE_CATEGORIES: ExpenseCategoryLabel = {
  FIXED: 'Custos Fixos (Aluguel/Luz)',
  VARIABLE: 'Custos Variáveis',
  PAYROLL: 'Folha de Pagamento',
  PARTS: 'Compra de Peças',
  TAXES: 'Impostos e Taxas'
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
