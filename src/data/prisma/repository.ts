import { prisma } from "./client";
import { IRepository } from "../mock/repository";
import {
  Area,
  AllocationRun,
  AuditEvent,
  PriorityConfig,
  ResourceStock,
  ResourceType,
  ResourceUnit,
  UserRecord,
  UserRole,
  VerificationStatus,
} from "@/domain/types";
import { DEFAULT_PRIORITY_CONFIG } from "@/domain/config";
import { seedDatabase } from "../../../prisma/seed";

const FIXED_UNITS: Record<ResourceType, ResourceUnit> = {
  food: "packs",
  water: "litres",
  medical: "kits",
  shelter: "kits",
  hygiene: "kits",
};

const DAILY_CONSUMPTION_DEFAULTS: Record<ResourceType, number> = {
  food: 2000,
  water: 8000,
  medical: 300,
  shelter: 400,
  hygiene: 500,
};

const RESOURCE_NAMES: Record<ResourceType, string> = {
  food: "Food Rations",
  water: "Drinking Water",
  medical: "Medical Kits",
  shelter: "Shelter Kits",
  hygiene: "Hygiene Kits",
};

export class PrismaRepository implements IRepository {
  getDataSourceName(): "mock" | "prisma" {
    return "prisma";
  }

  async getAreas(): Promise<Area[]> {
    const records = await prisma.area.findMany({
      include: { needs: true },
      orderBy: { id: "asc" },
    });

    return records.map((r) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      population: r.population,
      households: r.households,
      severity: r.severity,
      urgency: r.urgency,
      vulnerability: r.vulnerability,
      verificationStatus: r.verificationStatus as VerificationStatus,
      active: r.active,
      notes: r.notes || undefined,
      needs: r.needs.map((n) => ({
        resourceType: n.resourceType as ResourceType,
        requestedQty: n.quantity,
        locallyAvailableQty: n.localSupply,
        unit: (n.unit as ResourceUnit) || FIXED_UNITS[n.resourceType as ResourceType],
      })),
    }));
  }

  async getAreaById(id: string): Promise<Area | null> {
    const r = await prisma.area.findUnique({
      where: { id },
      include: { needs: true },
    });
    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      population: r.population,
      households: r.households,
      severity: r.severity,
      urgency: r.urgency,
      vulnerability: r.vulnerability,
      verificationStatus: r.verificationStatus as VerificationStatus,
      active: r.active,
      notes: r.notes || undefined,
      needs: r.needs.map((n) => ({
        resourceType: n.resourceType as ResourceType,
        requestedQty: n.quantity,
        locallyAvailableQty: n.localSupply,
        unit: (n.unit as ResourceUnit) || FIXED_UNITS[n.resourceType as ResourceType],
      })),
    };
  }

  async saveArea(area: Area, actor = "Emergency Coordinator", reason?: string): Promise<void> {
    const existing = await prisma.area.findUnique({ where: { id: area.id } });

    await prisma.$transaction(async (tx) => {
      await tx.area.upsert({
        where: { id: area.id },
        update: {
          name: area.name,
          latitude: area.latitude,
          longitude: area.longitude,
          population: area.population,
          households: area.households,
          severity: area.severity,
          urgency: area.urgency,
          vulnerability: area.vulnerability,
          verificationStatus: area.verificationStatus,
          active: area.active,
          notes: area.notes || null,
          version: { increment: 1 },
        },
        create: {
          id: area.id,
          name: area.name,
          latitude: area.latitude,
          longitude: area.longitude,
          population: area.population,
          households: area.households,
          severity: area.severity,
          urgency: area.urgency,
          vulnerability: area.vulnerability,
          verificationStatus: area.verificationStatus,
          active: area.active,
          notes: area.notes || null,
          version: 1,
        },
      });

      // Synchronize need requests
      for (const need of area.needs) {
        await tx.needRequest.upsert({
          where: {
            areaId_resourceType: {
              areaId: area.id,
              resourceType: need.resourceType,
            },
          },
          update: {
            quantity: need.requestedQty,
            localSupply: need.locallyAvailableQty,
            unit: FIXED_UNITS[need.resourceType],
          },
          create: {
            areaId: area.id,
            resourceType: need.resourceType,
            quantity: need.requestedQty,
            localSupply: need.locallyAvailableQty,
            unit: FIXED_UNITS[need.resourceType],
          },
        });
      }

      await tx.auditEvent.create({
        data: {
          actorRole: actor.toLowerCase().includes("admin") ? "admin" : "coordinator",
          action: existing ? "UPDATE_AREA" : "CREATE_AREA",
          entityType: "Area",
          entityId: area.id,
          details: `${existing ? "Updated" : "Created"} area record for ${area.name}`,
          reason: reason || "Field survey data synchronized",
          beforeSnapshot: existing ? JSON.stringify(existing) : null,
          afterSnapshot: JSON.stringify(area),
        },
      });
    });
  }

  async deleteArea(id: string, actor = "Emergency Coordinator", reason?: string): Promise<void> {
    const area = await prisma.area.findUnique({ where: { id } });
    if (!area) return;

    // Soft-delete per specification
    await prisma.$transaction(async (tx) => {
      await tx.area.update({
        where: { id },
        data: { active: false, version: { increment: 1 } },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.toLowerCase().includes("admin") ? "admin" : "coordinator",
          action: "DEACTIVATE_AREA",
          entityType: "Area",
          entityId: id,
          details: `Deactivated area ${area.name}`,
          reason: reason || "Area marked inactive/evacuated",
        },
      });
    });
  }

  async getInventory(): Promise<ResourceStock[]> {
    const resources = await prisma.resource.findMany({
      orderBy: { type: "asc" },
    });

    return resources.map((r) => {
      const type = r.type as ResourceType;
      const unit = FIXED_UNITS[type];
      const available = Math.max(0, r.total - r.reserved);
      return {
        type,
        name: RESOURCE_NAMES[type] || r.type,
        unit,
        total: r.total,
        reserved: r.reserved,
        available,
        dailyConsumptionRate: DAILY_CONSUMPTION_DEFAULTS[type] || 1000,
      };
    });
  }

  async updateInventory(
    type: ResourceType,
    updates: Partial<ResourceStock>,
    actor = "Administrator",
    reason?: string
  ): Promise<void> {
    const existing = await prisma.resource.findUnique({ where: { type } });
    if (!existing) return;

    const newTotal = typeof updates.total === "number" ? Math.max(0, updates.total) : existing.total;
    const newReserved = typeof updates.reserved === "number" ? Math.max(0, updates.reserved) : existing.reserved;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.resource.update({
        where: { type },
        data: {
          total: newTotal,
          reserved: newReserved,
          unit: FIXED_UNITS[type],
          version: { increment: 1 },
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.toLowerCase().includes("admin") ? "admin" : "resource_manager",
          action: "UPDATE_INVENTORY",
          entityType: "Resource",
          entityId: type,
          details: `Updated ${RESOURCE_NAMES[type]}: total=${updated.total}, reserved=${updated.reserved}, available=${Math.max(0, updated.total - updated.reserved)}`,
          reason: reason || "Inventory recount / shipment received",
          beforeSnapshot: JSON.stringify(existing),
          afterSnapshot: JSON.stringify(updated),
        },
      });
    });
  }

  async getPriorityConfig(): Promise<PriorityConfig> {
    const record = await prisma.priorityConfig.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return JSON.parse(JSON.stringify(DEFAULT_PRIORITY_CONFIG));
    }

    try {
      return {
        formulaVersion: record.formulaVersion,
        populationCap: record.populationCap,
        weights: JSON.parse(record.weights),
      };
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_PRIORITY_CONFIG));
    }
  }

  async getPriorityConfigHistory(): Promise<PriorityConfig[]> {
    const records = await prisma.priorityConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => ({
      formulaVersion: r.formulaVersion,
      populationCap: r.populationCap,
      weights: JSON.parse(r.weights),
    }));
  }

  async updatePriorityConfig(
    config: PriorityConfig,
    actor = "Administrator",
    reason?: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.priorityConfig.create({
        data: {
          formulaVersion: config.formulaVersion,
          weights: JSON.stringify(config.weights),
          populationCap: config.populationCap,
          reason: reason || "Policy adjustment",
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: "admin",
          action: "UPDATE_PRIORITY_WEIGHTS",
          entityType: "Config",
          entityId: "priority_formula",
          details: `Updated formula weights to version ${config.formulaVersion}`,
          reason: reason || "Policy adjustment",
          afterSnapshot: JSON.stringify(config),
        },
      });
    });
  }

  async getAllocationRuns(): Promise<AllocationRun[]> {
    const runs = await prisma.allocationRun.findMany({
      include: { items: true, approvals: true },
      orderBy: { createdAt: "desc" },
    });

    return runs.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      status: r.status as any,
      inputVersion: r.inputVersion || undefined,
      remainingStock: { food: 0, water: 0, medical: 0, shelter: 0, hygiene: 0 },
      fairness: r.fairnessData ? JSON.parse(r.fairnessData) : ({} as any),
      items: r.items.map((i) => ({
        areaId: i.areaId,
        areaName: i.areaId,
        resourceType: i.resourceType as ResourceType,
        unit: FIXED_UNITS[i.resourceType as ResourceType],
        eligibleDemand: i.recommendedQty + i.unmetQty,
        floorQty: 0,
        weightedQty: i.recommendedQty,
        recommendedQty: i.recommendedQty,
        unmetQty: i.unmetQty,
        rationale: i.rationale || "Algorithmic recommendation",
      })),
      approvedAt: r.approvals.find((a) => a.decision === "approved")?.decidedAt.toISOString(),
      approvedBy: r.approvals.find((a) => a.decision === "approved")?.approverId || undefined,
      rejectionReason: r.approvals.find((a) => a.decision === "rejected")?.reason || undefined,
    }));
  }

  async getAllocationRunById(id: string): Promise<AllocationRun | null> {
    const r = await prisma.allocationRun.findUnique({
      where: { id },
      include: { items: true, approvals: true },
    });
    if (!r) return null;

    return {
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      status: r.status as any,
      inputVersion: r.inputVersion || undefined,
      remainingStock: { food: 0, water: 0, medical: 0, shelter: 0, hygiene: 0 },
      fairness: r.fairnessData ? JSON.parse(r.fairnessData) : ({} as any),
      items: r.items.map((i) => ({
        areaId: i.areaId,
        areaName: i.areaId,
        resourceType: i.resourceType as ResourceType,
        unit: FIXED_UNITS[i.resourceType as ResourceType],
        eligibleDemand: i.recommendedQty + i.unmetQty,
        floorQty: 0,
        weightedQty: i.recommendedQty,
        recommendedQty: i.recommendedQty,
        unmetQty: i.unmetQty,
        rationale: i.rationale || "Algorithmic recommendation",
      })),
      approvedAt: r.approvals.find((a) => a.decision === "approved")?.decidedAt.toISOString(),
      approvedBy: r.approvals.find((a) => a.decision === "approved")?.approverId || undefined,
      rejectionReason: r.approvals.find((a) => a.decision === "rejected")?.reason || undefined,
    };
  }

  async saveAllocationRun(run: AllocationRun, actor = "Emergency Coordinator"): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Concurrency check against stock
      for (const item of run.items) {
        const stock = await tx.resource.findUnique({ where: { type: item.resourceType } });
        if (stock && item.recommendedQty > stock.total) {
          throw new Error(
            `EXCEEDS_INVENTORY_STOCK: Recommended ${item.recommendedQty} ${FIXED_UNITS[item.resourceType]} of ${item.resourceType} exceeds warehouse total ${stock.total}.`
          );
        }
      }

      // Compute input version from areas and resources
      const areas = await tx.area.findMany({ select: { id: true, version: true } });
      const resources = await tx.resource.findMany({ select: { type: true, version: true } });
      const inputVersion = `areas:${areas.map((a) => `${a.id}:${a.version}`).join(",")}|res:${resources.map((r) => `${r.type}:${r.version}`).join(",")}`;

      await tx.allocationRun.create({
        data: {
          id: run.id,
          status: run.status as any,
          inputVersion,
          fairnessData: JSON.stringify(run.fairness),
          items: {
            create: run.items.map((i) => ({
              areaId: i.areaId,
              resourceType: i.resourceType,
              recommendedQty: i.recommendedQty,
              unmetQty: i.unmetQty,
              rationale: i.rationale,
            })),
          },
        },
      });

      if (!run.isScenario) {
        await tx.auditEvent.create({
          data: {
            actorRole: actor.toLowerCase().includes("admin") ? "admin" : "coordinator",
            action: "COMPUTE_ALLOCATION",
            entityType: "AllocationRun",
            entityId: run.id,
            details: `Generated allocation run with ${run.items.length} items. Overall satisfaction: ${run.fairness?.overallSatisfactionRate?.toFixed(1) || 0}%`,
          },
        });
      }
    });
  }

  async approveAllocationRun(id: string, actor: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const run = await tx.allocationRun.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!run) throw new Error("Allocation run not found");
      if (run.status !== "pending_approval" && run.status !== "draft") {
        throw new Error(`Cannot approve run with status: ${run.status}`);
      }

      // Stale input check: compare current version with run.inputVersion
      if (run.inputVersion) {
        const areas = await tx.area.findMany({ select: { id: true, version: true } });
        const resources = await tx.resource.findMany({ select: { type: true, version: true } });
        const currentVersion = `areas:${areas.map((a) => `${a.id}:${a.version}`).join(",")}|res:${resources.map((r) => `${r.type}:${r.version}`).join(",")}`;

        if (run.inputVersion !== currentVersion) {
          throw new Error(
            "STALE_INPUT_RUN: Areas or inventory were modified since this allocation was computed. Please recalculate."
          );
        }
      }

      // Deduct stock with optimistic concurrency lock
      for (const item of run.items) {
        const resource = await tx.resource.findUnique({
          where: { type: item.resourceType },
        });

        if (!resource) {
          throw new Error(`Resource ${item.resourceType} not found.`);
        }

        const available = Math.max(0, resource.total - resource.reserved);
        if (available < item.recommendedQty) {
          throw new Error(
            `CONCURRENT_STOCK_EXHAUSTED: Available ${item.resourceType} is ${available}, but run requests ${item.recommendedQty}.`
          );
        }

        await tx.resource.update({
          where: { type: item.resourceType },
          data: {
            total: Math.max(0, resource.total - item.recommendedQty),
            version: { increment: 1 },
          },
        });
      }

      await tx.allocationRun.update({
        where: { id },
        data: { status: "approved" },
      });

      await tx.approval.create({
        data: {
          runId: id,
          decision: "approved",
          reason: "Emergency dispatch authorized",
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.toLowerCase().includes("admin") ? "admin" : "coordinator",
          action: "APPROVE_ALLOCATION",
          entityType: "AllocationRun",
          entityId: id,
          details: `Approved allocation dispatch. Inventory deducted accordingly.`,
          reason: "Emergency dispatch authorized",
        },
      });
    });
  }

  async rejectAllocationRun(id: string, actor: string, reason: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const run = await tx.allocationRun.findUnique({ where: { id } });
      if (!run) throw new Error("Allocation run not found");

      await tx.allocationRun.update({
        where: { id },
        data: { status: "rejected" },
      });

      await tx.approval.create({
        data: {
          runId: id,
          decision: "rejected",
          reason,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: actor.toLowerCase().includes("admin") ? "admin" : "coordinator",
          action: "REJECT_ALLOCATION",
          entityType: "AllocationRun",
          entityId: id,
          details: `Rejected allocation recommendation.`,
          reason,
        },
      });
    });
  }

  async getAuditEvents(): Promise<AuditEvent[]> {
    const events = await prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
    });

    return events.map((e) => ({
      id: e.id,
      timestamp: e.createdAt.toISOString(),
      actor: e.actorRole,
      role: e.actorRole as UserRole,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      details: e.details,
      reason: e.reason || undefined,
    }));
  }

  async logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<AuditEvent> {
    const record = await prisma.auditEvent.create({
      data: {
        actorRole: event.role,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        details: event.details,
        reason: event.reason,
        beforeSnapshot: event.beforeSnapshot ? JSON.stringify(event.beforeSnapshot) : null,
        afterSnapshot: event.afterSnapshot ? JSON.stringify(event.afterSnapshot) : null,
      },
    });

    return {
      id: record.id,
      timestamp: record.createdAt.toISOString(),
      actor: event.actor,
      role: event.role,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      details: record.details,
      reason: record.reason || undefined,
    };
  }

  async getUsers(): Promise<UserRecord[]> {
    const records = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    return records.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as UserRole,
      active: u.active,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));
  }

  async updateUser(
    id: string,
    updates: Partial<{ role: UserRole; active: boolean }>,
    actor = "Administrator"
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error(`User with id ${id} not found.`);

    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          role: updates.role ? (updates.role as any) : undefined,
          active: typeof updates.active === "boolean" ? updates.active : undefined,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorRole: "admin",
          action: "UPDATE_USER",
          entityType: "User",
          entityId: id,
          details: `Updated user ${user.name}: role=${updated.role}, active=${updated.active}`,
          beforeSnapshot: JSON.stringify(user),
          afterSnapshot: JSON.stringify(updated),
        },
      });
    });
  }

  async resetDemo(): Promise<void> {
    await seedDatabase(prisma);

    await prisma.auditEvent.create({
      data: {
        actorRole: "admin",
        action: "DEMO_RESET",
        entityType: "System",
        entityId: "SYS-RESET",
        details: "Restored baseline pristine Chennai disaster dataset.",
        reason: "Demo reset invoked",
      },
    });
  }

  async checkHealth(): Promise<{ database: "connected" | "fallback" | "unreachable"; latencyMs: number }> {
    const start = Date.now();
    try {
      // 3-second timeout probe
      const checkPromise = prisma.$queryRaw`SELECT 1`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );

      await Promise.race([checkPromise, timeoutPromise]);
      return { database: "connected", latencyMs: Date.now() - start };
    } catch {
      return { database: "unreachable", latencyMs: -1 };
    }
  }

  clone(): IRepository {
    return this;
  }
}

let prismaRepoInstance: PrismaRepository | null = null;
export function getPrismaRepository(): PrismaRepository {
  if (!prismaRepoInstance) {
    prismaRepoInstance = new PrismaRepository();
  }
  return prismaRepoInstance;
}
