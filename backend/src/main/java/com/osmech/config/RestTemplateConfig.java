package com.osmech.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuração do RestTemplate como bean Spring.
 * Permite injeção, testes e configuração centralizada de timeouts.
 */
@Configuration
public class RestTemplateConfig {

    @Value("${spring.http.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${spring.http.read-timeout:30000}")
    private int readTimeout;

    @Value("${spring.http.write-timeout:30000}")
    private int writeTimeout;

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectTimeout))
                .setReadTimeout(Duration.ofMillis(readTimeout))
                .build();
    }
}
