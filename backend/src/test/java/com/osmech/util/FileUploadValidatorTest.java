package com.osmech.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testes unitários para FileUploadValidator.
 */
class FileUploadValidatorTest {

    private final FileUploadValidator validator = new FileUploadValidator();

    @Test
    void testValidateImage_ValidJpeg() {
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.jpg",
            "image/jpeg",
            "dummy content".getBytes()
        );

        assertDoesNotThrow(() -> validator.validateImage(file));
    }

    @Test
    void testValidateImage_ValidPng() {
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.png",
            "image/png",
            "dummy content".getBytes()
        );

        assertDoesNotThrow(() -> validator.validateImage(file));
    }

    @Test
    void testValidateImage_InvalidType() {
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.exe",
            "application/x-executable",
            "dummy content".getBytes()
        );

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateImage(file)
        );
        assertTrue(exception.getMessage().contains("não permitido"));
    }

    @Test
    void testValidateImage_TooLarge() {
        byte[] largeContent = new byte[6 * 1024 * 1024]; // 6MB
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.jpg",
            "image/jpeg",
            largeContent
        );

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateImage(file)
        );
        assertTrue(exception.getMessage().contains("Tamanho máximo"));
    }

    @Test
    void testValidateImage_EmptyFile() {
        MultipartFile file = new MockMultipartFile(
            "file",
            "test.jpg",
            "image/jpeg",
            new byte[0]
        );

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateImage(file)
        );
        assertTrue(exception.getMessage().contains("vazio"));
    }

    @Test
    void testValidateDocument_ValidPdf() {
        MultipartFile file = new MockMultipartFile(
            "file",
            "document.pdf",
            "application/pdf",
            "dummy content".getBytes()
        );

        assertDoesNotThrow(() -> validator.validateDocument(file));
    }

    @Test
    void testValidateDocument_InvalidExtension() {
        MultipartFile file = new MockMultipartFile(
            "file",
            "script.php",
            "application/pdf",
            "dummy content".getBytes()
        );

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateDocument(file)
        );
        assertTrue(exception.getMessage().contains("Extensão"));
    }

    @Test
    void testValidateFilename_PathTraversal() {
        assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateFilename("../../etc/passwd")
        );
    }

    @Test
    void testValidateFilename_SpecialCharacters() {
        assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateFilename("file<script>.jpg")
        );
    }

    @Test
    void testSanitizeFilename_RemovesSpecialChars() {
        String sanitized = validator.sanitizeFilename("my file@#$%name.jpg");
        assertEquals("my_file_name.jpg", sanitized);
    }

    @Test
    void testSanitizeFilename_RemovesPath() {
        String sanitized = validator.sanitizeFilename("/home/user/../file.jpg");
        assertEquals("file.jpg", sanitized);
    }

    @Test
    void testGenerateUniqueFilename() {
        String unique1 = validator.generateUniqueFilename("test.jpg");
        String unique2 = validator.generateUniqueFilename("test.jpg");

        assertNotNull(unique1);
        assertNotNull(unique2);
        assertNotEquals(unique1, unique2);
        assertTrue(unique1.endsWith(".jpg"));
        assertTrue(unique2.endsWith(".jpg"));
    }

    @Test
    void testValidateDangerousExtensions() {
        String[] dangerousFiles = {
            "malware.exe", "script.bat", "hack.php", "virus.vbs"
        };

        for (String filename : dangerousFiles) {
            MultipartFile file = new MockMultipartFile(
                "file",
                filename,
                "application/octet-stream",
                "content".getBytes()
            );

            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateDocument(file)
            );
            assertTrue(exception.getMessage().contains("não permitida"));
        }
    }
}
