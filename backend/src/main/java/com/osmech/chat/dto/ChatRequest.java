package com.osmech.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "A mensagem é obrigatória")
    @Size(max = 2000, message = "Mensagem deve ter no máximo 2000 caracteres")
    private String message;

    @Size(max = 100, message = "Session ID deve ter no máximo 100 caracteres")
    private String sessionId; // Se null, cria nova sessão
}
