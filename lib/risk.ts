import { RiskLevel } from "@prisma/client";

export type LifecycleRiskInput = {
  installationYear?: number | null;
  expectedMaintenanceYear?: number | null;
  currentYear?: number | null;
};

export type LifecycleRiskResult = {
  score: number;
  level: RiskLevel;
  ageYears: number | null;
  explanation: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateLifecycleRisk(
  input: LifecycleRiskInput
): LifecycleRiskResult {
  const currentYear =
    input.currentYear ?? new Date().getFullYear();

  const installationYear = input.installationYear ?? null;
  const expectedMaintenanceYear =
    input.expectedMaintenanceYear ?? null;

  const ageYears =
    installationYear !== null
      ? Math.max(0, currentYear - installationYear)
      : null;

  /*
   * No lifecycle information means we cannot calculate
   * a meaningful risk score.
   */
  if (
    installationYear === null &&
    expectedMaintenanceYear === null
  ) {
    return {
      score: 0,
      level: RiskLevel.LOW,
      ageYears: null,
      explanation:
        "Lifecycle information is not available yet.",
    };
  }

  let score = 0;
  const reasons: string[] = [];

  /*
   * AGE COMPONENT
   *
   * 0–4 years   → 0
   * 5–9 years   → 15
   * 10–14 years → 30
   * 15–19 years → 40
   * 20+ years   → 50
   */
  if (ageYears !== null) {
    if (ageYears >= 20) {
      score += 50;
      reasons.push(`${ageYears} years old`);
    } else if (ageYears >= 15) {
      score += 40;
      reasons.push(`${ageYears} years old`);
    } else if (ageYears >= 10) {
      score += 30;
      reasons.push(`${ageYears} years old`);
    } else if (ageYears >= 5) {
      score += 15;
      reasons.push(`${ageYears} years old`);
    }
  }

  /*
   * MAINTENANCE COMPONENT
   *
   * Overdue by 3+ years → 50
   * Overdue by 1–2 years → 40
   * Due this year       → 35
   * Due within 1 year   → 25
   * Due within 2 years  → 15
   * More than 2 years   → 5
   */
  if (expectedMaintenanceYear !== null) {
    const yearsUntilMaintenance =
      expectedMaintenanceYear - currentYear;

    if (yearsUntilMaintenance < -2) {
      score += 50;
      reasons.push(
        `maintenance overdue by ${Math.abs(
          yearsUntilMaintenance
        )} years`
      );
    } else if (yearsUntilMaintenance < 0) {
      score += 40;
      reasons.push("maintenance is overdue");
    } else if (yearsUntilMaintenance === 0) {
      score += 35;
      reasons.push("maintenance is due this year");
    } else if (yearsUntilMaintenance === 1) {
      score += 25;
      reasons.push("maintenance is due next year");
    } else if (yearsUntilMaintenance === 2) {
      score += 15;
      reasons.push("maintenance is due within two years");
    } else {
      score += 5;
      reasons.push("maintenance is scheduled in the future");
    }
  }

  score = clamp(score, 0, 100);

  let level: RiskLevel;

  if (score >= 75) {
    level = RiskLevel.CRITICAL;
  } else if (score >= 50) {
    level = RiskLevel.HIGH;
  } else if (score >= 25) {
    level = RiskLevel.MEDIUM;
  } else {
    level = RiskLevel.LOW;
  }

  const explanation =
    reasons.length > 0
      ? `Lifecycle risk: ${reasons.join(" and ")}.`
      : "Lifecycle information is insufficient for detailed risk analysis.";

  return {
    score,
    level,
    ageYears,
    explanation,
  };
}