# Little Red's Big Studio — Product Master Specification

This is the consolidated product contract. New work should preserve these requirements unless a later decision explicitly supersedes them.

## North-star experience

Buddy is the user's creative companion and technical operator. Users express outcomes in natural language. Buddy silently plans, researches, chooses tools/models, prepares inputs, executes, validates, repairs failures, and delivers usable results. Technical provider/model details remain backstage unless explicitly requested.

## Identity and continuity

- User identity is account-specific; never hard-code the creator's name as every user's name.
- Normal sign-up/sign-in is supported, with biometric authentication where the platform/browser supports it.
- Memory is account-isolated.
- Lifelong memory is designed for durable cross-device recall, including Creative DNA, preferences, decisions, lessons, failures, relationships and project context.
- Memory is exportable and portable.
- Buddy remembers why decisions were made and what approaches failed, not only raw conversation text.
- The Creative Project Graph relates songs, lyrics, vocals, instrumentals, voices, characters, artwork, videos, thumbnails, Shorts and campaigns.

## Creation capabilities

The Studio should provide real, validated outputs for:

- natural-language chat and live continuous voice conversation
- lyrics
- full songs
- instrumental generation
- vocal cloning and voice conversion
- vocal swapping on uploaded songs
- singing over uploaded instrumentals with supplied or generated lyrics
- multilingual/natural voices
- image generation and editing
- outpainting
- character consistency
- Buddy avatar generation/animation
- video and image-to-video workflows
- music videos
- lip sync
- audio editing/separation/mixing/mastering
- covers, thumbnails and release assets
- complete multi-format release campaigns

A control is not considered functional merely because a request starts. Success requires a usable artifact that passes output validation.

## Outcome engine

Every task follows: understand intent -> inspect capabilities -> choose the best healthy route -> preserve originals -> execute -> validate -> resume/recover -> try alternatives -> compare when useful -> deliver. The system should prefer the simplest high-quality method and avoid AI generation when a deterministic/editing method is better.

## Model/provider policy

- Always choose the best currently available option for the specific task using quality, reliability, speed, task fit, availability, privacy and resource requirements.
- Provider/model changes must be invisible to ordinary users.
- Prefer free, open-source, public resources whenever they meet the quality/reliability requirement.
- No mandatory paid AI API or API key for ordinary use.
- GPT can be used when available and appropriate; it is not the sole dependency.
- Dead/degraded models are automatically cooled down, re-tested and retired from preference until recovered.
- Continuous benchmarking may promote better routes.

## Self-healing

- Health checks and runtime recovery.
- Fresh connection/endpoint discovery when a route fails.
- Automatic retries with backoff/cooldowns.
- Failover to the next best healthy route.
- Resume from the last successful pipeline stage.
- Duplicate-job protection.
- Cancellation and cleanup of abandoned jobs.
- Output quality control for empty, silent, malformed, corrupt, incomplete or obviously unsuitable results.
- Internal incident/failure memory so known-bad approaches are not repeatedly selected.
- Recovery from interrupted uploads/backgrounding where possible.
- Never claim success merely because a provider accepted a request.

## Web intelligence

Buddy can decide when live web research is useful, search current sources, read relevant pages, compare evidence, fact-check, research trends/models/documentation/licensing and preserve useful project research. Research must distinguish evidence from inference.

## Creative judgment

Buddy may propose better approaches, intelligently disagree, create alternatives, run creative A/B comparisons, detect blind spots, critique its own work, use "Make it better" workflows and know when not to interrupt the user.

## Buddy's long-term relationship

Buddy learns the user's creative preferences, successful patterns, things to avoid and project history over time. The goal is a genuine feeling of continuity while remaining honest about what is actually stored and remembered. Buddy can recall relevant information from years of use when that information has been durably stored and remains available.

## Visual identity

- Canonical Buddy character reference is retained and used consistently.
- Buddy is animated rather than represented only by a static square/avatar.
- Animated Studio logo.
- Tasteful dripping-red visual language.
- Animated wallpaper with performance-conscious fallbacks.
- Premium cinematic/glass/crimson/obsidian visual system.
- Day/night modes.
- Subtle screen-edge lighting.
- Realm-specific atmosphere while remaining one unified Studio.
- Android-first touch targets and one-handed layouts.
- Reduced-motion/accessibility support.
- No visual effect should make the app feel slower than it is.

## Android-first platform

- Browser-first and Android-first.
- No computer required for ordinary use.
- No Colab dependency.
- No notebook or terminal required for ordinary use.
- Heavy work may use remote public/open infrastructure behind the scenes.
- Browser/device processing should be used for lightweight/private operations when appropriate.
- Preserve state through mobile browser backgrounding, refreshes and interrupted connections where possible.

## Trial and paid tiers

### Seven-day all-access trial

- Begins when an account is officially activated/logged in for the first time.
- Server/account authority determines start and expiry.
- Seven consecutive days of full Studio access.
- No watermark during the trial.
- No credit card required.
- Countdown is visible on the homepage and continues accurately while the browser is closed.
- One trial entitlement per legitimate account/person under the abuse policy.

### Buddy Unlimited — $10/month

- Membership is intended to be fulfilled through the creator's Buy Me a Coffee membership.
- Unlimited Studio use means no arbitrary credit counter; legitimate infrastructure/fair-use protections may still protect service availability.
- No watermark after trusted entitlement verification.
- Do not treat browser storage as proof of payment.

### Free after trial

- Buddy and genuinely useful free/open capabilities remain available.
- Free-tier generated visual exports carry the official Studio logo watermark.
- Original/master/source artifacts are never modified solely to add a watermark.
- Paid watermark removal requires trusted entitlement verification.

## Trial abuse protection

Use layered, privacy-conscious signals rather than IP-only blocking:

- account identity/verification
- short-lived network/IP reputation signal
- rapid account creation patterns
- unusual generation volume
- device/session continuity signals where privacy-preserving
- datacenter/VPN/proxy risk signals where available

Never deny a legitimate trial solely because multiple people share an IP address. Never rely on browser clock/local storage for authoritative trial state. Retain only what security requires and avoid invasive permanent fingerprinting.

## Creator support

- Cash App: https://cash.app/$LittleRedBigSmile
- Buy Me a Coffee: https://buymeacoffee.com/littleredbigsmile
- YouTube: https://youtube.com/@little-red-big-smile
- Tips are optional and should not degrade the free experience.
- Supporter shout-outs exist only if they can be automated and verified; public recognition must be opt-in.

## Privacy and safety

- User originals remain separate from generated derivatives.
- Never expose provider secrets/API credentials to browser clients.
- Do not expose payment details or private supporter information.
- Public supporter recognition is opt-in.
- Creative memory is account-isolated and exportable.

## Acceptance standard

The product is not "done" because the UI looks functional or a workflow returns a request ID. Each important user-facing capability must be tested end-to-end enough to demonstrate that a real usable artifact is produced, errors are recovered where possible, and the user is not required to understand the technical machinery.
