package com.osmech.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;


/**
 * DTO de resposta após login/cadastro bem-sucedido.
 */
@Data
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String email;
    private String nome;
    private String role;
    private String plano;

    // Campo opcional para compatibilidade com versões do código que esperam mensagem.
    // Mantido como null por padrão.
    private String message;

}
