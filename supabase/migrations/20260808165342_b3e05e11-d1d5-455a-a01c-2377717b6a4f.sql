-- ============ EXAMS: enforce class level ============
DROP POLICY IF EXISTS "Students can view published exams for their class" ON public.exams;
CREATE POLICY "Students can view published exams for their class"
ON public.exams FOR SELECT TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.class_level = exams.class_level
    )
  )
);

-- ============ TEACHER SYSTEM ============
CREATE TYPE public.teacher_status AS ENUM ('pending','approved','rejected','suspended');
CREATE TYPE public.commission_status AS ENUM ('pending','approved','cancelled','paid');
CREATE TYPE public.withdrawal_status AS ENUM ('requested','approved','paid','rejected');

CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  code text NOT NULL UNIQUE,
  kyc_type text,
  kyc_number text,
  upi text,
  bank_acc text,
  bank_ifsc text,
  bank_holder text,
  status public.teacher_status NOT NULL DEFAULT 'pending',
  fraud_score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers view own row" ON public.teachers FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Teachers create own row" ON public.teachers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending' AND fraud_score = 0);
CREATE POLICY "Teachers update own row" ON public.teachers FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update teachers" ON public.teachers FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));

-- teachers cannot escalate their own status / fraud score
CREATE OR REPLACE FUNCTION public.protect_teacher_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT private.has_role(auth.uid(),'admin'::app_role) THEN
    NEW.status := OLD.status;
    NEW.fraud_score := OLD.fraud_score;
    NEW.code := OLD.code;
    NEW.user_id := OLD.user_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER teachers_protect BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.protect_teacher_privileged_fields();

CREATE TABLE public.teacher_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT '',
  student_email text NOT NULL DEFAULT '',
  student_phone text NOT NULL DEFAULT '',
  student_class text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  refunded boolean NOT NULL DEFAULT false,
  fraud_flags text[] NOT NULL DEFAULT '{}',
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teacher_referrals TO authenticated;
GRANT ALL ON public.teacher_referrals TO service_role;
ALTER TABLE public.teacher_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view own referrals" ON public.teacher_referrals FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin'::app_role) OR EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.id = teacher_referrals.teacher_id AND t.user_id = auth.uid()));

CREATE TABLE public.teacher_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.teacher_referrals(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  status public.commission_status NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teacher_commissions TO authenticated;
GRANT ALL ON public.teacher_commissions TO service_role;
ALTER TABLE public.teacher_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view own commissions" ON public.teacher_commissions FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin'::app_role) OR EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.id = teacher_commissions.teacher_id AND t.user_id = auth.uid()));

CREATE TABLE public.teacher_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL,
  destination text NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'requested',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.teacher_withdrawals TO authenticated;
GRANT ALL ON public.teacher_withdrawals TO service_role;
ALTER TABLE public.teacher_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view own withdrawals" ON public.teacher_withdrawals FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin'::app_role) OR EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.id = teacher_withdrawals.teacher_id AND t.user_id = auth.uid()));
CREATE POLICY "Teachers request own withdrawals" ON public.teacher_withdrawals FOR INSERT TO authenticated
WITH CHECK (status = 'requested' AND EXISTS (
  SELECT 1 FROM public.teachers t WHERE t.id = teacher_withdrawals.teacher_id AND t.user_id = auth.uid() AND t.status = 'approved'));
CREATE POLICY "Admins update withdrawals" ON public.teacher_withdrawals FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));

CREATE TABLE public.teacher_fraud_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.teacher_referrals(id) ON DELETE SET NULL,
  kind text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teacher_fraud_logs TO authenticated;
GRANT ALL ON public.teacher_fraud_logs TO service_role;
ALTER TABLE public.teacher_fraud_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view fraud logs" ON public.teacher_fraud_logs FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin'::app_role));

