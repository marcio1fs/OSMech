package com.osmech.notification.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Configuração para dev/local sem SMTP real.
 * Cria um JavaMailSender noop quando e-mail está desabilitado ou não há host SMTP.
 */
@Configuration
@ConditionalOnProperty(name = "notification.email.enabled", havingValue = "false", matchIfMissing = true)
public class DevNoopMailConfiguration {

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender noopMailSender() {
        return new JavaMailSenderImpl();
    }
}
