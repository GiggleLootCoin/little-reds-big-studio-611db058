import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/littlered-logo.png.asset.json";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { StudioButton } from "@/components/studio/ui";
import { ErrorNote, Field } from "@/components/studio/AiOutput";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const TITLE = "Sign In — Little Red's Big Studio";
const DESCRIPTION =
  "Create your creator account for Little Red's Big Studio: AI song critique, lyrics, storyboards and the Artist Spotlight feed.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "",
  }),
  component: AuthPage,
});

/** Only same-origin relative paths may be used as a post-login destination. */
function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const destination = safeNext(next);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(destination);
    });
  }, [destination]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${destination}`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (err) throw err;
        const { data } = await supabase.auth.getSession();
        if (data.session) window.location.replace(destination);
        else setNotice("Check your inbox to confirm your email, then sign in.");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.replace(destination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${destination}`,
    });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.redirected) return;
    window.location.replace(destination);
  };

  return (
    <>
      <AnimatedBackground />
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
        <img src={logo.url} alt="Little Red's Big Studio" className="mx-auto w-56 max-w-[70vw]" />
        <div className="glass-panel space-y-4 rounded-2xl p-5">
          <h1 className="text-center font-display text-xl font-black text-glow">
            {mode === "signin" ? "Enter the Studio" : "Create your creator account"}
          </h1>

          <StudioButton variant="ghost" className="w-full" onClick={google}>
            Continue with Google
          </StudioButton>

          <div className="drip-divider" />

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Field
                label="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your artist name"
              />
            )}
            <Field
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && <ErrorNote message={error} />}
            {notice && <p className="text-xs text-primary">{notice}</p>}
            <StudioButton className="w-full" type="submit" disabled={busy}>
              {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </StudioButton>
          </form>

          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
        <a href="/" className="text-center text-xs text-muted-foreground underline">
          Back to the studio
        </a>
      </main>
    </>
  );
}
