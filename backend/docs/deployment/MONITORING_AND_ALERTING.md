# Monitoring and Alerting

This document defines monitoring and alerting procedures for the Chioma backend, covering metrics collection, alert configuration, dashboard creation, alert response, escalation, and tuning.

Use this together with:

- [Deployment Runbook](./DEPLOYMENT.md)
- [Logging and Monitoring](../LOGGING_AND_MONITORING.md)
- [Production Setup](./PRODUCTION_SETUP.md)

---

## 1. Overview

Monitoring and alerting enable:

- early detection of service degradation
- rapid incident response
- capacity planning and performance optimization
- compliance and audit trail requirements

This document is written for operators, on-call engineers, and SREs responsible for maintaining production availability.

---

## 2. Metrics Collection

### 2.1 Metrics Sources

Chioma collects metrics from:

- application instrumentation (NestJS + Prometheus client)
- database (PostgreSQL query performance, connection pool)
- cache (Redis hit/miss rates, memory usage)
- infrastructure (CPU, memory, disk, network)
- external dependencies (Stellar RPC, third-party APIs)
- background jobs (Bull queue metrics)

### 2.2 Application Metrics

Key application metrics exposed at `/metrics`:

| Metric                           | Type      | Description                                  |
| -------------------------------- | --------- | -------------------------------------------- |
| `http_requests_total`            | Counter   | Total HTTP requests by method, route, status |
| `http_request_duration_seconds`  | Histogram | Request latency distribution                 |
| `http_requests_in_flight`        | Gauge     | Current active requests                      |
| `db_query_duration_seconds`      | Histogram | Database query latency                       |
| `db_connections_active`          | Gauge     | Active database connections                  |
| `db_connections_idle`            | Gauge     | Idle database connections                    |
| `redis_commands_total`           | Counter   | Redis commands by operation                  |
| `redis_command_duration_seconds` | Histogram | Redis operation latency                      |
| `queue_jobs_total`               | Counter   | Queue jobs by queue name and status          |
| `queue_jobs_active`              | Gauge     | Currently processing jobs                    |
| `queue_jobs_waiting`             | Gauge     | Jobs waiting in queue                        |
| `queue_jobs_failed`              | Counter   | Failed jobs by queue and reason              |
| `stellar_rpc_requests_total`     | Counter   | Stellar RPC calls by method                  |
| `stellar_rpc_errors_total`       | Counter   | Stellar RPC errors by type                   |

### 2.3 Infrastructure Metrics

Collected by node exporters or platform agents:

- CPU utilization per core and aggregate
- memory usage and swap
- disk I/O and space utilization
- network throughput and errors
- container restarts and OOM kills

### 2.4 Database Metrics

PostgreSQL metrics via `pg_stat_*` views or exporters:

- active connections
- transaction rate
- query execution time (p50, p95, p99)
- cache hit ratio
- deadlocks and lock waits
- replication lag (if applicable)
- table and index bloat

### 2.5 Cache Metrics

Redis metrics via INFO command or exporters:

- memory usage and fragmentation
- keyspace size
- hit/miss ratio
- evicted keys
- connected clients
- command latency

### 2.6 Queue Metrics

Bull queue metrics via Bull Board or custom instrumentation:

- jobs completed per minute
- jobs failed per minute
- queue depth by queue name
- job processing time
- stalled jobs
- retry attempts

### 2.7 External Dependency Metrics

Track third-party service health:

- Stellar RPC response time and error rate
- tenant screening API availability
- payment gateway latency
- webhook delivery success rate

### 2.8 Metrics Retention

Retention policy by environment:

- development: 7 days
- staging: 30 days
- production: 90 days minimum, 1 year recommended

High-resolution metrics (15s scrape interval) should be downsampled after 30 days to reduce storage costs.

### 2.9 Metrics Collection Stack

Current stack defined in `backend/docker-compose.monitoring.yml`:

- Prometheus: metrics storage and querying
- Node Exporter: host-level metrics
- cAdvisor: container metrics
- Postgres Exporter: database metrics
- Redis Exporter: cache metrics

Prometheus configuration: `backend/monitoring/prometheus/prometheus.yml`

Scrape targets:

