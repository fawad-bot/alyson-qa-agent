import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRuns, createRun } from "@/lib/qa/runs.functions";
import { listTargets } from "@/lib/qa/targets.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Play } from "lucide-react";
import { toast } from "sonner";

const runsOpts = () => queryOptions({ queryKey: ["runs"], queryFn: () => listRuns(), refetchInterval: 2000 });
const tgtsOpts = () => queryOptions({ queryKey: ["targets"], queryFn: () => listTargets() });

export const Route = createFileRoute("/_authenticated/_app/runs")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(runsOpts());
    context.queryClient.ensureQueryData(tgtsOpts());
  },
  component: Runs,
});

const STATUS_COLOR: Record<string, string> = {
  passed: "bg-ok-bg text-ok",
  failed: "bg-dng-bg text-dng",
  running: "bg-info-bg text-info",
  pending: "bg-canvas text-t2",
  cancelled: "bg-canvas text-t3",
};

function Runs() {
  const { data: runs } = useSuspenseQuery(runsOpts());
  const { data: targets } = useSuspenseQuery(tgtsOpts());
  const qc = useQueryClient();
  const create = useServerFn(createRun);
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [branch, setBranch] = useState("main");

  const createMut = useMutation({
    mutationFn: () => create({ data: { project_id: projectId, branch, trigger: "manual" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["runs"] }); setOpen(false); toast.success("Run started"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Runs" subtitle="Every QA execution, manual or scheduled."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={targets.length === 0}><Play className="w-3.5 h-3.5 mr-1.5" />New run</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New QA run</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Target</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue placeholder="Pick a target" /></SelectTrigger>
                    <SelectContent>{targets.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Branch</Label><Input value={branch} onChange={e => setBranch(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={!projectId || createMut.isPending} onClick={() => createMut.mutate()}>Start</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      {targets.length === 0 && (
        <div className="card-surface mb-4 text-subtitle">Add a target first to start running QA. <Link to="/targets" className="text-primary">Go to targets →</Link></div>
      )}
      {runs.length === 0 ? (
        <div className="card-surface text-center py-12"><div className="text-section mb-1">No runs yet</div><div className="text-subtitle">Trigger a run to populate this view.</div></div>
      ) : (
        <div className="card-surface p-0 overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-canvas text-t3 text-[11px] uppercase tracking-wider">
              <tr><th className="text-left px-4 py-2.5">Target</th><th className="text-left px-4 py-2.5">Branch</th><th className="text-left px-4 py-2.5">Trigger</th><th className="text-left px-4 py-2.5">Status</th><th className="text-left px-4 py-2.5">Started</th></tr>
            </thead>
            <tbody>
              {runs.map((r: any) => (
                <tr key={r.id} className="border-t border-border hover:bg-canvas/60 cursor-pointer" onClick={() => location.assign(`/runs/${r.id}`)}>
                  <td className="px-4 py-3 font-medium">{r.projects?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-t2">{r.branch ?? "—"}</td>
                  <td className="px-4 py-3 text-t2">{r.trigger}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${STATUS_COLOR[r.status] ?? ""}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-t3">{new Date(r.started_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
