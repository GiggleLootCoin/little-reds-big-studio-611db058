import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/littlered-logo.png.asset.json";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { StudioButton } from "@/components/studio/ui";
import { ErrorNote } from "@/components/studio/AiOutput";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: Error | null }>;
};
type AuthorizationDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};
type RedirectPayload = { redirect_url?: string | null; redirect_to?: string | null };

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase session lives in localStorage, absent during SSR.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <div className="glass-panel rounded-2xl p-5 text-sm">
        Could not load this authorization request: {String((error as Error)?.message ?? error)}
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = details?.client?.name ?? "this app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <>
      <AnimatedBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
        <img src={logo.url} alt="Little Red's Big Studio" className="mx-auto w-48 max-w-[60vw]" />
        <div className="glass-panel space-y-4 rounded-2xl p-5">
          <h1 className="text-center font-display text-xl font-black text-glow">
            Connect {client} to your studio
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            {client} will be able to read and write your studio sessions, lyrics and storyboards as you. You
            can disconnect it at any time from {client}.
          </p>
          {error && <ErrorNote message={error} />}
          <div className="flex gap-3">
            <StudioButton className="flex-1" disabled={busy} onClick={() => void decide(true)}>
              {busy ? "Working…" : "Approve"}
            </StudioButton>
            <StudioButton variant="ghost" className="flex-1" disabled={busy} onClick={() => void decide(false)}>
              Deny
            </StudioButton>
          </div>
        </div>
      </main>
    </>
  );
}
