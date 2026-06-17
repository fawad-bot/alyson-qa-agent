import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getReports } from "@/lib/qa/phase3.functions";
import { PageHeader } from "@/components/qa/AppShell";

const opts = () => queryOptions({ queryKey: ["reports"], queryFn: () => getReports() });

export const Route = createFileRoute("/_authenticated/_app/reports")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Reports,
});

function Reports() {
  const { data } = useSuspenseQuery(opts());
  const maxDay = Math.max(1, ...data.timeline.map(d => d.passed + d.failed));
  const sevTotal = Math.max(1, data.severities.critical + data.severities.high + data.severities.medium + data.severities.low);

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Reports" subtitle="Trends, pass rates, and release readiness." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Kpi label="Total runs" value={data.total} />
        <Kpi label="Pass rate" value={`${data.passRate}%`} tone={data.passRate >= 90 ? "ok" : data.passRate >= 70 ? "warn" : "dng"} />
        <Kpi label="Open findings" value={data.openFindings} tone={data.openFindings > 0 ? "warn" : "ok"} />
        <Kpi label="Resolved" value={data.resolvedFindings} tone="ok" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-surface lg:col-span-2">
          <div className="text-section mb-3">Runs — last 14 days</div>
          <div className="flex items-end gap-1.5 h-40">
            {data.timeline.map(d => {
              const total = d.passed + d.failed;
              const h = (total / maxDay) * 100;
              const passH = total ? (d.passed / total) * h : 0;
              const failH = total ? (d.failed / total) * h : 0;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex flex-col-reverse" style={{ height: "140px" }}>
                    <div style={{ height: `${passH}%` }} className="bg-[#15803D] rounded-b" title={`${d.passed} passed`} />
                    <div style={{ height: `${failH}%` }} className="bg-[#DC2626] rounded-t" title={`${d.failed} failed`} />
                  </div>
                  <div className="text-[10px] text-t3 tabular-nums">{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-[12px] text-t2">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#15803D]" /> Passed</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#DC2626]" /> Failed</div>
          </div>
        </div>

        <div className="card-surface">
          <div className="text-section mb-3">Findings by severity</div>
          <div className="space-y-3">
            {[
              { label: "Critical", val: data.severities.critical, color: "#DC2626" },
              { label: "High", val: data.severities.high, color: "#B45309" },
              { label: "Medium", val: data.severities.medium, color: "#2563EB" },
              { label: "Low", val: data.severities.low, color: "#94A3B8" },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-[12px] mb-1"><span className="text-t2">{s.label}</span><span className="tabular-nums font-medium">{s.val}</span></div>
                <div className="h-2 bg-canvas rounded-full overflow-hidden">
                  <div style={{ width: `${(s.val / sevTotal) * 100}%`, backgroundColor: s.color }} className="h-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface lg:col-span-3">
          <div className="text-section mb-3">By target</div>
          {data.byProject.length === 0 ? (
            <div className="text-subtitle">Run something to see breakdown by target.</div>
          ) : (
            <table className="w-full text-[13.5px]">
              <thead className="text-t3 text-[11px] uppercase tracking-wider">
                <tr><th className="text-left py-2">Target</th><th className="text-right py-2">Passed</th><th className="text-right py-2">Failed</th><th className="text-right py-2">Pass rate</th></tr>
              </thead>
              <tbody>
                {data.byProject.map(p => {
                  const t = p.passed + p.failed;
                  const rate = t ? Math.round((p.passed / t) * 100) : 0;
                  return (
                    <tr key={p.name} className="border-t border-border">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-right tabular-nums text-[#15803D]">{p.passed}</td>
                      <td className="py-3 text-right tabular-nums text-[#DC2626]">{p.failed}</td>
                      <td className="py-3 text-right tabular-nums font-medium">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" | "dng" }) {
  const color = tone === "ok" ? "text-[#15803D]" : tone === "warn" ? "text-[#B45309]" : tone === "dng" ? "text-[#DC2626]" : "text-ink";
  return (
    <div className="card-surface">
      <div className="text-[11px] uppercase tracking-wider text-t3 font-semibold mb-1">{label}</div>
      <div className={`text-[30px] font-bold leading-none tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
