package com.osmech.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.retry.backoff.FixedBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

/**
 * Configuração de Circuit Breaker e Retry para chamadas externas
 * OSMECH - Sistema de Gestão para Oficinas Mecânicas
 */
@Configuration
@EnableRetry
public class CircuitBreakerConfig {

    /**
     * Template de retry para chamadas HTTP externas (Mercado Pago, WhatsApp, etc.)
     * - Máximo de 3 tentativas
     * - Intervalo fixo de 2 segundos entre tentativas
     */
    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();

        // Política de backoff: espera fixa entre tentativas
        FixedBackOffPolicy backOffPolicy = new FixedBackOffPolicy();
        backOffPolicy.setBackOffPeriod(2000L); // 2 segundos
        retryTemplate.setBackOffPolicy(backOffPolicy);

        // Política de retry: máximo de 3 tentativas
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);
        retryTemplate.setRetryPolicy(retryPolicy);

        return retryTemplate;
    }
}
