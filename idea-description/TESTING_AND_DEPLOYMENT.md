# Testing and Deployment Specification

## 1. Testing Strategy

- **Unit Tests (Vitest)**:
  - Priority calculation accuracy (e.g. testing the spec example $80.25 \rightarrow 80.3$).
  - Allocation invariants: $\sum \text{allocated} \le \text{stock}$, $\text{allocated} \le \text{need}$.
  - Indivisible rounding and tie-breaking stability.
  - Fairness evaluation metrics.
  - Gemini schema parsing and deterministic fallback logic.
  - Elephant-Goldfish adapter fallback.
- **Type Checking (`tsc --noEmit`)**: Strict zero-any policy across domain and UI code.
- **Production Build (`npm run build`)**: Next.js optimized production bundle.

## 2. Deployment Architecture
- Docker containerized deployment (`Dockerfile` multi-stage build).
- Environment flags: `DATA_SOURCE=mock` for standalone zero-dependency evaluation, `DATA_SOURCE=prisma` for enterprise PostgreSQL deployment.
- Health check endpoint `/api/health` reporting database, AI, and adapter status.
