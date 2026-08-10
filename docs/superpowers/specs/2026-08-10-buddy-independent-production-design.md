# Buddy Independent Production Design

## Goal
Make Buddy an independent, mobile-first creative runtime that remains useful when ChatGPT is unavailable while automatically preferring the strongest currently reachable free/open/public engine for each task.

## Architecture
Buddy uses a local-first capability layer, a live public-engine router, and deterministic fallbacks. Local browser capabilities handle chat, speech I/O, persistence, and lightweight text generation when supported. Heavy creation routes use public Gradio/Hugging Face Spaces through the browser with no paid API key. Each route is health-checked and its Gradio API is inspected before use; failed or incompatible routes are skipped automatically.

## Requirements
- ChatGPT/GPT is optional and opportunistic; Buddy must never depend on this conversation or ChatGPT quota.
- Core operation requires no paid API key.
- Prefer open-source/publicly accessible engines.
- Select routes by task capability, current reachability, endpoint compatibility, and configured quality priority.
- Keep multiple independent fallbacks for music, image, video, voice clone, and voice conversion.
- Never report completion without a real returned artifact.
- Persist chat/project state locally on Android.
- Preserve Buddy's canonical animated visual identity.
- Keep Android/Chrome usability as the primary client target.
- Surface honest status when all free routes are unavailable.

## Task Routing
- Lyrics/chat: browser WebGPU/wasm text model first, deterministic fallback second.
- Song: ACE-Step 1.5 public Spaces, with additional compatible ACE-Step Spaces as fallbacks.
- Image: Z Image Turbo and compatible public image Spaces.
- Video: Wan 2.2 S2V and compatible public image/video Spaces.
- Voice clone/TTS: Qwen3-TTS and compatible public TTS Spaces.
- Voice swap: Seed-VC, Applio/RVC-compatible public Spaces.
- Browser audio: native Web Audio/Media APIs for recording and basic editing.

## Reliability
The Gradio client is loaded from a current public package. A route is considered usable only after connection and API inspection. Endpoint names are discovered from `view_api()` when possible. Route failures are isolated, cached briefly, and followed by the next candidate. The UI exposes the actual result URL and never fabricates a successful output.

## Security and privacy
No secrets are embedded in the client. Voice operations are restricted by copy and UI messaging to audio the user owns or has permission to transform. External public Spaces receive only files explicitly submitted by the user.

## Verification
Production acceptance requires TypeScript, formatting, lint, production build, a successful GitHub Pages deployment, and live verification of each creator action's success/failure path. Public model availability is inherently variable; the router must therefore verify availability at runtime rather than treating a hard-coded provider as permanently healthy.
