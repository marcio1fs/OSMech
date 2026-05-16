package com.osmech.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes unitários para validação de CPF e CNPJ
 */
class DocumentoValidatorTest {

    @Test
    void deveValidarCPFValido() {
        // CPFs válidos conhecidos
        assertTrue(DocumentoValidator.isValidCPF("12345678909"));
        assertTrue(DocumentoValidator.isValidCPF("11144477735"));
        assertTrue(DocumentoValidator.isValidCPF("22233344405"));
    }

    @Test
    void deveRejeitarCPFInvalido() {
        // CPFs inválidos
        assertFalse(DocumentoValidator.isValidCPF("12345678900"));
        assertFalse(DocumentoValidator.isValidCPF("11111111111"));
        assertFalse(DocumentoValidator.isValidCPF("22222222222"));
        assertFalse(DocumentoValidator.isValidCPF("123456789"));
    }

    @Test
    void deveRejeitarCPFComTodosDigitosIguais() {
        // CPFs com todos dígitos iguais são inválidos
        assertFalse(DocumentoValidator.isValidCPF("00000000000"));
        assertFalse(DocumentoValidator.isValidCPF("11111111111"));
        assertFalse(DocumentoValidator.isValidCPF("22222222222"));
        assertFalse(DocumentoValidator.isValidCPF("33333333333"));
        assertFalse(DocumentoValidator.isValidCPF("44444444444"));
        assertFalse(DocumentoValidator.isValidCPF("55555555555"));
        assertFalse(DocumentoValidator.isValidCPF("66666666666"));
        assertFalse(DocumentoValidator.isValidCPF("77777777777"));
        assertFalse(DocumentoValidator.isValidCPF("88888888888"));
        assertFalse(DocumentoValidator.isValidCPF("99999999999"));
    }

    @Test
    void deveValidarCPFFormatado() {
        assertTrue(DocumentoValidator.isValidCPF("123.456.789-09"));
        assertTrue(DocumentoValidator.isValidCPF("111.444.777-35"));
    }

    @Test
    void deveValidarCNPJValido() {
        // CNPJs válidos conhecidos
        assertTrue(DocumentoValidator.isValidCNPJ("12345678000195"));
        assertTrue(DocumentoValidator.isValidCNPJ("11222333000144"));
        assertTrue(DocumentoValidator.isValidCNPJ("98765432000110"));
    }

    @Test
    void deveRejeitarCNPJInvalido() {
        // CNPJs inválidos
        assertFalse(DocumentoValidator.isValidCNPJ("12345678000190"));
        assertFalse(DocumentoValidator.isValidCNPJ("11111111111111"));
        assertFalse(DocumentoValidator.isValidCNPJ("123456789"));
    }

    @Test
    void deveRejeitarCNPJComTodosDigitosIguais() {
        // CNPJs com todos dígitos iguais são inválidos
        assertFalse(DocumentoValidator.isValidCNPJ("00000000000000"));
        assertFalse(DocumentoValidator.isValidCNPJ("11111111111111"));
        assertFalse(DocumentoValidator.isValidCNPJ("22222222222222"));
        assertFalse(DocumentoValidator.isValidCNPJ("33333333333333"));
        assertFalse(DocumentoValidator.isValidCNPJ("44444444444444"));
        assertFalse(DocumentoValidator.isValidCNPJ("55555555555555"));
        assertFalse(DocumentoValidator.isValidCNPJ("66666666666666"));
        assertFalse(DocumentoValidator.isValidCNPJ("77777777777777"));
        assertFalse(DocumentoValidator.isValidCNPJ("88888888888888"));
        assertFalse(DocumentoValidator.isValidCNPJ("99999999999999"));
    }

    @Test
    void deveValidarCNPJFormatado() {
        assertTrue(DocumentoValidator.isValidCNPJ("12.345.678/0001-95"));
        assertTrue(DocumentoValidator.isValidCNPJ("11.222.333/0001-44"));
    }

    @Test
    void deveLidarComNuloOuVazio() {
        assertFalse(DocumentoValidator.isValidCPF(null));
        assertFalse(DocumentoValidator.isValidCPF(""));
        assertFalse(DocumentoValidator.isValidCNPJ(null));
        assertFalse(DocumentoValidator.isValidCNPJ(""));
    }

    @Test
    void deveFormatarCPF() {
        String cpfFormatado = DocumentoValidator.formatCPF("12345678909");
        assertEquals("123.456.789-09", cpfFormatado);
    }

    @Test
    void deveFormatarCNPJ() {
        String cnpjFormatado = DocumentoValidator.formatCNPJ("12345678000195");
        assertEquals("12.345.678/0001-95", cnpjFormatado);
    }

    @Test
    void deveRetornarNuloAoFormatarDocumentoInvalido() {
        assertNull(DocumentoValidator.formatCPF("123"));
        assertNull(DocumentoValidator.formatCNPJ("123"));
    }

    @Test
    void deveValidarDocumentoGenerico() {
        // CPF válido
        assertTrue(DocumentoValidator.isValidDocumento("12345678909"));
        assertTrue(DocumentoValidator.isValidDocumento("123.456.789-09"));
        
        // CNPJ válido
        assertTrue(DocumentoValidator.isValidDocumento("12345678000195"));
        assertTrue(DocumentoValidator.isValidDocumento("12.345.678/0001-95"));
        
        // Inválido
        assertFalse(DocumentoValidator.isValidDocumento("123456789"));
        assertFalse(DocumentoValidator.isValidDocumento("documento-invalido"));
    }
}
