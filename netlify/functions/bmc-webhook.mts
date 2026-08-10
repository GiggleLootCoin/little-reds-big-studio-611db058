import { getStore } from "@netlify/blobs";

const MEMBERSHIP_EVENTS = new Set(["membership.started", "membership.updated", "membership.cancelled", "membership.paused"]);
function constantTimeEqual(a: string, b: string) { if (a.length !== b.length) return false; let diff = 0; for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index); return diff === 0; }
async function hmacHex(body: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function collectStrings(value: unknown, found: Record<string, string> = {}) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) { for (const item of value) collectStrings(item, found); return found; }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string") {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalized.includes("email") && item.includes("@")) found.email ??= item.trim().toLowerCase();
      if (normalized === "membershipid" || normalized === "memberid" || normalized === "subscriptionid") found.membershipId ??= item;
      if (normalized === "name" || normalized === "displayname") found.displayName ??= item;
    } else collectStrings(item, found);
  }
  return found;
}
export default async (request: Request) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const secret = Netlify.env.get("BMC_WEBHOOK_SECRET");
  if (!secret) return new Response("Webhook secret is not configured", { status: 503 });
  const rawBody = await request.text();
  const supplied = request.headers.get("x-signature-sha256") ?? "";
  const expected = await hmacHex(rawBody, secret);
  if (!constantTimeEqual(expected, supplied.toLowerCase())) return new Response("Invalid signature", { status: 401 });
  let payload: { event_id?: number | string; type?: string; live_mode?: boolean; data?: unknown };
  try { payload = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }
  if (!payload.type || !MEMBERSHIP_EVENTS.has(payload.type)) return Response.json({ ok: true, ignored: true });
  if (payload.live_mode === false) return Response.json({ ok: true, test: true });
  const details = collectStrings(payload.data);
  if (!details.email) return new Response("Membership email not present", { status: 422 });
  const store = getStore("lrbgs-entitlements", { consistency: "strong" });
  const key = `membership:${details.email}`;
  const active = payload.type === "membership.started" || payload.type === "membership.updated";
  if (payload.type === "membership.cancelled" || payload.type === "membership.paused") {
    await store.setJSON(key, { status: "FREE", active: false, updatedAt: Date.now(), eventId: payload.event_id ?? null, membershipId: details.membershipId ?? null });
  } else {
    await store.setJSON(key, { status: "UNLIMITED", active, updatedAt: Date.now(), eventId: payload.event_id ?? null, membershipId: details.membershipId ?? null, displayName: details.displayName ?? null });
  }
  return Response.json({ ok: true });
};
export const config = { path: "/api/bmc-webhook" };
