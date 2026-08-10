# Best Free/Open Resources — August 2026

This registry records the current resource choices used by Little Red's Big Studio. It is intentionally provider-agnostic: a public resource is never a mandatory dependency and must pass live capability/health checks before Buddy selects it.

## Current primary choices

- **Music:** ACE-Step 1.5. The official project describes ACE-Step as an open-source foundation model for full-song generation, and the current official v1.5 Space is running on ZeroGPU. DiffRhythm 2 is retained as a fast full-song fallback. See the official ACE-Step repository and Spaces for the current API and model state.
- **Voice / TTS / cloning:** Qwen3-TTS. The current official Space supports Voice Design, Voice Clone and CustomVoice, with 0.6B and 1.7B model sizes and multilingual speakers.
- **Singing voice conversion:** Seed-VC. It is retained as the primary no-training singing conversion route, with RVC/Applio and a current AI-RVC whole-song cover Space as fallbacks.
- **Speech recognition:** Realtime Whisper Large-v3-Turbo for live conversation, with Whisper Large-v3-Turbo for upload/transcription fallback.
- **Images:** Z Image Turbo as the primary public artwork route, with SDXL Turbo as fallback.
- **Video:** Wan 2.2 S2V as the primary open image+audio video route, with other compatible public video Spaces as fallback.
- **Stem separation:** Demucs-family public Spaces for vocal/instrument separation when Buddy needs to construct a custom voice-swap pipeline.

## Weights.gg

**Do not integrate Weights.gg.** The service permanently shut down on March 31, 2026. It is therefore not a viable runtime dependency, regardless of how useful it was historically. Current community discussions also confirm that the service is offline. Buddy should use current open alternatives instead.

The closest functional replacements for the Studio's needs are the open RVC/Seed-VC ecosystem and current public Hugging Face Spaces. The Studio must not depend on a third-party account, paid credit system, or proprietary API for ordinary use.

## Routing rule

For every job:

1. Identify the task and required inputs.
2. Inspect the live engine API/capabilities.
3. Prefer the highest-quality compatible free/open route.
4. Execute the job.
5. Verify that a real usable artifact was returned.
6. If it fails, silently try the next compatible route.
7. Temporarily quarantine failed routes so Buddy does not repeatedly send work into a dead endpoint.
8. Keep the user's job, progress state and UX continuous while the engine changes.

A green web build is **not** considered proof that a generation feature works. Runtime success requires an actual artifact.

## Sources checked for this registry

- ACE-Step: https://github.com/ace-step/ACE-Step
- ACE-Step 1.5 public Space: https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5
- DiffRhythm 2 public Space: https://huggingface.co/spaces/ASLP-lab/DiffRhythm2
- Qwen3-TTS public Space: https://huggingface.co/spaces/Qwen/Qwen3-TTS
- Seed-VC public Space: https://huggingface.co/spaces/Plachta/Seed-VC
- Wan2.2 S2V public Space: https://huggingface.co/spaces/Wan-AI/Wan2.2-S2V
- Whisper Large-v3-Turbo public Space: https://huggingface.co/spaces/hf-audio/whisper-large-v3-turbo
- Realtime Whisper Turbo public Space: https://huggingface.co/spaces/KingNish/Realtime-whisper-large-v3-turbo
- Current RVC Space directory: https://huggingface.co/spaces?search=rvc
