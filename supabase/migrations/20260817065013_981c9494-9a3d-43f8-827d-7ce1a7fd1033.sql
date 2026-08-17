-- 1. Lock down SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_teacher_privileged_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_withdrawal() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.teacher_balance(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.attribute_referral(text, text, text, text, text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teacher_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.teacher_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attribute_referral(text, text, text, text, text, numeric, text) TO authenticated;

-- 2. In-function authorization for teacher_balance
CREATE OR REPLACE FUNCTION public.teacher_balance(_teacher_id uuid)
 RETURNS TABLE(earned numeric, withdrawn numeric, available numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT private.has_role(auth.uid(), 'admin'::app_role)
     AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = _teacher_id AND t.user_id = auth.uid())
  THEN RAISE EXCEPTION 'Not authorized'; END IF;

  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(c.amount) FROM public.teacher_commissions c
              WHERE c.teacher_id = _teacher_id AND c.status IN ('approved','paid')),0)::numeric,
    COALESCE((SELECT SUM(w.amount) FROM public.teacher_withdrawals w
              WHERE w.teacher_id = _teacher_id AND w.status IN ('requested','approved','paid')),0)::numeric,
    GREATEST(0,
      COALESCE((SELECT SUM(c.amount) FROM public.teacher_commissions c
                WHERE c.teacher_id = _teacher_id AND c.status IN ('approved','paid')),0)
      - COALESCE((SELECT SUM(w.amount) FROM public.teacher_withdrawals w
                  WHERE w.teacher_id = _teacher_id AND w.status IN ('requested','approved','paid')),0))::numeric;
END $function$;

REVOKE ALL ON FUNCTION public.teacher_balance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.teacher_balance(uuid) TO authenticated;

-- 3. Storage delete policy for student-documents
DROP POLICY IF EXISTS "Owners and admins delete student documents" ON storage.objects;
CREATE POLICY "Owners and admins delete student documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'student-documents'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR private.has_role(auth.uid(), 'admin'::app_role))
);