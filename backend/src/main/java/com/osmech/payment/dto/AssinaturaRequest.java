package com.osmech.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssinaturaRequest {
    @NotBlank(message = "Código do plano é obrigatório")
    @Size(max = 50, message = "Código do plano deve ter no máximo 50 caracteres")
    private String planoCodigo;
}
