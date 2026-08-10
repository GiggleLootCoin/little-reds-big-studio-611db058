# Little Red's Big Studio — Production Experience Standard

This document is the acceptance standard for the Studio. Technical implementation details stay behind the interface.

## User contract

The user asks for an outcome. Buddy handles model selection, preprocessing, retries, routing, quality checks, recovery, export, and technical settings automatically.

Users should not need to know or care which model, provider, endpoint, queue, codec, sampler, voice engine, or fallback was used.

## Reliability contract

1. Never report success until a real usable artifact exists.
2. Never make the user repeat a stage that already succeeded.
3. Retry transient failures automatically.
4. Quarantine unhealthy routes and use the best healthy alternative.
5. Recheck stale public APIs before retrying.
6. Resume multi-stage work from the last successful stage.
7. Validate audio, image, and video outputs before presenting them.
8. Preserve project state through refreshes, backgrounding, and browser restarts where storage permits.
9. Keep diagnostics private and useful for maintainers.
10. Do not require paid APIs, user API keys, or technical configuration for normal creation.

## Creative workflow

- Automatic project save and recovery.
- Non-destructive versions.
- Restore previous result.
- Create another version.
- Make it better.
- Reuse an asset as a reference.
- Automatic project organization and naming.
- One-tap export/share.
- Original-quality masters plus optimized previews.
- Automatic media format selection/conversion.
- Background generation queue.
- Duplicate-job protection.
- Cancel and resume support.

## Quality control

Before completion, Buddy should check for empty/corrupt output, implausible duration, silent audio, clipping where detectable, invalid media types, missing video frames, missing audio, synchronization problems, incomplete lyrics, and unusable voice output. Failed QC must trigger recovery rather than a false success state.

## Buddy

Buddy maintains task context, understands references to current project assets, supports natural interruptions, uses user identity only when reliably available, and never assumes the creator's name is the name of every user.

## Visual standard

The interface should feel like a premium creative instrument: Buddy is the visual focal point; creation actions are obvious; touch targets are Android-friendly; surfaces use restrained glass/depth; transitions are smooth; dark/light modes remain legible; the red visual identity is distinctive; motion respects reduced-motion settings; previews show real generated assets; and technical error details never dominate the creative experience.

## Free/open requirement

The preferred runtime is always the strongest genuinely usable free/public/open route. A dead or degraded service must not become a hard dependency. Model/provider choices are implementation details and may change as better free options become available.
