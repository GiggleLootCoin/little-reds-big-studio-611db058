export type StudioTier = "trial" | "free" | "paid";

export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const PAID_MONTHLY_PRICE_USD = 10;

export interface TrialState {
  startedAt: number;
  expiresAt: number;
  claimed: boolean;
}

export interface StudioEntitlement {
  tier: StudioTier;
  trial?: TrialState;
  unlimited: boolean;
  removeWatermark: boolean;
}

/**
 * The trial is seven days of the complete Studio experience. Expiration must
 * be authoritative on the account/entitlement service; this function only
 * evaluates an already-authoritative timestamp for UI and routing.
 */
export function createTrial(startedAt = Date.now()): TrialState {
  return { startedAt, expiresAt: startedAt + TRIAL_DURATION_MS, claimed: true };
}

export function isTrialActive(trial: TrialState | undefined, now = Date.now()): boolean {
  return Boolean(trial?.claimed && now < trial.expiresAt);
}

export function getStudioEntitlement(
  trial: TrialState | undefined,
  verifiedPaid = false,
  now = Date.now(),
): StudioEntitlement {
  if (verifiedPaid) {
    return { tier: "paid", unlimited: true, removeWatermark: true };
  }
  if (isTrialActive(trial, now)) {
    return { tier: "trial", trial, unlimited: true, removeWatermark: true };
  }
  return { tier: "free", trial, unlimited: false, removeWatermark: false };
}

export function trialRemainingMs(trial: TrialState | undefined, now = Date.now()): number {
  if (!trial) return 0;
  return Math.max(0, trial.expiresAt - now);
}

export function formatTrialCountdown(remainingMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, remainingMs) / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export const MEMBERSHIP_COPY = Object.freeze({
  title: "Buddy Unlimited",
  price: "$10/month",
  promise: "Unlimited Studio use without the Little Red's Big Studio export watermark.",
  trial: "Try everything free for 7 days. No credit card required.",
});
