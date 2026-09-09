-- 1. Roles: add teacher
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- 2. Account status
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active','suspended','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.account_status NOT NULL DEFAULT 'active',
  status_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_accounts TO authenticated;
GRANT ALL ON public.user_accounts TO service_role;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own account readable" ON public.user_accounts;
CREATE POLICY "own account readable" ON public.user_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins read all accounts" ON public.user_accounts;
CREATE POLICY "admins read all accounts" ON public.user_accounts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "admins manage accounts" ON public.user_accounts;
CREATE POLICY "admins manage accounts" ON public.user_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role));

DROP TRIGGER IF EXISTS user_accounts_updated ON public.user_accounts;
CREATE TRIGGER user_accounts_updated BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.user_accounts (user_id)
SELECT id FROM auth.users ON CONFLICT DO NOTHING;

-- 3. Audit log (append-only, admin readable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  result text NOT NULL DEFAULT 'success',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read audit logs" ON public.audit_logs;
CREATE POLICY "admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role));

-- 4. Rate limiting counters (server-only)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  identifier text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, identifier, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON public.rate_limits(window_start);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- no policies: only reachable via service role / security definer functions

-- 5. Trusted server clock
CREATE OR REPLACE FUNCTION public.server_now()
RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT now() $$;
REVOKE ALL ON FUNCTION public.server_now() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.server_now() TO authenticated, service_role;

-- 6. Account status gate
CREATE OR REPLACE FUNCTION public.is_account_active(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT ua.status = 'active' FROM public.user_accounts ua WHERE ua.user_id = _user_id), false)
$$;
REVOKE ALL ON FUNCTION public.is_account_active(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_active(uuid) TO authenticated, service_role;

-- 7. Audit writer (server side only)
CREATE OR REPLACE FUNCTION public.write_audit_log(_actor uuid, _action text, _target_type text, _target_id text, _result text, _metadata jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, result, metadata)
  VALUES (_actor, _action, _target_type, _target_id, COALESCE(_result,'success'), COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE ALL ON FUNCTION public.write_audit_log(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.write_audit_log(uuid, text, text, text, text, jsonb) TO service_role;

-- 8. Rate limit consumer (server side only)
CREATE OR REPLACE FUNCTION public.consume_rate_limit(_bucket text, _identifier text, _limit int, _window_seconds int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE w timestamptz; c int;
BEGIN
  w := to_timestamp(floor(extract(epoch from now()) / GREATEST(_window_seconds,1)) * GREATEST(_window_seconds,1));
  INSERT INTO public.rate_limits (bucket, identifier, window_start, count)
  VALUES (_bucket, _identifier, w, 1)
  ON CONFLICT (bucket, identifier, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO c;
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  RETURN c <= _limit;
END $$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, int, int) TO service_role;

-- 9. Keep account rows in sync for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_accounts (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;
CREATE TRIGGER on_auth_user_created_account
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_account();
