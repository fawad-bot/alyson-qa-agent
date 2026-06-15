import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { QA_GATE_SEEDS } from "./qa-gates";

/* ---------- Profile ---------- */
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return {
      userId,
      profile,
      roles: (roles ?? []).map((r) => r.role),
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ display_name: z.string().min(1).max(120), avatar_url: z.string().url().optional().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ display_name: data.display_name, avatar_url: data.avatar_url ?? null })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Projects ---------- */
export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().min(1).max(120),
      repo_url: z.string().url().optional().nullable(),
      default_branch: z.string().min(1).max(60).default("main"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({
        owner_id: context.userId,
        name: data.name,
        repo_url: data.repo_url ?? null,
        default_branch: data.default_branch,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Runs ---------- */
export const listRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId: z.string().uuid().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("qa_runs")
      .select("*, projects(name)")
      .order("started_at", { ascending: false })
      .limit(50);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      branch: z.string().max(120).optional().nullable(),
      commit_sha: z.string().max(60).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: run, error } = await context.supabase
      .from("qa_runs")
      .insert({
        project_id: data.project_id,
        owner_id: context.userId,
        branch: data.branch ?? "main",
        commit_sha: data.commit_sha ?? null,
        status: "running",
      })
      .select()
      .single();
    if (error || !run) throw new Error(error?.message ?? "Failed to create run");

    const gateRows = QA_GATE_SEEDS.map((g) => ({
      run_id: run.id,
      owner_id: context.userId,
      name: g.name,
      phase: g.phase,
      ordering: g.ordering,
      status: "pending" as const,
    }));
    const { error: gErr } = await context.supabase.from("run_gates").insert(gateRows);
    if (gErr) throw new Error(gErr.message);
    return run;
  });

export const getRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: run, error: rErr }, { data: gates }, { data: findings }] = await Promise.all([
      context.supabase.from("qa_runs").select("*, projects(name)").eq("id", data.id).single(),
      context.supabase.from("run_gates").select("*").eq("run_id", data.id).order("ordering"),
      context.supabase.from("findings").select("*").eq("run_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (rErr) throw new Error(rErr.message);
    return { run, gates: gates ?? [], findings: findings ?? [] };
  });

export const advanceGate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      gate_id: z.string().uuid(),
      status: z.enum(["pending", "running", "passed", "failed", "skipped"]),
      duration_ms: z.number().int().min(0).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("run_gates")
      .update({ status: data.status, duration_ms: data.duration_ms ?? null })
      .eq("id", data.gate_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["passed", "failed", "cancelled"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("qa_runs")
      .update({ status: data.status, finished_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Findings ---------- */
export const listFindings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.enum(["open", "acknowledged", "resolved", "ignored"]).optional(),
      projectId: z.string().uuid().optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("findings")
      .select("*, projects(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createFinding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      run_id: z.string().uuid().optional().nullable(),
      kind: z.string().min(1).max(60),
      severity: z.enum(["info", "low", "medium", "high", "critical"]).default("medium"),
      title: z.string().min(1).max(200),
      description: z.string().max(4000).optional().nullable(),
      location: z.string().max(500).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("findings")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateFindingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "acknowledged", "resolved", "ignored"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("findings").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
