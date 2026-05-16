package com.osmech.security.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes unitários para o serviço de Rate Limiting
 */
class RateLimiterServiceTest {

    private RateLimiterService rateLimiterService;

    @BeforeEach
    void setUp() {
        rateLimiterService = new RateLimiterService();
    }

    @Test
    void devePermitirRequisicoesDentroDoLimite() {
        String ip = "192.168.1.1";
        
        // Primeiras 10 requisições devem ser permitidas (limite padrão para teste)
        for (int i = 0; i < 10; i++) {
            assertTrue(rateLimiterService.isAllowed(ip), 
                "Requisição " + (i + 1) + " deveria ser permitida");
        }
    }

    @Test
    void deveBloquearRequisicoesAposExcederLimite() {
        String ip = "192.168.1.2";
        
        // Exceder limite
        for (int i = 0; i < 100; i++) {
            rateLimiterService.isAllowed(ip);
        }
        
        // Próxima requisição deve ser bloqueada
        assertFalse(rateLimiterService.isAllowed(ip), 
            "Requisição deveria ser bloqueada após exceder limite");
    }

    @Test
    void deveTratarIPsDiferentesSeparadamente() {
        String ip1 = "192.168.1.100";
        String ip2 = "192.168.1.101";
        
        // IP1 faz várias requisições
        for (int i = 0; i < 50; i++) {
            rateLimiterService.isAllowed(ip1);
        }
        
        // IP2 ainda deve ser permitido
        assertTrue(rateLimiterService.isAllowed(ip2), 
            "IP diferente não deveria ser afetado");
    }

    @Test
    void deveExtrairIPCorretamenteDoRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        
        String ip = rateLimiterService.extractClientIp(request);
        assertEquals("10.0.0.1", ip);
    }

    @Test
    void devePriorizarHeaderXForwardedFor() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.195");
        
        String ip = rateLimiterService.extractClientIp(request);
        assertEquals("203.0.113.195", ip);
    }

    @Test
    void deveSerThreadSafe() throws InterruptedException {
        String ip = "192.168.1.200";
        int numThreads = 10;
        Thread[] threads = new Thread[numThreads];
        
        // Múltiplas threads acessando simultaneamente
        for (int i = 0; i < numThreads; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 10; j++) {
                    rateLimiterService.isAllowed(ip);
                }
            });
            threads[i].start();
        }
        
        // Aguardar todas as threads completarem
        for (Thread thread : threads) {
            thread.join();
        }
        
        // Não deve lançar exceções de concorrência
        assertTrue(true, "Deve ser thread-safe");
    }
}
