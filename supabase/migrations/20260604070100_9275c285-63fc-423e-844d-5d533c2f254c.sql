
-- 1) profiles: restrict SELECT to self or admin
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2) exam_attempts: column-level UPDATE grants for students
REVOKE UPDATE ON public.exam_attempts FROM authenticated;
GRANT UPDATE (submitted_at, question_order, device_fingerprint) ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;

-- 3) attempt_answers: prevent students from writing is_correct
REVOKE UPDATE ON public.attempt_answers FROM authenticated;
GRANT UPDATE (selected_option, answered_at) ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;

-- 4) questions: defense-in-depth, never expose correct_option to authenticated
REVOKE SELECT ON public.questions FROM authenticated;
GRANT SELECT (id, exam_id, question_text, option_a, option_b, option_c, option_d, order_index, created_at)
  ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;

-- 5) has_role: revoke direct EXECUTE; RLS still calls it as definer
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
