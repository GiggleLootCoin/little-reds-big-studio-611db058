DROP POLICY IF EXISTS "studio media readable by signed in" ON storage.objects;

CREATE POLICY "studio media own read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'studio-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "studio media published read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'studio-media'
  AND EXISTS (
    SELECT 1 FROM public.tracks t
    WHERE t.audio_url = storage.objects.name
       OR t.cover_url = storage.objects.name
       OR t.video_url = storage.objects.name
  )
);

REVOKE EXECUTE ON FUNCTION public.refresh_plugin_weekly_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;