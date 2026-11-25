import { describe, it, expect } from "vitest";
import { MockRepository } from "../../src/data/mock/repository";
import { PrismaRepository } from "../../src/data/prisma/repository";

describe("Repository Contract Parity", () => {
  it("verifies MockRepository conforms to IRepository interface", async () => {
    const repo = new MockRepository();
    expect(repo.getDataSourceName()).toBe("mock");

    const areas = await repo.getAreas();
    expect(areas.length).toBe(7);
    expect(areas[0].id).toBe("CHN-001");
    expect(areas[0].needs.length).toBe(5);

    const inv = await repo.getInventory();
    expect(inv.length).toBe(5);
    const food = inv.find((r) => r.type === "food");
    expect(food?.unit).toBe("packs");
    expect(food?.total).toBe(8000);

    const config = await repo.getPriorityConfig();
    const sum =
      config.weights.severity +
      config.weights.urgency +
      config.weights.vulnerability +
      config.weights.unmetNeed +
      config.weights.populationImpact;
    expect(Math.round(sum * 100)).toBe(100);

    const users = await repo.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.some((u) => u.role === "admin")).toBe(true);
    expect(users.some((u) => u.role === "coordinator")).toBe(true);

    const health = await repo.checkHealth();
    expect(health.database).toBe("connected");
  });

  it("verifies PrismaRepository provides identical method signatures", () => {
    const repo = new PrismaRepository();
    expect(repo.getDataSourceName()).toBe("prisma");
    expect(typeof repo.getAreas).toBe("function");
    expect(typeof repo.getInventory).toBe("function");
    expect(typeof repo.getPriorityConfig).toBe("function");
    expect(typeof repo.saveAllocationRun).toBe("function");
    expect(typeof repo.approveAllocationRun).toBe("function");
    expect(typeof repo.rejectAllocationRun).toBe("function");
    expect(typeof repo.getUsers).toBe("function");
    expect(typeof repo.resetDemo).toBe("function");
    expect(typeof repo.checkHealth).toBe("function");
  });
});
