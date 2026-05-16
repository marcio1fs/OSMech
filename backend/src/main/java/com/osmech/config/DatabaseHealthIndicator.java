package com.osmech.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Health Indicator para verificação do banco de dados.
 * Realiza uma query simples para validar conectividade e performance.
 */
@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    private final javax.sql.DataSource dataSource;

    @org.springframework.beans.factory.annotation.Value("${db.health.query-timeout-ms:1000}")
    private long queryTimeoutMs;

    public DatabaseHealthIndicator(javax.sql.DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        try (java.sql.Connection conn = dataSource.getConnection();
             java.sql.Statement stmt = conn.createStatement()) {
            
            // Configura timeout da query
            stmt.setQueryTimeout((int) (queryTimeoutMs / 1000));
            
            long startTime = System.currentTimeMillis();
            
            // Executa query simples de validação
            stmt.executeQuery("SELECT 1");
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            // Verifica se a query foi muito lenta
            if (executionTime > queryTimeoutMs / 2) {
                return Health.up()
                        .withDetail("status", "CONNECTED")
                        .withDetail("executionTimeMs", executionTime)
                        .withDetail("warning", "Query lenta detectada")
                        .withDetail("thresholdMs", queryTimeoutMs)
                        .build();
            }
            
            // Obtém informações adicionais do banco
            java.sql.DatabaseMetaData meta = conn.getMetaData();
            
            return Health.up()
                    .withDetail("status", "CONNECTED")
                    .withDetail("executionTimeMs", executionTime)
                    .withDetail("databaseProduct", meta.getDatabaseProductName())
                    .withDetail("databaseVersion", meta.getDatabaseProductVersion())
                    .withDetail("jdbcDriver", meta.getDriverName())
                    .build();
                    
        } catch (java.sql.SQLTimeoutException e) {
            return Health.down(e)
                    .withDetail("error", "Query timeout excedido")
                    .withDetail("timeoutMs", queryTimeoutMs)
                    .build();
        } catch (Exception e) {
            return Health.down(e)
                    .withDetail("error", "Falha na conexão com o banco de dados")
                    .build();
        }
    }
}
