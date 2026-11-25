# ADR-001: Hexagonal Ports-and-Adapters Architecture

## Status
**Accepted**

## Context
Emergency management software requires high reliability, long-term maintainability, and clean separation between mathematical optimization engines and external infrastructure (databases, APIs, UI). Directly coupling Prisma queries or Next.js route handlers to business math makes testing and offline operation brittle.

## Decision
Adopt a decoupled **Hexagonal (Ports and Adapters)** architecture:
1. **Core Domain**: Pure TypeScript functions (`src/domain/priority.ts`, `src/domain/allocation.ts`, `src/domain/simulation.ts`). Zero database dependencies.
2. **Ports (Interfaces)**: Defined repository contract in `src/data/repository.ts` (`IRepository`).
3. **Adapters**:
   - `MockRepository` (In-memory, concurrent-safe mock layer).
   - `PrismaRepository` (PostgreSQL 16 relational ORM layer).
4. **Primary Adapters (Presentation)**: Next.js 15 App Router pages and API route handlers.

## Consequences
- **Positive**: 100% testable domain algorithms without mocking database connections. Fast in-memory test execution (Vitest runs 37 tests in 1.2s).
- **Positive**: Platform can run in zero-setup in-memory mode or full PostgreSQL mode seamlessly.
- **Trade-off**: Requires maintaining `IRepository` interface contract across all adapters.
