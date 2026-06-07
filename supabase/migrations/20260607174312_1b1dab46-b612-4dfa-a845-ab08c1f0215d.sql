CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;

ALTER POLICY "Users see their own answers"
ON public.attempt_answers
USING (
  (EXISTS (
    SELECT 1
    FROM public.exam_attempts a
    WHERE a.id = attempt_answers.attempt_id
      AND a.user_id = auth.uid()
  ))
  OR private.has_role(auth.uid(), 'admin'::public.app_role)
);

ALTER POLICY "Users see their own attempts"
ON public.exam_attempts
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Users update their own attempts"
ON public.exam_attempts
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins manage exams delete"
ON public.exams
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins manage exams insert"
ON public.exams
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins manage exams update"
ON public.exams
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Students can view published exams for their class"
ON public.exams
USING ((is_published = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Users can view their own profile"
ON public.profiles
USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can delete questions"
ON public.questions
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can insert questions"
ON public.questions
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can update questions"
ON public.questions
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Admins can view questions"
ON public.questions
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Only admins can assign roles"
ON public.user_roles
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Only admins can delete roles"
ON public.user_roles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Only admins can update roles"
ON public.user_roles
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Users can view their own roles"
ON public.user_roles
USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "Users see their own violations"
ON public.violations_log
USING (
  (EXISTS (
    SELECT 1
    FROM public.exam_attempts a
    WHERE a.id = violations_log.attempt_id
      AND a.user_id = auth.uid()
  ))
  OR private.has_role(auth.uid(), 'admin'::public.app_role)
);