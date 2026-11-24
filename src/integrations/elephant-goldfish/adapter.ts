import { AllocationRun } from "@/domain/types";

export interface EgmFinding {
  severity: "critical" | "warning" | "info";
  category: "structural" | "assumption" | "readiness" | "bias";
  description: string;
  recommendation: string;
}

export interface EgmAuditResult {
  status: "ready" | "degraded" | "unavailable";
  model: string;
  persona: "Elephant" | "Goldfish" | "Auditor";
  findings: EgmFinding[];
  timestamp: string;
  isFallback: boolean;
}

export class ElephantGoldfishAdapter {
  private isLoaded = false;

  async load(): Promise<{ status: "ready" | "unavailable"; details: string }> {
    try {
      this.isLoaded = true;
      return {
        status: "ready",
        details: "Elephant-Goldfish Model (EGM) advisory review interface ready.",
      };
    } catch {
      this.isLoaded = false;
      return {
        status: "unavailable",
        details: "EGM plugin not initialized. Fallback advisory active.",
      };
    }
  }

  describe(): {
    name: string;
    version: string;
    description: string;
    roles: Record<string, string>;
  } {
    return {
      name: "Automated Quality & Fairness Audit System",
      version: "1.0.0",
      description: "Adversarial design and objective validation system.",
      roles: {
        Core: "Holds operational context and domain constraints.",
        Auditor: "Independent audit flagging blind spots, equity bias, and unstated assumptions.",
        Elephant: "Holds operational context and domain constraints.",
        Goldfish: "Independent audit flagging blind spots, equity bias, and unstated assumptions.",
      },
    };
  }

  /**
   * Conducts an objective fairness and quality audit on an allocation run.
   */
  async auditAllocationRun(run: AllocationRun): Promise<EgmAuditResult> {
    const findings: EgmFinding[] = [];

    // Check 1: Fairness disparity audit
    const rates = Object.values(run.fairness.categorySatisfactionRate);
    const criticalRate = run.fairness.categorySatisfactionRate.critical;
    const lowRate = run.fairness.categorySatisfactionRate.low;

    if (criticalRate < 70) {
      findings.push({
        severity: "critical",
        category: "readiness",
        description: `Critical priority category satisfaction rate is only ${criticalRate.toFixed(1)}%.`,
        recommendation: "Consider reallocating reserves or initiating emergency supplier dispatch.",
      });
    }

    if (lowRate > criticalRate && criticalRate < 100) {
      findings.push({
        severity: "critical",
        category: "bias",
        description: "Disparity detected: Low priority areas have a higher satisfaction percentage than critical zones.",
        recommendation: "Inspect floor coverage overrides and verify priority scoring weights.",
      });
    }

    // Check 2: Minimum coverage check
    if (run.fairness.minCoverageAchievedCount < run.fairness.totalEligibleAreas) {
      const unservedCount = run.fairness.totalEligibleAreas - run.fairness.minCoverageAchievedCount;
      findings.push({
        severity: "warning",
        category: "structural",
        description: `${unservedCount} eligible area(s) did not achieve minimum 20% floor coverage.`,
        recommendation: "Review stock shortages for indivisible packages.",
      });
    }

    // Check 3: Water/Food essential ratio
    const waterSat = run.fairness.resourceSatisfactionRate.water;
    const foodSat = run.fairness.resourceSatisfactionRate.food;
    if (waterSat < 50 || foodSat < 50) {
      findings.push({
        severity: "warning",
        category: "assumption",
        description: `Acute life-support shortfall: Water satisfaction at ${waterSat.toFixed(1)}%, Food at ${foodSat.toFixed(1)}%.`,
        recommendation: "Issue immediate inter-district replenishment requests for drinking water and rations.",
      });
    }

    return {
      status: "ready",
      model: "Automated Quality & Fairness Audit v1.0",
      persona: "Auditor",
      findings,
      timestamp: new Date().toISOString(),
      isFallback: false,
    };
  }

  fallback(): EgmAuditResult {
    return {
      status: "unavailable",
      model: "Audit Engine (Offline)",
      persona: "Auditor",
      findings: [],
      timestamp: new Date().toISOString(),
      isFallback: true,
    };
  }
}

export const egmAdapter = new ElephantGoldfishAdapter();
