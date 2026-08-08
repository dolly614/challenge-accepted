CREATE POLICY "Students upload own documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students read own documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'student-documents' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR private.has_role(auth.uid(),'admin'::app_role)
));

CREATE POLICY "Students update own documents" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'student-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
