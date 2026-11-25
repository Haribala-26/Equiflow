import { IRepository, getRepository as getMockRepository } from "./mock/repository";

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
      const { getPrismaRepository } = require("./prisma/repository");
      const repo = getPrismaRepository() as IRepository;
      activeRepo = repo;
      return repo;
    } catch (err) {
      console.warn("⚠️ [EQUIFLOW] Failed to initialize PrismaRepository; falling back to MockRepository:", err);
    }
  }

  const mockRepo = getMockRepository();
  activeRepo = mockRepo;
  return mockRepo;
}
