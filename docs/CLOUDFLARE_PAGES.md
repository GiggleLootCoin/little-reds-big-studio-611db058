# Cloudflare Pages deployment target

This repository now contains a Pages Functions-compatible edge layer under `functions/api/`.

## Build

- Framework: Vite static build
- Build command: `npm run build`
- Output directory: `dist`
- Functions: `functions/`

## Endpoints

- `/api/health` — deployment/runtime health
- `/api/providers` — capability manifest; it deliberately does not claim live availability

## Free-first rules

The edge layer is infrastructure, not an AI provider. Heavy AI is selected at request time by the client/runtime provider router. ZeroGPU is never a hard dependency.

Do not add a paid secret to make the core Studio work. Optional provider credentials may be supported later, but the application must retain a working local/free path without them.

## Persistent storage

Do not use in-memory Pages Functions state as durable project storage. When persistent storage is added, use a free-tier durable store and keep media objects separate from metadata. The UI must show real provider limits rather than promising literally unlimited storage.
