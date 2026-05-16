package com.osmech.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Serviço de Rate Limiting para prevenir abusos e ataques DDoS.
 * Implementa limite de requisições por IP ou identificador.
 */
@Component
public class RateLimiterService {

    private static final int DEFAULT_MAX_REQUESTS = 100;
    private static final long DEFAULT_WINDOW_MS = 60000; // 1 minuto

    private final ConcurrentHashMap<String, RequestWindow> requestWindows;

    public RateLimiterService() {
        this.requestWindows = new ConcurrentHashMap<>();
    }

    /**
     * Verifica se a requisição está dentro do limite.
     * @param identifier Identificador único (IP, email, etc.)
     * @return true se permitido, false se excedeu o limite
     */
    public boolean isAllowed(String identifier) {
        return isAllowed(identifier, DEFAULT_MAX_REQUESTS, DEFAULT_WINDOW_MS);
    }

    /**
     * Verifica se a requisição está dentro do limite configurado.
     * @param identifier Identificador único
     * @param maxRequests Número máximo de requisições na janela
     * @param windowMs Tamanho da janela em milissegundos
     * @return true se permitido, false se excedeu o limite
     */
    public boolean isAllowed(String identifier, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis();
        
        RequestWindow window = requestWindows.computeIfAbsent(identifier, k -> new RequestWindow(now, windowMs));
        
        // Resetar janela se expirou
        if (now - window.startTime > window.windowSize) {
            window.reset(now, windowMs);
        }

        int currentCount = window.count.incrementAndGet();
        
        if (currentCount > maxRequests) {
            return false;
        }
        
        return true;
    }

    /**
     * Obtém informações sobre o limite atual.
     * @param identifier Identificador único
     * @param maxRequests Número máximo de requisições
     * @param windowMs Tamanho da janela em ms
     * @return Mapa com informações do rate limit
     */
    public Map<String, Object> getRateLimitInfo(String identifier, int maxRequests, long windowMs) {
        Map<String, Object> info = new HashMap<>();
        long now = System.currentTimeMillis();
        
        RequestWindow window = requestWindows.get(identifier);
        
        if (window == null || now - window.startTime > window.windowSize) {
            info.put("remaining", maxRequests);
            info.put("limit", maxRequests);
            info.put("reset", now + windowMs);
        } else {
            int used = window.count.get();
            info.put("remaining", Math.max(0, maxRequests - used));
            info.put("limit", maxRequests);
            info.put("reset", window.startTime + window.windowSize);
        }
        
        return Collections.unmodifiableMap(info);
    }

    /**
     * Limpa todos os registros (útil para testes).
     */
    public void clearCache() {
        requestWindows.clear();
    }

    /**
     * Extrai o IP do cliente da requisição HTTP.
     * @param request Requisição HTTP
     * @return IP do cliente
     */
    public String getClientIp(HttpServletRequest request) {
        String[] headers = {"X-Forwarded-For", "Proxy-Client-IP", "WL-Proxy-Client-IP", 
                           "HTTP_CLIENT_IP", "HTTP_X_FORWARDED_FOR"};
        
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For pode conter múltiplos IPs, pegar o primeiro
                return ip.split(",")[0].trim();
            }
        }
        
        return request.getRemoteAddr();
    }

    /**
     * Classe interna para gerenciar janelas de tempo.
     */
    private static class RequestWindow {
        private final AtomicInteger count;
        private long startTime;
        private final long windowSize;

        public RequestWindow(long startTime, long windowSize) {
            this.count = new AtomicInteger(0);
            this.startTime = startTime;
            this.windowSize = windowSize;
        }

        public void reset(long newStartTime, long newWindowSize) {
            this.count.set(0);
            this.startTime = newStartTime;
        }
    }
}
