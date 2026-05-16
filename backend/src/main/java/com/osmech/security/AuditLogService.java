package com.osmech.security;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Serviço de Logging de Auditoria para rastrear ações críticas no sistema.
 * Registra eventos como logins, alterações de dados, exclusões, etc.
 */
@Component
public class AuditLogService {

    private final ConcurrentHashMap<String, AuditEvent> eventCache;

    public AuditLogService() {
        this.eventCache = new ConcurrentHashMap<>();
    }

    /**
     * Registra um evento de auditoria.
     * @param eventType Tipo do evento (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)
     * @param entity Entidade afetada (Usuario, OrdemServico, etc.)
     * @param entityId ID da entidade afetada
     * @param userId ID do usuário que realizou a ação
     * @param userEmail Email do usuário que realizou a ação
     * @param details Detalhes adicionais em formato JSON
     * @param success Se a ação foi bem-sucedida
     */
    public void log(String eventType, String entity, Long entityId, Long userId, 
                   String userEmail, Map<String, Object> details, boolean success) {
        
        AuditEvent event = AuditEvent.builder()
                .timestamp(Instant.now())
                .eventType(eventType)
                .entity(entity)
                .entityId(entityId)
                .userId(userId)
                .userEmail(userEmail)
                .details(details)
                .success(success)
                .ipAddress(extractIpAddress())
                .userAgent(extractUserAgent())
                .build();

        // Em produção, enviar para banco de dados ou sistema de logs
        // Por enquanto, manter em cache para demonstração
        String eventId = entity + ":" + entityId + ":" + System.currentTimeMillis();
        eventCache.put(eventId, event);

        // Log no console para debugging
        System.out.printf("[AUDIT] %s - %s %s #%d by %s (%s) - Success: %b%n",
                event.getTimestamp(), event.getEventType(), event.getEntity(),
                event.getEntityId(), event.getUserEmail(), event.getIpAddress(), event.isSuccess());
    }

    /**
     * Registra evento simplificado sem detalhes.
     */
    public void log(String eventType, String entity, Long entityId, Long userId, String userEmail) {
        log(eventType, entity, entityId, userId, userEmail, null, true);
    }

    /**
     * Registra tentativa de login falha.
     */
    public void logLoginFailure(String email, String ipAddress, String reason) {
        Map<String, Object> details = Map.of("reason", reason, "email", email);
        log("LOGIN_FAILURE", "Usuario", null, null, email, details, false);
    }

    /**
     * Registra login bem-sucedido.
     */
    public void logLoginSuccess(Long userId, String email, String ipAddress) {
        Map<String, Object> details = Map.of("ipAddress", ipAddress);
        log("LOGIN_SUCCESS", "Usuario", userId, userId, email, details, true);
    }

    /**
     * Registra logout.
     */
    public void logLogout(Long userId, String email) {
        log("LOGOUT", "Usuario", userId, userId, email, null, true);
    }

    /**
     * Obtém eventos de auditoria por entidade.
     */
    public java.util.List<AuditEvent> getEventsByEntity(String entity) {
        return eventCache.values().stream()
                .filter(e -> e.getEntity().equals(entity))
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .toList();
    }

    /**
     * Obtém eventos de auditoria por usuário.
     */
    public java.util.List<AuditEvent> getEventsByUser(String userEmail) {
        return eventCache.values().stream()
                .filter(e -> e.getUserEmail().equals(userEmail))
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .toList();
    }

    /**
     * Limpa cache (útil para testes).
     */
    public void clearCache() {
        eventCache.clear();
    }

    /**
     * Extrai IP da requisição (placeholder - implementar com HttpServletRequest).
     */
    private String extractIpAddress() {
        // Em implementação real, extrair do HttpServletRequest
        return "127.0.0.1";
    }

    /**
     * Extrai User-Agent da requisição (placeholder).
     */
    private String extractUserAgent() {
        // Em implementação real, extrair do HttpServletRequest
        return "Unknown";
    }

    @Data
    @Builder
    public static class AuditEvent {
        private Instant timestamp;
        private String eventType;
        private String entity;
        private Long entityId;
        private Long userId;
        private String userEmail;
        private Map<String, Object> details;
        private boolean success;
        private String ipAddress;
        private String userAgent;
    }
}
