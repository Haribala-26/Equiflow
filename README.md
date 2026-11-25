# EQUIFLOW — Intelligent Emergency Resource Distribution Platform

> **Primary Focus City:** Chennai, Tamil Nadu, India  
> **Domain:** Humanitarian Logistics, Disaster Relief Optimization & Algorithmic Fairness  

---

## 🛠️ Tech Stack

- **Frontend & App Framework**: Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS
- **Database & Persistence**: PostgreSQL 16, Prisma ORM 6.4, In-Memory Mock Repository (`DATA_SOURCE=mock | prisma`)
- **Spatial Mapping & Analytics**: Leaflet (OpenStreetMap), Recharts
- **Responsible AI Engine**: Google Gemini 2.5 Flash + Resilient Offline Heuristic Engine
- **Security & Governance**: Zod Validation, Server-Side RBAC Guard, Append-Only Audit Ledger
- **Testing & Containerization**: Vitest 3.2 (37 automated tests), Docker Compose

---

## 🌟 Overview

During severe emergencies and natural disasters (such as the monsoon floods in Chennai), disaster management authorities face an acute operational challenge: **relief supplies are severely constrained, while life-critical demand surges unpredictably across flooded municipal wards.**

Equal distribution is not equitable distribution. Providing every neighborhood 50 food rations when one ward is submerged under 5 feet of water while another has minor street waterlogging leads to preventable casualties.

**EQUIFLOW** is an industrial-grade, AI-assisted decision-support platform designed to replace chaotic guesswork with mathematical fairness, transparent multi-criteria priority scoring, real-time spatial logistics, tamper-proof audit trails, and strict role-based governance.

---

## 🔄 End-to-End Operational Flow of the Project

Equiflow operates on a 10-stage end-to-end humanitarian workflow that balances operational urgency with mathematical rigor and human accountability:

```
[ Field Reconnaissance ] ──► [ AI Narrative Parsing ] ──► [ Human Review Gate ]
 (Ground Reports / SMS)        (Gemini + Fallback)          (Coordinator Sign-Off)
                                                                     │
                                                                     ▼
[ Dispatch Manifests ] ◄── [ Stock Deduction ] ◄── [ 2-Phase Allocation ] ◄── [ MCDA Priority Engine ]
 (Logistics Tracking)      (ACID Transactions)       (Anti-Starvation Floor)    (5 Weighted Dimensions)
         ▲
         │
[ Fresh-Eyes Audit ] ──► [ What-If Simulations ] ──► [ System Governance ]
 (Elephant-Goldfish)       (Stress-Test Shocks)       (Admin Policy Tuning)
```

### Step-by-Step Workflow Breakdown

1. **Field Ingestion**: On-ground officers submit unstructured situational updates (e.g. *"Water entering ICU in Saidapet. Urgent 1,000 food rations and 4,000 litres clean drinking water needed."*).
2. **Responsible AI Extraction**: Google Gemini 2.5 Flash analyzes narrative text and extracts structured needs, urgency, and hazard levels. If connectivity is lost or the API is unavailable, the system instantly switches to a **deterministic keyword heuristic parser** without interruption.
3. **Mandatory Human-in-the-Loop Gate**: Extracted requirements are staged as *suggestions*. An Emergency Coordinator must review, adjust, and approve suggestions before they enter the mathematical pipeline. AI is **never** permitted to autonomously dispatch supplies.
4. **MCDA Priority Scoring**: Municipal wards receive a deterministic score $P \in [0, 100]$ across 5 weighted dimensions:
   - **Severity (30%)**: Physical flood depth and structural damage.
   - **Urgency (25%)**: Time-criticality, medical distress, and road isolation.
   - **Vulnerability (20%)**: High-risk demographic concentration (infants, elderly, disabled).
   - **Unmet Need (15%)**: Cumulative supply deficit vs verified demand.
   - **Population Impact (10%)**: Log-normalized affected resident population (capped at 50,000).
5. **2-Phase Constrained Optimization**:
   - **Phase 1 (Anti-Starvation Floor)**: Every eligible ward is guaranteed at least **20%** of its essential survival needs (water and food) before surplus is distributed.
   - **Phase 2 (Weighted Proportional Rationing)**: Remaining warehouse stock is distributed proportionally according to priority scores and unmet demand. Discrete units are rounded with zero leakage using the **Hamilton-Hare Largest Remainder Method**.
