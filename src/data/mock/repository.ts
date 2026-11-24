import {
  Area,
  AllocationRun,
  AuditEvent,
  PriorityConfig,
  ResourceStock,
  ResourceType,
} from "@/domain/types";
import { DEFAULT_PRIORITY_CONFIG } from "@/domain/config";
import {
  INITIAL_AREAS,
  INITIAL_AUDIT_LOG,
  INITIAL_INVENTORY,
} from "./seed";

export interface IRepository {
  getAreas(): Promise<Area[]>;
  getAreaById(id: string): Promise<Area | null>;
  saveArea(area: Area, actor?: string, reason?: string): Promise<void>;
  deleteArea(id: string, actor?: string, reason?: string): Promise<void>;
  getInventory(): Promise<ResourceStock[]>;
  updateInventory(type: ResourceType, stock: Partial<ResourceStock>, actor?: string, reason?: string): Promise<void>;
  getPriorityConfig(): Promise<PriorityConfig>;
  updatePriorityConfig(config: PriorityConfig, actor?: string, reason?: string): Promise<void>;
  getAllocationRuns(): Promise<AllocationRun[]>;
  getAllocationRunById(id: string): Promise<AllocationRun | null>;
  saveAllocationRun(run: AllocationRun, actor?: string): Promise<void>;
  approveAllocationRun(id: string, actor: string): Promise<void>;
  rejectAllocationRun(id: string, actor: string, reason: string): Promise<void>;
  getAuditEvents(): Promise<AuditEvent[]>;
  logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<AuditEvent>;
  resetDemo(): Promise<void>;
  clone(): MockRepository;
}

export class MockRepository implements IRepository {
  private areas: Area[];
  private inventory: ResourceStock[];
  private priorityConfig: PriorityConfig;
  private allocationRuns: AllocationRun[];
  private auditEvents: AuditEvent[];

