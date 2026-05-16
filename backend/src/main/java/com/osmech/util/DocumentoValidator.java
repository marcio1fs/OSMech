package com.osmech.util;

import java.util.regex.Pattern;

/**
 * Utilitário para validação de CPF e CNPJ.
 * Implementa algoritmos oficiais de validação.
 */
public class DocumentoValidator {

    private static final Pattern CPF_PATTERN = Pattern.compile("\\d{11}");
    private static final Pattern CNPJ_PATTERN = Pattern.compile("\\d{14}");

    /**
     * Valida CPF (Cadastro de Pessoa Física).
     * Aceita string com ou sem pontos/traço.
     * 
     * @param cpf CPF a ser validado
     * @return true se CPF válido
     */
    public static boolean isValidCPF(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return false;
        }

        // Remove caracteres não numéricos
        String numeros = cpf.replaceAll("\\D", "");

        // Verifica tamanho e padrões conhecidos de inválidos
        if (numeros.length() != 11 || !CPF_PATTERN.matcher(numeros).matches()) {
            return false;
        }

        // Verifica sequências repetidas (ex: 111.111.111-11)
        if (numeros.matches("(\\d)\\1{10}")) {
            return false;
        }

        // Validação dos dígitos verificadores
        return calcularDigitoVerificadorCPF(numeros.substring(0, 9)) == numeros.charAt(9) - '0'
                && calcularDigitoVerificadorCPF(numeros.substring(0, 10)) == numeros.charAt(10) - '0';
    }

    /**
     * Valida CNPJ (Cadastro Nacional da Pessoa Jurídica).
     * Aceita string com ou sem pontos/traço.
     * 
     * @param cnpj CNPJ a ser validado
     * @return true se CNPJ válido
     */
    public static boolean isValidCNPJ(String cnpj) {
        if (cnpj == null || cnpj.isBlank()) {
            return false;
        }

        // Remove caracteres não numéricos
        String numeros = cnpj.replaceAll("\\D", "");

        // Verifica tamanho e padrões conhecidos de inválidos
        if (numeros.length() != 14 || !CNPJ_PATTERN.matcher(numeros).matches()) {
            return false;
        }

        // Verifica sequências repetidas (ex: 11.111.111/1111-11)
        if (numeros.matches("(\\d)\\1{13}")) {
            return false;
        }

        // Validação dos dígitos verificadores
        return calcularDigitoVerificadorCNPJ(numeros.substring(0, 12)) == numeros.charAt(12) - '0'
                && calcularDigitoVerificadorCNPJ(numeros.substring(0, 13)) == numeros.charAt(13) - '0';
    }

    /**
     * Calcula dígito verificador do CPF.
     */
    private static int calcularDigitoVerificadorCPF(String numeros) {
        int soma = 0;
        int peso = numeros.length() + 1;

        for (int i = 0; i < numeros.length(); i++) {
            soma += (numeros.charAt(i) - '0') * peso--;
        }

        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    /**
     * Calcula dígito verificador do CNPJ.
     */
    private static int calcularDigitoVerificadorCNPJ(String numeros) {
        int[] pesosPrimeiroDigito = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] pesosSegundoDigito = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

        int soma = 0;
        int[] pesos = numeros.length() == 12 ? pesosPrimeiroDigito : pesosSegundoDigito;

        for (int i = 0; i < numeros.length(); i++) {
            soma += (numeros.charAt(i) - '0') * pesos[i];
        }

        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    /**
     * Formata CPF no padrão XXX.XXX.XXX-XX.
     */
    public static String formatarCPF(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return null;
        }
        String numeros = cpf.replaceAll("\\D", "");
        if (numeros.length() != 11) {
            return cpf;
        }
        return String.format("%s.%s.%s-%s",
                numeros.substring(0, 3),
                numeros.substring(3, 6),
                numeros.substring(6, 9),
                numeros.substring(9, 11));
    }

    /**
     * Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX.
     */
    public static String formatarCNPJ(String cnpj) {
        if (cnpj == null || cnpj.isBlank()) {
            return null;
        }
        String numeros = cnpj.replaceAll("\\D", "");
        if (numeros.length() != 14) {
            return cnpj;
        }
        return String.format("%s.%s.%s/%s-%s",
                numeros.substring(0, 2),
                numeros.substring(2, 6),
                numeros.substring(6, 12),
                numeros.substring(12, 14));
    }
}
