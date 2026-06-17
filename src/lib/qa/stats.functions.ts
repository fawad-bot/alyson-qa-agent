import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [runsAll, runsToday, findingsOpen, recent] = await Promise.all([
      supabase.from("qa_runs").select("id, status, started_at, finished_at"),
      supabase.from("qa_runs").select("id, status").gte("started_at", since),
      supabase.from("findings").select("id, severity, status"),
      supabase.from("qa_runs").select("id, status, started_at, branch, projects(name)").order("started_at", { ascending: false }).limit(5),
    ]);

    const runs = runsAll.data ?? [];
    const today = runsToday.data ?? [];
    const findings = findingsOpen.data ?? [];

    const passed = runs.filter(r => r.status === "passed").length;
    const passRate = runs.length ? Math.round((passed / runs.length) * 100) : 0;

    const durs = runs
      .filter(r => r.finished_at && r.started_at)
      .map(r => new Date(r.finished_at!).getTime() - new Date(r.started_at).getTime());
    const mttr = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length / 1000) : 0;

    const open = findings.filter(f => f.status !== "resolved");
    const p0 = open.filter(f => f.severity === "critical").length;
    const p1 = open.filter(f => f.severity === "high").length;

    return {
      runsToday: today.length,
      passRate,
      p0, p1,
      openFindings: open.length,
      mttrSeconds: mttr,
      totalRuns: runs.length,
      recent: recent.data ?? [],
    };
  });
