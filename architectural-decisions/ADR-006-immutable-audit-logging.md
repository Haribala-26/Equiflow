# ADR-006: Append-Only Cryptographic Audit Logging

## Status
**Accepted**

## Context
Humanitarian aid distribution is vulnerable to political interference, diversion, or retrospective blame shifting. Decision-makers need an unalterable record of why allocations were modified, who authorized them, and what scoring policies were active.

## Decision
Implement an append-only `AuditEvent` model in the data layer:
- Every formula policy change, inventory modification, manual override, AI acceptance, and demo reset creates an immutable audit record.
- Database rules and repository interfaces strictly forbid `UPDATE` and `DELETE` queries on `AuditEvent`.
- The Administrator view includes a full, filterable audit ledger.

## Consequences
- **Positive**: Full transparency, forensic accountability, and compliance with disaster governance standards.
- **Positive**: Protects coordinators by capturing verified rationales for every emergency override.
