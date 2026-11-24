# Database & Repository Design

## 1. Domain Entities & Schema

- **Area**: Geographic coordinates, affected population, households, severity, urgency, vulnerability, active status.
- **NeedRequest**: Per-resource requested vs. locally available quantities.
- **PrioritySnapshot**: Pre-calculated scores, formula version, component breakdown, confidence rating.
- **Resource**: Stock metrics (total, reserved, available, unit).
- **AllocationRun**: Status (`draft`, `pending_approval`, `approved`, `rejected`), computed allocations, fairness metrics.
- **AllocationItem**: Per-area, per-resource recommended quantity, unmet demand, and decision rationale.
- **AuditEvent**: Immutable audit log (actor, action, entity, before/after snapshot, override rationale, timestamp).

## 2. Repository Pattern
All services interact exclusively with the `IRepository` interface:
```typescript
export interface IRepository {
  getAreas(): Promise<Area[]>;
  getAreaById(id: string): Promise<Area | null>;
  saveArea(area: Area): Promise<void>;
  getInventory(): Promise<ResourceStock[]>;
  updateInventory(type: ResourceType, stock: Partial<ResourceStock>): Promise<void>;
  getAllocationRuns(): Promise<AllocationRun[]>;
  saveAllocationRun(run: AllocationRun): Promise<void>;
  getAuditEvents(): Promise<AuditEvent[]>;
  logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<void>;
  resetDemo(): Promise<void>;
}
```
`MockRepository` implements this interface with an in-memory transactional store and deep cloning for simulation isolation.
