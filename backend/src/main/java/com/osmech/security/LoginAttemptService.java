package com.osmech.security;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.Instant;

/**
 * Gerenciador de tentativas de login para proteção contra força bruta.
 * Implementa bloqueio temporário após múltiplas falhas consecutivas.
 */
@Component
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

    private final ConcurrentHashMap<String, AtomicInteger> attemptCache;
    private final ConcurrentHashMap<String, Long> lockoutCache;

    public LoginAttemptService() {
        this.attemptCache = new ConcurrentHashMap<>();
        this.lockoutCache = new ConcurrentHashMap<>();
    }

    /**
     * Registra uma tentativa de login falha.
     * @param identifier Identificador único (email ou IP)
     */
    public void loginFailed(String identifier) {
        int attempts = attemptCache.computeIfAbsent(identifier, k -> new AtomicInteger(0))
                .incrementAndGet();
        
        if (attempts >= MAX_ATTEMPTS) {
            lockoutCache.put(identifier, Instant.now().toEpochMilli());
        }
    }

    /**
     * Reseta as tentativas após login bem-sucedido.
     * @param identifier Identificador único (email ou IP)
     */
    public void loginSucceeded(String identifier) {
        attemptCache.remove(identifier);
        lockoutCache.remove(identifier);
    }

    /**
     * Verifica se o identificador está bloqueado.
     * @param identifier Identificador único (email ou IP)
     * @return true se estiver bloqueado, false caso contrário
     */
    public boolean isLockedOut(String identifier) {
        Long lockoutTime = lockoutCache.get(identifier);
        
        if (lockoutTime == null) {
            return false;
        }

        long currentTime = Instant.now().toEpochMilli();
        if (currentTime - lockoutTime > LOCKOUT_DURATION_MS) {
            // Período de bloqueio expirou, resetar
            attemptCache.remove(identifier);
            lockoutCache.remove(identifier);
            return false;
        }

        return true;
    }

    /**
     * Obtém o número de tentativas restantes antes do bloqueio.
     * @param identifier Identificador único (email ou IP)
     * @return Número de tentativas restantes
     */
    public int getRemainingAttempts(String identifier) {
        AtomicInteger attempts = attemptCache.get(identifier);
        if (attempts == null) {
            return MAX_ATTEMPTS;
        }
        return Math.max(0, MAX_ATTEMPTS - attempts.get());
    }

    /**
     * Limpa todos os caches (útil para testes).
     */
    public void clearCache() {
        attemptCache.clear();
        lockoutCache.clear();
    }
}