6. **Fresh-Eyes Equity Audit**: The **Elephant-Goldfish** audit adapter executes automated bias checks, flagging potential starvation, regional disparity, or outlier allocations prior to approval.
7. **Coordinator Authorization & ACID Stock Reservation**: The Coordinator reviews truck manifests, checks fairness satisfaction curves, and authorizes the run. Atomic database transactions (`$transaction`) deduct warehouse stock with optimistic concurrency locking.
8. **Immutable Cryptographic Audit Logging**: Every override, approval, policy change, and AI assessment is committed to an append-only `AuditEvent` ledger.
9. **What-If Stress Simulations**: Coordinators and Administrators run isolated simulations (e.g. -30% supply cutoff, +20% evacuee surge) with baseline comparison before optionally committing them with operational justification.
10. **Administrative Governance & Formula Policy Tuning**: Administrators calibrate the 5 scoring weights (validated with Zod sum = 100%), manage user roles, review system diagnostics, and execute baseline resets.

---

## 🏛️ Top-Level Visualizing Architecture

Equiflow is architected using a decoupled **Hexagonal / Ports-and-Adapters** design that enforces strict separation between presentation, security guards, mathematical domain engines, and the underlying data layer.

```
+---------------------------------------------------------------------------------------+
|                                  PRESENTATION LAYER                                   |
|                                                                                       |
|   EMERGENCY COORDINATOR VIEW (Default)             ADMINISTRATOR GOVERNANCE HUB       |
|   - Real-time Operations Dashboard                 - Multi-Tab Control Panel (/admin) |
|   - Spatial Map & Ward Leaderboard                 - MCDA Scoring Weight Tuning (Zod) |
|   - Allocation Centre & Fairness Curve             - Warehouse Stock Limits & Batches |
|   - What-If Stress Simulations                     - Personnel Directory & RBAC       |
|   - Resource Inventory (READ-ONLY MODE)            - System Health Diagnostics        |
+---------------------------------------------------------------------------------------+
                                           │
                                    (Session / HTTP)
                                           ▼
+---------------------------------------------------------------------------------------+
|                            SERVER-SIDE RBAC SECURITY GUARD                            |
|                        src/lib/session.ts  ──►  src/lib/rbac.ts                       |
|           Enforces HTTP 403 Forbidden on unauthorized roles at the API level          |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
|                              CORE DOMAIN BUSINESS ENGINES                             |
|                           (Pure Math — Zero Database Imports)                         |
|                                                                                       |
|   +-----------------------+   +-----------------------+   +-----------------------+   |
|   |    Priority Engine    |   |   Allocation Engine   |   |   Simulation Engine   |   |
|   | - 5 Weighted Factors  |   | - Anti-Starvation 20% |   | - Supply Disruption   |   |
|   | - Pop Normalization   |   | - Hamilton-Hare Round |   | - Population Surges   |   |
|   +-----------------------+   +-----------------------+   +-----------------------+   |
+---------------------------------------------------------------------------------------+
                                           │
                               (Domain Interfaces Only)
                                           ▼
+---------------------------------------------------------------------------------------+
|                            REPOSITORY ABSTRACTION LAYER                               |
|                         src/data/repository.ts (Factory)                              |
|                                                                                       |
|         DATA_SOURCE="mock" (Default)                   DATA_SOURCE="prisma"           |
|         ┌─────────────────────────┐                    ┌──────────────────────────┐   |
|         │     MockRepository      │                    │     PrismaRepository     │   |
|         │  (In-Memory Concurrency)│                    │  (PostgreSQL 16 Layer)   │   |
|         └─────────────────────────┘                    └────────────┬─────────────┘   |
+---------------------------------------------------------------------┼-----------------+
                                                                      │
                                                        ┌─────────────▼─────────────┐
                                                        │       PostgreSQL 16       │
                                                        │  - ACID Transactions      │
                                                        │  - Optimistic Locking     │
                                                        │  - Stale Input Blocking   │
                                                        │  - Append-Only Audit Logs │
                                                        └───────────────────────────┘
```

---

## 👥 Role-Based Access Control (RBAC) & View Divergence

Equiflow provides two distinct, tailored experiences enforced both in the UI and server-side:

### Role Permissions Matrix

