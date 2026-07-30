ALTER TABLE public.model_plugins DROP CONSTRAINT IF EXISTS model_plugins_provider_check;
ALTER TABLE public.model_plugins ADD CONSTRAINT model_plugins_provider_check
  CHECK (provider IN ('replicate','huggingface','fal','lovable','elevenlabs'));

ALTER TABLE public.model_plugins DROP CONSTRAINT IF EXISTS model_plugins_capability_check;
ALTER TABLE public.model_plugins ADD CONSTRAINT model_plugins_capability_check
  CHECK (capability IN ('video','voice','stems','image','text','music'));

INSERT INTO public.model_plugins (slug, name, capability, provider, model_ref, secret_name, is_free, quality, speed, enabled, notes)
VALUES
 ('elevenlabs-voice', 'ElevenLabs Multilingual v2', 'voice', 'elevenlabs', 'eleven_multilingual_v2', 'ELEVENLABS_API_KEY', false, 97, 78, true, 'Studio-grade vocal synthesis in 29 languages.'),
 ('elevenlabs-turbo', 'ElevenLabs Turbo v2.5', 'voice', 'elevenlabs', 'eleven_turbo_v2_5', 'ELEVENLABS_API_KEY', false, 88, 96, true, 'Low-latency vocals for fast takes and scratch passes.'),
 ('elevenlabs-music', 'ElevenLabs Music', 'music', 'elevenlabs', 'music_v1', 'ELEVENLABS_API_KEY', false, 94, 70, true, 'Generates full original backing tracks from a text brief.')
ON CONFLICT (slug) DO UPDATE SET
 name = EXCLUDED.name,
 capability = EXCLUDED.capability,
 provider = EXCLUDED.provider,
 model_ref = EXCLUDED.model_ref,
 secret_name = EXCLUDED.secret_name,
 quality = EXCLUDED.quality,
 speed = EXCLUDED.speed,
 enabled = true,
 notes = EXCLUDED.notes;