# EQUIFLOW — System Architecture

## Layered Architectural Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (Next.js App Router)                     │
│  - Overview Dashboard (/overview)                           │
│  - Affected Areas Management (/affected-areas)              │
│  - Resource Inventory Tracker (/resource-inventory)         │
│  - Allocation Centre & Approvals (/allocation-centre)       │
│  - Real Chennai Geographic Map (/map-view)                  │
│  - What-If Scenario Simulations (/simulations)              │
│  - Reports, Fairness & Audit History (/reports-audit)       │
│  - Admin Settings & Demo Reset (/settings)                  │
├─────────────────────────────────────────────────────────────┤
│ CLIENT-SIDE SHARED STORE                                    │
│  - Selected Area ID & Multi-filter State                    │
│  - Active Scenario Overrides & Baseline Diff State          │
├─────────────────────────────────────────────────────────────┤
│ SERVER API LAYER (/api/* Route Handlers)                    │
│  - /api/areas, /api/inventory, /api/allocations             │
│  - /api/simulations, /api/shortages, /api/ai/assess         │
│  - /api/audit, /api/demo/reset                              │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN SERVICE ENGINES (Pure TypeScript, Framework-Free)    │
│  - PriorityService (Deterministic 5-factor scoring)         │
│  - AllocationService (Floor + Weighted proportional)        │
│  - FairnessService (Variance, coverage, equity metrics)     │
│  - ShortageService (Burn-rate & depletion forecasting)      │
│  - SimulationService (Cloned scenario execution)            │
├─────────────────────────────────────────────────────────────┤
│ INTEGRATION & PERSISTENCE ADAPTERS                          │
│  - GeminiClient (Structured JSON extraction & fallback)     │
│  - ElephantGoldfishAdapter (Review & audit adapter)         │
│  - Repository Interface -> MockRepository / Prisma          │
└─────────────────────────────────────────────────────────────┘
```
