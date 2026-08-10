# Production Release Checklist

## Identity and onboarding
- [ ] User-specific display name; never hard-code Red.
- [ ] Normal signup/sign-in works.
- [ ] Biometric authentication works where supported.
- [ ] Seven-day trial starts once, server-side, at completed signup/login.
- [ ] Homepage countdown survives reloads and device/browser restarts.
- [ ] Welcome experience is polished and accessible.

## Core creation
- [ ] Buddy text chat produces real responses.
- [ ] Continuous voice chat produces real responses and handles interruption/recovery.
- [ ] Lyrics produce actual usable lyrics.
- [ ] Music generation produces a real playable song.
- [ ] Image generation produces a real image.
- [ ] Video generation produces a real playable video.
- [ ] Voice clone/swap produces an actual result using authorized user-provided voice material.
- [ ] Existing-song vocal replacement preserves the instrumental and synchronizes the replacement vocal.
- [ ] Instrumental + voice sample + lyrics creates a complete vocal song.

## Reliability
- [ ] Output QC runs before success is shown.
- [ ] Failed provider route is retried/reconnected or replaced automatically.
- [ ] Work resumes from the last successful stage where possible.
- [ ] Autosave and recovery work after refresh/background/interrupted upload.
- [ ] Duplicate generation protection works.
- [ ] Cancellation works.
- [ ] Internal diagnostics record failures without exposing raw errors.

## Web and intelligence
- [ ] Live web search works when current information is required.
- [ ] Search failure does not become a fabricated answer.
- [ ] Project memory and Creative DNA are account-scoped.
- [ ] Buddy recalls available history accurately and honestly.

## Plans and support
- [ ] Free trial has full access for seven days.
- [ ] Free post-trial exports receive the canonical Studio logo watermark.
- [ ] Original/master assets remain unwatermarked.
- [ ] Paid $10/month Buy Me a Coffee membership is verified server-side.
- [ ] Verified paid entitlement removes export watermark.
- [ ] Trial-abuse protection uses layered privacy-conscious signals and does not rely on IP alone.
- [ ] Support links work: Buy Me a Coffee, Cash App, YouTube.
- [ ] Supporter shout-outs are opt-in and automated if enabled.

## Android UX
- [ ] No Colab or computer dependency.
- [ ] Mobile Chrome works for the complete primary workflow.
- [ ] Touch targets are appropriate for phones.
- [ ] One-handed workflows are practical.
- [ ] Upload/download/backgrounding interruptions recover correctly.
- [ ] Reduced-motion and accessibility settings work.

## Visual quality
- [ ] Buddy character remains consistent.
- [ ] Buddy and logo animation work.
- [ ] Dripping-red visual identity and animated wallpaper are performant.
- [ ] Day/night modes work.
- [ ] Realm effects and edge lighting can be disabled.
- [ ] Generation progress and previews look polished.
- [ ] No placeholder/fake-success states remain in production.

## Final rule
Do not declare the product ready based solely on CI/build success. Perform end-to-end runtime verification of the actual user outcomes.