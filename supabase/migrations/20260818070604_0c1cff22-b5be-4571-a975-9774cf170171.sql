
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('not_submitted','pending','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT '',
  class text NOT NULL DEFAULT '',
  school_name text NOT NULL DEFAULT '',
  mobile_number text NOT NULL DEFAULT '',
  email text,
  document_type text,
  document_url text,
  photo_url text,
  verification_status public.verification_status NOT NULL DEFAULT 'not_submitted',
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  challenge_started boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own record" ON public.students;
CREATE POLICY "Students view own record" ON public.students
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Students create own record" ON public.students;
CREATE POLICY "Students create own record" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND verification_status = 'not_submitted'::public.verification_status);

DROP POLICY IF EXISTS "Students update own record" ON public.students;
CREATE POLICY "Students update own record" ON public.students
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));

-- students may not self-approve
CREATE OR REPLACE FUNCTION public.protect_student_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.verification_status := OLD.verification_status;
    NEW.verified_by := OLD.verified_by;
    NEW.verified_at := OLD.verified_at;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.protect_student_verification() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS students_protect ON public.students;
CREATE TRIGGER students_protect BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.protect_student_verification();

-- create the student row on signup, alongside the existing profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, class_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'class_level', NEW.raw_user_meta_data->>'class', ''), '\D', '', 'g'), '')::INT
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  INSERT INTO public.students (user_id, student_name, class, school_name, mobile_number, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class', NEW.raw_user_meta_data->>'class_level', ''),
    COALESCE(NEW.raw_user_meta_data->>'school_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'display_email', ''), '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_for_verification(
  p_document_type text, p_document_url text, p_photo_url text
) RETURNS public.students
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE row public.students;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_document_type NOT IN ('school_id_card','birth_certificate','aadhaar_card') THEN
    RAISE EXCEPTION 'Invalid document type';
  END IF;

  INSERT INTO public.students (user_id, document_type, document_url, photo_url, verification_status)
  VALUES (auth.uid(), p_document_type, p_document_url, p_photo_url, 'pending')
  ON CONFLICT (user_id) DO UPDATE SET
    document_type = EXCLUDED.document_type,
    document_url = EXCLUDED.document_url,
    photo_url = EXCLUDED.photo_url,
    verification_status = 'pending',
    rejection_reason = NULL,
    verified_by = NULL,
    verified_at = NULL,
    updated_at = now()
  RETURNING * INTO row;

  RETURN row;
END $$;
REVOKE EXECUTE ON FUNCTION public.submit_for_verification(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_for_verification(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_student_verification(
  p_student_id uuid, p_approve boolean, p_reason text
) RETURNS public.students
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE row public.students;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.students SET
    verification_status = CASE WHEN p_approve THEN 'verified'::public.verification_status ELSE 'rejected'::public.verification_status END,
    verified_by = auth.uid(),
    verified_at = now(),
    rejection_reason = CASE WHEN p_approve THEN NULL ELSE p_reason END,
    updated_at = now()
  WHERE id = p_student_id
  RETURNING * INTO row;

  IF row.id IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF;
  RETURN row;
END $$;
REVOKE EXECUTE ON FUNCTION public.review_student_verification(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_student_verification(uuid,boolean,text) TO authenticated;

ALTER TABLE public.students REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
