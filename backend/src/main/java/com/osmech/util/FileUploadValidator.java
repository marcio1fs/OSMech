package com.osmech.util;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Utilitário para validação e sanitização de uploads de arquivos.
 * Previne upload de arquivos maliciosos e valida tipos MIME.
 */
@Component
public class FileUploadValidator {

    // Tipos MIME permitidos para imagens
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    );

    // Tipos MIME permitidos para documentos
    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    );

    // Tamanho máximo: 5MB para imagens, 10MB para documentos
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final long MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

    // Padrão para detectar nomes de arquivos maliciosos
    private static final Pattern MALICIOUS_FILENAME_PATTERN = Pattern.compile(
        "[<>:\"/\\\\|?*]|\\.\\.|^\\.|\\.$",
        Pattern.CASE_INSENSITIVE
    );

    // Extensões perigosas
    private static final List<String> DANGEROUS_EXTENSIONS = Arrays.asList(
        ".exe", ".bat", ".cmd", ".sh", ".php", ".jsp", ".asp", ".aspx",
        ".js", ".vbs", ".ps1", ".hta", ".scr", ".pif", ".com", ".msi"
    );

    /**
     * Valida um arquivo de imagem.
     * @param file Arquivo a ser validado
     * @throws IllegalArgumentException se o arquivo for inválido
     */
    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode estar vazio");
        }

        // Validar tamanho
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException(
                String.format("Tamanho máximo para imagens é %d MB", MAX_IMAGE_SIZE / 1024 / 1024)
            );
        }

        // Validar tipo MIME
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Tipo de arquivo não permitido. Apenas JPEG, PNG, GIF e WebP são aceitos."
            );
        }

        // Validar nome do arquivo
        validateFilename(file.getOriginalFilename());

        // Validar extensão
        validateExtension(file.getOriginalFilename(), 
            Arrays.asList(".jpg", ".jpeg", ".png", ".gif", ".webp"));
    }

    /**
     * Valida um arquivo de documento.
     * @param file Arquivo a ser validado
     * @throws IllegalArgumentException se o arquivo for inválido
     */
    public void validateDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo não pode estar vazio");
        }

        // Validar tamanho
        if (file.getSize() > MAX_DOCUMENT_SIZE) {
            throw new IllegalArgumentException(
                String.format("Tamanho máximo para documentos é %d MB", MAX_DOCUMENT_SIZE / 1024 / 1024)
            );
        }

        // Validar tipo MIME
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_DOCUMENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Tipo de documento não permitido. Apenas PDF, DOC, DOCX e TXT são aceitos."
            );
        }

        // Validar nome do arquivo
        validateFilename(file.getOriginalFilename());

        // Validar extensão
        validateExtension(file.getOriginalFilename(), 
            Arrays.asList(".pdf", ".doc", ".docx", ".txt"));
    }

    /**
     * Valida o nome do arquivo em busca de caracteres maliciosos.
     * @param filename Nome do arquivo
     * @throws IllegalArgumentException se o nome for inválido
     */
    public void validateFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do arquivo não pode ser vazio");
        }

        // Detectar path traversal e caracteres especiais
        if (MALICIOUS_FILENAME_PATTERN.matcher(filename).find()) {
            throw new IllegalArgumentException("Nome do arquivo contém caracteres inválidos");
        }

        // Detectar path traversal explícito
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Nome do arquivo não pode conter caminhos");
        }
    }

    /**
     * Valida a extensão do arquivo.
     * @param filename Nome do arquivo
     * @param allowedExtensions Extensões permitidas
     * @throws IllegalArgumentException se a extensão não for permitida
     */
    private void validateExtension(String filename, List<String> allowedExtensions) {
        if (filename == null) {
            throw new IllegalArgumentException("Nome do arquivo não pode ser nulo");
        }

        String lowerFilename = filename.toLowerCase();

        // Verificar extensões perigosas
        for (String ext : DANGEROUS_EXTENSIONS) {
            if (lowerFilename.endsWith(ext)) {
                throw new IllegalArgumentException("Extensão de arquivo não permitida por segurança");
            }
        }

        // Verificar se está nas extensões permitidas
        boolean allowed = allowedExtensions.stream()
            .anyMatch(lowerFilename::endsWith);

        if (!allowed) {
            throw new IllegalArgumentException("Extensão de arquivo não permitida");
        }
    }

    /**
     * Sanitiza o nome do arquivo removendo caracteres especiais.
     * @param filename Nome original do arquivo
     * @return Nome sanitizado
     */
    public String sanitizeFilename(String filename) {
        if (filename == null) {
            return null;
        }

        // Remover path e manter apenas o nome do arquivo
        String sanitized = filename.replaceAll(".*[/\\\\]", "");

        // Substituir caracteres especiais por underscore
        sanitized = sanitized.replaceAll("[^a-zA-Z0-9._\\-]", "_");

        // Remover múltiplos underscores
        sanitized = sanitized.replaceAll("_+", "_");

        // Garantir que não comece ou termine com ponto
        sanitized = sanitized.replaceAll("^\\.+|\\.+$", "");

        return sanitized;
    }

    /**
     * Gera um nome de arquivo único e seguro.
     * @param originalFilename Nome original do arquivo
     * @return Nome de arquivo único
     */
    public String generateUniqueFilename(String originalFilename) {
        String sanitized = sanitizeFilename(originalFilename);
        String extension = "";

        if (sanitized != null && sanitized.lastIndexOf('.') > 0) {
            extension = sanitized.substring(sanitized.lastIndexOf('.'));
            sanitized = sanitized.substring(0, sanitized.lastIndexOf('.'));
        }

        // Truncar nome muito longo (max 50 caracteres antes da extensão)
        if (sanitized != null && sanitized.length() > 50) {
            sanitized = sanitized.substring(0, 50);
        }

        return System.currentTimeMillis() + "_" + 
               java.util.UUID.randomUUID().toString().substring(0, 8) + 
               (sanitized != null ? "_" + sanitized : "") + 
               extension;
    }
}
