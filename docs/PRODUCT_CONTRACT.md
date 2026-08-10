# Little Red's Big Studio — Product Contract

This is the source-of-truth product contract for future implementation work. It describes the user experience and system behaviour; it does not claim that every capability is already wired to a production inference backend.

## Non-negotiable user experience

- Android-first and browser-first.
- No computer, Colab notebook, terminal, or technical installation required for normal use.
- Users should not need to know which model, provider, endpoint, sampler, codec, vocoder, or backend is being used.
- Buddy chooses the best currently healthy route for the requested outcome and silently fails over when needed.
- A generation is not successful until a usable artifact passes validation.
- Technical errors belong in internal diagnostics, not in the normal user experience.
- The interface should remain simple, premium, fast-feeling, accessible, and touch-friendly.

## Seven-day all-access trial

- Every eligible user receives seven days of full Studio access after verified account activation.
- The authoritative start and expiry timestamps are server-side.
- The homepage shows a tasteful live countdown immediately after activation.
- Trial users receive the complete experience, including normally paid capabilities and watermark-free exports.
- Trial expiry does not delete projects, memories, Creative DNA, assets, or versions.
- After expiry, the account moves to the Free tier unless a verified paid entitlement exists.

### Trial-abuse protection

The system must prevent simple multi-account abuse without treating shared households or mobile networks as one person.

Use layered, privacy-conscious signals:

- authenticated account identity
- verified email and optional stronger verification when risk is high
- short-lived privacy-preserving device/session signals
- IP/network reputation as one signal, never the sole identity
- rapid account-creation velocity
- suspicious generation velocity
- provider/resource abuse signals

Do not implement an IP-only trial rule. Do not retain raw IP data indefinitely merely for trial enforcement. High-risk activity may trigger additional verification or resource protection while ordinary users continue to receive the promised trial.

## Free and paid tiers

### Free

- Useful Buddy access and free/open generation routes.
- Free-tier generated exports carry the canonical Studio logo watermark where technically appropriate.
- Source/master artifacts are never mutated merely to add a free-tier watermark.
- No mandatory API key.

### Buddy Unlimited — $10/month

- Paid entitlement is verified server-side through the configured Buy Me a Coffee membership integration.
- Watermark-free exports.
- Full Studio capabilities subject to legitimate provider availability and fair-use safeguards.
- No artificial credit counter should be presented as the product experience.

## Support

- Buy Me a Coffee: https://buymeacoffee.com/littleredbigsmile
- Cash App: https://cash.app/$LittleRedBigSmile
- YouTube: https://youtube.com/@little-red-big-smile

Support is optional and must never degrade the Free experience.

### Automated supporter shout-outs

Keep this feature only as an automated system capability. A supporter must explicitly opt into public recognition. Never expose payment amount, email, transaction details, or other private information. If automation is unavailable, do not promise a shout-out.

## Buddy identity and memory

- Never hard-code the creator's name as the name of every user.
- Use the authenticated user's preferred name when available and appropriate.
- Allow users to operate without a displayed name.
- Memory is scoped to the authenticated user.
- Design for lifelong continuity: conversations, preferences, decisions, projects, Creative DNA, lessons, failures, assets, and relationships between assets.
- Cross-device lifelong memory requires authenticated persistent storage; browser-only storage is a cache/fallback, not a promise of permanent memory.
- Memory must be exportable and portable.

## Creative Project Graph

Projects should model relationships rather than isolated files:

Project → song → lyrics/vocals/instrumental/master → artwork → video → Shorts → thumbnail → release campaign.

Buddy must be able to refer back to a previous version, source asset, character, voice, or decision without requiring the user to remember filenames.

## Generation and quality

All creative capabilities should follow:

**Understand goal → plan → choose route → preprocess → generate → validate → critique → repair/regenerate if needed → deliver.**

Required capabilities include, as backends become available:

- music/song generation
- lyrics generation
- voice cloning
- voice conversion
- vocal swapping on uploaded songs
- instrumental + voice sample + lyrics song creation
- multilingual natural voices
- image generation/editing/outpainting
- consistent characters and avatars
- video and music-video generation
- lip sync
- audio editing and mastering
- thumbnails and promotional assets
- release/campaign packages

Quality control must detect empty, corrupt, silent, clipped, malformed, incomplete, badly synchronized, or otherwise unusable outputs before success is reported.

## Web intelligence

Buddy may automatically use live web research when current information, verification, discovery, or multi-source research would improve the outcome. The user should not need to choose a search provider manually.

## Self-healing

The runtime should automatically:

- detect unhealthy providers/routes
- refresh stale connections
- retry with fresh connections
- fail over to the next best healthy route
- quarantine repeatedly failing routes
- promote recovered routes
- validate real outputs
- resume from the last successful stage
- prevent duplicate expensive jobs
- retain internal incident diagnostics

## Creative intelligence

Buddy should support:

- Creative Director mode
- Make It Great workflow
- intelligent disagreement when another approach is likely better
- “What am I missing?” blind-spot analysis
- A/B creative evaluation
- remembering why previous approaches failed
- knowing when a non-generative tool is better than generation
- proactive help without becoming intrusive
- knowing when to leave the user alone

## Visual identity

The Studio should retain its distinctive premium identity:

- canonical Buddy character consistency
- animated Buddy rather than a static avatar
- animated canonical logo
- tasteful dripping-red visual language
- animated wallpaper that can be disabled
- day/night modes
- subtle screen-edge lighting
- beautiful generation states and previews
- excellent Android touch targets
- reduced-motion/accessibility support
- unified realms for Sound, Visual, Motion, Research, and Vault while maintaining one coherent Studio

## Privacy and trust

- Never expose provider secrets in browser code.
- Prefer free/open/public resources where technically and legally appropriate.
- Avoid unnecessary vendor lock-in.
- Do not claim an integration is working until it has been verified end-to-end.
- Do not claim lifelong memory when only browser-local storage exists.
- Do not claim watermark removal is implemented merely because an on-screen preview hides a watermark; exported media needs format-appropriate processing.
