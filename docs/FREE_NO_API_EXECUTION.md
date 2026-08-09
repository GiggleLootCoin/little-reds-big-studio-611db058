# Free / No-API execution architecture

Little Red's Big Studio does not require a commercial AI API key for its creative stack.

## Primary Android strategy

1. Keep the Studio open in one browser tab.
2. Use a public Hugging Face Space for lightweight or GPU-backed jobs.
3. Use Kaggle Notebooks or Lightning AI Studio for long/heavy GPU jobs when a public Space is insufficient.
4. Use local browser/WebGPU/WebAssembly execution for lightweight models when supported.

## Why Colab is not required

The runtime no longer has a `colab`-only model path. Public Spaces, Kaggle and Lightning are first-class alternatives. Hugging Face ZeroGPU provides free access to existing ZeroGPU Spaces, with quota limits; Lightning currently advertises a free GPU tier and one free Studio; availability and quotas can change.

## No-key rule

The Studio never stores or sends a provider API key for model execution. A runner may require its own free user account, but that account is outside the Studio and is not an API credential.

## Current open model families

- RVC — voice conversion
- Demucs — source separation
- Wan — video
- LTX-Video — video
- Kokoro — text-to-speech
- Whisper — transcription
- Stable Diffusion XL — image generation
- MusicGen — music generation

Buddy visual-reference assets remain intentionally separate from model execution so the character system can be moved between runners without changing the Studio architecture.
