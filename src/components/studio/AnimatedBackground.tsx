import { useEffect, useMemo, useState } from "react";
import bgAsset from "@/assets/red-moon-bg.png.asset.json";

type Ember = { id: number; left: number; size: number; delay: number; duration: number; drift: number };

/**
 * Layered live-wallpaper background: slow parallax moon plate, drifting
 * musical wave veils and floating embers. GPU-transform only, no layout work.
 */
export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const embers = useMemo<Ember[]>(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: (i * 37) % 100,
        size: 2 + ((i * 13) % 5),
        delay: (i * 1.7) % 18,
        duration: 16 + ((i * 5) % 14),
        drift: -60 + ((i * 29) % 120),
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute inset-0 animate-slow-zoom bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${bgAsset.url})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,oklch(0.62_0.24_26/25%),transparent_62%)]" />
      <div className="absolute left-1/2 top-[26%] h-[46vw] w-[46vw] max-h-96 max-w-96 -translate-x-1/2 animate-moon rounded-full bg-[radial-gradient(circle,oklch(0.62_0.25_26/55%),oklch(0.4_0.2_24/18%)_55%,transparent_72%)] blur-xl" />
      <div className="absolute bottom-0 left-0 h-1/2 w-[140%] animate-wave bg-[linear-gradient(0deg,oklch(0.5_0.22_25/28%),transparent)] [mask-image:radial-gradient(circle_at_50%_100%,black,transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(0deg,oklch(0.08_0.02_20)_10%,transparent)]" />

      {mounted &&
        embers.map((e) => (
          <span
            key={e.id}
            className="animate-ember absolute bottom-[-10vh] rounded-full bg-ember"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              boxShadow: "0 0 10px currentColor",
              // @ts-expect-error custom property
              "--drift": `${e.drift}px`,
            }}
          />
        ))}
    </div>
  );
}
