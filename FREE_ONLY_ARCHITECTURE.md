# Little Red's Big Studio — Free-Only Architecture

## Non-negotiable rules

- No paid APIs.
- No API keys required for core Studio use.
- No Lovable dependency.
- No ElevenLabs.
- No Replicate.
- No Supabase dependency for the core app.
- No mandatory installation on Android.
- Prefer local/browser inference and open-source/public free inference.
- Never expose a capability as available unless its route can actually run.

## Runtime strategy

The Android web app is the control surface. Lightweight work runs in-browser. Heavy open models run through explicitly configured free/public runtimes such as Hugging Face Spaces or Colab-compatible workflows when browser inference is impractical.

## Music

Preferred open-source engines should be selected by capability and current availability, with ACE-Step 1.5 as the primary open music-generation target and other genuinely free/open engines as fallbacks. The router must report unavailable engines instead of fabricating success.

## Voice

Use open RVC/Applio-compatible workflows for voice conversion. User-owned models and audio remain under the user's control.

## Buddy

Buddy is a local-first companion. Text chat must not require a paid API. Where WebGPU-capable models are available, use them locally. If a model cannot run on the device, expose a clearly labelled free/open hosted fallback. Buddy maintains context/memory locally where practical and supports unlimited conversation subject only to the selected free runtime's actual limits.

## Storage

Core projects should use browser storage (IndexedDB/local files) rather than requiring Supabase. Export/import must provide portable project data.

## Provider registry

Every engine reports capability, runtime, requirements, availability, and fallback. UI controls are generated from this registry so unavailable services cannot masquerade as working generators.

## Deployment

The production app must be deployable independently of Lovable. GitHub is the source of truth. Deployment must build from the repository and verify the deployed revision.
