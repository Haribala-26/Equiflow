# 🏛️ Architectural Decision Records (ADRs)

This directory documents the key architectural decisions made during the design, engineering, and implementation of **EQUIFLOW**.

## 📑 Index of Architecture Decisions

| ADR Number | Title | Status | Date | Core Focus |
| :--- | :--- | :---: | :---: | :--- |
| **[ADR-001](./ADR-001-hexagonal-architecture.md)** | Hexagonal Ports-and-Adapters Architecture | **Accepted** | 2026-11 | Decoupled domain math from UI and database |
| **[ADR-002](./ADR-002-dual-persistence-prisma-postgres.md)** | Dual-Source Persistence (`DATA_SOURCE=mock \| prisma`) | **Accepted** | 2026-11 | Zero-setup demo with PostgreSQL 16 ACID support |
| **[ADR-003](./ADR-003-server-side-rbac-and-governance.md)** | Server-Side RBAC Guard & Session Governance | **Accepted** | 2026-11 | Enforcing HTTP 403 on API routes, not just UI hiding |
| **[ADR-004](./ADR-004-two-phase-fairness-allocation.md)** | 2-Phase Constrained Supply Allocation Algorithm | **Accepted** | 2026-11 | 20% anti-starvation floor + Hamilton-Hare rounding |
| **[ADR-005](./ADR-005-responsible-ai-and-deterministic-fallback.md)** | Responsible AI with Deterministic Heuristic Fallback | **Accepted** | 2026-11 | Human-in-the-loop gate + zero offline single point of failure |
| **[ADR-006](./ADR-006-immutable-audit-logging.md)** | Append-Only Cryptographic Audit Logging | **Accepted** | 2026-11 | Immutable ledger preventing deletion/modification |

---

## 🧭 Decision Context & Principles

1. **Human Accountability**: AI assists in unstructured field narrative extraction; it is strictly prohibited from autonomously dispatching relief inventory.
2. **Deterministic Reproducibility**: Given identical input requests and stock levels, mathematical allocations yield identical, verifiable results.
3. **Resilience in Disaster Contexts**: The platform functions seamlessly offline or in in-memory mode without external database connection failures.
