package com.osmech.auth.service;

import com.osmech.auth.dto.AuthResponse;
import com.osmech.auth.dto.LoginRequest;
import com.osmech.auth.dto.RegisterRequest;
import com.osmech.security.JwtUtil;
import com.osmech.user.entity.Usuario;
import com.osmech.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por autenticação e cadastro de usuários.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final com.osmech.notification.service.EmailService emailService;

    /**
     * Realiza o cadastro de um novo usuário.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Validação básica de tamanho de e-mail
        if (email.length() < 5) {
            throw new IllegalArgumentException("Por favor, utilize um e-mail válido.");
        }

        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Este e-mail já está em uso.");
        }

        // Gera token de verificação
        String vToken = java.util.UUID.randomUUID().toString();

        // Cria o usuário com senha criptografada e não verificado
        Usuario usuario = Usuario.builder()
                .nome(request.getNome())
                .email(email)
                .senha(passwordEncoder.encode(request.getSenha()))
                .telefone(request.getTelefone())
                .nomeOficina(request.getNomeOficina())
                .role("OFICINA")
                .build();


        usuarioRepository.save(usuario);

        // Envia e-mail de verificação (em um cenário real, isso poderia ser assíncrono)
        // Desabilitado no modo local rápido: sua entidade Usuario atual não suporta verificationToken.

        return AuthResponse.builder()
                .email(usuario.getEmail())
                .nome(usuario.getNome())
                .role(usuario.getRole())
                .build();

    }

    /**
     * Realiza o login do usuário.
     */
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElse(null);

        if (usuario == null || !passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            throw new org.springframework.security.authentication.BadCredentialsException("E-mail ou senha incorretos.");
        }

        // Gera token JWT
        String token = jwtUtil.generateToken(usuario.getEmail(), usuario.getRole());

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .nome(usuario.getNome())
                .role(usuario.getRole())
                .build();
    }

    // Fluxos de verificação e recuperação de senha foram desabilitados no modo local rápido,
    // pois sua entidade Usuario atual não contém os campos/tokens correspondentes.
    @Transactional
    public void verifyEmail(String token) {
        throw new UnsupportedOperationException("Verificação de e-mail está indisponível no modo local rápido.");
    }

    @Transactional
    public void forgotPassword(String email) {
        throw new UnsupportedOperationException("Recuperação de senha está indisponível no modo local rápido.");
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        throw new UnsupportedOperationException("Reset de senha está indisponível no modo local rápido.");
    }

}

