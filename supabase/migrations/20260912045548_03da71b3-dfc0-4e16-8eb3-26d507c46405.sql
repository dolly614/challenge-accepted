
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_code text; ref_teacher uuid; terms text;
BEGIN
  terms := COALESCE(NEW.raw_user_meta_data->>'terms_accepted', '');

  -- Students must accept the terms; other account types (admin/teacher created
  -- through backoffice flows) don't carry student metadata.
  IF (NEW.raw_user_meta_data ? 'school_name') AND terms <> 'true' THEN
    RAISE EXCEPTION 'Terms & Conditions accept karein.';
  END IF;

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

  IF terms = 'true' THEN
    INSERT INTO public.terms_acceptances (user_id, accepted, terms_version)
    VALUES (NEW.id, true, COALESCE(NEW.raw_user_meta_data->>'terms_version','v1'))
    ON CONFLICT DO NOTHING;
    PERFORM public.write_audit_log(NEW.id, 'TERMS_ACCEPTED', 'user', NEW.id::text, 'success', '{}'::jsonb);
  END IF;

  PERFORM public.write_audit_log(NEW.id, 'STUDENT_REGISTERED', 'student', NEW.id::text, 'success', '{}'::jsonb);
  IF ref_teacher IS NOT NULL THEN
    PERFORM public.write_audit_log(NEW.id, 'REFERRAL_ATTACHED', 'teacher', ref_teacher::text, 'success', '{}'::jsonb);
  END IF;

  RETURN NEW;
END; $$;
