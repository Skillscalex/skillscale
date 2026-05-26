# Data Protection Notes

## Assumptions

- The crawler should ingest public directory data only.
- Personal data should be minimized and retained only when it is part of public source attribution, such as an author name or public profile URL.
- Raw and normalized records require retention for provenance and auditability, but retention rules should be explicit.

## Implementation Choices

- Store source attribution fields separately from user account data.
- Avoid collecting cookies, session identifiers, emails hidden behind auth, or private profile details.
- Preserve raw data for auditability while marking stale/missing records instead of deleting them automatically.
- Document source methodology and stale-record handling for transparency.
- Keep future deletion/anonymization workflows possible by retaining source IDs and provenance links.

## Risks

- Public pages can contain personal information that is not necessary for marketplace discovery.
- Long-term raw payload storage can increase privacy exposure if not reviewed.
- Duplicate records may preserve outdated author or maintainer identity after upstream changes.
- Different jurisdictions may impose retention or removal obligations for public personal data.

## Validation Results

- Pending. Review normalized fields for data minimization before enabling scheduled ingestion.
- Pending. Add documentation for stale data, correction requests, and removal handling.
