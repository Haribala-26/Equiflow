# Equiflow — System Architecture Specification

## 1. High-Level Architectural Principles

Equiflow is designed as a disaster resource allocation and humanitarian logistics optimization platform. It combines mathematical rigor, deterministic multi-criteria scoring, and responsible AI guardrails under a clean hexagonal architecture.

```
+-------------------------------------------------------------------------+
|                           Presentation Layer                            |
|  +-----------------------------+     +-------------------------------+  |
|  | Administrator Governance    |     | Emergency Coordinator (Def)   |  |
|  | - Formula Calibration (Zod) |     | - Operational Dashboard       |  |
|  | - Warehouse Limits & Batches|     | - Ward Priority Leaderboard   |  |
|  | - RBAC User Directory       |     | - Allocation Approvals        |  |
|  | - System Health Diagnostics |     | - What-If Stress Simulations  |  |
|  +-----------------------------+     +-------------------------------+  |
+-------------------------------------------------------------------------+
                                     │ (HTTP / Session Guards)
+------------------------------------▼------------------------------------+
|                         Server-Side RBAC Guard                          |
|             src/lib/session.ts  ──►  src/lib/rbac.ts                    |
|      Enforces 403 Forbidden on unauthorized API routes server-side       |
+-------------------------------------------------------------------------+
                                     │
+------------------------------------▼------------------------------------+
|                       Core Domain Business Logic                        |
|  +--------------------+  +--------------------+  +-------------------+  |
|  | Priority Engine    |  | Allocation Engine  |  | Simulation Engine |  |
|  | - 5 MCDA Weights   |  | - Fairness & Floor |  | - Isolated Deltas |  |
|  | - Pop Normalization|  | - LP / Proportional|  | - Burn Forecasts  |  |
|  +--------------------+  +--------------------+  +-------------------+  |
+-------------------------------------------------------------------------+
                                     │ (Domain Types Only - Zero Prisma)
+------------------------------------▼------------------------------------+
|                      Repository Layer Abstraction                       |
|                   src/data/repository.ts (Factory)                      |
|                                                                         |
|         DATA_SOURCE=mock (Default)           DATA_SOURCE=prisma         |
|         ┌─────────────────────────┐         ┌────────────────────────┐  |
|         │     MockRepository      │         │    PrismaRepository    │  |
|         │  (In-Memory Concurrency)│         │ (PostgreSQL 16 Engine) │  |
|         └─────────────────────────┘         └────────────────────────┘  |
+-------------------------------------------------------------------------+
```

---

## 2. Decoupled Service Isolation

Under strict architectural governance, domain computation engines (`src/domain/priority`, `src/domain/allocation`, `src/domain/simulation`) **NEVER** import Prisma or the database layer directly:
- Domain engines operate exclusively on plain domain interfaces (`Area`, `ResourceStock`, `PriorityConfig`, `AllocationRun`).
- The data factory (`src/data/repository.ts`) selects either `MockRepository` or `PrismaRepository` based on `process.env.DATA_SOURCE`.
- Both implementations satisfy the exact same `IRepository` contract, ensuring zero algorithmic drift between mock development and production PostgreSQL deployment.

---

## 3. Presentation Layer & View Divergence

### 3.1 Emergency Coordinator View (Default, Operational)
- **Primary Goal**: Immediate disaster response, field intelligence ingestion, and life-saving resource dispatching.
- **Components**:
  - Operational KPI strip: Affected population, critical zones (score ≥ 80), allocated vs shortfall.
  - Interactive Ward Map & Priority Leaderboard.
  - Allocation Centre: Run optimization, inspect fairness distribution, approve/reject dispatches.
  - What-If Simulations: Test supply chain shocks and displacements with zero baseline corruption.
  - Resource Inventory: Read-only logistics awareness mode.

### 3.2 Administrator View (System Governance & Policy)
- **Primary Goal**: System oversight, mathematical policy calibration, personnel access, and compliance auditing.
- **Components**:
  - Administration Tabbed Hub (`/admin`):
    1. **Scoring Formula**: View and modify the 5 policy weights (Severity, Urgency, Vulnerability, Unmet Need, Population Impact) with Zod validation (sum = 100%). Generates versioned formulas (`v1.1`, `v1.2`) and triggers automatic ward score recomputation.
    2. **Inventory Management**: Edit warehouse totals and reserved stock with validation.
    3. **User & Role Management**: RBAC personnel directory with status toggles.
    4. **Full Audit Stream**: Filterable by actor, role, action, and date.
    5. **System Diagnostics**: Live latency, database source, Gemini status, and Elephant-Goldfish health checks.
    6. **City & Demo Controls**: Municipal basemap switcher (Chennai vs Coimbatore) and baseline demo reset.

---

## 4. Elephant-Goldfish Memory & Adaptive Protocol

Equiflow integrates the Elephant-Goldfish dual-memory protocol:
- **Elephant Memory**: Long-term persistent institutional memory storing past flood records, historical allocation runs, and verified field baselines.
- **Goldfish Memory**: Rapid, stateless "Fresh-Eyes" review cycles executed by specialized subagents to audit allocation fairness and flag hidden biases before final coordinator sign-off.
