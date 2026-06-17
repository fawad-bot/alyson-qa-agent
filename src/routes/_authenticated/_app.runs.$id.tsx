import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getRun, tickRun } from "@/lib/qa/runs.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { CheckCircle2, XCircle, Loader2, Circle, ChevronLeft } from "lucide-react";

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

  return (
    <>
      <Link to="/runs" className="inline-flex items-center text-[13px] text-t2 hover:text-ink mb-3"><ChevronLeft className="w-3.5 h-3.5" />All runs</Link>
      <PageHeader
        eyebrow={`Run · ${(data.run as any).projects?.name ?? ""}`}
        title={`#${data.run.id.slice(0, 8)} on ${data.run.branch ?? "main"}`}
        subtitle={`${data.run.trigger} · started ${new Date(data.run.started_at).toLocaleString()}`}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card-surface"><div className="text-kpi-label mb-1">Status</div><div className="text-section capitalize">{data.run.status}</div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Gates passed</div><div className="text-kpi-value">{passed}<span className="text-[14px] text-t3">/{data.gates.length}</span></div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Gates failed</div><div className="text-kpi-value">{failed}</div></div>
        <div className="card-surface"><div className="text-kpi-label mb-1">Findings</div><div className="text-kpi-value">{data.findings.length}</div></div>
      </div>

      <div className="card-surface mb-6">
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

      <div className="card-surface">
        <div className="text-section mb-2">Findings ({data.findings.length})</div>
        {data.findings.length === 0 ? (
          <div className="text-subtitle">No findings yet.</div>
        ) : (
          <div className="space-y-2">
            {data.findings.map(f => (
              <Link key={f.id} to="/findings" className="flex items-center gap-3 p-2.5 rounded border border-border hover:bg-canvas">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${SEV_COLOR[f.severity] ?? ""}`}>{f.severity}</span>
                <div className="flex-1 min-w-0"><div className="text-[13.5px] font-medium truncate">{f.title}</div><div className="text-[12px] text-t3">{f.location}</div></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
