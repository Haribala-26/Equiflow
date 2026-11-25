import { PrismaClient } from "@prisma/client";
import { INITIAL_AREAS, INITIAL_INVENTORY, INITIAL_AUDIT_LOG } from "../src/data/mock/seed";
import { DEFAULT_PRIORITY_CONFIG } from "../src/domain/config";

const prisma = new PrismaClient();

export async function seedDatabase(client: PrismaClient = prisma) {
  console.log("🌱 Starting deterministic Equiflow database seed...");

  // 1. Clean existing records in correct referential order
  await client.approval.deleteMany();
  await client.allocationItem.deleteMany();
  await client.allocationRun.deleteMany();
  await client.prioritySnapshot.deleteMany();
  await client.needRequest.deleteMany();
  await client.incident.deleteMany();
  await client.assessment.deleteMany();
  await client.inventoryBatch.deleteMany();
  await client.resource.deleteMany();
  await client.area.deleteMany();
  await client.priorityConfig.deleteMany();
  await client.auditEvent.deleteMany();
  await client.user.deleteMany();

  // 2. Seed Users
  const adminUser = await client.user.create({
    data: {
      id: "usr-admin-01",
      name: "System Administrator",
      email: "admin@equiflow.org",
      role: "admin",
      active: true,
    },
  });

  const coordUser = await client.user.create({
    data: {
      id: "usr-coord-01",
      name: "Emergency Coordinator Raman",
      email: "coordinator@equiflow.org",
      role: "coordinator",
      active: true,
    },
  });

  // 3. Seed Priority Configuration
  await client.priorityConfig.create({
    data: {
      id: "cfg-v1-0",
      formulaVersion: "v1.0",
      weights: JSON.stringify(DEFAULT_PRIORITY_CONFIG.weights),
      populationCap: DEFAULT_PRIORITY_CONFIG.populationCap,
      updatedBy: adminUser.id,
      reason: "Initial baseline configuration for Chennai monsoon response",
    },
  });

  // 4. Seed Inventory Resources
  for (const item of INITIAL_INVENTORY) {
    await client.resource.create({
      data: {
        type: item.type,
        unit: item.unit,
        total: item.total,
        reserved: item.reserved,
        version: 1,
        batches: {
          create: [
            {
              batchNumber: `BATCH-${item.type.toUpperCase()}-001`,
              quantity: item.total,
              receivedAt: new Date(),
            },
          ],
        },
      },
    });
  }

  // 5. Seed Areas and Need Requests
  for (const a of INITIAL_AREAS) {
    await client.area.create({
      data: {
        id: a.id,
        name: a.name,
        latitude: a.latitude,
        longitude: a.longitude,
        population: a.population,
        households: a.households,
        severity: a.severity,
        urgency: a.urgency,
        vulnerability: a.vulnerability,
        verificationStatus: a.verificationStatus,
        active: a.active,
        notes: a.notes,
        version: 1,
        needs: {
          create: a.needs.map((n) => ({
            resourceType: n.resourceType,
            quantity: n.requestedQty,
            unit: n.unit,
            localSupply: n.locallyAvailableQty,
            resourceUrgency: 50,
          })),
        },
      },
    });
  }

  // 6. Seed Initial Audit Events
  for (const aud of INITIAL_AUDIT_LOG) {
    await client.auditEvent.create({
      data: {
        id: aud.id,
        actorId: aud.role === "admin" ? adminUser.id : coordUser.id,
        actorRole: aud.role,
        action: aud.action,
        entityType: aud.entityType,
        entityId: aud.entityId,
        details: aud.details,
        reason: aud.reason,
        createdAt: new Date(aud.timestamp),
      },
    });
  }

  console.log(`✅ Seed finished successfully: 7 Areas, 5 Resources, ${INITIAL_AUDIT_LOG.length} Audit Events.`);
}

async function main() {
  try {
    await seedDatabase(prisma);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"));

if (isDirectRun) {
  main();
}
