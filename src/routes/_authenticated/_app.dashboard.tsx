import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/qa/stats.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const opts = () => queryOptions({ queryKey: ["dashboard-stats"], queryFn: () => getDashboardStats() });

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Dashboard,
  errorComponent: ({ error, reset }) => {
    const r = useRouter();
    return <div className="p-8"><p className="text-dng mb-3">{error.message}</p><Button onClick={() => { r.invalidate(); reset(); }}>Retry</Button></div>;
  },
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function fmt(s: number) { if (!s) return "—"; const m = Math.floor(s/60); return m ? `${m}m ${s%60}s` : `${s}s`; }

function Dashboard() {
  useServerFn(getDashboardStats); // ensure RPC stub
  const { data } = useSuspenseQuery(opts());
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
        actions={<Button size="sm"><Play className="w-3.5 h-3.5 mr-1.5" />New run</Button>}
      />
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
        <div className="text-section mb-1">Recent activity</div>
        <div className="text-subtitle">Connect a target and trigger a run to see live QA activity here.</div>
      </div>
    </>
  );
}
