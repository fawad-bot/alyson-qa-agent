import { createFileRoute, useRouter, useNavigate, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getDashboardStats } from "@/lib/qa/stats.functions";
import { listTargets } from "@/lib/qa/targets.functions";
import { createRun } from "@/lib/qa/runs.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Play, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["dashboard-stats"], queryFn: () => getDashboardStats() });
const tOpts = () => queryOptions({ queryKey: ["targets"], queryFn: () => listTargets() });

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(opts());
    context.queryClient.ensureQueryData(tOpts());
  },
  component: Dashboard,
  errorComponent: ({ error, reset }) => {
    const r = useRouter();
    return <div className="p-8"><p className="text-dng mb-3">{error.message}</p><Button onClick={() => { r.invalidate(); reset(); }}>Retry</Button></div>;
  },
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function fmt(s: number) { if (!s) return "—"; const m = Math.floor(s/60); return m ? `${m}m ${s%60}s` : `${s}s`; }

const STATUS_ICON: Record<string, any> = {
  passed: CheckCircle2, failed: XCircle, running: Loader2, pending: Loader2,
};
const STATUS_COLOR: Record<string, string> = {
  passed: "text-[#15803D]", failed: "text-[#DC2626]", running: "text-[#2563EB]", pending: "text-t3",
};

function Dashboard() {
  const { data } = useSuspenseQuery(opts());
  const { data: targets } = useSuspenseQuery(tOpts());
  const qc = useQueryClient();
  const navigate = useNavigate();
  const startRun = useServerFn(createRun);
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [branch, setBranch] = useState("main");

  const runMut = useMutation({
    mutationFn: () => startRun({ data: { project_id: targetId, branch, trigger: "manual" } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["runs"] });
      setOpen(false);
      toast.success("Run started");
      navigate({ to: "/runs/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cards = [
    { label: "Runs (24h)", value: data.runsToday, hint: `${data.totalRuns} all-time` },
    { label: "Pass rate", value: `${data.passRate}%`, hint: "across all runs" },
    { label: "Open P0", value: data.p0, hint: "blocking" },
    { label: "Open P1", value: data.p1, hint: "to triage" },
    { label: "Open findings", value: data.openFindings, hint: "total" },
    { label: "MTTR", value: fmt(data.mttrSeconds), hint: "mean run time" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="QA Agent"
        title="Dashboard"
        subtitle="Runs unit tests, regression sweeps, and exploratory probes across every target you connect."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={targets.length === 0} data-testid="new-run-button">
                <Play className="w-3.5 h-3.5 mr-1.5" />New run
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="new-run-dialog">
              <DialogHeader><DialogTitle>Start a QA run</DialogTitle></DialogHeader>
              <div className="space-y-3" data-testid="new-run-step-target">
                <div>
                  <Label>Target</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger data-testid="new-run-target-select"><SelectValue placeholder="Choose a target" /></SelectTrigger>
                    <SelectContent>
                      {targets.map((t: any) => <SelectItem key={t.id} value={t.id} data-testid={`new-run-target-option-${t.id}`}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div data-testid="new-run-step-branch"><Label>Branch</Label><Input value={branch} onChange={e => setBranch(e.target.value)} data-testid="new-run-branch-input" /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)} data-testid="new-run-cancel">Cancel</Button>
                <Button onClick={() => runMut.mutate()} disabled={!targetId || runMut.isPending} data-testid="new-run-submit">Start run</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {targets.length === 0 && (
        <div className="card-surface !bg-[#FCF3E2] !border-[#F0D9A0] mb-4 flex items-center justify-between">
          <div className="text-sm text-[#7A4A07]">
            <b>No targets yet.</b> Connect an application before starting a run.
          </div>
          <Link to="/targets"><Button size="sm" variant="outline">Add target</Button></Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card-surface">
            <div className="text-kpi-label mb-2">{c.label}</div>
            <div className="text-kpi-value">{c.value}</div>
            <div className="text-[12px] text-t3 mt-1">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 card-surface">
        <div className="flex items-center justify-between mb-3">
          <div className="text-section">Recent activity</div>
          <Link to="/runs" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {data.recent.length === 0 ? (
          <div className="text-subtitle">Connect a target and trigger a run to see live QA activity here.</div>
        ) : (
          <div className="space-y-2">
            {data.recent.map((r: any) => {
              const Icon = STATUS_ICON[r.status] ?? Loader2;
              const spinning = r.status === "running" || r.status === "pending";
              return (
                <Link key={r.id} to="/runs/$id" params={{ id: r.id }}
                  className="flex items-center gap-3 p-2.5 rounded-md hover:bg-canvas border border-transparent hover:border-border">
                  <Icon className={`w-4 h-4 ${STATUS_COLOR[r.status]} ${spinning ? "animate-spin" : ""}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.projects?.name ?? "Unknown target"}</div>
                    <div className="text-xs text-t3">{r.branch} · {new Date(r.started_at).toLocaleString()}</div>
                  </div>
                  <span className="text-[11px] uppercase font-bold text-t3">{r.status}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
