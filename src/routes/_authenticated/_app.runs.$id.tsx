import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getRun, tickRun } from "@/lib/qa/runs.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Loader2, Circle, ChevronLeft, Camera, Bell, FileText } from "lucide-react";

const opts = (id: string) => queryOptions({
  queryKey: ["run", id],
  queryFn: () => getRun({ data: { id } }),
  refetchInterval: (q) => (q.state.data?.run?.status === "running" ? 1200 : false),
});

export const Route = createFileRoute("/_authenticated/_app/runs/$id")({
  loader: ({ context, params }) => { context.queryClient.ensureQueryData(opts(params.id)); },
  component: RunDetail,
});

const SEV_COLOR: Record<string, string> = {
  critical: "bg-dng-bg text-dng",
  high: "bg-warn-bg text-warn",
  medium: "bg-info-bg text-info",
  low: "bg-canvas text-t2",
  info: "bg-canvas text-t3",
};

function GateIcon({ s }: { s: string }) {
  if (s === "passed") return <CheckCircle2 className="w-4 h-4 text-ok" />;
  if (s === "failed") return <XCircle className="w-4 h-4 text-dng" />;
  if (s === "running") return <Loader2 className="w-4 h-4 text-info animate-spin" />;
  return <Circle className="w-4 h-4 text-t3" />;
}

function RunDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(opts(id));
  const tick = useServerFn(tickRun);
  const tickMut = useMutation({ mutationFn: () => tick({ data: { id } }) });

  useEffect(() => {
    if (data.run.status !== "running") return;
    const t = setInterval(() => { if (!tickMut.isPending) tickMut.mutate(); }, 1300);
    return () => clearInterval(t);
  }, [data.run.status, tickMut]);

  const passed = data.gates.filter(g => g.status === "passed").length;
  const failed = data.gates.filter(g => g.status === "failed").length;
  const running = data.gates.filter(g => g.status === "running").length;
  const totalMs = data.gates.reduce((s, g) => s + (g.duration_ms ?? 0), 0);
  const critical = data.findings.filter((f: any) => f.severity === "critical").length;

  return (
    <>
      <Link to="/runs" className="inline-flex items-center text-[13px] text-t2 hover:text-ink mb-3"><ChevronLeft className="w-3.5 h-3.5" />All runs</Link>
      <PageHeader
        eyebrow={`Run · ${(data.run as any).projects?.name ?? ""}`}
        title={`#${data.run.id.slice(0, 8)} on ${data.run.branch ?? "main"}`}
        subtitle={`${data.run.trigger} · started ${new Date(data.run.started_at).toLocaleString()}`}
      />

      <div className="grid grid-cols-6 gap-3 mb-6">
        <div className="card-surface"><div className="text-kpi-label mb-1">Status</div><div className="text-section capitalize">{data.run.status}</div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Passed</div><div className="text-kpi-value text-ok">{passed}</div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Failed</div><div className="text-kpi-value text-dng">{failed}</div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Running</div><div className="text-kpi-value">{running}</div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Findings</div><div className="text-kpi-value">{data.findings.length}<span className="text-[14px] text-t3"> · {critical} P0</span></div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Duration</div><div className="text-kpi-value">{(totalMs / 1000).toFixed(1)}<span className="text-[14px] text-t3">s</span></div></div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="bg-canvas border border-border">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="findings">Findings ({data.findings.length})</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({data.evidence.length})</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({data.alerts.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="card-surface">
            <div className="text-section mb-3">Run summary</div>
            <dl className="grid grid-cols-2 gap-y-2 text-[13.5px]">
              <dt className="text-t3">Trigger</dt><dd className="capitalize">{data.run.trigger}</dd>
              <dt className="text-t3">Branch</dt><dd>{data.run.branch ?? "main"}</dd>
              <dt className="text-t3">Started</dt><dd>{new Date(data.run.started_at).toLocaleString()}</dd>
              <dt className="text-t3">Finished</dt><dd>{data.run.finished_at ? new Date(data.run.finished_at).toLocaleString() : "—"}</dd>
              <dt className="text-t3">Commit</dt><dd className="font-mono text-[12px]">{(data.run as any).commit_sha?.slice(0, 12) ?? "—"}</dd>
              <dt className="text-t3">Total duration</dt><dd>{(totalMs / 1000).toFixed(1)}s</dd>
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <div className="card-surface">
            <div className="text-section mb-3">Pipeline</div>
            <div className="space-y-1.5">
              {data.gates.map(g => (
                <div key={g.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-canvas">
                  <GateIcon s={g.status} />
                  <div className="text-[11px] uppercase tracking-wider text-t3 w-20">{g.phase}</div>
                  <div className="flex-1 text-[13.5px]">{g.name}</div>
                  <div className="text-[12px] text-t3 tabular-nums">{g.duration_ms ? `${(g.duration_ms / 1000).toFixed(1)}s` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="findings" className="mt-4">
          <div className="card-surface">
            {data.findings.length === 0 ? (
              <div className="text-subtitle">No findings yet.</div>
            ) : (
              <div className="space-y-2">
                {data.findings.map((f: any) => (
                  <Link key={f.id} to="/findings" className="flex items-center gap-3 p-2.5 rounded border border-border hover:bg-canvas">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${SEV_COLOR[f.severity] ?? ""}`}>{f.severity}</span>
                    <div className="flex-1 min-w-0"><div className="text-[13.5px] font-medium truncate">{f.title}</div><div className="text-[12px] text-t3">{f.location}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <div className="card-surface">
            {data.evidence.length === 0 ? (
              <div className="text-subtitle">No evidence captured.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {data.evidence.map((e: any) => (
                  <div key={e.id} className="border border-border rounded-lg p-3 hover:bg-canvas">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Camera className="w-3.5 h-3.5 text-t3" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">{e.kind}</span>
                    </div>
                    <div className="text-[13px] font-medium truncate">{e.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="card-surface">
            {data.alerts.length === 0 ? (
              <div className="text-subtitle">No alerts for this run.</div>
            ) : (
              <div className="space-y-2">
                {data.alerts.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 p-2.5 rounded border border-border">
                    <Bell className="w-4 h-4 text-t3 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium">{a.title}</div>
                      {a.body && <div className="text-[12px] text-t2">{a.body}</div>}
                    </div>
                    <span className="text-[11px] text-t3">{new Date(a.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <div className="card-surface">
            <div className="text-section mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-t3" />Pipeline logs</div>
            <pre className="bg-canvas border border-border rounded-lg p-3 text-[12px] font-mono text-t2 overflow-x-auto">
{data.gates.map(g => `[${g.phase.padEnd(12)}] ${g.status.padEnd(8)} ${g.name}${g.duration_ms ? ` (${(g.duration_ms/1000).toFixed(1)}s)` : ""}`).join("\n")}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="card-surface">
            <div className="text-section mb-3">Run settings</div>
            <div className="text-subtitle">Run configuration is inherited from the target. Edit the target to change gates, suites, and personas applied to future runs.</div>
            <Link to="/targets" className="text-[13px] text-primary hover:underline mt-3 inline-block">Manage targets →</Link>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
