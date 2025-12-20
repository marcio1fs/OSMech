import { z } from 'zod';

// Validação de CPF
const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(cpf.charAt(10));
};

// Validação de CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

// Validação de placa brasileira (antiga e Mercosul)
const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

// ============ Schemas ============

// Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Company Settings (Setup)
export const companySettingsSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome da empresa é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .refine((val) => validateCNPJ(val), 'CNPJ inválido'),
  address: z
    .string()
    .min(1, 'Endereço é obrigatório')
    .min(10, 'Endereço deve ter no mínimo 10 caracteres'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .min(14, 'Telefone inválido'),
  email: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  subtitle: z.string().optional(),
});

// User
export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  phone: z
    .string()
    .optional(),
  role: z.enum(['ADMIN', 'MECHANIC']),
  specialty: z.string().optional(),
  commissionRate: z
    .number()
    .min(0, 'Comissão não pode ser negativa')
    .max(100, 'Comissão não pode ser maior que 100%')
    .optional(),
  active: z.boolean().default(true),
});

export const createUserSchema = userSchema.extend({
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Service Order
export const serviceOrderSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Nome do cliente é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres'),
  customerCpf: z
    .string()
    .optional()
    .refine((val) => !val || validateCPF(val), 'CPF inválido'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .min(14, 'Telefone inválido'),
  vehicleManufacturer: z
    .string()
    .min(1, 'Fabricante é obrigatório'),
  vehicleModel: z
    .string()
    .min(1, 'Modelo é obrigatório'),
  vehicleYear: z
    .number()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 1, 'Ano inválido')
    .optional(),
  vehicleColor: z.string().optional(),
  plate: z
    .string()
    .min(1, 'Placa é obrigatória')
    .length(7, 'Placa deve ter 7 caracteres')
    .refine((val) => plateRegex.test(val), 'Placa inválida'),
  currentMileage: z
    .number()
    .min(0, 'Quilometragem não pode ser negativa')
    .optional(),
  complaint: z
    .string()
    .min(1, 'Reclamação é obrigatória')
    .min(10, 'Descreva melhor o problema'),
  acceptsNotifications: z.boolean().default(true),
});

// Service Item
export const serviceItemSchema = z.object({
  code: z.string().optional(),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória'),
  type: z.enum(['PART', 'LABOR']),
  quantity: z
    .number()
    .min(1, 'Quantidade deve ser no mínimo 1'),
  unitPrice: z
    .number()
    .min(0, 'Preço não pode ser negativo'),
  inventoryItemId: z.string().optional(),
  mechanicId: z.string().optional(),
});

// Expense
export const expenseSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória'),
  amount: z
    .number()
    .min(0.01, 'Valor deve ser maior que zero'),
  category: z.enum(['FIXED', 'VARIABLE', 'PAYROLL', 'PARTS', 'TAXES']),
  date: z.string().min(1, 'Data é obrigatória'),
  dueDate: z.string().optional(),
  status: z.enum(['PAID', 'PENDING']).default('PENDING'),
});

// Inventory Item
export const inventoryItemSchema = z.object({
  code: z
    .string()
    .min(1, 'Código é obrigatório'),
  name: z
    .string()
    .min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z
    .string()
    .min(1, 'Categoria é obrigatória'),
  costPrice: z
    .number()
    .min(0, 'Preço de custo não pode ser negativo'),
  sellPrice: z
    .number()
    .min(0, 'Preço de venda não pode ser negativo'),
  stockQuantity: z
    .number()
    .min(0, 'Estoque não pode ser negativo'),
  minStockLevel: z
    .number()
    .min(0, 'Estoque mínimo não pode ser negativo'),
});

// Payment
export const paymentSchema = z.object({
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'PIX']),
  amount: z
    .number()
    .min(0.01, 'Valor deve ser maior que zero'),
  notes: z.string().optional(),
});

// Types derivados dos schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ServiceOrderInput = z.infer<typeof serviceOrderSchema>;
export type ServiceItemInput = z.infer<typeof serviceItemSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type PaymentInputZod = z.infer<typeof paymentSchema>;
