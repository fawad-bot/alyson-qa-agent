import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATE_NAMES = [
  ["setup", "Provision environment"],
  ["setup", "Install dependencies"],
  ["build", "Build target"],
  ["lint", "Static analysis"],
  ["unit", "Unit tests"],
  ["integration", "Integration suite"],
  ["a11y", "Accessibility sweep"],
  ["perf", "Performance probes"],
  ["security", "Security checks"],
  ["e2e", "End-to-end flows"],
  ["visual", "Visual regression"],
  ["report", "Compile report"],
] as const;

export const listRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("qa_runs")
      .select("*, projects(name)")
      .order("started_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [run, gates, findings] = await Promise.all([
      context.supabase.from("qa_runs").select("*, projects(name)").eq("id", data.id).maybeSingle(),
      context.supabase.from("run_gates").select("*").eq("run_id", data.id).order("ordering"),
      context.supabase.from("findings").select("*").eq("run_id", data.id).order("severity"),
    ]);
    if (run.error) throw new Error(run.error.message);
    if (!run.data) throw new Error("Run not found");
    return { run: run.data, gates: gates.data ?? [], findings: findings.data ?? [] };
  });

export const createRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    project_id: z.string().uuid(),
    branch: z.string().min(1).default("main"),
    trigger: z.enum(["manual", "scheduled", "webhook"]).default("manual"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: run, error } = await context.supabase.from("qa_runs").insert({
      project_id: data.project_id,
      owner_id: context.userId,
      branch: data.branch,
      trigger: data.trigger,
      status: "running",
      started_at: new Date().toISOString(),
      summary: {},
    }).select().single();
    if (error) throw new Error(error.message);

    const gateRows = GATE_NAMES.map(([phase, name], i) => ({
      run_id: run.id,
      owner_id: context.userId,
      phase, name,
      ordering: i,
      status: "pending" as const,
      output: {},
    }));
    const { error: gErr } = await context.supabase.from("run_gates").insert(gateRows);
    if (gErr) throw new Error(gErr.message);
    return run;
  });

const FINDING_TEMPLATES = [
  { kind: "a11y", severity: "high" as const, title: "Missing alt text on hero image", location: "/landing", description: "<img> in hero section has no alt attribute." },
  { kind: "perf", severity: "medium" as const, title: "LCP above 2.5s on mobile", location: "/pricing", description: "Largest Contentful Paint measured at 3.1s." },
  { kind: "security", severity: "critical" as const, title: "Form submits over HTTP", location: "/contact", description: "Form action targets http:// endpoint." },
  { kind: "e2e", severity: "high" as const, title: "Checkout fails for returning users", location: "/checkout", description: "Stored payment method dropdown does not populate." },
  { kind: "visual", severity: "low" as const, title: "Header overlaps content at 1024px", location: "/dashboard", description: "Sticky header has incorrect z-index." },
];

export const tickRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: gates } = await context.supabase
      .from("run_gates").select("*").eq("run_id", data.id).order("ordering");
    if (!gates || gates.length === 0) return { done: true };

    // Finalize any "running" gate
    const running = gates.find(g => g.status === "running");
    if (running) {
      const fail = Math.random() < 0.18;
      await context.supabase.from("run_gates").update({
        status: fail ? "failed" : "passed",
        duration_ms: 1000 + Math.floor(Math.random() * 1500),
      }).eq("id", running.id);
    }

    // Start next pending
    const next = gates.find(g => g.status === "pending" && g.id !== running?.id);
    if (next) {
      await context.supabase.from("run_gates").update({ status: "running" }).eq("id", next.id);
      return { done: false };
    }

    // No more pending. Finalize run.
    const { data: finalGates } = await context.supabase
      .from("run_gates").select("status").eq("run_id", data.id);
    const failed = (finalGates ?? []).some(g => g.status === "failed");

    const { data: run } = await context.supabase
      .from("qa_runs").select("project_id").eq("id", data.id).maybeSingle();

    if (failed && run) {
      // seed a few findings
      const picks = FINDING_TEMPLATES
        .sort(() => Math.random() - 0.5)
        .slice(0, 2 + Math.floor(Math.random() * 3));
      const { data: insertedFindings } = await context.supabase.from("findings").insert(picks.map(f => ({
        ...f,
        run_id: data.id,
        project_id: run.project_id,
        owner_id: context.userId,
        status: "open" as const,
        metadata: {},
      }))).select();

      // seed evidence + alerts per finding
      if (insertedFindings && insertedFindings.length) {
        await context.supabase.from("evidence_items").insert(insertedFindings.map((f: any) => ({
          owner_id: context.userId,
          run_id: data.id,
          finding_id: f.id,
          kind: "screenshot" as const,
          title: `Screenshot — ${f.title}`,
          url: null,
          payload: { location: f.location },
        })));
        await context.supabase.from("alerts").insert(insertedFindings.map((f: any) => ({
          owner_id: context.userId,
          run_id: data.id,
          finding_id: f.id,
          severity: f.severity === "critical" ? "danger" : f.severity === "high" ? "danger" : "warn",
          title: `${f.severity.toUpperCase()}: ${f.title}`,
          body: f.description,
          channel: "in_app" as const,
        })));
      }
    } else if (run) {
      // success alert
      await context.supabase.from("alerts").insert({
        owner_id: context.userId,
        run_id: data.id,
        severity: "info",
        title: "Run passed",
        body: "All gates completed successfully.",
        channel: "in_app",
      });
    }

    await context.supabase.from("qa_runs").update({
      status: failed ? "failed" : "passed",
      finished_at: new Date().toISOString(),
      summary: { gates: (finalGates ?? []).length, failed: (finalGates ?? []).filter(g => g.status === "failed").length },
    }).eq("id", data.id);

    return { done: true };
  });

