# Alerts Setup Guide

Configuration for monitoring and alerting on MCP Gateway metrics.

## Alert Thresholds

| Metric | Warning | Critical | Window |
|--------|---------|----------|--------|
| p95 Latency | > 500ms | > 1000ms | 5 min |
| Error Rate | > 1% | > 5% | 5 min |
| WebSocket Drops | > 10/min | > 50/min | 1 min |
| Memory Usage | > 80% | > 95% | 5 min |
| CPU Usage | > 70% | > 90% | 5 min |

## Slack Integration

1. Create Slack App at https://api.slack.com/apps
2. Add Incoming Webhook
3. Set webhook URL in environment:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
   ```

4. Configure alert template:
   ```json
   {
     "channel": "#kis-alerts",
     "username": "MCP Gateway",
     "icon_emoji": ":warning:",
     "text": "Alert: ${metric} threshold exceeded",
     "attachments": [{
       "color": "${severity}",
       "fields": [
         {"title": "Metric", "value": "${metric}", "short": true},
         {"title": "Value", "value": "${value}", "short": true},
         {"title": "Threshold", "value": "${threshold}", "short": true},
         {"title": "Environment", "value": "${environment}", "short": true}
       ]
     }]
   }
   ```

## Email Alerts (SendGrid)

1. Get SendGrid API key
2. Configure environment:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   ALERT_EMAIL_FROM=alerts@kis-project.com
   ALERT_EMAIL_TO=team@kis-project.com
   ```

3. Email template:
   ```html
   Subject: [${severity}] MCP Gateway Alert - ${metric}

   Alert Details:
   - Metric: ${metric}
   - Current Value: ${value}
   - Threshold: ${threshold}
   - Time: ${timestamp}
   - Environment: ${environment}

   Action Required:
   ${action_items}
   ```

## Monitoring Dashboard

### Grafana Setup
```yaml
datasources:
  - name: MCP Metrics
    type: prometheus
    url: http://prometheus:9090

dashboards:
  - name: MCP Gateway
    panels:
      - title: Request Rate
        query: rate(mcp_requests_total[5m])
      - title: p95 Latency
        query: histogram_quantile(0.95, mcp_request_duration_seconds)
      - title: Error Rate
        query: rate(mcp_errors_total[5m])
      - title: WebSocket Connections
        query: mcp_websocket_connections_active
```

### Health Check Monitoring

```bash
# Uptime monitoring with curl
while true; do
  curl -f http://localhost:8080/health || \
    curl -X POST $SLACK_WEBHOOK_URL \
      -H "Content-Type: application/json" \
      -d '{"text":"MCP Gateway health check failed"}'
  sleep 60
done
```

## Alert Rules Configuration

```yaml
# prometheus-rules.yml
groups:
  - name: mcp_gateway
    interval: 30s
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(mcp_request_duration_seconds[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High p95 latency detected"
          description: "p95 latency is {{ $value }}s (threshold: 0.5s)"

      - alert: HighErrorRate
        expr: rate(mcp_errors_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}% (threshold: 1%)"

      - alert: WebSocketDrops
        expr: rate(mcp_websocket_drops_total[1m]) > 10
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High WebSocket drop rate"
          description: "{{ $value }} drops/min (threshold: 10/min)"
```

## Incident Response

### Playbook Template
1. **Acknowledge alert** within 5 minutes
2. **Assess severity** using metrics dashboard
3. **Notify stakeholders** if customer-facing
4. **Investigate root cause** using logs
5. **Implement fix** or mitigation
6. **Monitor recovery** for 30 minutes
7. **Post-mortem** for critical incidents

### Escalation Path
1. On-call engineer (0-15 min)
2. Team lead (15-30 min)
3. Platform team (30+ min)

## Testing Alerts

```bash
# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test alert from MCP Gateway"}'

# Simulate high latency
curl -X POST http://localhost:8080/debug/simulate-latency?ms=1500

# Simulate errors
for i in {1..100}; do
  curl -X POST http://localhost:8080/debug/trigger-error
done
```

## Required Keys (Manual Setup)

⚠️ These must be configured in your monitoring platform:

- **Slack**: Get webhook URL from Slack app settings
- **SendGrid**: Get API key from SendGrid dashboard
- **PagerDuty**: Get integration key from PagerDuty service
- **Datadog**: Get API key from Datadog organization settings