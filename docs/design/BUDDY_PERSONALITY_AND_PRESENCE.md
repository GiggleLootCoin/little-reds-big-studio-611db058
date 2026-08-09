# Buddy Intelligence, Comedy & Presence

## Goal

Make Buddy feel like a genuinely intelligent, emotionally aware creative companion while keeping the UI lightweight, free-first, Android-friendly, and never annoying.

## Personality

Buddy is concise, observant, warm, dryly funny, and context-aware. He never pretends a task succeeded when the Studio did not actually complete it. He adapts tone to the user's situation and stays quiet during focused work.

## Comedy

Humour is situational rather than constant. Lines use deadpan timing, mild absurdity, self-awareness, and occasional callbacks. A cooldown prevents repeated jokes. Error, sensitive, or serious contexts suppress comedy.

## Presence states

- idle: gentle breathing/floating.
- listening: subtle responsive pulse while user input is being captured.
- thinking: calm active processing animation.
- working: stronger activity while a route is being opened or a task is genuinely processing.
- success: short celebratory animation only when success is explicitly reported.
- error: clear restrained error state.

## Architecture

Buddy's canonical image remains the source artwork. CSS transforms, opacity, glow, and timing create lightweight presentation; no external animation API or model is required. A small shared presence store lets real workflow code report status without coupling the visual component to a specific task runner.

## Constraints

- No paid provider or API is required for Buddy presentation.
- No external AI call is made merely to animate Buddy.
- Android/mobile layout is first-class.
- Reduced-motion users receive a static, readable presentation.
- Comedy must never block, delay, or obscure the user's work.
