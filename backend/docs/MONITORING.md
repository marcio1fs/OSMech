# Monitoramento e Observabilidade - OSMECH

## Configuração de Monitoramento

### 1. Prometheus + Grafana

#### Instalação do Prometheus (Docker Compose)

```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - osmech-network
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    networks:
      - osmech-network
    restart: unless-stopped
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:

networks:
  osmech-network:
    external: true
```

#### Configuração do Prometheus (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'osmech-backend'
    static_configs:
      - targets: ['backend:8081']
    metrics_path: '/actuator/prometheus'
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 2. Health Checks Avançados

O OSMECH já implementa health checks customizados:

- **DatabaseHealthIndicator**: Verifica conexão e tempo de resposta do banco
- **ExternalServicesHealthIndicator**: Monitora Mercado Pago e outros serviços externos
- **StorageHealthIndicator**: Verifica espaço em disco disponível

Endpoints disponíveis:
- `GET /actuator/health` - Status geral
- `GET /actuator/health/liveness` - Sonda de vivacidade (Kubernetes)
- `GET /actuator/health/readiness` - Sonda de prontidão (Kubernetes)
- `GET /actuator/prometheus` - Métricas no formato Prometheus

### 3. Métricas Principais Monitoradas

#### JVM Metrics
- `jvm_memory_used_bytes` - Uso de memória
- `jvm_gc_pause_seconds` - Tempo de GC
- `jvm_threads_live` - Threads ativas

#### HTTP Metrics
- `http_server_requests_seconds` - Latência de requisições
- `http_server_requests_total` - Total de requisições por status

#### Database Metrics
- `hikaricp_connections_active` - Conexões ativas
- `hikaricp_connections_idle` - Conexões ociosas
- `hikaricp_connections_pending` - Conexões pendentes

#### Custom Metrics (implementar)
- `osmech_os_total` - Total de ordens de serviço
- `osmech_users_active` - Usuários ativos
- `osmech_payments_processed` - Pagamentos processados

### 4. Alertas Recomendados (Grafana/Prometheus)

```yaml
groups:
  - name: osmech-alerts
    rules:
      # Banco de dados indisponível
      - alert: DatabaseDown
        expr: up{job="osmech-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend OSMECH indisponível"
          
      # Alta latência
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Latência alta detectada (>2s p95)"
          
      # Erros 5xx elevados
      - alert: HighErrorRate
        expr: rate(http_server_requests_total{status=~"5.."}[5m]) / rate(http_server_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taxa de erro 5xx acima de 5%"
          
      # Pouco espaço em disco
      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Menos de 10% de espaço em disco"
          
      # HikariCP sem conexões disponíveis
      - alert: HikariCpExhausted
        expr: hikaricp_connections_pending > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Pool de conexões do banco esgotado"
```

### 5. Rastreamento Distribuído (Opcional)

Para microserviços futuros, implementar OpenTelemetry:

```xml
<!-- Adicionar ao pom.xml -->
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-spring-boot-starter</artifactId>
    <version>1.30.0</version>
</dependency>
```

Configurar Jaeger ou Zipkin para visualização de traces.

### 6. Logs Centralizados

#### Stack ELK (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

### 7. Dashboard Recomendado (Grafana)

Importar dashboard JSON com:
- Visão geral de saúde do sistema
- Métricas de JVM
- Latência de requisições HTTP
- Taxa de erro por endpoint
- Conexões do banco de dados
- Uso de CPU/memória do container
- Status dos serviços externos

### 8. Variáveis de Ambiente para Monitoramento

```bash
# Monitoring
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics,prometheus
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=when_authorized
MANAGEMENT_PROMETHEUS_METRICS_EXPORT_ENABLED=true

# Logging
LOGGING_LEVEL_COM_OSMECH=INFO
LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG
LOGGING_PATTERN_CONSOLE=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n

# Tracing (se habilitado)
OTEL_SERVICE_NAME=osmech-backend
OTEL_EXPORTER_JAEGER_ENDPOINT=http://jaeger:14268/api/traces
```

## Próximos Passos

1. **Implementar métricas customizadas** para regras de negócio
2. **Configurar alertas** no Slack/Teams/Email
3. **Criar dashboards** específicos por domínio (OS, Financeiro, Estoque)
4. **Implementar distributed tracing** para chamadas entre serviços
5. **Configurar log aggregation** centralizado
6. **Estabelecer SLOs/SLIs** para cada serviço crítico
