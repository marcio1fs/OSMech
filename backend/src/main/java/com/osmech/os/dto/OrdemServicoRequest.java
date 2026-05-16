package com.osmech.os.dto;

import com.osmech.util.DocumentoValidator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para criação/atualização de Ordem de Serviço.
 * Suporta múltiplos serviços e itens de estoque.
 */
@Data
public class OrdemServicoRequest {

    @NotBlank(message = "Nome do cliente é obrigatório")
    private String clienteNome;

    private String clienteCpf;
    private String clienteCnpj;

    private String clienteTelefone;

    @NotBlank(message = "Placa é obrigatória")
    private String placa;

    @NotBlank(message = "Modelo é obrigatório")
    private String modelo;

    private String montadora;
    private String corVeiculo;

    @Min(value = 1900, message = "Ano deve ser no mínimo 1900")
    @Max(value = 2100, message = "Ano deve ser no máximo 2100")
    private Integer ano;

    @Min(value = 0, message = "Quilometragem não pode ser negativa")
    private Integer quilometragem;

    /** Descrição geral (campo legado, opcional se enviar servicos[]) */
    private String descricao;

    private String diagnostico;
    private String mecanicoResponsavel;

    /** Peças (campo legado, opcional se enviar itens[]) */
    private String pecas;

    /** Valor total (campo legado, calculado automaticamente se servicos/itens presentes) */
    @DecimalMin(value = "0.0", message = "Valor não pode ser negativo")
    private BigDecimal valor;

    private String status;

    private Boolean whatsappConsentimento;

    /** Lista de serviços da OS */
    @Valid
    private List<ServicoOSRequest> servicos;

    /** Lista de itens de estoque para a OS */
    @Valid
    private List<ItemOSRequest> itens;

    @AssertTrue(message = "Telefone do cliente deve ter 10 ou 11 dígitos")
    public boolean isClienteTelefoneValido() {
        if (clienteTelefone == null || clienteTelefone.isBlank()) {
            return true;
        }
        String digits = digitsOnly(clienteTelefone);
        return digits.length() == 10 || digits.length() == 11;
    }

    @AssertTrue(message = "CPF inválido")
    public boolean isClienteCpfValido() {
        if (clienteCpf == null || clienteCpf.isBlank()) {
            return true;
        }
        return DocumentoValidator.isValidCPF(clienteCpf);
    }

    @AssertTrue(message = "CNPJ inválido")
    public boolean isClienteCnpjValido() {
        if (clienteCnpj == null || clienteCnpj.isBlank()) {
            return true;
        }
        return DocumentoValidator.isValidCNPJ(clienteCnpj);
    }

    private String digitsOnly(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}
