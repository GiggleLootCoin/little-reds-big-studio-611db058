export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const BUDDY_UNLIMITED_MONTHLY_USD = 10;

export type SubscriptionTier = "trial" | "free" | "unlimited";

export type TrialState = {
  startedAt: number;
  endsAt: number;
  tier: SubscriptionTier;
};

export type Entitlement = {
  tier: SubscriptionTier;
  paidVerified: boolean;
  watermarkRequired: boolean;
};

/**
 * The browser may display a countdown, but an authoritative backend timestamp
 * must decide whether a trial is valid. This function is deliberately pure so
 * the same rule can be used by UI and server code without trusting the device
 * clock for entitlement decisions.
 */
export function createTrialState(startedAt: number): TrialState {
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    throw new Error("Invalid trial start time");
  }

  return {
    startedAt,
    endsAt: startedAt + TRIAL_DURATION_MS,
    tier: "trial",
  };
}

export function getTrialRemainingMs(state: TrialState, now = Date.now()): number {
  if (!Number.isFinite(now)) return 0;
  return Math.max(0, state.endsAt - now);
}

export function isTrialActive(state: TrialState, now = Date.now()): boolean {
  return getTrialRemainingMs(state, now) > 0;
}

export function resolveEntitlement(
  input: {
    trial?: TrialState | null;
    paidVerified?: boolean;
    now?: number;
  },
): Entitlement {
  const now = input.now ?? Date.now();
  const paidVerified = input.paidVerified === true;

  if (paidVerified) {
    return { tier: "unlimited", paidVerified: true, watermarkRequired: false };
  }

  if (input.trial && isTrialActive(input.trial, now)) {
    return { tier: "trial", paidVerified: false, watermarkRequired: false };
  }

  return { tier: "free", paidVerified: false, watermarkRequired: true };
}

export type AbuseSignal = {
  accountAgeMs?: number;
  recentAccountCreations?: number;
  recentGenerationJobs?: number;
  verifiedEmail?: boolean;
  verifiedPhone?: boolean;
  networkRisk?: "low" | "medium" | "high";
  deviceRisk?: "low" | "medium" | "high";
};

/**
 * Produces a coarse risk score only. It must never be treated as proof of
 * abuse. In particular, a shared IP/network is not an identity and must not
 * automatically consume another person's trial.
 */
export function scoreTrialAbuseRisk(signal: AbuseSignal): number {
  let score = 0;

  if (signal.recentAccountCreations !== undefined) {
    score += Math.min(35, Math.max(0, signal.recentAccountCreations) * 5);
  }
  if (signal.recentGenerationJobs !== undefined) {
    score += Math.min(30, Math.max(0, signal.recentGenerationJobs) * 2);
  }
  if (signal.verifiedEmail === false) score += 8;
  if (signal.verifiedPhone === false) score += 8;
  if (signal.networkRisk === "medium") score += 8;
  if (signal.networkRisk === "high") score += 18;
  if (signal.deviceRisk === "medium") score += 8;
  if (signal.deviceRisk === "high") score += 18;

  if (signal.accountAgeMs !== undefined && signal.accountAgeMs < 60 * 60 * 1000) {
    score += 5;
  }

  return Math.min(100, score);
}

export function requiresAdditionalTrialVerification(score: number): boolean {
  return Number.isFinite(score) && score >= 60;
}

export const SUPPORT_LINKS = {
  cashApp: "https://cash.app/$LittleRedBigSmile",
  buyMeACoffee: "https://buymeacoffee.com/littleredbigsmile",
  youtube: "https://youtube.com/@little-red-big-smile",
} as const;

export const SUPPORT_POLICY = {
  publicRecognitionRequiresOptIn: true,
  neverPublishPaymentAmount: true,
  neverPublishEmailAddress: true,
} as const;
