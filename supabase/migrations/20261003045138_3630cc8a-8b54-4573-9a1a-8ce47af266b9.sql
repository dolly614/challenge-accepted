CREATE OR REPLACE FUNCTION public.submit_for_verification(p_document_type text, p_document_url text, p_photo_url text)
 RETURNS students LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE row public.students; cur public.verification_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT public.is_account_active(auth.uid()) THEN RAISE EXCEPTION 'Account is not active'; END IF;
  IF p_document_type NOT IN ('school_id_card','school_dress_photo') THEN
    RAISE EXCEPTION 'Invalid document type';
  END IF;
  IF p_document_url IS NULL OR p_document_url !~ ('^' || auth.uid()::text || '/') THEN
    RAISE EXCEPTION 'Invalid document reference';
  END IF;
  IF p_photo_url IS NOT NULL AND p_photo_url !~ ('^' || auth.uid()::text || '/') THEN
    RAISE EXCEPTION 'Invalid photo reference';
  END IF;
  SELECT verification_status INTO cur FROM public.students WHERE user_id = auth.uid() FOR UPDATE;
  IF cur IS NOT NULL AND cur NOT IN ('not_submitted','rejected') THEN
    RAISE EXCEPTION 'Verification already submitted';
  END IF;
  INSERT INTO public.students (user_id, document_type, document_url, photo_url, verification_status, submitted_at,
                               student_name, class, school_name, mobile_number)
  VALUES (auth.uid(), p_document_type, p_document_url, p_photo_url, 'pending', now(), '', '', '', '')
  ON CONFLICT (user_id) DO UPDATE SET
    document_type = EXCLUDED.document_type, document_url = EXCLUDED.document_url, photo_url = EXCLUDED.photo_url,
    verification_status = 'pending', submitted_at = now(), rejection_reason = NULL,
    verified_by = NULL, verified_at = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = now()
  RETURNING * INTO row;
  PERFORM public.write_audit_log(auth.uid(),
    CASE WHEN cur = 'rejected' THEN 'VERIFICATION_RESUBMITTED' ELSE 'VERIFICATION_SUBMITTED' END,
    'student', row.id::text, 'success', jsonb_build_object('document_type', p_document_type));
  RETURN row;
END $function$;