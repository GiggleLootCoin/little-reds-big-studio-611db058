# Little Red's Big Studio — Free Infrastructure

## Goal
Keep the Studio itself $0 for its owner. No paid API is required for the core application.

## Architecture

1. **Static web app / PWA** — deploy the Vite build on a free static host/CDN.
2. **Browser-first AI** — Buddy chat, speech recognition, and speech synthesis use Android/browser capabilities first whenever practical.
3. **Free-provider router** — heavy AI requests use a pool of free/open providers. No single provider is a hard dependency.
4. **Persistent backend** — the backend stores metadata, job state, provider health, and project indexes. Large media should use object storage rather than browser local storage.
5. **Real-output rule** — a generation is successful only when a playable/downloadable artifact has been received and validated.
6. **Failover** — quota exhaustion, provider errors, timeouts, unsupported endpoints, and invalid artifacts immediately retire that provider for the request and try the next compatible provider.

## Provider policy

- Never require ZeroGPU.
- Never silently claim an output was generated when a provider failed.
- Never require a paid API key for the core free tier.
- Prefer open-source/public models and local inference.
- Provider adapters must expose health, capabilities, limits, and last failure.

## Android policy

- The app must remain usable from Android Chrome without a computer.
- Microphone permission failures must produce an actionable UI message.
- Long-running generation must survive page navigation when possible through server-side job state.
- UI must never remain indefinitely in `Listening`, `Generating`, or `Processing`.

## Privacy

The product promise is that user data and creations are used for the Studio's operation and are not sold for advertising. The implementation must make the actual data flows explicit and must not claim stronger legal guarantees than the deployed infrastructure and privacy policy support.

## Storage

Do not describe finite infrastructure as literally unlimited. The UI should present storage as persistent project storage and show usage/limits where the selected provider imposes them. User deletion must be explicit and permanent deletion must require confirmation.
