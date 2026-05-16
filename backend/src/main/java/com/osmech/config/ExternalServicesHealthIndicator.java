package com.osmech.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Health Indicator para verificação de serviços externos.
 * Verifica conectividade com Mercado Pago e outros serviços.
 */
@Component
public class ExternalServicesHealthIndicator implements HealthIndicator {

    @org.springframework.beans.factory.annotation.Value("${mercadopago.access-token:}")
    private String mercadoPagoAccessToken;

    @org.springframework.beans.factory.annotation.Value("${external.services.timeout-ms:5000}")
    private long timeoutMs;

    private final org.springframework.web.client.RestTemplate restTemplate;

    public ExternalServicesHealthIndicator(
            org.springframework.web.client.RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public Health health() {
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        boolean allHealthy = true;

        // Verifica Mercado Pago
        Health mercadoPagoHealth = checkMercadoPago();
        details.put("mercadoPago", mercadoPagoHealth);
        if (mercadoPagoHealth.getStatus().equals(org.springframework.boot.actuate.health.Status.DOWN)) {
            allHealthy = false;
        }

        if (allHealthy) {
            return Health.up().withDetails(details).build();
        } else {
            return Health.down().withDetails(details).build();
        }
    }

    private Health checkMercadoPago() {
        if (mercadoPagoAccessToken == null || mercadoPagoAccessToken.isEmpty()) {
            return Health.unknown()
                    .withDetail("status", "NOT_CONFIGURED")
                    .withDetail("message", "Token de acesso não configurado")
                    .build();
        }

        try {
            long startTime = System.currentTimeMillis();
            
            // Tenta acessar endpoint público do Mercado Pago para validar conectividade
            restTemplate.getForObject(
                "https://api.mercadopago.com/users/me",
                String.class
            );
            
            long responseTime = System.currentTimeMillis() - startTime;
            
            return Health.up()
                    .withDetail("status", "CONNECTED")
                    .withDetail("responseTimeMs", responseTime)
                    .build();
                    
        } catch (org.springframework.web.client.ResourceAccessException e) {
            return Health.down(e)
                    .withDetail("status", "UNREACHABLE")
                    .withDetail("message", "Não foi possível conectar ao Mercado Pago")
                    .build();
        } catch (Exception e) {
            return Health.down(e)
                    .withDetail("status", "ERROR")
                    .withDetail("message", "Erro ao verificar Mercado Pago")
                    .build();
        }
    }
}
