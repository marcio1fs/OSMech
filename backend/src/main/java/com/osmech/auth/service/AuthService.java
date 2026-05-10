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
                .emailVerificado(false)
                .verificationToken(vToken)
                .build();

        usuarioRepository.save(usuario);

        // Envia e-mail de verificação (em um cenário real, isso poderia ser assíncrono)
        emailService.enviarEmailVerificacao(usuario.getEmail(), vToken);

        return AuthResponse.builder()
                .email(usuario.getEmail())
                .nome(usuario.getNome())
                .role(usuario.getRole())
                .message("Cadastro realizado! Voce ja pode fazer login. Se receber o e-mail de verificacao, confirme para manter seus dados atualizados.")
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

    @Transactional
    public void verifyEmail(String token) {
        Usuario usuario = usuarioRepository.findByVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de verificação inválido ou expirado."));

        usuario.setEmailVerificado(true);
        usuario.setVerificationToken(null);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void forgotPassword(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Se este e-mail estiver cadastrado, você receberá as instruções."));

        String token = java.util.UUID.randomUUID().toString();
        usuario.setResetPasswordToken(token);
        usuario.setResetPasswordTokenExpiry(java.time.LocalDateTime.now().plusHours(1));
        usuarioRepository.save(usuario);

        emailService.enviarEmailRecuperacaoSenha(usuario.getEmail(), token);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        Usuario usuario = usuarioRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de recuperação inválido ou expirado."));

        if (usuario.getResetPasswordTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Token de recuperação expirado.");
        }

        usuario.setSenha(passwordEncoder.encode(newPassword));
        usuario.setResetPasswordToken(null);
        usuario.setResetPasswordTokenExpiry(null);
        usuarioRepository.save(usuario);
    }
}

