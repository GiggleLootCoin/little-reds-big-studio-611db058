# Phone-First Production Checklist

This checklist is the release gate for Little Red's Big Studio.

## Non-negotiable runtime requirements

- Android/browser first; ordinary use must not require a computer, Colab, or Kaggle.
- Generation controls must produce real, validated artifacts or clearly report that no free runtime is currently available.
- Provider/model selection stays hidden from end users.
- Prefer the best currently usable free route for each task; model age is not a selection criterion.
- Verify live schema/capability before promoting a provider.
- Verify the returned artifact before reporting success.
- Automatically fail over to another eligible provider after a verified provider failure.
- Preserve successful older providers when they remain best for a task.

## Critical user journeys

1. Sign up/sign in.
2. Start the server-authoritative seven-day trial.
3. Use Buddy hands-free from an Android browser without headphones.
4. Generate lyrics and receive real text output.
5. Generate music and receive a playable audio artifact.
6. Generate an image and receive a real image artifact.
7. Generate video and receive a playable video artifact when a free runtime is available.
8. Use speech recognition and speech output.
9. Use voice conversion/cloning through an eligible free runtime.
10. Verify paid entitlement before exposing Buddy Unleashed.
11. Preserve originals and apply free-tier export restrictions only where the product contract requires them.
12. Reload/resume without losing authenticated entitlement or project state.

## Release rule

A green build is necessary but not sufficient. Critical paths require runtime evidence from the actual Android/browser production environment.
