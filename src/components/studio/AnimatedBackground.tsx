import { useEffect, useMemo, useState } from "react";
import bgAsset from "@/assets/red-moon-bg.png.asset.json";

type Particle = { id: number; left: number; size: number; delay: number; duration: number; drift: number; rotate: number };
export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const hearts = useMemo<Particle[]>(() => Array.from({ length: 24 }, (_, i) => ({ id: i, left: (i * 53) % 100, size: 8 + ((i * 7) % 12), delay: (i * 1.9) % 14, duration: 18 + ((i * 3) % 13), drift: -50 + ((i * 31) % 100), rotate: -18 + ((i * 17) % 36) })), []);
  const embers = useMemo<Particle[]>(() => Array.from({ length: 30 }, (_, i) => ({ id: i, left: (i * 37) % 100, size: 2 + ((i * 13) % 5), delay: (i * 1.7) % 18, duration: 16 + ((i * 5) % 14), drift: -60 + ((i * 29) % 120), rotate: 0 })), []);
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
    <div className="absolute inset-0 animate-slow-zoom bg-cover bg-center opacity-48" style={{ backgroundImage: `url(${bgAsset.url})` }} />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,oklch(0.62_0.24_26/18%),transparent_58%)]" />
    <div className="absolute left-1/2 top-[20%] h-[58vw] w-[58vw] max-h-[34rem] max-w-[34rem] -translate-x-1/2 animate-moon rounded-full bg-[radial-gradient(circle,oklch(0.62_0.25_26/40%),oklch(0.4_0.2_24/14%)_55%,transparent_72%)] blur-2xl" />
    <div className="absolute inset-x-0 top-0 h-24 opacity-95"><div className="paint-drip-field h-full w-full animate-paint-shimmer" /></div>
    <div className="absolute bottom-0 left-0 h-1/2 w-[140%] animate-wave bg-[linear-gradient(0deg,oklch(0.5_0.22_25/22%),transparent)] [mask-image:radial-gradient(circle_at_50%_100%,black,transparent_70%)]" />
    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(0deg,oklch(0.08_0.02_20)_10%,transparent)]" />
    <div className="absolute inset-0 bg-background/38" />
    {mounted && hearts.map((heart) => <span key={`heart-${heart.id}`} className="animate-love-heart absolute bottom-[-10vh] select-none font-serif text-love" style={{ left: `${heart.left}%`, fontSize: heart.size, animationDelay: `${heart.delay}s`, animationDuration: `${heart.duration}s`, textShadow: "0 0 14px currentColor", "--drift": `${heart.drift}px`, "--rotate": `${heart.rotate}deg` } as React.CSSProperties}>♥</span>)}
    {mounted && embers.map((ember) => <span key={`ember-${ember.id}`} className="animate-ember absolute bottom-[-10vh] rounded-full bg-ember" style={{ left: `${ember.left}%`, width: ember.size, height: ember.size, animationDelay: `${ember.delay}s`, animationDuration: `${ember.duration}s`, boxShadow: "0 0 10px currentColor", "--drift": `${ember.drift}px` } as React.CSSProperties} />)}
  </div>;
}
