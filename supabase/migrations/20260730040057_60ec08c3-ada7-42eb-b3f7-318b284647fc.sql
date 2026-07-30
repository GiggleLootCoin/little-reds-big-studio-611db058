ALTER TABLE public.model_plugins DROP CONSTRAINT IF EXISTS model_plugins_capability_check;
ALTER TABLE public.model_plugins ADD CONSTRAINT model_plugins_capability_check CHECK (capability IN ('video','voice','stems','image','text','music'));

INSERT INTO public.model_plugins (slug, name, capability, provider, model_ref, secret_name, is_free, quality, speed, enabled, notes) VALUES
 ('council-sol','Council Seat 1 — GPT-5.6 Sol','text','lovable','openai/gpt-5.6-sol',NULL,true,99,82,true,'Flagship reasoning: creative direction and final calls.'),
 ('council-terra','Council Seat 2 — GPT-5.6 Terra','text','lovable','openai/gpt-5.6-terra',NULL,true,95,88,true,'Balanced everyday writing and arrangement notes.'),
 ('council-luna','Council Seat 3 — GPT-5.6 Luna','text','lovable','openai/gpt-5.6-luna',NULL,true,88,96,true,'Fast hook and title brainstorming.'),
 ('council-gpt55','Council Seat 4 — GPT-5.5','text','lovable','openai/gpt-5.5',NULL,true,97,80,true,'Deep song structure analysis.'),
 ('council-gpt54','Council Seat 5 — GPT-5.4','text','lovable','openai/gpt-5.4',NULL,true,94,84,true,'Lyric craft and rhyme engineering.'),
 ('council-gpt54-mini','Council Seat 6 — GPT-5.4 Mini','text','lovable','openai/gpt-5.4-mini',NULL,true,86,94,true,'High-volume variations and alternates.'),
 ('council-gemini-pro','Council Seat 7 — Gemini 3.1 Pro','text','lovable','google/gemini-3.1-pro-preview',NULL,true,96,82,true,'Visual direction and storyboard reasoning.'),
 ('council-gemini-flash','Council Seat 8 — Gemini 3.6 Flash','text','lovable','google/gemini-3.6-flash',NULL,true,90,95,true,'Rapid scene-by-scene shot lists.'),
 ('council-gemini-lite','Council Seat 9 — Gemini 3.1 Flash Lite','text','lovable','google/gemini-3.1-flash-lite',NULL,true,82,99,true,'Instant metadata, tags and SEO passes.')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, model_ref = EXCLUDED.model_ref, capability = EXCLUDED.capability, provider = EXCLUDED.provider, secret_name = EXCLUDED.secret_name, quality = EXCLUDED.quality, speed = EXCLUDED.speed, enabled = true, notes = EXCLUDED.notes;