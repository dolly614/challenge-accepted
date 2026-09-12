
-- 1. Columns
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS referred_by_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS mobile_normalized text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS challenge_started_at timestamptz;

-- 2. Mobile normalization
CREATE OR REPLACE FUNCTION public.normalize_mobile(_raw text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _raw IS NULL THEN NULL
    WHEN length(regexp_replace(_raw, '\D', '', 'g')) >= 10
      THEN '+91' || right(regexp_replace(_raw, '\D', '', 'g'), 10)
    ELSE NULL END
$$;

UPDATE public.students SET mobile_normalized = public.normalize_mobile(mobile_number)
  WHERE mobile_normalized IS NULL;

CREATE OR REPLACE FUNCTION public.students_normalize()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.mobile_normalized := public.normalize_mobile(NEW.mobile_number);
  NEW.email := NULLIF(lower(trim(COALESCE(NEW.email,''))), '');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS students_normalize_trg ON public.students;
CREATE TRIGGER students_normalize_trg BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.students_normalize();

CREATE UNIQUE INDEX IF NOT EXISTS students_mobile_normalized_uniq
  ON public.students (mobile_normalized) WHERE mobile_normalized IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_email_uniq
  ON public.students (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS students_status_idx ON public.students (verification_status, created_at);
CREATE INDEX IF NOT EXISTS students_referrer_idx ON public.students (referred_by_teacher_id);

-- 3. Terms acceptance
CREATE TABLE IF NOT EXISTS public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted boolean NOT NULL DEFAULT true,
  terms_version text NOT NULL DEFAULT 'v1',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, terms_version)
);
GRANT SELECT ON public.terms_acceptances TO authenticated;
GRANT ALL ON public.terms_acceptances TO service_role;
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own terms read" ON public.terms_acceptances;
CREATE POLICY "own terms read" ON public.terms_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));

-- 4. Signup trigger: terms + referral attribution (server-side only)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_code text; ref_teacher uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, class_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'class_level', NEW.raw_user_meta_data->>'class', ''), '\D', '', 'g'), '')::INT
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');

  ref_code := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code','')), '');
  IF ref_code IS NOT NULL THEN
    SELECT t.id INTO ref_teacher FROM public.teachers t
      WHERE upper(t.code) = upper(ref_code) AND t.status = 'approved' LIMIT 1;
    IF ref_teacher IS NULL THEN ref_code := NULL; END IF;
  END IF;

  INSERT INTO public.students (user_id, student_name, class, school_name, mobile_number, email, referral_code, referred_by_teacher_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class', NEW.raw_user_meta_data->>'class_level', ''),
    COALESCE(NEW.raw_user_meta_data->>'school_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'display_email', ''), ''),
    ref_code,
    ref_teacher
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'terms_accepted','') = 'true' THEN
    INSERT INTO public.terms_acceptances (user_id, accepted, terms_version)
    VALUES (NEW.id, true, COALESCE(NEW.raw_user_meta_data->>'terms_version','v1'))
    ON CONFLICT DO NOTHING;
  END IF;

  PERFORM public.write_audit_log(NEW.id, 'STUDENT_REGISTERED', 'student', NEW.id::text, 'success', '{}'::jsonb);
  IF ref_teacher IS NOT NULL THEN
    PERFORM public.write_audit_log(NEW.id, 'REFERRAL_ATTACHED', 'teacher', ref_teacher::text, 'success', '{}'::jsonb);
  END IF;

  RETURN NEW;
END; $$;

-- 5. Verification state machine
CREATE OR REPLACE FUNCTION public.submit_for_verification(p_document_type text, p_document_url text, p_photo_url text)
RETURNS students LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row public.students; cur public.verification_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT public.is_account_active(auth.uid()) THEN RAISE EXCEPTION 'Account is not active'; END IF;
  IF p_document_type NOT IN ('school_id_card','birth_certificate','aadhaar_card') THEN
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
    document_type = EXCLUDED.document_type,
    document_url = EXCLUDED.document_url,
    photo_url = EXCLUDED.photo_url,
    verification_status = 'pending',
    submitted_at = now(),
    rejection_reason = NULL,
    verified_by = NULL,
    verified_at = NULL,
    reviewed_by = NULL,
    reviewed_at = NULL,
    updated_at = now()
  RETURNING * INTO row;

  PERFORM public.write_audit_log(auth.uid(),
    CASE WHEN cur = 'rejected' THEN 'VERIFICATION_RESUBMITTED' ELSE 'VERIFICATION_SUBMITTED' END,
    'student', row.id::text, 'success', jsonb_build_object('document_type', p_document_type));
  RETURN row;
END $$;

CREATE OR REPLACE FUNCTION public.review_student_verification(p_student_id uuid, p_approve boolean, p_reason text)
RETURNS students LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row public.students; cur public.verification_status;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'teacher'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT public.is_account_active(auth.uid()) THEN RAISE EXCEPTION 'Account is not active'; END IF;

  SELECT verification_status INTO cur FROM public.students WHERE id = p_student_id FOR UPDATE;
  IF cur IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF;
  IF cur <> 'pending' THEN RAISE EXCEPTION 'Verification is not pending'; END IF;

  UPDATE public.students SET
    verification_status = CASE WHEN p_approve THEN 'verified'::public.verification_status ELSE 'rejected'::public.verification_status END,
    verified_by = auth.uid(),
    verified_at = now(),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    rejection_reason = CASE WHEN p_approve THEN NULL ELSE NULLIF(trim(COALESCE(p_reason,'')),'') END,
    updated_at = now()
  WHERE id = p_student_id
  RETURNING * INTO row;

  PERFORM public.write_audit_log(auth.uid(),
    CASE WHEN p_approve THEN 'VERIFICATION_APPROVED' ELSE 'VERIFICATION_REJECTED' END,
    'student', p_student_id::text, 'success', jsonb_build_object('previous_status', cur));
  RETURN row;
END $$;

-- 6. Challenge start (authoritative)
CREATE OR REPLACE FUNCTION public.start_challenge()
RETURNS students LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row public.students;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT public.is_account_active(auth.uid()) THEN RAISE EXCEPTION 'Account is not active'; END IF;

  SELECT * INTO row FROM public.students WHERE user_id = auth.uid() FOR UPDATE;
  IF row.id IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF;
  IF row.verification_status <> 'verified' THEN RAISE EXCEPTION 'Verification pending'; END IF;

  IF NOT row.challenge_started THEN
    UPDATE public.students SET challenge_started = true, challenge_started_at = now(), updated_at = now()
      WHERE id = row.id RETURNING * INTO row;
    PERFORM public.write_audit_log(auth.uid(), 'CHALLENGE_STARTED', 'student', row.id::text, 'success', '{}'::jsonb);
  END IF;
  RETURN row;
END $$;

REVOKE ALL ON FUNCTION public.normalize_mobile(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.students_normalize() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_challenge() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_challenge() TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_mobile(text) TO authenticated;
