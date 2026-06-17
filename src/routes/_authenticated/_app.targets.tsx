import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTargets, createTarget, deleteTarget } from "@/lib/qa/targets.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["targets"], queryFn: () => listTargets() });

export const Route = createFileRoute("/_authenticated/_app/targets")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Targets,
});

function Targets() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const create = useServerFn(createTarget);
  const del = useServerFn(deleteTarget);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", repo_url: "", default_branch: "main" });

  const createMut = useMutation({
    mutationFn: (d: typeof form) => create({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); setOpen(false); setForm({ name: "", repo_url: "", default_branch: "main" }); toast.success("Target added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); toast.success("Removed"); },
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Targets" subtitle="Apps and surfaces under continuous QA."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />Add target</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New target</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Marketing site" /></div>
                <div><Label>Repository URL (optional)</Label><Input value={form.repo_url} onChange={e => setForm({ ...form, repo_url: e.target.value })} placeholder="https://github.com/org/repo" /></div>
                <div><Label>Default branch</Label><Input value={form.default_branch} onChange={e => setForm({ ...form, default_branch: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMut.mutate(form)} disabled={!form.name || createMut.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      {data.length === 0 ? (
        <div className="card-surface text-center py-12">
          <div className="text-section mb-1">No targets yet</div>
          <div className="text-subtitle mb-4">Add a target so QA Agent can start running checks against it.</div>
        </div>
      ) : (
        <div className="card-surface p-0 overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-canvas text-t3 text-[11px] uppercase tracking-wider">
              <tr><th className="text-left px-4 py-2.5">Name</th><th className="text-left px-4 py-2.5">Repository</th><th className="text-left px-4 py-2.5">Branch</th><th className="text-left px-4 py-2.5">Created</th><th></th></tr>
            </thead>
            <tbody>
              {data.map(t => (
                <tr key={t.id} className="border-t border-border hover:bg-canvas/60">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-t2">{t.repo_url ? <a href={t.repo_url} target="_blank" className="text-primary inline-flex items-center gap-1">repo<ExternalLink className="w-3 h-3" /></a> : "—"}</td>
                  <td className="px-4 py-3 text-t2">{t.default_branch}</td>
                  <td className="px-4 py-3 text-t3">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => delMut.mutate(t.id)} className="text-t3 hover:text-dng"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
