export type TrialRiskLevel = "normal" | "elevated" | "high";

export interface TrialRiskSignals {
  accountAgeMs: number;
  emailVerified: boolean;
  rapidAccountCreations: number;
  rapidTrialClaims: number;
  generationBurstCount: number;
  networkTrialClaims: number;
  deviceTrialClaims: number;
  vpnOrDatacenterRisk: boolean;
}

export interface TrialRiskDecision {
  level: TrialRiskLevel;
  allowTrial: boolean;
  requireAdditionalVerification: boolean;
  reason: string;
}

/**
 * Privacy-preserving abuse guidance. IP/network and device signals are inputs,
 * never a sole identity. The authoritative service should keep raw network
 * identifiers short-lived and protected; this client-safe policy consumes only
 * aggregate counts and risk flags.
 */
export function assessTrialRisk(signals: TrialRiskSignals): TrialRiskDecision {
  let score = 0;
  if (!signals.emailVerified) score += 1;
  if (signals.rapidAccountCreations >= 3) score += 3;
  if (signals.rapidTrialClaims >= 2) score += 4;
  if (signals.generationBurstCount >= 20) score += 3;
  if (signals.networkTrialClaims >= 5) score += 2;
  if (signals.deviceTrialClaims >= 2) score += 4;
  if (signals.vpnOrDatacenterRisk) score += 1;
  if (signals.accountAgeMs < 10 * 60 * 1000) score += 1;

  if (score >= 8) {
    return {
      level: "high",
      allowTrial: false,
      requireAdditionalVerification: true,
      reason: "Multiple trial-abuse signals require verification before high-cost trial access.",
    };
  }
  if (score >= 4) {
    return {
      level: "elevated",
      allowTrial: true,
      requireAdditionalVerification: true,
      reason: "Trial remains available while additional safeguards protect shared resources.",
    };
  }
  return {
    level: "normal",
    allowTrial: true,
    requireAdditionalVerification: false,
    reason: "No material trial-abuse pattern detected.",
  };
}

export const TRIAL_ABUSE_RULES = Object.freeze([
  "One genuine seven-day trial per legitimate account.",
  "Never treat one IP address as one human: households, schools and mobile networks can share IPs.",
  "Use network/IP reputation only as one privacy-conscious signal.",
  "Never use invasive fingerprinting as the sole identity mechanism.",
  "Rate-limit rapid account creation and generation bursts.",
  "Keep raw security identifiers protected and short-lived where possible.",
  "Do not punish legitimate shared networks solely because another user abused a trial.",
  "Use stronger verification only when risk is materially elevated.",
  "Keep trial abuse controls invisible to ordinary users.",
]);
