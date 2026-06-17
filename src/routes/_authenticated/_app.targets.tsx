import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTargets, createTarget, deleteTarget, updateTargetUrl } from "@/lib/qa/targets.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink, Check, Pencil, X } from "lucide-react";
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
  const updUrl = useServerFn(updateTargetUrl);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", repo_url: "", target_url: "", default_branch: "main" });
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);

  const createMut = useMutation({
    mutationFn: (d: typeof form) => create({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); setOpen(false); setForm({ name: "", repo_url: "", target_url: "", default_branch: "main" }); toast.success("Target added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); toast.success("Removed"); },
  });
  const urlMut = useMutation({
    mutationFn: (d: { id: string; target_url: string }) => updUrl({ data: d }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["targets"] }); setEditing(null); toast.success("Landing page URL updated"); },
    onError: (e: Error) => toast.error(e.message),
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
                <div><Label>Landing page URL</Label><Input value={form.target_url} onChange={e => setForm({ ...form, target_url: e.target.value })} placeholder="https://your-site.com" /></div>
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
              <tr>
                <th className="text-left px-4 py-2.5">Name</th>
                <th className="text-left px-4 py-2.5">Landing page</th>
                <th className="text-left px-4 py-2.5">Repository</th>
                <th className="text-left px-4 py-2.5">Branch</th>
                <th className="text-left px-4 py-2.5">Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((t: any) => {
                const isEditing = editing?.id === t.id;
                return (
                  <tr key={t.id} className="border-t border-border hover:bg-canvas/60">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-t2">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            autoFocus
                            value={editing!.value}
                            onChange={e => setEditing({ id: t.id, value: e.target.value })}
                            placeholder="https://your-site.com"
                            className="h-7 text-[13px]"
                          />
                          <button className="text-ok hover:opacity-80" onClick={() => urlMut.mutate({ id: t.id, target_url: editing!.value })}><Check className="w-4 h-4" /></button>
                          <button className="text-t3 hover:text-ink" onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
                        </div>
                      ) : t.target_url ? (
                        <div className="flex items-center gap-2">
                          <a href={t.target_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 max-w-[280px] truncate">{t.target_url}<ExternalLink className="w-3 h-3 shrink-0" /></a>
                          <button className="text-t3 hover:text-ink" onClick={() => setEditing({ id: t.id, value: t.target_url })}><Pencil className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button className="text-t3 hover:text-primary inline-flex items-center gap-1" onClick={() => setEditing({ id: t.id, value: "" })}><Pencil className="w-3.5 h-3.5" />Set URL</button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-t2">{t.repo_url ? <a href={t.repo_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1">repo<ExternalLink className="w-3 h-3" /></a> : "—"}</td>
                    <td className="px-4 py-3 text-t2">{t.default_branch}</td>
                    <td className="px-4 py-3 text-t3">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => delMut.mutate(t.id)} className="text-t3 hover:text-dng"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
