# Data Security Notes

## Assumptions

- The platform must not store credentials, private tokens, authenticated content, or bypassed access-controlled data.
- Admin ingestion endpoints need explicit protection before they are exposed outside local development.
- Source metadata can include untrusted content and must be treated as unsafe input.

## Implementation Choices

- Use environment variables for service keys, admin tokens, API credentials, and scheduling secrets.
- Keep service-role Supabase access on the server only.
- Sanitize rendered descriptions, README excerpts, tags, and source-provided HTML before display.
- Record crawl errors without leaking secrets, request headers, cookies, or full signed URLs.
- Gate ingestion writes behind server-only code paths and protected admin endpoints.

## Risks

- Raw payloads may contain unexpected secrets if a source accidentally publishes them.
- GitHub URLs, install commands, and package metadata can point users to malicious projects.
- Overly verbose error logging can expose environment or infrastructure details.
- Public admin endpoints can trigger abuse, high crawl cost, or database churn if not protected.

## Validation Results

- Pending. Verify no secrets are hardcoded in source, docs, fixtures, or migrations.
- Pending. Confirm admin ingestion routes reject unauthorized requests before deployment.
