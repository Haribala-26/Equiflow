# Equiflow — PostgreSQL & Prisma Database Design Specification

## 1. Architectural Overview
Equiflow implements a clean, enterprise-grade data layer using PostgreSQL and Prisma ORM, abstracted behind an identical repository interface (`IRepository`). The application dynamically toggles between in-memory mock persistence and live PostgreSQL storage via the `DATA_SOURCE` environment variable (`mock` or `prisma`), defaulting to `mock` for zero-configuration local evaluation.

```
                      ┌─────────────────────────────────┐
                      │    Business Domain / Engines    │
                      │  (Allocation, Priority, Sim)   │
                      └────────────────┬────────────────┘
                                       │ (Domain Types only)
                      ┌────────────────▼────────────────┐
                      │      IRepository Interface      │
                      └────────┬───────────────┬────────┘
                               │               │
            ┌──────────────────▼───┐       ┌───▼──────────────────┐
            │    MockRepository    │       │   PrismaRepository   │
            │  (In-Memory Baseline)│       │  (PostgreSQL Layer)  │
            └──────────────────────┘       └───────────┬──────────┘
                                                       │
                                           ┌───────────▼──────────┐
                                           │    PostgreSQL 16     │
                                           │  (ACID Transactions) │
                                           └──────────────────────┘
```

---

## 2. Relational Entity Schema

### 2.1 Core Identity & RBAC
- **`User`**: System operators with enforced roles (`ADMINISTRATOR`, `EMERGENCY_COORDINATOR`, `FIELD_OFFICER`, `RESOURCE_MANAGER`, `AUDITOR`, `VIEWER`), status toggles (`active`), and timestamps.

### 2.2 Disaster Operational Entities
- **`Area`**: Geographic wards (e.g. `CHN-001` Adyar) with coordinates (`lat`, `lng`), population demographics, vulnerability scores, severity, urgency, verification status, and soft-delete flag (`active`).
- **`Incident`**: Event records linked to affected areas specifying disaster category and status.
- **`NeedRequest`**: Humanitarian aid demands linked to areas, maintaining strict units (`packs`, `litres`, `kits`) and local supply levels.
- **`Assessment`**: AI and human assessment reports evaluating ward condition.

### 2.3 Priority & Policy Calibration
- **`PrioritySnapshot`**: Deterministic score records (0–100), categorization (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`), component breakdowns (JSON), formula version, and confidence metrics.
- **`PriorityConfig`**: Versioned MCDA policy weights (Severity, Urgency, Vulnerability, Unmet Need, Population Impact), population caps, and author tracking.

### 2.4 Warehouse Logistics & Concurrency
- **`Resource`**: Warehouse inventory tracking `type`, `unit`, `total`, and `reserved` stock with optimistic concurrency `version` column.
- **`InventoryBatch`**: Inbound logistical shipments tracking batch code, warehouse location, and expiration dates.

### 2.5 Constrained Optimization & Approvals
- **`AllocationRun`**: Algorithmic runs (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`) containing fairness metrics and an `inputVersion` hash for stale-run detection.
- **`AllocationItem`**: Individual ward-level resource dispatches with recommended quantities, unmet quantities, floor compliance, and rationales.
- **`Approval`**: Multi-signature decision records tracking approver identity, decision, and mandatory justification reason.
- **`Simulation`**: What-if stress-test scenario overrides (JSON) and baseline deltas.

### 2.6 Accountability & AI Traceability
- **`AuditEvent`**: Strictly append-only cryptographic ledger tracking actor ID, role, action, entity type, before/after snapshots, and justification reasons.
- **`AIAnalysis`**: Gemini assessment logs preserving raw LLM responses, validated structured outputs, and human acceptance status.

---

## 3. Data Integrity & Concurrency Rules

1. **Fixed Resource Units**: Resource units are strictly enforced at the database and application level:
   - Food: `packs`
   - Water: `litres`
   - Medical, Shelter, Hygiene: `kits`
   - Mixed or ambiguous units are rejected by schema validators.
2. **ACID Transactions**: Stock reservations on allocation run submission and final stock deductions upon approval execute inside atomic PostgreSQL `$transaction` blocks.
3. **Optimistic Concurrency Locking**: Inventory rows contain a `version` integer. Concurrent allocation commits that conflict with updated stock versions are rejected, preventing over-allocation.
4. **Stale Input Blocking**: When an allocation run is approved, the repository validates that ward needs and inventory versions have not changed since run computation. If inputs are stale, approval is blocked and recomputation is enforced.
5. **Immutable Audit Trail**: `AuditEvent` rows are append-only. Updates and deletions are blocked by Prisma constraints and database triggers.
6. **Soft Deletion**: Municipal areas are soft-deleted via `active = false`, preserving historical referential integrity while removing deactivated wards from active maps.

---

## 4. Database Setup & Management Commands

```bash
# 1. Start PostgreSQL via Docker Compose
docker compose up -d postgres

# 2. Apply Prisma Migrations
npm run db:migrate

# 3. Seed Deterministic Baseline (Chennai 7 Wards, Standard Stock)
npm run db:seed

# 4. Reset Database to Factory Baseline
npm run db:reset
```
