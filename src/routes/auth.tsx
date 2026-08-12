import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { StudioButton } from "@/components/studio/ui";
import { Field } from "@/components/studio/AiOutput";
import { signIn, signUp, sendPasswordReset, updatePassword } from "@/lib/supabase-rest";
import { useAuth } from "@/hooks/use-auth";

const LOGO_URL =
  "https://raw.githubusercontent.com/GiggleLootCoin/little-reds-big-studio-611db058/main/1784996969001.png";

export const Route = createFileRoute("/auth")({ component: AuthPage });

type Mode = "signin" | "signup" | "reset" | "new-password";

function AuthPage() {
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("new-password");
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === "new-password") {
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        await updatePassword(password);
        setMessage("Your password has been changed. You can now sign in normally.");
        setMode("signin");
        setPassword("");
        return;
      }
      if (!cleanEmail) throw new Error("Enter your email address.");
      if (mode === "reset") {
        await sendPasswordReset(cleanEmail);
        setMessage("If that email has an account, a password-reset email has been sent.");
        return;
      }
      if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
      if (mode === "signup") {
        const cleanName = name.trim();
        if (!cleanName) throw new Error("Enter the name you'd like Buddy to use.");
        const result = await signUp(cleanEmail, password, cleanName);
        if (!("access_token" in result)) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        await signIn(cleanEmail, password);
      }
      window.location.replace(import.meta.env.BASE_URL);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (ready && user && mode !== "new-password") {
    return (
      <>
        <AnimatedBackground />
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
          <img src={LOGO_URL} alt="Little Red's Big Studio" className="mx-auto w-56" />
          <section className="glass-panel rounded-2xl p-5 text-center">
            <h1 className="font-display text-xl font-black text-glow">Welcome back, {user.user_metadata.display_name}</h1>
            <p className="my-3 text-xs text-muted-foreground">{user.email}</p>
            <StudioButton className="w-full" type="button" onClick={() => (window.location.href = import.meta.env.BASE_URL)}>Enter the Studio</StudioButton>
          </section>
        </main>
      </>
    );
  }

  const title = mode === "signup" ? "Create your Studio account" : mode === "reset" ? "Reset your password" : mode === "new-password" ? "Choose a new password" : "Sign in to Little Red's Big Studio";
  return (
    <>
      <AnimatedBackground />
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
        <img src={LOGO_URL} alt="Little Red's Big Studio" className="mx-auto w-56" />
        <section className="glass-panel rounded-2xl p-5">
          <h1 className="text-center font-display text-xl font-black text-glow">{title}</h1>
          <p className="my-3 text-center text-xs text-muted-foreground">Free account. No paid API key required.</p>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />}
            {mode !== "new-password" && <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />}
            {(mode === "signup" || mode === "signin" || mode === "new-password") && <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} />}
            <StudioButton className="w-full" type="submit" disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create free account" : mode === "reset" ? "Send reset email" : mode === "new-password" ? "Change password" : "Sign in"}</StudioButton>
          </form>
          {message && <p className="mt-3 text-center text-xs text-muted-foreground">{message}</p>}
          {mode !== "new-password" && (
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
              {mode !== "signin" && <button className="underline" type="button" onClick={() => { setMode("signin"); setMessage(""); }}>Sign in</button>}
              {mode !== "signup" && <button className="underline" type="button" onClick={() => { setMode("signup"); setMessage(""); }}>Create account</button>}
              {mode !== "reset" && <button className="underline" type="button" onClick={() => { setMode("reset"); setMessage(""); }}>Forgot password?</button>}
            </div>
          )}
        </section>
        <a href="./" className="text-center text-xs text-muted-foreground underline">Continue to the studio</a>
      </main>
    </>
  );
}
