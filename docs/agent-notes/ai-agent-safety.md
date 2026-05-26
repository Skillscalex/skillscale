# AI Agent Safety Notes

## Assumptions

- The catalog will include tools, plugins, commands, hooks, and agents that may execute code or access user environments.
- Source-provided install commands and READMEs are untrusted and should not be executed by the platform.
- Safety metadata should help users evaluate risk without presenting unverified claims as guarantees.

## Implementation Choices

- Store install commands as inert text and display them with source attribution.
- Add risk flags for broad file access, shell execution, network access, credential access, unknown license, abandoned source, and unverified publisher when detectable.
- Keep security notes separate from marketing descriptions.
- Avoid auto-running plugin code, hook scripts, package installs, or repository commands during ingestion.
- Prefer static metadata extraction over executing source projects.

## Risks

- A malicious component can disguise risky behavior behind harmless names or descriptions.
- Install commands can include destructive shell operations.
- README badges and claims can be spoofed.
- Users may interpret catalog inclusion as a security endorsement.

## Validation Results

- Pending. Add fixture tests for risky install commands and unknown-risk components.
- Pending. Confirm detail views show provenance and risk notes near install instructions.
