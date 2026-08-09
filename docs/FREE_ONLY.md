# Free-only contract

This project has a strict runtime rule: core Studio functionality must not require a paid service, API key, paid account, Lovable, Netlify, Cloudflare, or Supabase.

## Runtime principles

1. Browser/local processing first.
2. Free and open-source models second.
3. Free public/open hosted execution only where local execution is impractical.
4. Capability detection before presenting an engine as available.
5. Graceful fallback instead of fake success.
6. User data stays in browser/device storage unless the user explicitly exports it.
7. Android is the primary target; desktop mouse/keyboard support is additive.

## Buddy

Buddy chat is designed for local inference so chat usage is not metered by an external API. The UI must clearly report when a model is loading or unavailable.

## Media generation

Heavy models are not assumed to run inside every phone browser. The Studio may launch or hand off to a genuinely free/open hosted execution route, but must never require a paid API to unlock core functionality.
