CREATE TABLE public.model_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  capability text NOT NULL CHECK (capability IN ('video','voice','stems','image','text')),
  provider text NOT NULL CHECK (provider IN ('replicate','huggingface','fal','lovable')),
  model_ref text NOT NULL,
  secret_name text,
  is_free boolean NOT NULL DEFAULT true,
  quality smallint NOT NULL DEFAULT 70,
  speed smallint NOT NULL DEFAULT 70,
  weekly_score numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.model_plugins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_plugins TO authenticated;
GRANT ALL ON public.model_plugins TO service_role;
ALTER TABLE public.model_plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plugin catalog is public" ON public.model_plugins FOR SELECT USING (true);
CREATE POLICY "Admins manage plugins" ON public.model_plugins FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER model_plugins_updated_at BEFORE UPDATE ON public.model_plugins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.plugin_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_slug text NOT NULL,
  capability text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed')),
  duration_ms integer,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.plugin_runs TO authenticated;
GRANT ALL ON public.plugin_runs TO service_role;
ALTER TABLE public.plugin_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators read own runs" ON public.plugin_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Creators insert own runs" ON public.plugin_runs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators update own runs" ON public.plugin_runs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX plugin_runs_recent_idx ON public.plugin_runs (plugin_slug, created_at DESC);

CREATE OR REPLACE FUNCTION public.refresh_plugin_weekly_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.model_plugins p
  SET weekly_score = COALESCE(s.score, 0)
  FROM (
    SELECT plugin_slug,
           ROUND(
             (COUNT(*) FILTER (WHERE status = 'succeeded')::numeric
               / GREATEST(COUNT(*) FILTER (WHERE status <> 'running'), 1)) * 70
             + LEAST(COUNT(*) FILTER (WHERE status = 'succeeded'), 20)
             + GREATEST(0, 10 - COALESCE(AVG(duration_ms) FILTER (WHERE status = 'succeeded'), 0) / 30000)
           , 2) AS score
    FROM public.plugin_runs
    WHERE created_at > now() - interval '7 days'
    GROUP BY plugin_slug
  ) s
  WHERE s.plugin_slug = p.slug;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_plugin_weekly_scores() FROM public;
GRANT EXECUTE ON FUNCTION public.refresh_plugin_weekly_scores() TO service_role;

INSERT INTO public.model_plugins (slug, name, capability, provider, model_ref, secret_name, quality, speed, notes) VALUES
  ('wan', 'Wan 2.2 (text/image to video)', 'video', 'replicate', 'wan-video/wan-2.2-t2v-fast', 'REPLICATE_API_TOKEN', 88, 82, 'Open-weights Wan video model. Fast, strong motion.'),
  ('hunyuan-video', 'Hunyuan Video', 'video', 'replicate', 'tencent/hunyuan-video', 'REPLICATE_API_TOKEN', 90, 55, 'Cinematic open-weights video model, slower renders.'),
  ('ltx-video', 'LTX Video', 'video', 'replicate', 'lightricks/ltx-video', 'REPLICATE_API_TOKEN', 78, 95, 'Real-time class open video model, great for drafts.'),
  ('cogvideox', 'CogVideoX 5B', 'video', 'replicate', 'chenxwh/cogvideox-5b', 'REPLICATE_API_TOKEN', 76, 70, 'Reliable open video baseline.'),
  ('openvoice', 'OpenVoice v2 (voice clone)', 'voice', 'replicate', 'myshell-ai/openvoice', 'REPLICATE_API_TOKEN', 84, 80, 'Instant voice cloning and tone colour transfer.'),
  ('fish-speech', 'Fish Speech 1.5', 'voice', 'replicate', 'fishaudio/fish-speech-1.5', 'REPLICATE_API_TOKEN', 86, 85, 'High quality multilingual TTS with reference audio.'),
  ('demucs', 'Demucs v4 (stem separation)', 'stems', 'replicate', 'ryan5453/demucs', 'REPLICATE_API_TOKEN', 92, 75, 'Four-way demixing: vocals, drums, bass, other.'),
  ('lovable-image', 'Lovable AI image engine', 'image', 'lovable', 'google/gemini-3.1-flash-image', NULL, 88, 90, 'Built-in, always available — no key required.');