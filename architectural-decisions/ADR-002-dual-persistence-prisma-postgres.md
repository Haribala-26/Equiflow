# ADR-002: Dual-Persistence Architecture (`DATA_SOURCE=mock | prisma`)

## Status
**Accepted**

## Context
Hackathons, demonstrations, and rapid disaster field deployments often happen in constrained environments where spinning up a local PostgreSQL server is impossible or inconvenient. Conversely, enterprise deployments require relational data integrity, foreign keys, ACID transactions, and optimistic concurrency.

## Decision
Implement a single environment-driven repository factory:
- `DATA_SOURCE=mock` (Default): Uses an in-memory repository initialized with deterministic seed data for 7 Chennai flood wards.
- `DATA_SOURCE=prisma`: Connects to PostgreSQL 16 via Prisma ORM 6.4 with migrations and identical seed data.

Services (priority scoring, allocation, simulations, reports) interact strictly with `IRepository`, remaining completely agnostic of which backend is active.

## Consequences
- **Positive**: Instant "clone-and-run" experience for hackathon evaluators without needing Docker or PostgreSQL.
- **Positive**: Production deployments benefit from PostgreSQL relational constraints, indexes, and transactions.
- **Safety**: Both data sources use a shared, deterministic seed definition to prevent data drift.
