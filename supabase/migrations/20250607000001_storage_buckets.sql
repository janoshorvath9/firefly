-- Storage buckets for event covers and business feed media
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('event-images', 'event-images', true),
  ('feed-media', 'feed-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Public read feed media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed-media');

CREATE POLICY "Authenticated upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated upload feed media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feed-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update own event images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-images' AND auth.uid() = owner);

CREATE POLICY "Authenticated update own feed media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'feed-media' AND auth.uid() = owner);

CREATE POLICY "Authenticated delete own event images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-images' AND auth.uid() = owner);

CREATE POLICY "Authenticated delete own feed media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'feed-media' AND auth.uid() = owner);
