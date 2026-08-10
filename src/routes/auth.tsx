import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { StudioButton } from "@/components/studio/ui";
import { Field } from "@/components/studio/AiOutput";
import { createLocalUser } from "@/hooks/use-auth";

const LOGO_URL = "https://raw.githubusercontent.com/GiggleLootCoin/little-reds-big-studio-611db058/main/1784996969001.png";

export const Route = createFileRoute("/auth")({ component: AuthPage });
function AuthPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createLocalUser(name || "Little Red", email || "local@studio");
    window.location.replace(import.meta.env.BASE_URL);
  };
  return (
    <>
      <AnimatedBackground />
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
        <img src={LOGO_URL} alt="Little Red's Big Studio" className="mx-auto w-56" />
        <section className="glass-panel rounded-2xl p-5">
          <h1 className="text-center font-display text-xl font-black text-glow">
            Enter the Studio
          </h1>
          <p className="my-3 text-center text-xs text-muted-foreground">
            No account, password, cloud database or API key required. Your creator identity stays on
            this device.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <Field
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Little Red"
            />
            <Field
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="local@studio"
            />
            <StudioButton className="w-full" type="submit">
              Enter locally
            </StudioButton>
          </form>
        </section>
        <a href="./" className="text-center text-xs text-muted-foreground underline">
          Back to the studio
        </a>
      </main>
    </>
  );
}
