import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { StudioButton } from "@/components/studio/ui";
import { Field } from "@/components/studio/AiOutput";
import { createLocalUser, useAuth } from "@/hooks/use-auth";
import { authenticateWithPasskey, registerPasskey, supportsPasskeys } from "@/lib/auth/passkey";

const LOGO_URL = "https://raw.githubusercontent.com/GiggleLootCoin/little-reds-big-studio-611db058/main/1784996969001.png";

export const Route = createFileRoute("/auth")({ component: AuthPage });
function AuthPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = name.trim();
    if (!displayName) {
      setMessage("Enter the name you'd like Buddy to use.");
      return;
    }
    createLocalUser(displayName, email.trim() || "local@studio");
    window.location.replace(import.meta.env.BASE_URL);
  };
  const signInWithPasskey = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (!(await authenticateWithPasskey())) {
        setMessage("No passkey is registered on this device yet. Create your account first.");
        return;
      }
      window.location.replace(import.meta.env.BASE_URL);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Biometric sign-in was cancelled or unavailable.");
    } finally {
      setBusy(false);
    }
  };
  const createPasskey = async () => {
    const displayName = name.trim();
    if (!displayName) {
      setMessage("Enter your name first so the passkey belongs to your creator identity.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      createLocalUser(displayName, email.trim() || "local@studio");
      await registerPasskey(displayName);
      window.location.replace(import.meta.env.BASE_URL);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Passkey setup was cancelled or unavailable.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <AnimatedBackground />
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
        <img src={LOGO_URL} alt="Little Red's Big Studio" className="mx-auto w-56" />
        <section className="glass-panel rounded-2xl p-5">
          <h1 className="text-center font-display text-xl font-black text-glow">
            {user ? `Welcome back, ${user.user_metadata.display_name}` : "Enter the Studio"}
          </h1>
          <p className="my-3 text-center text-xs text-muted-foreground">
            Use your name and email, then optionally protect this device with a fingerprint, face, or device passkey.
          </p>
          {!user && (
            <form onSubmit={submit} className="space-y-3">
              <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
              <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              <StudioButton className="w-full" type="submit">Create / Enter Studio</StudioButton>
              {supportsPasskeys() && (
                <StudioButton className="w-full" type="button" variant="ghost" onClick={createPasskey} disabled={busy}>
                  {busy ? "Setting up…" : "Create with fingerprint / passkey"}
                </StudioButton>
              )}
            </form>
          )}
          {user && supportsPasskeys() && (
            <StudioButton className="w-full" type="button" variant="ghost" onClick={signInWithPasskey} disabled={busy}>
              {busy ? "Checking…" : "Sign in with fingerprint / passkey"}
            </StudioButton>
          )}
          {message && <p className="mt-3 text-center text-xs text-destructive">{message}</p>}
        </section>
        <a href="./" className="text-center text-xs text-muted-foreground underline">Back to the studio</a>
      </main>
    </>
  );
}
