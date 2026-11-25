import { IRepository, getRepository as getMockRepository } from "./mock/repository";
import { getPrismaRepository } from "./prisma/repository";

export * from "./mock/repository";

let activeRepo: IRepository | null = null;

/**
 * Returns the active IRepository singleton based on the DATA_SOURCE environment variable.
 * Supported values: "mock" (default, zero-setup in-memory) | "prisma" (PostgreSQL)
 */
export function getRepository(): IRepository {
  if (activeRepo) return activeRepo;

  const dataSource = (process.env.DATA_SOURCE || "mock").toLowerCase().trim();

  if (dataSource === "prisma") {
    try {
      activeRepo = getPrismaRepository();
      return activeRepo;
    } catch (err) {
      console.warn("⚠️ [EQUIFLOW] Failed to initialize PrismaRepository; falling back to MockRepository:", err);
      activeRepo = getMockRepository();
      return activeRepo;
    }
  }

  activeRepo = getMockRepository();
  return activeRepo;
}
