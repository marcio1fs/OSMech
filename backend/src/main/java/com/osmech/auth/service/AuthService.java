package com.osmech.auth.service;

import com.osmech.auth.dto.AuthResponse;
import com.osmech.auth.dto.LoginRequest;
import com.osmech.auth.dto.RegisterRequest;
import com.osmech.security.AuditLogService;
import com.osmech.security.JwtUtil;
import com.osmech.security.LoginAttemptService;
import com.osmech.security.RateLimiterService;
import com.osmech.user.entity.Usuario;
import com.osmech.user.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por autenticação e cadastro de usuários.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;
    private final RateLimiterService rateLimiterService;
    private final AuditLogService auditLogService;
    private final HttpServletRequest request;

    @Value("${app.security.max-login-attempts:5}")
    private int maxLoginAttempts;

    @Value("${app.security.lockout-duration-ms:900000}")
    private long lockoutDurationMs;

    /**
     * Realiza o cadastro de um novo usuário.
     *
     * @throws IllegalArgumentException se o email já estiver em uso
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Verifica se email já existe
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }

        // Validação de senha forte
        validarSenhaForte(request.getSenha());

        // Cria o usuário com senha criptografada
        Usuario usuario = Usuario.builder()
                .nome(request.getNome())
                .email(request.getEmail())
                .senha(passwordEncoder.encode(request.getSenha()))
                .telefone(request.getTelefone())
                .nomeOficina(request.getNomeOficina())
                .role("OFICINA")
                .plano("FREE")
                .ativo(true)
                .build();

        usuarioRepository.save(usuario);

        // Gera token JWT
        String token = jwtUtil.generateToken(usuario.getEmail(), usuario.getRole());

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .nome(usuario.getNome())
                .role(usuario.getRole())
                .plano(usuario.getPlano())
                .build();
    }

    /**
     * Valida se a senha atende aos requisitos de segurança:
     * - Mínimo 8 caracteres
     * - Pelo menos uma letra maiúscula
     * - Pelo menos uma letra minúscula
     * - Pelo menos um número
     * - Pelo menos um caractere especial
     */
    private void validarSenhaForte(String senha) {
        if (senha == null || senha.length() < 8) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 8 caracteres");
        }
        if (!senha.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos uma letra maiúscula");
        }
        if (!senha.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos uma letra minúscula");
        }
        if (!senha.matches(".*\\d.*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos um número");
        }
        if (!senha.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos um caractere especial (!@#$%^&*...)");
        }
    }

    /**
     * Realiza o login do usuário com proteção contra força bruta e logging de auditoria.
     *
     * @throws IllegalArgumentException se credenciais forem inválidas
     * @throws IllegalStateException se a conta estiver bloqueada temporariamente
     */
    public AuthResponse login(LoginRequest request) {
        // Obter identificador (email + IP para maior segurança)
        String clientIp = rateLimiterService.getClientIp(this.request);
        String identifier = request.getEmail() + ":" + clientIp;

        // Verificar rate limiting
        if (!rateLimiterService.isAllowed(identifier, maxLoginAttempts, 60000)) {
            auditLogService.logLoginFailure(request.getEmail(), clientIp, "Rate limit excedido");
            log.warn("Tentativa de login bloqueada por rate limiting: {}", request.getEmail());
            throw new IllegalStateException("Muitas tentativas de login. Aguarde alguns minutos.");
        }

        // Verificar se está bloqueado por múltiplas falhas
        if (loginAttemptService.isLockedOut(request.getEmail())) {
            auditLogService.logLoginFailure(request.getEmail(), clientIp, "Conta bloqueada");
            long lockoutTimeMinutes = lockoutDurationMs / 60000;
            throw new IllegalStateException(
                String.format("Conta temporariamente bloqueada após %d tentativas falhas. " +
                    "Tente novamente em %d minutos.", maxLoginAttempts, lockoutTimeMinutes)
            );
        }

        // Busca usuário pelo email
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    auditLogService.logLoginFailure(request.getEmail(), clientIp, "Usuário não encontrado");
                    log.warn("Tentativa de login com email não cadastrado: {}", request.getEmail());
                    return new IllegalArgumentException("Credenciais inválidas");
                });

        // Verifica senha
        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            loginAttemptService.loginFailed(request.getEmail());
            int remainingAttempts = loginAttemptService.getRemainingAttempts(request.getEmail());
            
            auditLogService.logLoginFailure(usuario.getEmail(), clientIp, 
                "Senha incorreta. Restantes: " + remainingAttempts);
            log.warn("Senha incorreta para {}: {} tentativas restantes", 
                request.getEmail(), remainingAttempts);
            
            if (remainingAttempts == 0) {
                throw new IllegalStateException(
                    String.format("Muitas tentativas falhas. Conta bloqueada por %d minutos.", 
                        lockoutDurationMs / 60000)
                );
            }
            throw new IllegalArgumentException(
                String.format("Credenciais inválidas. Restam %d tentativas antes do bloqueio.", 
                    remainingAttempts)
            );
        }

        // Verifica se está ativo
        if (!usuario.getAtivo()) {
            auditLogService.logLoginFailure(usuario.getEmail(), clientIp, "Conta desativada");
            throw new IllegalArgumentException("Conta desativada. Entre em contato com o suporte.");
        }

        // Login bem-sucedido: resetar contadores e registrar auditoria
        loginAttemptService.loginSucceeded(request.getEmail());
        auditLogService.logLoginSuccess(usuario.getId(), usuario.getEmail(), clientIp);
        log.info("Login bem-sucedido: {} (IP: {})", usuario.getEmail(), clientIp);

        // Gera token JWT
        String token = jwtUtil.generateToken(usuario.getEmail(), usuario.getRole());

        return AuthResponse.builder()
                .token(token)
                .email(usuario.getEmail())
                .nome(usuario.getNome())
                .role(usuario.getRole())
                .plano(usuario.getPlano())
                .build();
    }
}
