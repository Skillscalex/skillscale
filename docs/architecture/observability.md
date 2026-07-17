# Observability

Every service must emit structured logs, metrics, and trace identifiers.

## Minimum events

- request started/completed/failed
- authz denied
- orchestration job created/progress/completed/failed
- ingestion batch started/completed/failed
- reputation event accepted/rejected
- billing event accepted/rejected
- deployment/canary status

## Dashboards

- API latency and error rate
- skills mirror coverage
- orchestration job success rate
- trust/reputation event volume
- billing conversion and usage
- production deployment health
