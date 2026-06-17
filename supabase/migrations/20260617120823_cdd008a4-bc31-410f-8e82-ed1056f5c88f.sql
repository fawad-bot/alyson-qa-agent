CREATE POLICY "auth read evidence files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidence');