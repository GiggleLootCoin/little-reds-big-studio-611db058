/**
 * Little Red's Big Studio — product policy and entitlement constants.
 *
 * This file contains product-level policy only. Secrets, payment credentials,
 * provider tokens, and server-side verification keys must never be placed here.
 */

export const PRODUCT_POLICY = {
  identity: {
    creatorName: 'Little Red',
    appName: "Little Red's Big Studio",
    universalGreeting: false,
    userNameSource: 'authenticated-profile',
  },

  platform: {
    androidFirst: true,
    browserFirst: true,
    computerRequired: false,
    colabRequired: false,
    noInstallRequired: true,
  },

  trial: {
    durationDays: 7,
    fullAccess: true,
    watermarkFree: true,
    startsOnVerifiedAccountActivation: true,
    serverAuthoritativeExpiry: true,
    oneTrialPerEligibleAccount: true,
    abuseProtection: {
      enabled: true,
      useIpAsOneSignalOnly: true,
      useDeviceSignals: true,
      useAccountSignals: true,
      useVelocitySignals: true,
      avoidIpOnlyBlocking: true,
      avoidPermanentRawIpRetention: true,
      protectHighCostGeneration: true,
    },
  },

  tiers: {
    free: {
      name: 'Free',
      watermarkExports: true,
      watermarkUsesCanonicalLogo: true,
      watermarkDoesNotMutateSourceMasters: true,
      noMandatoryApiKey: true,
    },
    unlimited: {
      name: 'Buddy Unlimited',
      monthlyPriceUsd: 10,
      watermarkFreeExports: true,
      entitlementMustBeServerVerified: true,
      paymentProvider: 'buymeacoffee',
      fairUseProtection: true,
    },
  },

  support: {
    buyMeACoffee: 'https://buymeacoffee.com/littleredbigsmile',
    cashApp: 'https://cash.app/$LittleRedBigSmile',
    youtube: 'https://youtube.com/@little-red-big-smile?si=U1pBT09zB91GBrW3',
    supporterShoutouts: {
      enabledOnlyWhenAutomated: true,
      requiresExplicitOptIn: true,
      neverExposePaymentDetails: true,
    },
  },

  generation: {
    outcomeFirst: true,
    validateActualArtifactBeforeSuccess: true,
    automaticBestRouteSelection: true,
    automaticFailover: true,
    automaticRecovery: true,
    automaticQualityControl: true,
    resumeFromLastSuccessfulStage: true,
    duplicateJobProtection: true,
    backgroundJobs: true,
    userDoesNotChooseProviderByDefault: true,
    preferFreeOpenPublicResources: true,
    noProviderLockIn: true,
  },

  memory: {
    lifelongDesign: true,
    creativeDna: true,
    projectGraph: true,
    versionHistory: true,
    rememberFailuresAndLessons: true,
    userScoped: true,
    exportable: true,
    crossDeviceRequiresPersistentAuthenticatedStorage: true,
  },

  buddy: {
    liveWebResearch: true,
    multimodalContext: true,
    creativeDirector: true,
    proactiveAssistance: true,
    intelligentDisagreement: true,
    knowsWhenNotToUseAi: true,
    makeItGreatWorkflow: true,
    hiddenTechnicalMachinery: true,
  },
} as const;

export type ProductPolicy = typeof PRODUCT_POLICY;
