import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAlerts, markAlertRead, markAllAlertsRead } from "@/lib/qa/phase3.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, AlertTriangle, AlertOctagon, Info } from "lucide-react";

const opts = () => queryOptions({ queryKey: ["alerts"], queryFn: () => listAlerts() });

const SEV: Record<string, { icon: any; bg: string; fg: string }> = {
  info: { icon: Info, bg: "bg-[#EAF1FE]", fg: "text-[#2563EB]" },
  warn: { icon: AlertTriangle, bg: "bg-[#FCF3E2]", fg: "text-[#B45309]" },
  danger: { icon: AlertOctagon, bg: "bg-[#FBEAE8]", fg: "text-[#DC2626]" },
};

export const Route = createFileRoute("/_authenticated/_app/alerts")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Alerts,
});

function Alerts() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const markOne = useServerFn(markAlertRead);
  const markAll = useServerFn(markAllAlertsRead);

  const markOneMut = useMutation({
    mutationFn: (id: string) => markOne({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const markAllMut = useMutation({
    mutationFn: () => markAll({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const unread = data.filter(a => !a.read_at).length;

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Alerts" subtitle="Where QA Agent pings you when things break."
        actions={unread > 0 ? <Button size="sm" variant="ghost" onClick={() => markAllMut.mutate()}><CheckCheck className="w-3.5 h-3.5 mr-1.5" />Mark all read</Button> : undefined} />

      {data.length === 0 ? (
        <div className="card-surface text-center py-12">
          <Bell className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">All quiet</div>
          <div className="text-subtitle">Alerts will land here when a run fails or a quality gate breaks.</div>
        </div>
      ) : (
        <div className="card-surface p-0 divide-y divide-border">
          {data.map(a => {
            const cfg = SEV[a.severity] ?? SEV.info;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${!a.read_at ? "bg-primary-weak/30" : ""}`}>
                <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.fg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-medium">{a.title}</div>
                    {!a.read_at && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  {a.body && <div className="text-[12.5px] text-t2 mt-0.5">{a.body}</div>}
                  <div className="text-[11px] text-t3 mt-1">{new Date(a.created_at).toLocaleString()} · {a.channel}</div>
                </div>
                {!a.read_at && (
                  <button onClick={() => markOneMut.mutate(a.id)} className="text-[11px] text-primary hover:underline shrink-0">Mark read</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
