# Little Red's Big Studio

**Buddy-first, Android-first, free-first creative studio for musicians and YouTubers.**

The Studio is designed around one simple experience: bring in your idea, music, voice or artwork and let **Buddy** decide how to move the project forward. Model names, provider setup and runner selection stay backstage.

## Production

- **Source:** this public GitHub repository
- **Hosting:** provider-neutral static web app; GitHub Pages is configured as the zero-cost deployment path
- **Live site:** `https://gigglelootcoin.github.io/little-reds-big-studio-611db058/`
- **Cost target:** $0 / no paid hosting required for the project owner
- **AI policy:** no mandatory paid AI API, API key, provider account, or hosted AI subscription
- **Storage:** browser-first project storage where supported; persistent cloud vault work remains provider-agnostic
- **Device:** Android-first responsive web app

## Buddy orchestration

Buddy ranks genuinely available local capabilities and free/open runners. The Studio never claims that WebGPU, WebAssembly or a browser API is itself an AI model. Heavy generative work can be handed to public open/free runners when local execution is not genuinely available.

The normal user does **not** choose models or providers.

### Current free/open routes

- Writing/reasoning: local Qwen-family models when the device can handle them
- Voice: Qwen3-TTS for natural speech/voice cloning, with Seed-VC/RVC fallbacks for conversion
- Music: ACE-Step 1.5, with DiffRhythm 2 fallback
- Stems: Demucs
- Artwork: Z Image Turbo, with SDXL fallback
- Video: LTX 2.3 and other live free/open video fallbacks

Public free GPU services can have queues or temporary outages; Buddy therefore keeps alternatives rather than presenting one provider as guaranteed. The runtime discovers live Gradio endpoints instead of hard-coding one provider's API contract.

## Visual identity

The repository contains the uploaded visual-reference library under `assets/visual-references/` and the Studio uses the approved visual direction for its cinematic, glass, crimson/obsidian interface.

Buddy's canonical visual reference is `file_0000000070e8824391d24367b5f22d59.png`. The normal Buddy animation path uses that source asset with lightweight browser/CSS runtime behavior rather than requiring repeated external AI image generation.

## Privacy

The Studio is designed around a privacy-first model: user creations and Buddy memory are not intended for advertising or resale, and the product should not claim that an external public AI service is private when a user explicitly sends a file to that service. Voice-cloning and other external generation requests therefore disclose that the selected public engine receives the requested input for that generation request.

## Creator support

This Project Was Made With Love ❤️ By LittleRedBigSmile 🔴😁✨️

Support The Creator And Her Music On YouTube! 💃 🎧 🎶

- YouTube: https://youtube.com/@little-red-big-smile
- Cash App: https://cash.app/$LittleRedBigSmile
- Internationally: https://buymeacoffee.com/littleredbigsmile

## Development

The repository is a TanStack Start application configured as a browser-first SPA with Vite and TypeScript.

```sh
npm install
npm run dev
```

Production build:

```sh
npm run build
```

Full local verification:

```sh
npm run check
```

Deployment is intentionally free and provider-light. GitHub Actions validates pull requests and the main branch with dependency installation, TypeScript checking, formatting, linting and a production build. A separate Pages workflow builds the SPA with the correct project base path and publishes it to GitHub Pages.
