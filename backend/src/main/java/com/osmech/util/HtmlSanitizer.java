package com.osmech.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

/**
 * Utilitário para sanitização de inputs contra ataques XSS.
 * Remove tags HTML perigosas e scripts maliciosos de strings.
 */
@Component
public class HtmlSanitizer {

    private static final Safelist SAFE_LIST = Safelist.relaxed()
            .addTags("strike", "s")
            .addAttributes(":all", "class", "id", "style")
            .addProtocols("img", "src", "https")
            .removeTags("script", "iframe", "object", "embed", "form", "input", "textarea", "select", "button")
            .removeAttributes(":all", "onclick", "onerror", "onload", "onmouseover", "onmouseout", "onfocus", "onblur");

    /**
     * Sanitiza uma string removendo tags HTML perigosas.
     * @param input String a ser sanitizada
     * @return String limpa, segura para exibição em HTML
     */
    public String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        return Jsoup.clean(input, SAFE_LIST);
    }

    /**
     * Sanitiza múltiplos campos de um objeto.
     * Útil para aplicar em DTOs antes de persistir.
     * @param input String a ser sanitizada
     * @return String sanitizada ou null se input for null
     */
    public String sanitizeOrNull(String input) {
        if (input == null) {
            return null;
        }
        return sanitize(input);
    }

    /**
     * Verifica se uma string contém potencial código XSS.
     * @param input String a verificar
     * @return true se conter padrões suspeitos de XSS
     */
    public boolean containsXssPattern(String input) {
        if (input == null || input.isBlank()) {
            return false;
        }
        String lower = input.toLowerCase();
        return lower.contains("<script") ||
               lower.contains("javascript:") ||
               lower.contains("onerror=") ||
               lower.contains("onclick=") ||
               lower.contains("onload=") ||
               lower.contains("<iframe") ||
               lower.contains("document.cookie") ||
               lower.contains("eval(");
    }
}
