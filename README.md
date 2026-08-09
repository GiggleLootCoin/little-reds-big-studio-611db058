# Little Red's Big Studio

**Buddy-first, Android-first, free-first creative studio for musicians and YouTubers.**

The Studio is designed around one simple experience: bring in your idea, music, voice or artwork and let **Buddy** decide how to move the project forward. Model names, provider setup and runner selection stay backstage.

## Production

- **Live app:** `https://gigglelootcoin.github.io/little-reds-big-studio-611db058/`
- **Source:** this public GitHub repository
- **Hosting:** GitHub Pages
- **Cost target:** $0 / no paid hosting required
- **AI policy:** no mandatory paid AI API and no mandatory provider account
- **Storage:** browser-first project storage where supported
- **Device:** Android-first responsive web app

GitHub Pages builds the Vite production bundle and publishes the generated `dist/` directory. No Lovable, Netlify, Cloudflare Workers, or Supabase runtime is required.

## Buddy orchestration

Buddy ranks available routes by capability and keeps free/open fallbacks ready. The Studio never claims that WebGPU, WebAssembly or a browser API is itself an AI model. Heavy generative work can be handed to public open/free runners when local execution is not genuinely available.

The normal user does **not** choose models or providers.

### Current free/open routes

- Writing/reasoning: Bonsai WebGPU when the device can handle it
- Voice: Applio/RVC, with browser and Qwen3-TTS fallbacks
- Music: ACE-Step 1.5, with MusicGen Web for lighter jobs
- Stems: Demucs, with BS-Roformer fallback
- Artwork: Z Image Turbo, with SDXL fallback
- Video: Wan 2.2 S2V / video routes, with LTX 2.3 fallback

Public free GPU services can have queues or temporary outages; Buddy therefore keeps alternatives rather than presenting one provider as guaranteed.

## Red's Ways Of Thinking

`Red's Ways Of Thinking` is kept as private reference material for Buddy. It is treated as a perspective/creative knowledge layer, not as a list of verified facts. Buddy can use it for creative framing and personal context while separating disputed claims from independently verifiable information when factual accuracy matters.

## Visual identity

The repository contains the uploaded visual-reference library under `assets/visual-references/` and the Studio uses the approved visual direction for its cinematic, glass, crimson/obsidian interface.

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

Production deployment is automatic through `.github/workflows/github-pages.yml` whenever an approved change reaches `main`.

## Quality gate

GitHub Actions validates changes with dependency installation, TypeScript checking, formatting, linting and a production build. The `main` branch is protected and requires the configured validation check before merging.

## Creator support

This Project Was Made With Love ❤️ By LittleRedBigSmile 🔴😁✨️

Support The Creator And Her Music On YouTube!
