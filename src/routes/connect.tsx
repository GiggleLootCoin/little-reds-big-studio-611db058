import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, Bot, RefreshCw, Sparkles } from "lucide-react";
import logo from "@/assets/littlered-logo.png.asset.json";
import { AnimatedBackground } from "@/components/studio/AnimatedBackground";
import { Panel, StudioButton } from "@/components/studio/ui";

const TITLE = "Connect ChatGPT & Claude — Little Red's Big Studio";
const DESCRIPTION =
  "Step-by-step instructions to connect Little Red's Big Studio to ChatGPT, Claude and other AI assistants so they can write lyrics, critiques and storyboards straight into your studio.";

export const Route = createFileRoute("/connect")({
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
  component: ConnectPage,
});

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="crimson-gloss mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-muted-foreground">{children}</span>
    </li>
  );
}

function ConnectPage() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const mcpUrl = origin ? new URL("/mcp", origin).toString() : "";

  const claudeUrl =
    "https://claude.ai/customize/connectors?modal=add-custom-connector" +
    `&connectorName=${encodeURIComponent("Little Red's Big Studio")}` +
    `&connectorUrl=${encodeURIComponent(mcpUrl)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <AnimatedBackground />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-xl">
        <a href="/">
          <img src={logo.url} alt="Little Red's Big Studio logo" className="mx-auto h-12 w-auto" />
        </a>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6">
        <h1 className="text-center font-display text-2xl font-black leading-tight text-glow">
          Use the Studio inside ChatGPT &amp; Claude
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Connect your AI assistant once, then just ask it to write your lyrics, critique a song or build a
          storyboard — it saves straight into your studio.
        </p>

        <div className="drip-divider my-6" />

        <section className="glass-panel rounded-2xl p-5" aria-labelledby="studio-link">
          <h2 id="studio-link" className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            Your studio link
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            This is the only thing you ever need to paste. Copy it now.
          </p>
          <code className="mt-3 block overflow-x-auto rounded-xl border border-border/60 bg-secondary/60 px-3 py-2 font-mono text-xs text-foreground">
            {mcpUrl || "Loading…"}
          </code>
          <StudioButton className="mt-3 w-full" onClick={() => void copy()} disabled={!mcpUrl}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied!" : "Copy studio link"}
          </StudioButton>
        </section>

        <div className="mt-4 space-y-3">
          <Panel
            title="Connect ChatGPT"
            eyebrow="Step by step"
            icon={<Sparkles className="size-5" aria-hidden />}
            defaultOpen
          >
            <ol className="space-y-3">
              <Step n={1}>
                Open{" "}
                <a
                  className="text-primary underline"
                  href="https://chatgpt.com/#settings/Connectors/Advanced"
                  target="_blank"
                  rel="noreferrer"
                >
                  ChatGPT&nbsp;→ Settings → Connectors → Advanced
                </a>{" "}
                and switch on <strong>Developer mode</strong> (read the risk notice it shows you).
              </Step>
              <Step n={2}>
                Back in a chat, click the <strong>+</strong> button in the message box and turn on{" "}
                <strong>Developer mode</strong> there too.
              </Step>
              <Step n={3}>
                Click <strong>Add sources</strong>, then <strong>Connect more</strong>.
              </Step>
              <Step n={4}>
                Name it <strong>Little Red's Big Studio</strong> and paste the studio link from above.
              </Step>
              <Step n={5}>
                Sign in with the same account you use here and press <strong>Approve</strong> on the screen
                that appears.
              </Step>
              <Step n={6}>
                Now just ask: <em>"Write a chorus for my new session in Little Red's Big Studio."</em>
              </Step>
            </ol>
          </Panel>

          <Panel title="Connect Claude" eyebrow="Step by step" icon={<Bot className="size-5" aria-hidden />}>
            <ol className="space-y-3">
              <Step n={1}>
                Click{" "}
                <a className="text-primary underline" href={claudeUrl} target="_blank" rel="noreferrer">
                  this link to open Claude's connector box
                </a>{" "}
                — the name and studio link are already filled in for you.
              </Step>
              <Step n={2}>
                Check the details look right and press <strong>Add</strong>.
              </Step>
              <Step n={3}>
                If the box doesn't open, go to Claude → <strong>Settings → Connectors</strong> →{" "}
                <strong>Add custom connector</strong>, then paste the studio link yourself.
              </Step>
              <Step n={4}>
                Sign in with the same account you use here and press <strong>Approve</strong>.
              </Step>
              <Step n={5}>
                Turn the connector on from the message box, then ask Claude to work on your studio sessions.
              </Step>
            </ol>
          </Panel>

          <Panel
            title="Other AI assistants"
            eyebrow="Step by step"
            icon={<Bot className="size-5" aria-hidden />}
          >
            <ol className="space-y-3">
              <Step n={1}>Open your assistant's MCP server or custom connector settings.</Step>
              <Step n={2}>Create a new remote MCP server connection.</Step>
              <Step n={3}>Name it Little Red's Big Studio and paste the studio link.</Step>
              <Step n={4}>Finish the sign-in and approval prompts.</Step>
              <Step n={5}>Enable the connection, then ask the assistant to use your studio.</Step>
            </ol>
          </Panel>

          <Panel
            title="After the studio gets updated"
            eyebrow="Refresh"
            icon={<RefreshCw className="size-5" aria-hidden />}
          >
            <p className="mb-3 text-sm text-muted-foreground">
              Your assistant remembers what the studio could do the day you connected it. When new features
              land, refresh the connection:
            </p>
            <ol className="space-y-3">
              <Step n={1}>
                <strong>ChatGPT:</strong> Settings → Enabled apps → Little Red's Big Studio → next to
                "Information", click <strong>Refresh</strong>. Then start a new chat.
              </Step>
              <Step n={2}>
                <strong>Claude:</strong> Settings → Connectors → select this connector → refresh or update its
                tools.
              </Step>
              <Step n={3}>
                <strong>Anything else:</strong> open the connection in its settings and reload / reconnect it.
              </Step>
              <Step n={4}>If the studio link above ever changes, paste the new one in.</Step>
            </ol>
          </Panel>
        </div>

        <a href="/" className="mt-8 block text-center text-xs text-muted-foreground underline">
          Back to the studio
        </a>
      </main>
    </>
  );
}