-- server-side balance
CREATE OR REPLACE FUNCTION public.teacher_balance(_teacher_id uuid)
RETURNS TABLE (earned numeric, withdrawn numeric, available numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE((SELECT SUM(amount) FROM public.teacher_commissions c
              WHERE c.teacher_id = _teacher_id AND c.status IN ('approved','paid')),0)::numeric,
    COALESCE((SELECT SUM(amount) FROM public.teacher_withdrawals w
              WHERE w.teacher_id = _teacher_id AND w.status IN ('requested','approved','paid')),0)::numeric,
    GREATEST(0,
      COALESCE((SELECT SUM(amount) FROM public.teacher_commissions c
                WHERE c.teacher_id = _teacher_id AND c.status IN ('approved','paid')),0)
      - COALESCE((SELECT SUM(amount) FROM public.teacher_withdrawals w
                  WHERE w.teacher_id = _teacher_id AND w.status IN ('requested','approved','paid')),0))::numeric;
$$;

-- enforce withdrawal amount server-side
CREATE OR REPLACE FUNCTION public.validate_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE avail numeric;
BEGIN
  IF NEW.amount < 500 THEN RAISE EXCEPTION 'Minimum payout is 500'; END IF;
  SELECT available INTO avail FROM public.teacher_balance(NEW.teacher_id);
  IF NEW.amount > avail THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER teacher_withdrawals_validate BEFORE INSERT ON public.teacher_withdrawals
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal();

-- referral attribution (server-computed commission)
CREATE OR REPLACE FUNCTION public.attribute_referral(
  _code text, _student_name text, _student_email text,
  _student_phone text, _student_class text, _amount numeric, _device text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.teachers%ROWTYPE; flags text[] := '{}'; ref_id uuid; cnt int; rate numeric;
BEGIN
  SELECT * INTO t FROM public.teachers WHERE upper(code) = upper(_code);
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code'); END IF;
  IF t.status <> 'approved' THEN RETURN jsonb_build_object('ok', false, 'reason', 'teacher_not_approved'); END IF;

  IF lower(t.email) = lower(_student_email) OR t.phone = _student_phone THEN
    flags := array_append(flags, 'self_referral');
  END IF;
  IF EXISTS (SELECT 1 FROM public.teacher_referrals r WHERE r.teacher_id = t.id AND (
      (_device IS NOT NULL AND r.device = _device)
      OR lower(r.student_email) = lower(_student_email)
      OR r.student_phone = _student_phone)) THEN
    flags := array_append(flags, 'duplicate_signup');
  END IF;
  IF _student_email ~* '(temp|mailinator|10minute|guerrilla)' THEN
    flags := array_append(flags, 'disposable_email');
  END IF;

  INSERT INTO public.teacher_referrals (teacher_id, student_name, student_email, student_phone, student_class, amount, paid, fraud_flags, device)
  VALUES (t.id, _student_name, _student_email, _student_phone, _student_class, COALESCE(_amount,0), true, flags, _device)
  RETURNING id INTO ref_id;

  IF 'self_referral' = ANY(flags) OR 'duplicate_signup' = ANY(flags) THEN
    INSERT INTO public.teacher_commissions (teacher_id, referral_id, amount, status, reason)
    VALUES (t.id, ref_id, 0, 'cancelled', array_to_string(flags, ','));
    INSERT INTO public.teacher_fraud_logs (teacher_id, referral_id, kind, detail)
    VALUES (t.id, ref_id, 'fraud_block', array_to_string(flags, ','));
  ELSE
    SELECT count(*) INTO cnt FROM public.teacher_referrals r
      WHERE r.teacher_id = t.id AND r.paid AND NOT r.refunded AND r.id <> ref_id;
    rate := CASE WHEN cnt > 200 THEN 20 WHEN cnt > 50 THEN 15 ELSE 10 END;
    INSERT INTO public.teacher_commissions (teacher_id, referral_id, amount, status)
    VALUES (t.id, ref_id, rate, 'approved');
  END IF;

  RETURN jsonb_build_object('ok', true, 'referral_id', ref_id);
END $$;
GRANT EXECUTE ON FUNCTION public.attribute_referral(text,text,text,text,text,numeric,text) TO anon, authenticated;

-- public lookup of a referral code (name + code only)
CREATE OR REPLACE FUNCTION public.teacher_by_code(_code text)
RETURNS TABLE (name text, code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.name, t.code FROM public.teachers t
  WHERE upper(t.code) = upper(_code) AND t.status = 'approved';
$$;
GRANT EXECUTE ON FUNCTION public.teacher_by_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_balance(uuid) TO authenticated;
