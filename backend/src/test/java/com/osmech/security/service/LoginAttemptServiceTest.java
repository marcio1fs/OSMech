package com.osmech.security.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes unitários para o serviço de Proteção Contra Força Bruta
 */
class LoginAttemptServiceTest {

    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService();
    }

    @Test
    void devePermitirLoginAposSucesso() {
        String email = "usuario@teste.com";
        
        // Simular tentativas falhas
        for (int i = 0; i < 3; i++) {
            loginAttemptService.loginFailed(email);
        }
        
        // Login com sucesso deve resetar contador
        loginAttemptService.loginSucceeded(email);
        
        // Deve estar desbloqueado
        assertFalse(loginAttemptService.isBlocked(email), 
            "Usuário deveria estar desbloqueado após login com sucesso");
    }

    @Test
    void deveBloquearAposMaximoTentativas() {
        String email = "bloqueado@teste.com";
        
        // Simular 5 tentativas falhas (limite padrão)
        for (int i = 0; i < 5; i++) {
            loginAttemptService.loginFailed(email);
        }
        
        // Deve estar bloqueado
        assertTrue(loginAttemptService.isBlocked(email), 
            "Usuário deveria estar bloqueado após 5 tentativas falhas");
    }

    @Test
    void deveManterDesbloqueadoComMenosQueMaximoTentativas() {
        String email = "seguro@teste.com";
        
        // Simular 4 tentativas falhas (abaixo do limite)
        for (int i = 0; i < 4; i++) {
            loginAttemptService.loginFailed(email);
        }
        
        // Não deve estar bloqueado
        assertFalse(loginAttemptService.isBlocked(email), 
            "Usuário não deveria estar bloqueado com menos de 5 tentativas");
    }

    @Test
    void deveTratarEmailsDiferentesSeparadamente() {
        String email1 = "usuario1@teste.com";
        String email2 = "usuario2@teste.com";
        
        // Bloquear usuario1
        for (int i = 0; i < 5; i++) {
            loginAttemptService.loginFailed(email1);
        }
        
        // usuario2 não deve ser afetado
        assertFalse(loginAttemptService.isBlocked(email2), 
            "Usuario2 não deveria ser afetado pelo bloqueio de usuario1");
        
        assertTrue(loginAttemptService.isBlocked(email1), 
            "Usuario1 deveria estar bloqueado");
    }

    @Test
    void deveResetarContadorAposLoginSucesso() {
        String email = "reset@teste.com";
        
        // 3 tentativas falhas
        for (int i = 0; i < 3; i++) {
            loginAttemptService.loginFailed(email);
        }
        
        // Login com sucesso
        loginAttemptService.loginSucceeded(email);
        
        // Mais 3 tentativas falhas não devem bloquear
        for (int i = 0; i < 3; i++) {
            loginAttemptService.loginFailed(email);
        }
        
        assertFalse(loginAttemptService.isBlocked(email), 
            "Contador deveria ter sido resetado após login com sucesso");
    }

    @Test
    void deveSerThreadSafe() throws InterruptedException {
        String email = "concurrent@teste.com";
        int numThreads = 10;
        Thread[] threads = new Thread[numThreads];
        
        // Múltiplas threads registrando falhas simultaneamente
        for (int i = 0; i < numThreads; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 5; j++) {
                    loginAttemptService.loginFailed(email);
                }
            });
            threads[i].start();
        }
        
        // Aguardar todas as threads completarem
        for (Thread thread : threads) {
            thread.join();
        }
        
        // Deve estar bloqueado (50 tentativas totais)
        assertTrue(loginAttemptService.isBlocked(email), 
            "Deve ser thread-safe e bloquear após muitas tentativas");
    }

    @Test
    void deveLidarComEmailNuloOuVazio() {
        assertDoesNotThrow(() -> {
            loginAttemptService.loginFailed(null);
            loginAttemptService.loginFailed("");
            loginAttemptService.loginSucceeded(null);
            loginAttemptService.loginSucceeded("");
            loginAttemptService.isBlocked(null);
            loginAttemptService.isBlocked("");
        }, "Deve lidar graciosamente com emails nulos ou vazios");
    }
}
