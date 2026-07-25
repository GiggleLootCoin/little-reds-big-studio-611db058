
CREATE POLICY "studio media readable by signed in" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'studio-media');
CREATE POLICY "studio media own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "studio media own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "studio media own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
