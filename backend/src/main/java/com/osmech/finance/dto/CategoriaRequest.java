package com.osmech.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para criação de categoria financeira.
 */
@Data
public class CategoriaRequest {

    @NotBlank(message = "Nome da categoria é obrigatório")
    @Size(max = 80, message = "Nome da categoria deve ter no máximo 80 caracteres")
    private String nome;

    @NotBlank(message = "Tipo é obrigatório (ENTRADA ou SAIDA)")
    @Size(max = 10, message = "Tipo deve ter no máximo 10 caracteres")
    private String tipo;

    @Size(max = 50, message = "Ícone deve ter no máximo 50 caracteres")
    private String icone;
}
