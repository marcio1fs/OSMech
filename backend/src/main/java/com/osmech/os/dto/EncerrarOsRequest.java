package com.osmech.os.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class EncerrarOsRequest {

    @NotBlank(message = "Método de pagamento é obrigatório")
    @Size(max = 30, message = "Método de pagamento deve ter no máximo 30 caracteres")
    private String metodoPagamento;

    private Boolean enviarReciboWhatsapp;

    /** Opcional: sobrescreve o telefone do cliente no envio do recibo. */
    @Size(max = 20, message = "Telefone WhatsApp deve ter no máximo 20 caracteres")
    private String telefoneWhatsapp;

    @Size(max = 500, message = "Observações deve ter no máximo 500 caracteres")
    private String observacoesPagamento;
}
