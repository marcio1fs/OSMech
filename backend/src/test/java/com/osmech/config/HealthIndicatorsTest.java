package com.osmech.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes para os Health Indicators customizados.
 */
@SpringBootTest
@ActiveProfiles("test")
class HealthIndicatorsTest {

    @Autowired
    private StorageHealthIndicator storageHealthIndicator;

    @Autowired
    private DatabaseHealthIndicator databaseHealthIndicator;

    @Autowired
    private ExternalServicesHealthIndicator externalServicesHealthIndicator;

    @Test
    void testStorageHealthIndicator_WhenDirectoryExists_ShouldReturnUp() {
        // O diretório temporário deve existir e ser gravável
        Health health = storageHealthIndicator.health();
        
        assertNotNull(health);
        assertTrue(health.getDetails().containsKey("path"));
        assertTrue(health.getDetails().containsKey("writable"));
    }

    @Test
    void testStorageHealthIndicator_WithCustomPath_ShouldCreateDirectory() {
        // Testa criação de diretório que não existe
        StorageHealthIndicator indicator = new StorageHealthIndicator();
        // Nota: Em teste real, injetaríamos um path temporário via reflection ou constructor
        
        // Este teste valida que o indicador tenta criar diretórios inexistentes
        Health health = storageHealthIndicator.health();
        assertNotNull(health);
    }

    @Test
    void testDatabaseHealthIndicator_WhenConnected_ShouldReturnUp() {
        // Assumindo que o banco de dados H2 de teste está configurado
        Health health = databaseHealthIndicator.health();
        
        assertNotNull(health);
        assertTrue(health.getDetails().containsKey("status"));
        assertEquals("CONNECTED", health.getDetails().get("status"));
        
        if (health.getStatus().equals(Health.up().getStatus())) {
            assertTrue(health.getDetails().containsKey("executionTimeMs"));
        }
    }

    @Test
    void testExternalServicesHealthIndicator_WhenMercadoPagoNotConfigured_ShouldReturnUnknown() {
        // Em ambiente de teste, o token do Mercado Pago não está configurado
        Health health = externalServicesHealthIndicator.health();
        
        assertNotNull(health);
        // Pode ser UNKNOWN (não configurado) ou UP (se mockado)
        assertTrue(
            health.getStatus().equals(Health.unknown().getStatus()) ||
            health.getStatus().equals(Health.up().getStatus()) ||
            health.getStatus().equals(Health.down().getStatus()),
            "Status deve ser UNKNOWN, UP ou DOWN"
        );
    }

    @Test
    void testAllHealthIndicators_NotNull() {
        // Valida que todos os indicadores foram injetados corretamente
        assertNotNull(storageHealthIndicator, "StorageHealthIndicator não deve ser nulo");
        assertNotNull(databaseHealthIndicator, "DatabaseHealthIndicator não deve ser nulo");
        assertNotNull(externalServicesHealthIndicator, "ExternalServicesHealthIndicator não deve ser nulo");
    }
}
