
CREATE POLICY "anon kf read" ON storage.objects FOR SELECT USING (bucket_id IN ('knowledge-files','generated-images'));
CREATE POLICY "anon kf write" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('knowledge-files','generated-images'));
CREATE POLICY "anon kf update" ON storage.objects FOR UPDATE USING (bucket_id IN ('knowledge-files','generated-images')) WITH CHECK (bucket_id IN ('knowledge-files','generated-images'));
CREATE POLICY "anon kf delete" ON storage.objects FOR DELETE USING (bucket_id IN ('knowledge-files','generated-images'));
