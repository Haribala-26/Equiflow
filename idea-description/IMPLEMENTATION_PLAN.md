# Implementation Plan & Milestone Execution

## 8-Milestone Production Blueprint

| Milestone | Deliverables | Verification Criteria |
|---|---|---|
| **M1: Environment & Tooling** | Node v22, npm, Next.js 15, Tailwind, Vitest | `npm run typecheck`, package scripts verified |
| **M2: Architecture & Specs** | `idea-description/*`, `docs/*` specifications | All 15 documents authored and aligned |
| **M3: Core Domain Engines** | PriorityService, AllocationService, FairnessService, Types | 100% test coverage on priority formula & invariants |
| **M4: Simulation & Shortage** | SimulationService, ShortageService, Scenario Store | Isolated what-if calculations, burn rate estimates |
| **M5: AI & Model Integrations** | GeminiClient, EGM Adapter, Zod schemas, fallbacks | Validated JSON extraction and fallback behavior |
| **M6: Next.js Frontend Shell & UI**| App layout, navigation, KPI cards, tables, detail drawers | Responsive on desktop, tablet, and mobile |
| **M7: Leaflet Map Integration** | Interactive Chennai map, dynamic markers, sync store | Real-time color updates & fly-to synchronization |
| **M8: Final Verification & Delivery**| End-to-end testing, linting, build passing | `npm run typecheck && npm run test && npm run build` |
