package com.osmech.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Health Indicator para verificação do sistema de arquivos.
 * Verifica se o diretório de backup está acessível e com espaço suficiente.
 */
@Component
public class StorageHealthIndicator implements HealthIndicator {

    @org.springframework.beans.factory.annotation.Value("${backup.directory:/var/backups/osmech}")
    private String backupDirectory;

    @org.springframework.beans.factory.annotation.Value("${storage.min-free-space-mb:100}")
    private long minFreeSpaceMb;

    @Override
    public Health health() {
        try {
            java.io.File dir = new java.io.File(backupDirectory);
            
            // Verifica se o diretório existe
            if (!dir.exists()) {
                boolean created = dir.mkdirs();
                if (!created) {
                    return Health.down()
                            .withDetail("error", "Diretório de backup não existe e não pôde ser criado")
                            .withDetail("path", backupDirectory)
                            .build();
                }
            }
            
            // Verifica permissões de escrita
            if (!dir.canWrite()) {
                return Health.down()
                        .withDetail("error", "Sem permissão de escrita no diretório de backup")
                        .withDetail("path", backupDirectory)
                        .build();
            }
            
            // Verifica espaço disponível
            long freeSpaceBytes = dir.getFreeSpace();
            long freeSpaceMb = freeSpaceBytes / (1024 * 1024);
            
            if (freeSpaceMb < minFreeSpaceMb) {
                return Health.down()
                        .withDetail("error", "Espaço em disco insuficiente")
                        .withDetail("freeSpaceMb", freeSpaceMb)
                        .withDetail("minRequiredMb", minFreeSpaceMb)
                        .withDetail("path", backupDirectory)
                        .build();
            }
            
            return Health.up()
                    .withDetail("freeSpaceMb", freeSpaceMb)
                    .withDetail("path", backupDirectory)
                    .withDetail("writable", true)
                    .build();
                    
        } catch (Exception e) {
            return Health.down(e)
                    .withDetail("path", backupDirectory)
                    .build();
        }
    }
}
