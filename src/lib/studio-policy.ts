export const STUDIO_POLICY = Object.freeze({
  trial: {
    durationMs: 7 * 24 * 60 * 60 * 1000,
    startsOn: "verified_account_activation" as const,
    fullAccess: true,
    watermark: false,
    noCreditCardRequired: true,
    oneTrialPerAccount: true,
  },
  paid: {
    name: "Buddy Unlimited",
    priceUsdMonthly: 10,
    watermark: false,
    unlimitedUsage: true,
    fairUseForInfrastructure: true,
    entitlementSource: "trusted_membership_verification" as const,
  },
  free: {
    watermark: true,
    watermarkAsset: "/assets/visual-references/1784996969001.png",
    originalsUnmodified: true,
    fairUse: true,
  },
  platform: {
    androidFirst: true,
    browserFirst: true,
    colabRequired: false,
    computerRequired: false,
    mandatoryApiKey: false,
    paidAiApiRequired: false,
    openPublicFreePreferred: true,
  },
  support: {
    cashApp: "https://cash.app/$LittleRedBigSmile",
    buyMeACoffee: "https://buymeacoffee.com/littleredbigsmile",
    youtube: "https://youtube.com/@little-red-big-smile",
    publicShoutouts: "opt_in_only" as const,
  },
  abuseProtection: {
    enabled: true,
    ipIsSignalOnly: true,
    accountIdentityRequired: true,
    useMultipleSignals: true,
    examples: [
      "verified account identity",
      "short-lived network reputation signal",
      "rapid account creation patterns",
      "generation volume anomalies",
      "device/session continuity signals where privacy-preserving",
      "datacenter/VPN/proxy risk signals where available",
    ],
    neverBlockSolelyOnSharedIp: true,
    neverUsePaymentDataAsPublicIdentity: true,
    retainOnlyWhatSecurityNeeds: true,
  },
} as const);

export type TrialState = "not_started" | "active" | "expired";

export function trialState(startedAt: number | null, now = Date.now()): TrialState {
  if (!startedAt) return "not_started";
  return now - startedAt < STUDIO_POLICY.trial.durationMs ? "active" : "expired";
}

export function trialRemainingMs(startedAt: number | null, now = Date.now()): number {
  if (!startedAt) return 0;
  return Math.max(0, STUDIO_POLICY.trial.durationMs - (now - startedAt));
}

export function formatTrialCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
}

/**
 * Client code may display the countdown, but must never treat it as proof of
 * entitlement. Trial start/expiry and paid membership must be authoritative
 * on an account-backed service before granting protected capabilities.
 */
export function canRemoveWatermark(entitlement: { paid: boolean; trialActive: boolean }): boolean {
  return entitlement.paid || entitlement.trialActive;
}
