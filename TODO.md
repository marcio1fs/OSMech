# TODO - Correção do erro de startup (JavaMailSender / MessagingException)

- [ ] Analisar falha: bean `noopMailSender` (DevNoopMailConfiguration) está lançando `jakarta/mail/MessagingException`.
- [ ] Ajustar configuração para criar um `JavaMailSender` “noop” que não inicialize sessão/SMTP e não dispare exceção no startup.
- [ ] Preferir `@ConditionalOnProperty(notification.email.enabled=false)` para desabilitar completamente a criação do sender real.
- [ ] Remover dependência “mailSender obrigatório” no `EmailService` (tornar opcional/proteger construtor) para não quebrar o contexto.
- [ ] Recompilar e rodar o backend para confirmar que o ApplicationContext inicia.

