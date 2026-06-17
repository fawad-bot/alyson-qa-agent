import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ---------- FIX TASKS ---------- */
export const listFixTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("fix_tasks").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createFixTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().min(1),
    summary: z.string().optional().default(""),
    priority: z.enum(["p0", "p1", "p2", "p3"]).default("p2"),
    auto_fixable: z.boolean().default(false),
    requires_human_review: z.boolean().default(false),
    assignee: z.string().optional(),
    finding_id: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("fix_tasks").insert({
      owner_id: context.userId, ...data,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateFixTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["open", "in_progress", "needs_review", "resolved", "wont_fix"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fix_tasks")
      .update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFixTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("fix_tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- PERSONAS ---------- */
export const listPersonas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("personas").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createPersona = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    description: z.string().optional().default(""),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("personas").insert({
      owner_id: context.userId, ...data,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePersona = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("personas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- CREDENTIALS ---------- */
export const listCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("credentials").select("*, personas(name)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1),
    kind: z.enum(["password", "oauth", "api_key", "session"]).default("password"),
    vault_ref: z.string().min(1),
    persona_id: z.string().uuid().optional().nullable(),
    expires_at: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("credentials").insert({
      owner_id: context.userId,
      name: data.name,
      kind: data.kind,
      vault_ref: data.vault_ref,
      persona_id: data.persona_id ?? null,
      expires_at: data.expires_at ?? null,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("credentials").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- TRIGGERS ---------- */
export const listTriggers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("qa_triggers").select("*").order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    // Seed defaults on first read
    if ((data ?? []).length === 0) {
      const defaults = [
        { kind: "pull_request", label: "On Pull Request", enabled: true },
        { kind: "preview", label: "On Preview Deploy", enabled: true },
        { kind: "publish", label: "Before Publish", enabled: true },
        { kind: "nightly", label: "Nightly Regression", enabled: false },
      ].map(t => ({ ...t, owner_id: context.userId, config: {} }));
      await context.supabase.from("qa_triggers").insert(defaults);
      const { data: seeded } = await context.supabase
        .from("qa_triggers").select("*").order("created_at", { ascending: true });
      return seeded ?? [];
    }
    return data;
  });

export const toggleTrigger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("qa_triggers")
      .update({ enabled: data.enabled }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- INTEGRATIONS ---------- */
const PROVIDERS = [
  { provider: "github", label: "GitHub", description: "Source control & pull request checks" },
  { provider: "vercel", label: "Vercel", description: "Preview deployments" },
  { provider: "slack", label: "Slack", description: "Run + alert notifications" },
  { provider: "jira", label: "Jira", description: "Fix task tracking" },
  { provider: "aws_s3", label: "AWS S3", description: "Evidence storage" },
  { provider: "software_factory", label: "Software Factory", description: "Auto-fix delivery (coming soon)" },
];

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("integrations").select("*");
    if (error) throw new Error(error.message);
    const byProvider = new Map((data ?? []).map(r => [r.provider, r]));
    return PROVIDERS.map(p => ({
      ...p,
      id: byProvider.get(p.provider)?.id ?? null,
      status: byProvider.get(p.provider)?.status ?? "disconnected",
    }));
  });

export const toggleIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    provider: z.string().min(1),
    connect: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.connect) {
      const { error } = await context.supabase.from("integrations").upsert({
        owner_id: context.userId,
        provider: data.provider,
        status: "connected",
        config: {},
      }, { onConflict: "owner_id,provider" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("integrations")
        .delete().eq("owner_id", context.userId).eq("provider", data.provider);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------- WORKSPACE SETTINGS ---------- */
export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("workspace_settings").select("*").eq("owner_id", context.userId).maybeSingle();
    if (data) return data;
    const { data: created, error } = await context.supabase
      .from("workspace_settings").insert({ owner_id: context.userId })
      .select().single();
    if (error) throw new Error(error.message);
    return created;
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    workspace_name: z.string().min(1).optional(),
    default_mode: z.enum(["smoke", "regression", "full_e2e"]).optional(),
    default_gate: z.enum(["lenient", "standard", "strict"]).optional(),
    evidence_retention_days: z.number().int().min(1).max(365).optional(),
    ai_starts_runs: z.boolean().optional(),
    ai_auto_fix: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("workspace_settings")
      .update(data).eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
