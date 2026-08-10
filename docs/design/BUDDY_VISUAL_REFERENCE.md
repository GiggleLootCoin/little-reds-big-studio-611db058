# Buddy Visual Reference

## Canonical source reference

The canonical Buddy character reference is the exact repository asset:

- `file_0000000070e8824391d24367b5f22d59.png`

This asset is the source-of-truth character reference for Buddy's visual identity. It must not be silently replaced by a newly generated character or by an unrelated stock/AI image.

## Character identity

- Friendly compact hooded character.
- Black primary materials with strong red accents.
- Glowing white facial features on a dark face.
- Large black/red headphones are a signature element.
- Red audio waveform motif appears on clothing and headphone earcups.
- Rounded, soft, approachable silhouette.
- Expressive eyes/mouth capable of communicating emotion without a human face.
- Music-first identity.
- Cute and approachable without becoming childish.
- Futuristic without looking sterile or generic.

## Consistency requirements

Future Buddy artwork should preserve the recognizable character identity unless a deliberate alternate form is requested.

Maintain consistency across:

- Face/feature placement
- Hood/head silhouette
- Headphones
- Red/black material language
- Audio waveform motif
- Body proportions
- Overall friendly personality

## Planned expressive states

The canonical reference can guide lightweight runtime states including:

- Idle
- Listening
- Speaking
- Thinking
- Laughing
- Serious/empathetic
- Producing music
- Mixing
- Singing
- Holding a microphone
- Beatboxing
- Writing lyrics
- Researching
- Working/processing
- Success
- Error/recovery
- Buddy Off the Chain

## Animation architecture

Buddy's normal on-screen animation is a lightweight Studio runtime layer. The canonical PNG remains the visual source; CSS/browser animation supplies movement such as floating, aura pulsing, listening, thinking, working, success and recovery states.

The animation layer must:

- Reuse the canonical local asset.
- Avoid repeatedly uploading the Buddy reference to an external AI service merely to animate it.
- Remain functional on Android/mobile Chrome.
- Respect `prefers-reduced-motion`.
- Keep the character recognizable rather than morphing it into a different design.

Heavy generative animation may be offered as an optional external workflow, but it is not required for Buddy's normal Studio presence.

## Implementation note

The canonical PNG is already committed to the repository. Components should import this exact asset rather than duplicating or regenerating it. The current implementation uses the image as the source layer and the browser runtime for lightweight animation, keeping the normal Buddy experience free and local to the Studio UI.
