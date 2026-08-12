import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { StudioButton } from "@/components/studio/ui";
import { Field } from "@/components/studio/AiOutput";
import { signIn, signUp, sendPasswordReset } from "@/lib/supabase-rest";
import { useAuth } from "@/hooks/use-auth";

const LOGO_URL =
  "https://raw.githubusercontent.com/GiggleLootCoin/little-reds-big-studio-611db058/main/1784996969001.png";

export const Route = createFileRoute("/auth")({ component: AuthPage });

type Mode = "signin" | "signup" | "reset";

function AuthPage() {
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) throw new Error("Enter your email and password.");
      if (mode === "signup") {
        const cleanName = name.trim();
        if (!cleanName) throw new Error("Enter the name you'd like Buddy to use.");
        const result = await signUp(cleanEmail, password, cleanName);
        if (!("access_token" in result)) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          setMode("signin");
          return;
        }
      } else if (mode === "signin") {
        await signIn(cleanEmail, password);
      } else {
        await sendPasswordReset(cleanEmail);
        setMessage("If that email has an account, a password-reset email has been sent.");
        return;
      }
      window.location.replace(import.meta.env.BASE_URL);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (ready && user) {
    return (
      <>
        <AnimatedBackground />
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
          <img src={LOGO_URL} alt="Little Red's Big Studio" className="mx-auto w-56" />
          <section className="glass-panel rounded-2xl p-5 text-center">
            <h1 className="font-display text-xl font-black text-glow">
              Welcome back, {user.user_metadata.display_name}
            </h1>
            <p className="my-3 text-xs text-muted-foreground">{user.email}</p>
            <StudioButton className="w-full" type="button" onClick={() => (window.location.href = import.meta.env.BASE_URL)}>
              Enter the Studio
            </StudioButton>
          </section>
        </main>
      </>
    );
  }

  const title = mode === "signup" ? "Create your Studio account" : mode === "reset" ? "Reset your password" : "Sign in to Little Red's Big Studio";
  return (
    <>
      <AnimatedBackground />
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
        <img src={LOGO_URL} alt="Little Red's Big Studio" className="mx-auto w-56" />
        <section className="glass-panel rounded-2xl p-5">
          <h1 className="text-center font-display text-xl font-black text-glow">{title}</h1>
          <p className="my-3 text-center text-xs text-muted-foreground">
            Free account. No paid API key required. Your account keeps your Studio identity separate from your device.
          </p>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
            )}
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            {mode !== "reset" && (
              <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            )}
            <StudioButton className="w-full" type="submit" disabled={busy}>
              {busy ? "Working…" : mode === "signup" ? "Create free account" : mode === "reset" ? "Send reset email" : "Sign in"}
            </StudioButton>
          </form>
          {message && <p className="mt-3 text-center text-xs text-muted-foreground">{message}</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
            {mode !== "signin" && <button className="underline" onClick={() => { setMode("signin"); setMessage(""); }}>Sign in</button>}
            {mode !== "signup" && <button className="underline" onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button>}
            {mode !== "reset" && <button className="underline" onClick={() => { setMode("reset"); setMessage(""); }}>Forgot password?</button>}
          </div>
        </section>
        <a href="./" className="text-center text-xs text-muted-foreground underline">Continue to the studio</a>
      </main>
    </>
  );
}
