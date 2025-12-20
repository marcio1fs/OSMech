import { describe, it, expect } from 'vitest';
import { 
  loginSchema, 
  companySettingsSchema, 
  serviceOrderSchema,
  expenseSchema 
} from '../schemas/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty fields', () => {
      const invalidData = {
        email: '',
        password: '',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('companySettingsSchema', () => {
    it('should validate correct company settings', () => {
      const validData = {
        name: 'Auto Center Silva',
        cnpj: '11.222.333/0001-81',
        address: 'Rua das Flores, 123 - Centro',
        phone: '(11) 99999-9999',
        email: 'contato@autocenter.com',
      };
      expect(() => companySettingsSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid CNPJ', () => {
      const invalidData = {
        name: 'Auto Center Silva',
        cnpj: '00.000.000/0000-00',
        address: 'Rua das Flores, 123 - Centro',
        phone: '(11) 99999-9999',
      };
      const result = companySettingsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('serviceOrderSchema', () => {
    it('should validate correct service order', () => {
      const validData = {
        customerName: 'João da Silva',
        phone: '(11) 99999-9999',
        vehicleManufacturer: 'FIAT',
        vehicleModel: 'Uno 1.0',
        plate: 'ABC1D23',
        complaint: 'Motor fazendo barulho estranho ao acelerar',
        acceptsNotifications: true,
      };
      expect(() => serviceOrderSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid plate format', () => {
      const invalidData = {
        customerName: 'João da Silva',
        phone: '(11) 99999-9999',
        vehicleManufacturer: 'FIAT',
        vehicleModel: 'Uno 1.0',
        plate: 'INVALID',
        complaint: 'Motor fazendo barulho estranho ao acelerar',
        acceptsNotifications: true,
      };
      const result = serviceOrderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid Brazilian plates', () => {
      // Placa antiga
      const oldPlate = {
        customerName: 'João da Silva',
        phone: '(11) 99999-9999',
        vehicleManufacturer: 'FIAT',
        vehicleModel: 'Uno 1.0',
        plate: 'ABC1234',
        complaint: 'Motor fazendo barulho estranho ao acelerar',
        acceptsNotifications: true,
      };
      expect(() => serviceOrderSchema.parse(oldPlate)).not.toThrow();

      // Placa Mercosul
      const mercosulPlate = {
        ...oldPlate,
        plate: 'ABC1D23',
      };
      expect(() => serviceOrderSchema.parse(mercosulPlate)).not.toThrow();
    });
  });

  describe('expenseSchema', () => {
    it('should validate correct expense', () => {
      const validData = {
        description: 'Aluguel do galpão',
        amount: 2500.00,
        category: 'FIXED',
        date: '2024-01-15',
        status: 'PENDING',
      };
      expect(() => expenseSchema.parse(validData)).not.toThrow();
    });

    it('should reject negative amount', () => {
      const invalidData = {
        description: 'Aluguel do galpão',
        amount: -100,
        category: 'FIXED',
        date: '2024-01-15',
      };
      const result = expenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category', () => {
      const invalidData = {
        description: 'Aluguel do galpão',
        amount: 2500,
        category: 'INVALID_CATEGORY',
        date: '2024-01-15',
      };
      const result = expenseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
