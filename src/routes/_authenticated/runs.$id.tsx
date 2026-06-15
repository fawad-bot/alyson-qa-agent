import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getRun, advanceGate, completeRun, createFinding } from "@/lib/qa.functions";
import { StatusBadge, SeverityBadge, RelativeTime } from "@/components/qa-bits";
import { Play, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/runs/$id")({
  component: RunDetail,
});

const SAMPLE_FINDINGS = [
  { kind: "security", severity: "high" as const, title: "Session token leaked in console.log", description: "Auth bearer was emitted to console in src/routes/index.tsx", location: "src/routes/index.tsx:42" },
  { kind: "a11y", severity: "medium" as const, title: "Primary CTA has insufficient color contrast (3.1:1)", description: "Hero button fails WCAG AA on dark background.", location: "src/components/hero.tsx:18" },
  { kind: "visual", severity: "low" as const, title: "Hero image shifts 8px between viewports", description: null, location: "viewport 1440 vs 1280" },
];

function RunDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchRun = useServerFn(getRun);
  const advance = useServerFn(advanceGate);
  const complete = useServerFn(completeRun);
  const addFinding = useServerFn(createFinding);

  const data = useQuery({
    queryKey: ["run", id],
    queryFn: () => fetchRun({ data: { id } }),
    refetchInterval: 1500,
  });

  const [simulating, setSimulating] = useState(false);
  const stop = useRef(false);

  async function simulate() {
    if (!data.data) return;
    setSimulating(true); stop.current = false;
    try {
      const gates = [...data.data.gates].sort((a, b) => a.ordering - b.ordering);
      let anyFailed = false;
      for (const g of gates) {
        if (stop.current) break;
        if (g.status !== "pending") continue;
        await advance({ data: { gate_id: g.id, status: "running" } });
        qc.invalidateQueries({ queryKey: ["run", id] });
        await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
        const fail = Math.random() < 0.1;
        if (fail) anyFailed = true;
        await advance({ data: { gate_id: g.id, status: fail ? "failed" : "passed", duration_ms: Math.round(700 + Math.random() * 1500) } });
        qc.invalidateQueries({ queryKey: ["run", id] });
      }
      if (data.data.run?.project_id) {
        for (const f of SAMPLE_FINDINGS) {
          await addFinding({ data: { project_id: data.data.run.project_id, run_id: id, kind: f.kind, severity: f.severity, title: f.title, description: f.description ?? undefined, location: f.location } });
        }
      }
      await complete({ data: { id, status: anyFailed ? "failed" : "passed" } });
      qc.invalidateQueries({ queryKey: ["run", id] });
      qc.invalidateQueries({ queryKey: ["runs"] });
      qc.invalidateQueries({ queryKey: ["findings"] });
      toast.success(anyFailed ? "Run finished with failures" : "Run passed all gates");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }

  useEffect(() => () => { stop.current = true; }, []);

  if (data.isLoading || !data.data?.run) {
    return <AppShell title="Run"><div className="text-sm text-muted-foreground">Loading…</div></AppShell>;
  }
  const { run, gates, findings } = data.data;
  const phase1 = gates.filter((g) => g.phase === "phase1");
  const phase2 = gates.filter((g) => g.phase === "phase2");
  const isLive = run.status === "running" || run.status === "pending";

  return (
    <AppShell title={`${run.projects?.name ?? "Run"} · ${run.branch ?? ""}`}>
      <div className="rounded-lg border border-border bg-card p-4 mb-6 flex items-center gap-4">
        <StatusBadge status={run.status} />
        <div className="text-sm">
          <div className="font-mono">{run.commit_sha?.slice(0, 7) ?? "—"}</div>
          <div className="text-xs text-muted-foreground">started <RelativeTime iso={run.started_at} /></div>
        </div>
        <div className="ml-auto">
          {isLive ? (
            <Button onClick={simulate} disabled={simulating}>
              <Play className="h-4 w-4 mr-1" /> {simulating ? "Running gates…" : "Execute gates (demo)"}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">finished <RelativeTime iso={run.finished_at} /></span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <GateList title="Phase 1 — pre-merge" gates={phase1} />
        <GateList title="Phase 2 — post-deploy" gates={phase2} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Findings from this run</h2>
        </div>
        {!findings.length ? (
          <div className="p-6 text-sm text-muted-foreground">No findings yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {findings.map((f) => (
              <li key={f.id} className="p-3 flex items-start gap-3">
                <SeverityBadge severity={f.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{f.title}</div>
                  {f.description && <div className="text-xs text-muted-foreground mt-0.5">{f.description}</div>}
                  {f.location && <div className="text-xs font-mono text-muted-foreground mt-0.5">{f.location}</div>}
                </div>
                <StatusBadge status={f.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function GateList({ title, gates }: { title: string; gates: Array<{ id: string; name: string; status: string; duration_ms: number | null; ordering: number }> }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border text-sm font-semibold">{title}</div>
      <ul className="divide-y divide-border">
        {gates.map((g) => (
          <li key={g.id} className="px-4 py-2 flex items-center gap-3 text-sm">
            <span className="w-6 text-xs text-muted-foreground tabular-nums">{String(g.ordering).padStart(2, "0")}</span>
            <GateIcon status={g.status} />
            <span className="flex-1">{g.name}</span>
            {g.duration_ms != null && <span className="text-xs text-muted-foreground tabular-nums">{g.duration_ms}ms</span>}
            <StatusBadge status={g.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function GateIcon({ status }: { status: string }) {
  if (status === "passed") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-500" />;
  if (status === "running") return <div className="h-3 w-3 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />;
  return <div className="h-3 w-3 rounded-full border border-muted-foreground/40" />;
}