```yaml
scrape_configs:
  - job_name: 'chioma-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 2.10 Metrics Best Practices

- use consistent naming conventions (snake_case)
- include units in metric names (`_seconds`, `_bytes`, `_total`)
- use labels for dimensions, not metric names
- avoid high-cardinality labels (user IDs, request IDs)
- instrument critical paths first, expand coverage iteratively
- document custom metrics in code comments

---

## 3. Alert Configuration

### 3.1 Alert Philosophy

Alerts should be:

- actionable: every alert requires human intervention
- specific: clear signal, minimal noise
- urgent: indicates active or imminent customer impact
- documented: runbook link included

Non-actionable signals belong in dashboards, not alerts.

### 3.2 Alert Severity Levels

| Severity | Description                            | Response Time     | Escalation     |
| -------- | -------------------------------------- | ----------------- | -------------- |
| Critical | Service down or severe degradation     | Immediate         | Page on-call   |
| High     | Partial degradation, customer impact   | 15 minutes        | Notify on-call |
| Medium   | Warning threshold, no immediate impact | 1 hour            | Team channel   |
| Low      | Informational, trend monitoring        | Next business day | Email/ticket   |

### 3.3 Core Production Alerts

Alerts defined in `backend/monitoring/prometheus/alerts.yml`:

#### Service Availability

```yaml
- alert: ServiceDown
  expr: up{job="chioma-backend"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: 'Chioma backend is down'
    description: 'Backend service has been unreachable for 1 minute'
    runbook: 'https://docs.chioma.io/runbooks/service-down'
```

#### High Error Rate

```yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{status=~"5.."}[5m])) 
    / 
    sum(rate(http_requests_total[5m])) > 0.05
  for: 5m
  labels:
    severity: high
  annotations:
    summary: 'High 5xx error rate detected'
    description: 'Error rate is {{ $value | humanizePercentage }} over 5 minutes'
    runbook: 'https://docs.chioma.io/runbooks/high-error-rate'
```

#### High Latency

```yaml
- alert: HighLatency
  expr: |
    histogram_quantile(0.95, 
      rate(http_request_duration_seconds_bucket[5m])
    ) > 2
  for: 10m
  labels:
    severity: high
  annotations:
    summary: 'High request latency detected'
    description: 'P95 latency is {{ $value }}s over 10 minutes'
    runbook: 'https://docs.chioma.io/runbooks/high-latency'
```

#### Database Connection Pool Exhaustion

```yaml
- alert: DatabaseConnectionPoolExhausted
  expr: |
    db_connections_active / 
    (db_connections_active + db_connections_idle) > 0.9
  for: 5m
  labels:
    severity: high
  annotations:
    summary: 'Database connection pool near exhaustion'
    description: '{{ $value | humanizePercentage }} of connections in use'
    runbook: 'https://docs.chioma.io/runbooks/db-pool-exhausted'
```

#### Redis Memory High

```yaml
- alert: RedisMemoryHigh
  expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.85
  for: 10m
  labels:
    severity: medium
  annotations:
    summary: 'Redis memory usage high'
    description: 'Redis using {{ $value | humanizePercentage }} of max memory'
    runbook: 'https://docs.chioma.io/runbooks/redis-memory'
```

#### Queue Backlog Growing

```yaml
- alert: QueueBacklogGrowing
  expr: |
    deriv(queue_jobs_waiting[10m]) > 10
  for: 15m
  labels:
    severity: medium
  annotations:
    summary: 'Queue backlog growing'
    description: 'Queue {{ $labels.queue }} backlog increasing'
    runbook: 'https://docs.chioma.io/runbooks/queue-backlog'
```

#### High Job Failure Rate

```yaml
- alert: HighJobFailureRate
  expr: |
    sum(rate(queue_jobs_failed[5m])) 
    / 
    sum(rate(queue_jobs_total[5m])) > 0.1
  for: 10m
  labels:
    severity: high
  annotations:
    summary: 'High background job failure rate'
    description: '{{ $value | humanizePercentage }} of jobs failing'
    runbook: 'https://docs.chioma.io/runbooks/job-failures'