| Capability / Resource | Emergency Coordinator (Default) | Administrator |
| :--- | :---: | :---: |
| **Operational Mission Control Dashboard** | ✅ Full Access | ✅ Full Access |
| **Affected Areas & Priority Scoring Breakdown** | ✅ Full Access | ✅ Full Access |
| **AI Field Report Assessment Tool** | ✅ Full Access | ✅ Full Access |
| **Allocation Optimization & Dispatch Sign-Off** | ✅ Full Access | ✅ Full Access |
| **What-If Scenario Simulation Engine** | ✅ Full Access | ✅ Full Access |
| **Resource Inventory & Shortage Forecaster** | 👁️ **Read-Only Mode** | ✏️ **Edit Stock & Reserves** |
| **Scoring Formula Policy Tuning (MCDA)** | ❌ Blocked (HTTP 403) | ✅ **Full Calibration** |
| **Personnel Directory & Role Management** | ❌ Blocked (HTTP 403) | ✅ **Full RBAC Control** |
| **Full System Audit Trail & Override Stream** | ❌ Blocked (HTTP 403) | ✅ **Filterable Ledger** |
| **System Diagnostics (DB Latency, Health)** | ❌ Blocked (HTTP 403) | ✅ **Live Telemetry** |
| **Factory Demo Data Reset** | ❌ Blocked (HTTP 403) | ✅ **Privileged Action** |

---

## 📚 Deep-Dive Architecture Specifications

Comprehensive architectural specifications are maintained in the [`idea-description/`](./idea-description) directory:

- 🗄️ **[Database Design Specification](./idea-description/DATABASE_DESIGN.md)**: Relational entity schema (15 Prisma models), fixed unit constraints, ACID transactions, optimistic concurrency locking (`version`), stale-input detection, and deterministic seed definitions.
- 🏛️ **[System Architecture Specification](./idea-description/SYSTEM_ARCHITECTURE.md)**: Hexagonal architecture design, repository factory pattern, presentation layer divergence, and the Elephant-Goldfish dual-memory protocol.
- 🛡️ **[Security & Responsible AI Architecture](./idea-description/SECURITY_AND_RESPONSIBLE_AI.md)**: Centralized RBAC permission matrix, server-side guard enforcement (`guardPermission`), AI deterministic fallback mechanisms, human-in-the-loop gates, and append-only audit verification.
- 🧪 **[Testing & Deployment Guide](./idea-description/TESTING_AND_DEPLOYMENT.md)**: 3-tier quality gate matrix, Vitest test suite breakdown (37 tests across 8 suites), Docker Compose orchestration (PostgreSQL 16 + web), and environment configuration.

---

## 🗺️ Monitored Flood Wards (Chennai, Tamil Nadu)

Equiflow comes pre-configured with 7 active flood wards mapped across Greater Chennai:

| Ward Code | Zone / Neighborhood | Coordinates | Population | Baseline Status |
| :--- | :--- | :---: | :---: | :---: |
| **CHN-001** | **Velachery South** | `12.9815, 80.2180` | 42,000 | 🔴 Critical (Waterlogging > 1.5m) |
| **CHN-002** | **Vyasarpadi Industrial** | `13.1118, 80.2612` | 58,000 | 🔴 Critical (Industrial canal breach) |
| **CHN-003** | **Saidapet Canal Basin** | `13.0213, 80.2231` | 36,000 | 🟠 High (Adyar river overflow) |
| **CHN-004** | **Perungudi Lowlands** | `12.9654, 80.2461` | 29,000 | 🟠 High (Marshland runoff) |
| **CHN-005** | **T. Nagar Commercial Basin** | `13.0418, 80.2341` | 48,000 | 🟡 Moderate (Drainage congestion) |
| **CHN-006** | **Mylapore Coastal Fringe** | `13.0368, 80.2676` | 31,000 | 🟢 Low (Elevated coastal zone) |
| **CHN-007** | **Anna Nagar North** | `13.0850, 80.2101` | 52,000 | 🟢 Low (Minor street water) |

---

## 🚀 Quick Run

### Option 1: In-Memory Mock Mode (Fastest — Zero DB Setup)

```bash
git clone https://github.com/Haribala-26/equiflow.git
cd equiflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (Emergency Coordinator view is active by default).

---

### Option 2: Full PostgreSQL Mode (Docker)

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

---

## 🧪 Quality Verification & Testing

```bash
npm run test        # 37/37 automated tests passing
npm run typecheck   # 0 TypeScript compiler errors
npm run build       # Optimized Next.js production build
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
