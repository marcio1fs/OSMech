package com.osmech.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para criação de transação financeira.
 */
@Data
public class TransacaoRequest {

    @NotBlank(message = "Tipo é obrigatório (ENTRADA ou SAIDA)")
    @Size(max = 10, message = "Tipo deve ter no máximo 10 caracteres")
    private String tipo;

    private Long categoriaId;

    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
    private String descricao;

    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    private BigDecimal valor;

    @Size(max = 50, message = "Referência tipo deve ter no máximo 50 caracteres")
    private String referenciaTipo;
    
    private Long referenciaId;
    
    @Size(max = 30, message = "Método de pagamento deve ter no máximo 30 caracteres")
    private String metodoPagamento;
    
    private LocalDateTime dataMovimentacao;
    
    @Size(max = 500, message = "Observações deve ter no máximo 500 caracteres")
    private String observacoes;
}
