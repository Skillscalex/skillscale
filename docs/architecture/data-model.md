# Data Model

Canonical platform entities:

```text
Skill
Agent
Tool
Workflow
User
Organization
Outcome
Solution
Credential
Reputation
TrustEdge
UsageEvent
LearningEvent
Transaction
Subscription
ValueShareAgreement
```

Core graph edges:

```text
USER_HAS_SKILL
USER_LEARNS_SKILL
SKILL_DEPENDS_ON_SKILL
AGENT_USES_SKILL
TOOL_ENABLES_SKILL
SKILL_PRODUCES_OUTCOME
OUTCOME_HAS_VALUE
USER_COMPLETED_OUTCOME
ORG_TRUSTS_USER
USER_REVIEWED_SKILL
SKILL_EARNED_REPUTATION
SOLUTION_BUNDLES_SKILLS
```

Privacy rule: public skill graph rows are readable; private user/vault/reputation evidence requires RLS and explicit access policies.
