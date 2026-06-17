import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/* ---------- SUITES ---------- */
export const listSuites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("test_suites").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createSuite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1),
    description: z.string().optional().default(""),
    tags: z.array(z.string()).optional().default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("test_suites").insert({
      owner_id: context.userId,
      name: data.name,
      description: data.description,
      tags: data.tags,
      checks: [],
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSuite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("test_suites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- QUALITY GATES ---------- */
export const listGates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quality_gates").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    name: z.string().min(1),
    metric: z.string().min(1),
    operator: z.enum(["lt","lte","gt","gte","eq"]),
    threshold: z.number(),
    severity: z.enum(["low","medium","high","critical"]).default("high"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("quality_gates").insert({
      owner_id: context.userId,
      ...data,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("quality_gates")
      .update({ enabled: data.enabled }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("quality_gates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- REPORTS ---------- */
export const getReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: runs } = await context.supabase
      .from("qa_runs").select("status, started_at, finished_at, project_id, projects(name)")
      .order("started_at", { ascending: false }).limit(200);
    const { data: findings } = await context.supabase
      .from("findings").select("severity, status, created_at");

    const r = runs ?? [];
    const f = findings ?? [];
    const total = r.length;
    const passed = r.filter(x => x.status === "passed").length;
    const failed = r.filter(x => x.status === "failed").length;
    const running = r.filter(x => x.status === "running" || x.status === "pending").length;
    const passRate = total ? Math.round((passed / total) * 100) : 0;

    // by day, last 14 days
    const byDay: Record<string, { date: string; passed: number; failed: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { date: key, passed: 0, failed: 0 };
    }
    r.forEach(x => {
      const key = (x.started_at ?? "").slice(0, 10);
      if (byDay[key]) {
        if (x.status === "passed") byDay[key].passed++;
        else if (x.status === "failed") byDay[key].failed++;
      }
    });

    // by project
    const byProject: Record<string, { name: string; passed: number; failed: number }> = {};
    r.forEach((x: any) => {
      const name = x.projects?.name ?? "Unknown";
      byProject[name] ??= { name, passed: 0, failed: 0 };
      if (x.status === "passed") byProject[name].passed++;
      else if (x.status === "failed") byProject[name].failed++;
    });

    const severities = { critical: 0, high: 0, medium: 0, low: 0 };
    f.forEach(x => { (severities as any)[x.severity] = ((severities as any)[x.severity] ?? 0) + 1; });

    return {
      total, passed, failed, running, passRate,
      openFindings: f.filter(x => x.status === "open").length,
      resolvedFindings: f.filter(x => x.status === "resolved").length,
      severities,
      timeline: Object.values(byDay),
      byProject: Object.values(byProject),
    };
  });

/* ---------- EVIDENCE ---------- */
export const listEvidence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("evidence_items")
      .select("*, qa_runs(id, branch, projects(name))")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ---------- ALERTS ---------- */
export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alerts").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("alerts")
      .update({ read_at: new Date().toISOString() }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllAlertsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("alerts")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
