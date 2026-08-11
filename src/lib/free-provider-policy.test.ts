import { describe, expect, it, beforeEach } from "vitest";
import { markProviderFailure, markProviderSuccess, providerAvailable } from "./free-provider-policy";

describe("free provider policy", () => {
  beforeEach(() => localStorage.clear());

  it("starts available", () => expect(providerAvailable("engine")).toBe(true));

  it("temporarily disables a failed provider", () => {
    markProviderFailure("engine", new Error("quota exceeded"));
    expect(providerAvailable("engine")).toBe(false);
  });

  it("clears a provider after success", () => {
    markProviderFailure("engine", new Error("timeout"));
    markProviderSuccess("engine");
    expect(providerAvailable("engine")).toBe(true);
  });
});
