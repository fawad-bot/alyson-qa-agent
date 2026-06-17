
-- FIX TASKS
CREATE TABLE public.fix_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES public.findings(id) ON DELETE SET NULL,
  run_id UUID REFERENCES public.qa_runs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'p2',
  status TEXT NOT NULL DEFAULT 'open',
  auto_fixable BOOLEAN NOT NULL DEFAULT false,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  assignee TEXT,
  patch_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fix_tasks TO authenticated;
GRANT ALL ON public.fix_tasks TO service_role;
ALTER TABLE public.fix_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own fix_tasks select" ON public.fix_tasks FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own fix_tasks insert" ON public.fix_tasks FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own fix_tasks update" ON public.fix_tasks FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own fix_tasks delete" ON public.fix_tasks FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER fix_tasks_updated_at BEFORE UPDATE ON public.fix_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PERSONAS
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO authenticated;
GRANT ALL ON public.personas TO service_role;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own personas select" ON public.personas FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own personas insert" ON public.personas FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own personas update" ON public.personas FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own personas delete" ON public.personas FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER personas_updated_at BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CREDENTIALS (vault references only, NEVER raw secrets)
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'password',
  vault_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credentials TO authenticated;
GRANT ALL ON public.credentials TO service_role;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own credentials select" ON public.credentials FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own credentials insert" ON public.credentials FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own credentials update" ON public.credentials FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own credentials delete" ON public.credentials FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER credentials_updated_at BEFORE UPDATE ON public.credentials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TRIGGERS (renamed to qa_triggers to avoid SQL reserved-ish confusion)
CREATE TABLE public.qa_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_triggers TO authenticated;
GRANT ALL ON public.qa_triggers TO service_role;
ALTER TABLE public.qa_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own qa_triggers select" ON public.qa_triggers FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own qa_triggers insert" ON public.qa_triggers FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own qa_triggers update" ON public.qa_triggers FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own qa_triggers delete" ON public.qa_triggers FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER qa_triggers_updated_at BEFORE UPDATE ON public.qa_triggers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- INTEGRATIONS
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own integrations select" ON public.integrations FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own integrations insert" ON public.integrations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own integrations update" ON public.integrations FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own integrations delete" ON public.integrations FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- WORKSPACE SETTINGS (one row per user)
CREATE TABLE public.workspace_settings (
  owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_mode TEXT NOT NULL DEFAULT 'full_e2e',
  default_gate TEXT NOT NULL DEFAULT 'strict',
  evidence_retention_days INTEGER NOT NULL DEFAULT 30,
  ai_starts_runs BOOLEAN NOT NULL DEFAULT true,
  ai_auto_fix BOOLEAN NOT NULL DEFAULT false,
  workspace_name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_settings TO authenticated;
GRANT ALL ON public.workspace_settings TO service_role;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings select" ON public.workspace_settings FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own settings insert" ON public.workspace_settings FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own settings update" ON public.workspace_settings FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER workspace_settings_updated_at BEFORE UPDATE ON public.workspace_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
