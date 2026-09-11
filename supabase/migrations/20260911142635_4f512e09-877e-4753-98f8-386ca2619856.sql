
-- ============ site_config ============
CREATE TABLE public.site_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  batch_name text NOT NULL DEFAULT 'Batch 1',
  registration_opens_at timestamptz NOT NULL DEFAULT now(),
  registration_closes_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_config TO anon, authenticated;
GRANT ALL ON public.site_config TO service_role;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_config public read" ON public.site_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_config admin write" ON public.site_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE ON public.site_config TO authenticated;
CREATE TRIGGER site_config_updated_at BEFORE UPDATE ON public.site_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.site_config (id) VALUES (true);

-- ============ homepage_stats ============
CREATE TABLE public.homepage_stats (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  students_registered integer NOT NULL DEFAULT 0,
  cities_covered integer NOT NULL DEFAULT 0,
  use_live_counts boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_stats TO anon, authenticated;
GRANT INSERT, UPDATE ON public.homepage_stats TO authenticated;
GRANT ALL ON public.homepage_stats TO service_role;
ALTER TABLE public.homepage_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_stats public read" ON public.homepage_stats FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "homepage_stats admin write" ON public.homepage_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER homepage_stats_updated_at BEFORE UPDATE ON public.homepage_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.homepage_stats (id, students_registered, cities_covered) VALUES (true, 12847, 320);

-- ============ testimonials ============
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  class_info text NOT NULL,
  quote text NOT NULL,
  emoji text NOT NULL DEFAULT '🌟',
  order_index integer NOT NULL DEFAULT 0,
  is_approved boolean NOT NULL DEFAULT false,
  internal_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials public read approved" ON public.testimonials FOR SELECT TO anon, authenticated USING (is_approved);
CREATE POLICY "testimonials admin all" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX testimonials_public_idx ON public.testimonials (is_approved, order_index);
CREATE TRIGGER testimonials_updated_at BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.testimonials (display_name, class_info, quote, emoji, order_index, is_approved) VALUES
  ('Riya Agarwal', 'Class 7, Jaipur', 'Bahut maza aaya! Roz kuch naya seekha aur naya tablet bhi jeeta. 💜', '🌟', 1, true),
  ('Mohammed Faizan', 'Class 10, Hyderabad', '30 din ka challenge ne meri study habit hi badal di. Highly recommended!', '🚀', 2, true),
  ('Sneha Kulkarni', 'Class 5, Pune', 'Mujhe certificate aur gift dono mile. Mummy bhi bahut khush hain!', '🎉', 3, true);

-- ============ faqs ============
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  internal_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs public read published" ON public.faqs FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "faqs admin all" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX faqs_public_idx ON public.faqs (is_published, order_index);
CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.faqs (question, answer, order_index) VALUES
  ('Yeh challenge kya hai?', '30 din ka daily learning program jisme aap roz ek topic seekhte ho, exam dete ho aur prizes jeet sakte ho.', 1),
  ('Registration fee kitni hai?', 'Sirf ₹99 — ek baar ka payment. Ismein 30 din ka content, final exam aur certificate sab include hai.', 2),
  ('Prizes kab milenge?', 'Final exam ke 15 working days ke andar top 3 winners ko Laptop / Tablet / Smartphone deliver kiya jayega. Baaki sabko gift + certificate milega.', 3),
  ('Kaun participate kar sakta hai?', 'Class 1 se Class 12 tak ka koi bhi Indian student. Parent ke saath register karna hota hai.', 4),
  ('Agar koi din miss ho gaya toh?', 'Koi baat nahi! ''Catch up'' option se aap missed day complete kar sakte ho. Streak break nahi hoga.', 5);

-- ============ payments (Razorpay foundation) ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  purpose text NOT NULL,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','refunded')),
  provider text NOT NULL DEFAULT 'razorpay',
  provider_order_id text UNIQUE,
  provider_payment_id text UNIQUE,
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments owner read" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX payments_user_idx ON public.payments (user_id, created_at DESC);

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.payments(id) ON DELETE CASCADE,
  provider_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_events admin read" ON public.payment_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ registration status (server clock authority) ============
CREATE OR REPLACE FUNCTION public.registration_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
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
