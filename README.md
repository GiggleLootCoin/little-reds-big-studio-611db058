# Little Red's Big Studio

**Buddy-first, Android-first, free-first creative studio for musicians and YouTubers.**

The Studio is designed around one simple experience: bring in your idea, music, voice or artwork and let **Buddy** help decide how to move the project forward. Model names, provider setup and runner selection stay backstage.

## Production

- **GitHub Pages:** `https://gigglelootcoin.github.io/little-reds-big-studio-611db058/`
- **Source:** this GitHub repository
- **Hosting:** GitHub Pages
- **Cost target:** $0
- **AI policy:** no mandatory paid AI API and no mandatory provider account
- **Storage:** browser-first project storage where supported
- **Device:** Android-first responsive web app

## Buddy orchestration

Buddy ranks available free/open routes by capability and keeps fallbacks ready. The Studio never claims that WebGPU, WebAssembly or a browser API is itself an AI model. Heavy generative work can be handed to public open/free runners when local execution is not genuinely available.

The normal user does **not** choose models or providers.

## Current free/open routes

- Writing/reasoning: local/browser-capable models when supported
- Voice: Applio/RVC and browser-capable fallbacks
- Music: ACE-Step and MusicGen Web routes
- Stems: Demucs and BS-Roformer routes
- Artwork: Z Image Turbo and SDXL routes
- Video: Wan/LTX-class public free/open routes where available

Public free GPU services can have queues or temporary outages; Buddy therefore keeps alternatives rather than presenting one provider as guaranteed.

## Red's Ways Of Thinking

`Red's Ways Of Thinking` is kept as private reference material for Buddy. It is treated as a perspective/creative knowledge layer, not as a list of verified facts. Buddy can use it for creative framing while separating disputed claims from independently verifiable information when factual accuracy matters.

## Visual identity

The repository contains the uploaded visual-reference library under `assets/visual-references/` and the Studio uses the approved cinematic glass, crimson/obsidian visual direction. Buddy's canonical reference is preserved in the repository.

## Development

The repository is a TanStack Start application built with Vite and TypeScript.

```sh
npm install
npm run dev
```

Production build:

```sh
npm run build
```

GitHub Actions validates the project with dependency installation, TypeScript checking, formatting, linting and a production build. A separate GitHub Pages workflow builds the Vite `dist/` output and deploys it to GitHub Pages.
