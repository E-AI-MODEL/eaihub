INSERT INTO storage.buckets (id, name, public) VALUES ('eai-images', 'eai-images', true);

CREATE POLICY "Public read access for eai-images" ON storage.objects FOR SELECT USING (bucket_id = 'eai-images');

CREATE POLICY "Service role can upload eai-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'eai-images');

CREATE POLICY "Service role can delete eai-images" ON storage.objects FOR DELETE USING (bucket_id = 'eai-images');