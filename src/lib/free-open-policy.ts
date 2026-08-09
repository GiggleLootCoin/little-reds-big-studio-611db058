export type ProviderPolicy = {
  id: string;
  openSource: boolean;
  local: boolean;
  apiKeyRequired: boolean;
  paidOrMetered: boolean;
};

/** Core Studio providers must satisfy every field below. */
export function isAllowedCoreProvider(provider: ProviderPolicy): boolean {
  return provider.openSource && provider.local && !provider.apiKeyRequired && !provider.paidOrMetered;
}

export function assertAllowedCoreProvider(provider: ProviderPolicy): void {
  if (!isAllowedCoreProvider(provider)) {
    throw new Error(`Provider ${provider.id} is not permitted in the free local Studio core.`);
  }
}
