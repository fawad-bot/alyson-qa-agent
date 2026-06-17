
-- test_suites: grouped checks
CREATE TABLE public.test_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_suites TO authenticated;
GRANT ALL ON public.test_suites TO service_role;
ALTER TABLE public.test_suites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read suites" ON public.test_suites FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert suites" ON public.test_suites FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update suites" ON public.test_suites FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner delete suites" ON public.test_suites FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER set_test_suites_updated_at BEFORE UPDATE ON public.test_suites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- quality_gates: blocking criteria
CREATE TABLE public.quality_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('lt','lte','gt','gte','eq')),
  threshold NUMERIC NOT NULL,
  severity TEXT NOT NULL DEFAULT 'high' CHECK (severity IN ('low','medium','high','critical')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_gates TO authenticated;
GRANT ALL ON public.quality_gates TO service_role;
ALTER TABLE public.quality_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read gates" ON public.quality_gates FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert gates" ON public.quality_gates FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update gates" ON public.quality_gates FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner delete gates" ON public.quality_gates FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER set_quality_gates_updated_at BEFORE UPDATE ON public.quality_gates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- evidence_items
CREATE TABLE public.evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.qa_runs(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES public.findings(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('screenshot','log','trace','har','video','dom')),
  title TEXT NOT NULL,
  url TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_items TO authenticated;
GRANT ALL ON public.evidence_items TO service_role;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read evidence" ON public.evidence_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert evidence" ON public.evidence_items FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update evidence" ON public.evidence_items FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner delete evidence" ON public.evidence_items FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.qa_runs(id) ON DELETE SET NULL,
  finding_id UUID REFERENCES public.findings(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info','warn','danger')),
  title TEXT NOT NULL,
  body TEXT,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app','email','slack')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner update alerts" ON public.alerts FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "owner delete alerts" ON public.alerts FOR DELETE TO authenticated USING (owner_id = auth.uid());
