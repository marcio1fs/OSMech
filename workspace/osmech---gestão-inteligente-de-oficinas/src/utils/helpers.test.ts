import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCPF, formatCNPJ, formatPhone, formatPlate, validateCPF, validateCNPJ } from './helpers';

describe('Helper Functions', () => {
  describe('formatCurrency', () => {
    it('should format number to BRL currency', () => {
      expect(formatCurrency(1234.56)).toBe('R$\u00a01.234,56');
      expect(formatCurrency(0)).toBe('R$\u00a00,00');
      expect(formatCurrency(1000000)).toBe('R$\u00a01.000.000,00');
    });
  });

  describe('formatCPF', () => {
    it('should format CPF correctly', () => {
      expect(formatCPF('12345678900')).toBe('123.456.789-00');
      expect(formatCPF('123')).toBe('123');
      expect(formatCPF('123456')).toBe('123.456');
    });

    it('should remove non-numeric characters', () => {
      expect(formatCPF('123.456.789-00')).toBe('123.456.789-00');
      expect(formatCPF('abc123def456')).toBe('123.456');
    });
  });

  describe('formatCNPJ', () => {
    it('should format CNPJ correctly', () => {
      expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99');
    });
  });

  describe('formatPhone', () => {
    it('should format phone correctly', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
      expect(formatPhone('1199999')).toBe('(11) 9-9999');
    });
  });

  describe('formatPlate', () => {
    it('should format plate in uppercase and remove special chars', () => {
      expect(formatPlate('abc1234')).toBe('ABC1234');
      expect(formatPlate('abc-1d23')).toBe('ABC1D23');
      expect(formatPlate('ABC1D234567')).toBe('ABC1D23');
    });
  });

  describe('validateCPF', () => {
    it('should validate correct CPFs', () => {
      expect(validateCPF('529.982.247-25')).toBe(true);
      expect(validateCPF('52998224725')).toBe(true);
    });

    it('should reject invalid CPFs', () => {
      expect(validateCPF('000.000.000-00')).toBe(false);
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('123.456.789-00')).toBe(false);
      expect(validateCPF('12345')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('should validate correct CNPJs', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validateCNPJ('11222333000181')).toBe(true);
    });

    it('should reject invalid CNPJs', () => {
      expect(validateCNPJ('00.000.000/0000-00')).toBe(false);
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('12345')).toBe(false);
    });
  });
});
