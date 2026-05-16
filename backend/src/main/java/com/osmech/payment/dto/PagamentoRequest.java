package com.osmech.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.math.BigDecimal;

/**
 * DTO para registrar um pagamento (assinatura ou OS).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagamentoRequest {

    /** Tipo: ASSINATURA ou OS */
    @NotBlank(message = "Tipo de pagamento é obrigatório")
    @Size(max = 20, message = "Tipo deve ter no máximo 20 caracteres")
    private String tipo;

    /** ID de referência (assinatura_id ou os_id) */
    private Long referenciaId;

    /** Descrição do pagamento */
    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
    private String descricao;

    /** Método: PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO, BOLETO, TRANSFERENCIA */
    @NotBlank(message = "Método de pagamento é obrigatório")
    @Size(max = 30, message = "Método de pagamento deve ter no máximo 30 caracteres")
    private String metodoPagamento;

    /** Valor do pagamento */
    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser positivo")
    private BigDecimal valor;

    /** Observações */
    @Size(max = 500, message = "Observações deve ter no máximo 500 caracteres")
    private String observacoes;
}