  constructor() {
    this.areas = JSON.parse(JSON.stringify(INITIAL_AREAS));
    this.inventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    this.priorityConfig = JSON.parse(JSON.stringify(DEFAULT_PRIORITY_CONFIG));
    this.allocationRuns = [];
    this.auditEvents = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOG));
  }

  async getAreas(): Promise<Area[]> {
    return JSON.parse(JSON.stringify(this.areas));
  }

  async getAreaById(id: string): Promise<Area | null> {
    const area = this.areas.find((a) => a.id === id);
    return area ? JSON.parse(JSON.stringify(area)) : null;
  }

  async saveArea(area: Area, actor = "Coordinator", reason?: string): Promise<void> {
    const index = this.areas.findIndex((a) => a.id === area.id);
    const before = index >= 0 ? this.areas[index] : null;

    if (index >= 0) {
      this.areas[index] = JSON.parse(JSON.stringify(area));
    } else {
      this.areas.push(JSON.parse(JSON.stringify(area)));
    }

    await this.logAuditEvent({
      actor,
      role: "coordinator",
      action: before ? "UPDATE_AREA" : "CREATE_AREA",
      entityType: "Area",
      entityId: area.id,
      details: `${before ? "Updated" : "Created"} area record for ${area.name}`,
      reason: reason || "Field survey data synchronized",
      beforeSnapshot: before,
      afterSnapshot: area,
    });
  }

  async deleteArea(id: string, actor = "Coordinator", reason?: string): Promise<void> {
    const index = this.areas.findIndex((a) => a.id === id);
    if (index >= 0) {
      const removed = this.areas[index];
      // Soft deactivate per spec
      this.areas[index].active = false;
      await this.logAuditEvent({
        actor,
        role: "coordinator",
        action: "DEACTIVATE_AREA",
        entityType: "Area",
        entityId: id,
        details: `Deactivated area ${removed.name}`,
        reason: reason || "Area marked inactive/evacuated",
      });
    }
  }

  async getInventory(): Promise<ResourceStock[]> {
    return JSON.parse(JSON.stringify(this.inventory));
  }

  async updateInventory(
    type: ResourceType,
    updates: Partial<ResourceStock>,
    actor = "Resource Manager",
    reason?: string
  ): Promise<void> {
    const item = this.inventory.find((r) => r.type === type);
    if (!item) return;

    const before = { ...item };
    if (typeof updates.total === "number") item.total = updates.total;
    if (typeof updates.reserved === "number") item.reserved = updates.reserved;
    item.available = Math.max(0, item.total - item.reserved);

    await this.logAuditEvent({
      actor,
      role: "resource_manager",
      action: "UPDATE_INVENTORY",
      entityType: "Resource",
      entityId: type,
      details: `Updated ${item.name}: total=${item.total}, reserved=${item.reserved}, available=${item.available}`,
      reason: reason || "Inventory recount / shipment received",
      beforeSnapshot: before,
      afterSnapshot: item,
    });
  }

  async getPriorityConfig(): Promise<PriorityConfig> {
    return JSON.parse(JSON.stringify(this.priorityConfig));
  }

  async updatePriorityConfig(
    config: PriorityConfig,
    actor = "Administrator",
    reason?: string
  ): Promise<void> {
    const before = { ...this.priorityConfig };
    this.priorityConfig = JSON.parse(JSON.stringify(config));

    await this.logAuditEvent({
      actor,
      role: "admin",
      action: "UPDATE_PRIORITY_WEIGHTS",
      entityType: "Config",
      entityId: "priority_formula",
      details: `Updated formula weights to version ${config.formulaVersion}`,
      reason: reason || "Policy adjustment",
      beforeSnapshot: before,
      afterSnapshot: config,
    });
  }

  async getAllocationRuns(): Promise<AllocationRun[]> {
    return JSON.parse(JSON.stringify(this.allocationRuns));
  }

  async getAllocationRunById(id: string): Promise<AllocationRun | null> {
    const run = this.allocationRuns.find((r) => r.id === id);
    return run ? JSON.parse(JSON.stringify(run)) : null;
  }

  async saveAllocationRun(run: AllocationRun, actor = "Coordinator"): Promise<void> {
    const existingIdx = this.allocationRuns.findIndex((r) => r.id === run.id);
    if (existingIdx >= 0) {
      this.allocationRuns[existingIdx] = JSON.parse(JSON.stringify(run));
    } else {
      this.allocationRuns.unshift(JSON.parse(JSON.stringify(run)));
    }

    if (!run.isScenario) {
      await this.logAuditEvent({
        actor,
        role: "coordinator",
        action: "COMPUTE_ALLOCATION",
        entityType: "AllocationRun",
        entityId: run.id,
        details: `Generated allocation run with ${run.items.length} items. Overall satisfaction: ${run.fairness.overallSatisfactionRate.toFixed(1)}%`,
      });
    }
  }

  async approveAllocationRun(id: string, actor: string): Promise<void> {
    const run = this.allocationRuns.find((r) => r.id === id);
    if (!run) throw new Error("Allocation run not found");
    if (run.status !== "pending_approval" && run.status !== "draft") {
      throw new Error(`Cannot approve run with status: ${run.status}`);
    }

    // Deduct allocated stock from available inventory in transaction
    for (const item of run.items) {
      const stock = this.inventory.find((r) => r.type === item.resourceType);
      if (stock) {
        stock.available = Math.max(0, stock.available - item.recommendedQty);
        stock.total = Math.max(0, stock.total - item.recommendedQty);
      }
    }

    run.status = "approved";
    run.approvedAt = new Date().toISOString();
    run.approvedBy = actor;

    await this.logAuditEvent({
      actor,
      role: "coordinator",
      action: "APPROVE_ALLOCATION",
      entityType: "AllocationRun",
      entityId: id,
      details: `Approved allocation dispatch. Inventory deducted accordingly.`,
      reason: "Emergency dispatch authorized",
    });
  }

  async rejectAllocationRun(id: string, actor: string, reason: string): Promise<void> {
    const run = this.allocationRuns.find((r) => r.id === id);
    if (!run) throw new Error("Allocation run not found");

    run.status = "rejected";
    run.rejectionReason = reason;

    await this.logAuditEvent({
      actor,
      role: "coordinator",
      action: "REJECT_ALLOCATION",
      entityType: "AllocationRun",
      entityId: id,
      details: `Rejected allocation recommendation.`,
      reason,
    });
  }

  async getAuditEvents(): Promise<AuditEvent[]> {
    return JSON.parse(JSON.stringify(this.auditEvents));
  }

  async logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<AuditEvent> {
    const newEvent: AuditEvent = {
      ...event,
      id: `AUD-${String(this.auditEvents.length + 1).padStart(3, "0")}`,
      timestamp: new Date().toISOString(),
    };
    this.auditEvents.unshift(newEvent);
    return newEvent;
  }

  async resetDemo(): Promise<void> {
    this.areas = JSON.parse(JSON.stringify(INITIAL_AREAS));
    this.inventory = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
    this.priorityConfig = JSON.parse(JSON.stringify(DEFAULT_PRIORITY_CONFIG));
    this.allocationRuns = [];
    this.auditEvents = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOG));

    await this.logAuditEvent({
      actor: "Admin",
      role: "admin",
      action: "DEMO_RESET",
      entityType: "System",
      entityId: "SYS-RESET",
      details: "Restored baseline pristine Chennai disaster dataset.",
      reason: "Demo reset invoked",
    });
  }

  clone(): MockRepository {
    const cloned = new MockRepository();
    cloned.areas = JSON.parse(JSON.stringify(this.areas));
    cloned.inventory = JSON.parse(JSON.stringify(this.inventory));
    cloned.priorityConfig = JSON.parse(JSON.stringify(this.priorityConfig));
    cloned.allocationRuns = JSON.parse(JSON.stringify(this.allocationRuns));
    cloned.auditEvents = JSON.parse(JSON.stringify(this.auditEvents));
    return cloned;
  }
}

// Global in-memory singleton
const globalRepo = new MockRepository();
export function getRepository(): IRepository {
  return globalRepo;
}