```

#### Disk Space Low

```yaml
- alert: DiskSpaceLow
  expr: |
    (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15
  for: 5m
  labels:
    severity: high
  annotations:
    summary: 'Disk space low on {{ $labels.instance }}'
    description: 'Only {{ $value | humanizePercentage }} space remaining'
    runbook: 'https://docs.chioma.io/runbooks/disk-space'
```

#### SSL Certificate Expiring

```yaml
- alert: SSLCertificateExpiringSoon
  expr: |
    (ssl_certificate_expiry_seconds - time()) / 86400 < 14
  for: 1h
  labels:
    severity: medium
  annotations:
    summary: 'SSL certificate expiring soon'
    description: 'Certificate expires in {{ $value }} days'
    runbook: 'https://docs.chioma.io/runbooks/ssl-renewal'
```

### 3.4 Alert Routing

Alertmanager configuration: `backend/monitoring/alertmanager/alertmanager.yml`

```yaml
route:
  receiver: 'team-channel'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    - match:
        severity: high
      receiver: 'on-call-slack'
      continue: true

    - match:
        severity: medium
      receiver: 'team-channel'

receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<PAGERDUTY_SERVICE_KEY>'

  - name: 'on-call-slack'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK_URL>'
        channel: '#on-call'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'team-channel'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK_URL>'
        channel: '#chioma-alerts'
```

### 3.5 Alert Inhibition

Prevent alert storms by inhibiting dependent alerts:

```yaml
inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'high'
    equal: ['instance']

  - source_match:
      alertname: 'ServiceDown'
    target_match_re:
      alertname: '(HighErrorRate|HighLatency|DatabaseConnectionPoolExhausted)'
    equal: ['instance']
```

---

## 4. Dashboard Creation

### 4.1 Dashboard Philosophy

Dashboards should:

- answer specific operational questions
- show trends over time
- highlight anomalies
- enable drill-down investigation
- load quickly (avoid expensive queries)

### 4.2 Core Dashboards

#### Service Overview Dashboard

Purpose: high-level service health

Panels:

- request rate (requests/sec)
- error rate (%)
- latency (p50, p95, p99)
- active instances
- CPU and memory usage
- database connection pool
- Redis hit rate

Time range: last 1 hour, auto-refresh 30s

#### Database Performance Dashboard

Purpose: database health and query performance

Panels:

- active connections
- transaction rate
- query duration (p50, p95, p99)
- cache hit ratio
- deadlocks
- slow queries (top 10)
- table sizes
- index usage

Time range: last 6 hours

#### Queue Monitoring Dashboard

Purpose: background job health

Panels:

- jobs completed per minute by queue
- jobs failed per minute by queue
- queue depth by queue
- job processing time (p50, p95, p99)
- stalled jobs
- retry attempts

Time range: last 1 hour

#### Infrastructure Dashboard

Purpose: host and container health

Panels:

- CPU utilization
- memory usage
- disk I/O
- network throughput
- container restarts
- disk space remaining

Time range: last 24 hours

#### Business Metrics Dashboard

Purpose: product and business KPIs

Panels:

- user registrations per hour
- active sessions
- property listings created
- rental agreements signed
- escrow transactions
- API usage by endpoint

Time range: last 7 days

### 4.3 Dashboard Variables

Use Grafana variables for filtering:

- `$environment`: dev, staging, production
- `$instance`: specific backend instance
- `$queue`: queue name filter
- `$endpoint`: API endpoint filter

### 4.4 Dashboard Annotations

Mark deployments and incidents:

- deployment markers from CI/CD
- incident start/end times
- configuration changes
- maintenance windows

### 4.5 Dashboard Organization

Grafana folder structure:

```
Chioma/
├── Overview/
│   └── Service Overview
├── Application/
│   ├── API Performance
│   ├── Authentication
│   └── Background Jobs
├── Infrastructure/
│   ├── Hosts
│   ├── Containers
│   └── Network
├── Data Layer/
│   ├── PostgreSQL
│   ├── Redis
│   └── Stellar RPC
└── Business/
    └── KPIs
```

### 4.6 Dashboard Provisioning

Dashboards as code in `backend/monitoring/grafana/provisioning/dashboards/`:

- `service-overview.json`
- `database-performance.json`
- `queue-monitoring.json`
- `infrastructure.json`

Provisioning config in `backend/monitoring/grafana/provisioning/dashboards/dashboard.yml`:

```yaml
apiVersion: 1

providers:
  - name: 'Chioma Dashboards'
    orgId: 1
    folder: 'Chioma'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /etc/grafana/provisioning/dashboards
```

---

## 5. Alert Response Procedures

### 5.1 Alert Response Workflow

1. Acknowledge alert in alerting system
2. Assess severity and customer impact
3. Check relevant dashboards
4. Review recent changes (deployments, config)
5. Investigate logs and traces
6. Mitigate immediate impact
7. Identify root cause
8. Implement fix
9. Verify resolution
10. Document incident

### 5.2 ServiceDown Alert Response

Symptoms:

- health check failing
- no metrics being scraped
- service unreachable

Diagnostics:

```bash
# Check service status
docker ps | grep chioma-backend

# Check logs
docker logs chioma-backend --tail 100

# Check health endpoint
curl http://localhost:5000/health

# Check database connectivity
docker exec chioma-backend npm run typeorm query "SELECT 1"
```

Common causes:

- application crash (OOM, unhandled exception)
- database connection failure
- Redis connection failure
- port binding conflict
- configuration error

Mitigation:

1. Restart service if transient failure
2. Roll back recent deployment if related
3. Scale horizontally if capacity issue
4. Fix configuration if misconfigured

### 5.3 HighErrorRate Alert Response

Symptoms:

- elevated 5xx responses
- error spike in logs
- Sentry error grouping

Diagnostics:

```bash
# Check error distribution by endpoint
curl http://localhost:9090/api/v1/query?query='sum by (route) (rate(http_requests_total{status=~"5.."}[5m]))'

# Check recent errors in logs
docker logs chioma-backend --since 10m | grep ERROR

# Check Sentry for error details
# Visit Sentry dashboard
```

Common causes:

- database query timeout
- external API failure
- unhandled exception in new code
- resource exhaustion

Mitigation:

1. Identify failing endpoint
2. Check external dependencies
3. Review recent code changes
4. Roll back if deployment-related
5. Add circuit breaker if external API issue

### 5.4 HighLatency Alert Response

Symptoms:

- slow API responses
- timeout errors
- user complaints

Diagnostics:

```bash
# Check latency by endpoint
curl http://localhost:9090/api/v1/query?query='histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'

# Check database slow queries
docker exec postgres psql -U chioma -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check active connections
docker exec postgres psql -U chioma -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

Common causes:

- slow database queries
- missing indexes
- N+1 query problem
- external API latency
- resource contention

Mitigation:

1. Identify slow endpoint
2. Optimize database queries
3. Add caching
4. Scale resources
5. Add timeouts to external calls

### 5.5 DatabaseConnectionPoolExhausted Alert Response

Symptoms:

- connection timeout errors
- slow query execution
- service degradation

Diagnostics:

```bash
# Check connection pool status
curl http://localhost:5000/health/detailed | jq '.database'

# Check active queries
docker exec postgres psql -U chioma -c "SELECT pid, usename, state, query FROM pg_stat_activity WHERE state != 'idle';"

# Check for long-running transactions
docker exec postgres psql -U chioma -c "SELECT pid, now() - xact_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"
```

Common causes:

- connection leak (not releasing connections)
- long-running queries
- pool size too small
- sudden traffic spike

Mitigation:

1. Kill long-running queries if safe
2. Restart service to reset pool
3. Increase pool size if capacity issue
4. Fix connection leak in code

### 5.6 QueueBacklogGrowing Alert Response

Symptoms:

- jobs not processing
- queue depth increasing
- delayed background tasks

Diagnostics:

```bash
# Check queue status
curl http://localhost:5000/admin/queues

# Check failed jobs
# Visit Bull Board UI

# Check worker logs
docker logs chioma-backend | grep "Queue worker"
```

Common causes:

- worker crash or stuck
- job processing too slow
- insufficient workers
- external dependency failure

Mitigation:

1. Check worker health
2. Restart workers
3. Scale worker count
4. Pause queue if external issue
5. Clear failed jobs if safe

---

## 6. Alert Escalation

### 6.1 Escalation Policy

| Time   | Action                                                  |
| ------ | ------------------------------------------------------- |
| 0 min  | Alert fires, notify primary on-call                     |
| 15 min | If unacknowledged, notify secondary on-call             |
| 30 min | If unresolved, notify engineering manager               |
| 60 min | If unresolved, notify CTO and initiate incident command |

### 6.2 Escalation Triggers

Escalate immediately for:

- data loss or corruption
- security breach
- complete service outage
- payment processing failure
- regulatory compliance violation

### 6.3 Incident Command

For major incidents:

1. Declare incident in team channel
2. Assign incident commander
3. Create incident Slack channel
4. Assign roles: commander, communications, operations
5. Establish status update cadence
6. Document timeline and actions
7. Conduct post-incident review

---

## 7. Alert Tuning

### 7.1 Alert Tuning Goals

- reduce false positives
- eliminate alert fatigue
- improve signal-to-noise ratio
- ensure actionable alerts only

### 7.2 Alert Review Cadence

- weekly: review alert volume and response times
- monthly: review alert effectiveness and tune thresholds
- quarterly: review alert coverage and add new alerts

### 7.3 Alert Tuning Process

1. Identify noisy alerts (high fire rate, low action rate)
2. Analyze root cause of noise
3. Adjust threshold, duration, or inhibition rules
4. Test changes in staging
5. Deploy to production
6. Monitor for 1 week
7. Iterate if needed

### 7.4 Alert Metrics

Track alert effectiveness:

- alert fire rate
- alert acknowledgment time
- alert resolution time
- false positive rate
- alert-to-incident ratio

Target metrics:

- <5% false positive rate
- > 95% acknowledgment within SLA
- > 90% resolution within SLA

### 7.5 Common Tuning Adjustments

- increase `for` duration to reduce transient alerts
- adjust threshold based on historical data
- add inhibition rules to prevent cascading alerts
- split broad alerts into specific alerts
- remove alerts that never lead to action

---

## 8. Monitoring Checklist

Pre-deployment:

- [ ] Metrics endpoints accessible
- [ ] Prometheus scraping targets
- [ ] Alertmanager routing configured
- [ ] Dashboards provisioned
- [ ] Alert runbooks documented
- [ ] On-call rotation configured
- [ ] Escalation policy defined
- [ ] Incident response plan reviewed

Post-deployment:

- [ ] Verify metrics flowing
- [ ] Verify alerts firing correctly
- [ ] Verify dashboards loading
- [ ] Verify alert routing
- [ ] Test alert acknowledgment
- [ ] Test escalation flow
- [ ] Document any anomalies

Ongoing:

- [ ] Review alert volume weekly
- [ ] Tune noisy alerts monthly
- [ ] Update dashboards as needed
- [ ] Rotate on-call schedule
- [ ] Conduct incident reviews
- [ ] Update runbooks
- [ ] Train new team members

---

## 9. Monitoring Troubleshooting

### 9.1 Metrics Not Appearing

Check:

- Prometheus target status: `http://localhost:9090/targets`
- application `/metrics` endpoint accessibility
- network connectivity between Prometheus and targets
- scrape interval and timeout configuration
- authentication if required

### 9.2 Alerts Not Firing

Check:

- alert rule syntax in Prometheus
- alert evaluation interval
- alert `for` duration
- metric availability
- Alertmanager connectivity

### 9.3 Alerts Not Routing

Check:

- Alertmanager configuration
- receiver configuration (webhook URLs, API keys)
- routing rules and matchers
- inhibition rules
- silences

### 9.4 Dashboards Not Loading

Check:

- Grafana datasource configuration
- Prometheus connectivity
- query syntax
- time range selection
- dashboard permissions

### 9.5 High Cardinality Issues

Symptoms:

- Prometheus memory usage high
- slow query performance
- scrape timeouts

Solutions:

- reduce label cardinality
- drop unused metrics
- increase Prometheus resources
- implement metric relabeling

---

## 10. References

- [Deployment Runbook](./DEPLOYMENT.md)
- [Logging and Monitoring](../LOGGING_AND_MONITORING.md)
- [Production Setup](./PRODUCTION_SETUP.md)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
