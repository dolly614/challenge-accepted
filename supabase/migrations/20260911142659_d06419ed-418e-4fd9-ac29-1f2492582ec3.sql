
CREATE OR REPLACE FUNCTION public.registration_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'batch', c.batch_name,
    'opensAt', c.registration_opens_at,
    'closesAt', c.registration_closes_at,
    'serverNow', now(),
    'status', CASE
      WHEN now() < c.registration_opens_at THEN 'upcoming'
      WHEN now() > c.registration_closes_at THEN 'closed'
      ELSE 'open' END
  )
  FROM public.site_config c WHERE c.id;
$$;
REVOKE ALL ON FUNCTION public.registration_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registration_status() TO anon, authenticated, service_role;
