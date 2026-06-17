import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listFindings, updateFindingStatus, createFixTaskFromFinding } from "@/lib/qa/findings.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["findings"], queryFn: () => listFindings() });

export const Route = createFileRoute("/_authenticated/_app/findings")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Findings,
});

const SEV_COLOR: Record<string, string> = {
  critical: "bg-dng-bg text-dng",
  high: "bg-warn-bg text-warn",
  medium: "bg-info-bg text-info",
  low: "bg-canvas text-t2",
  info: "bg-canvas text-t3",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-dng-bg text-dng",
  acknowledged: "bg-warn-bg text-warn",
  resolved: "bg-ok-bg text-ok",
  ignored: "bg-canvas text-t3",
};

function Findings() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const navigate = useNavigate();
  const upd = useServerFn(updateFindingStatus);
  const mkTask = useServerFn(createFixTaskFromFinding);
  const [selected, setSelected] = useState<any>(null);

  const updMut = useMutation({
    mutationFn: (v: { id: string; status: any }) => upd({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["findings"] }); toast.success("Updated"); },
  });
  const taskMut = useMutation({
    mutationFn: (finding_id: string) => mkTask({ data: { finding_id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["findings"] });
      qc.invalidateQueries({ queryKey: ["fix-tasks"] });
      toast.success(r.existed ? "Fix task already exists" : "Fix task created");
      setSelected(null);
      navigate({ to: "/fix-tasks" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Findings" subtitle="Issues raised by the agent, clustered and owned." />
      {data.length === 0 ? (
        <div className="card-surface text-center py-12"><div className="text-section mb-1">All clear</div><div className="text-subtitle">No findings to triage right now.</div></div>
      ) : (
        <div className="card-surface p-0 overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-canvas text-t3 text-[11px] uppercase tracking-wider">
              <tr><th className="text-left px-4 py-2.5">Severity</th><th className="text-left px-4 py-2.5">Title</th><th className="text-left px-4 py-2.5">Target</th><th className="text-left px-4 py-2.5">Location</th><th className="text-left px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody>
              {data.map((f: any) => (
                <tr key={f.id} className="border-t border-border hover:bg-canvas/60 cursor-pointer" onClick={() => setSelected(f)}>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${SEV_COLOR[f.severity]}`}>{f.severity}</span></td>
                  <td className="px-4 py-3 font-medium">{f.title}</td>
                  <td className="px-4 py-3 text-t2">{f.projects?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-t2">{f.location ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${STATUS_COLOR[f.status]}`}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[480px] sm:max-w-[480px]">
          {selected && (
            <>
              <SheetHeader><SheetTitle>{selected.title}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${SEV_COLOR[selected.severity]}`}>{selected.severity}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded uppercase bg-canvas text-t2">{selected.kind}</span>
                </div>
                <div><div className="text-eyebrow mb-1">Location</div><div className="text-[13.5px]">{selected.location ?? "—"}</div></div>
                <div><div className="text-eyebrow mb-1">What happened</div><div className="text-[13.5px] leading-relaxed text-t2">{selected.description ?? "—"}</div></div>
                <div className="card-surface bg-ok-bg/40 border-ok/20">
                  <div className="text-eyebrow mb-1" style={{ color: "var(--ok)" }}>Suggested fix</div>
                  <div className="text-[13px] text-t2">Open a fix task to route this to engineering. Severity-based priority and human-review flags are set automatically.</div>
                </div>
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button size="sm" onClick={() => taskMut.mutate(selected.id)} disabled={taskMut.isPending}>
                    <Wrench className="w-3.5 h-3.5 mr-1.5" />Create fix task
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updMut.mutate({ id: selected.id, status: "acknowledged" })}>Acknowledge</Button>
                  <Button size="sm" variant="outline" onClick={() => updMut.mutate({ id: selected.id, status: "resolved" })}>Resolve</Button>
                  <Button size="sm" variant="ghost" onClick={() => updMut.mutate({ id: selected.id, status: "ignored" })}>Ignore</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
