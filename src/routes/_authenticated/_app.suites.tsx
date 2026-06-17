import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listSuites, createSuite, deleteSuite } from "@/lib/qa/phase3.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["suites"], queryFn: () => listSuites() });

export const Route = createFileRoute("/_authenticated/_app/suites")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Suites,
});

function Suites() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const create = useServerFn(createSuite);
  const del = useServerFn(deleteSuite);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", tags: "" });

  const createMut = useMutation({
    mutationFn: () => create({ data: { name: form.name, description: form.description, tags: form.tags.split(",").map(s => s.trim()).filter(Boolean) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suites"] }); setOpen(false); setForm({ name: "", description: "", tags: "" }); toast.success("Suite created"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suites"] }); toast.success("Deleted"); },
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Suites" subtitle="Grouped checks reused across targets."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />New suite</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New suite</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Checkout regression" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="checkout, regression" /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMut.mutate()} disabled={!form.name || createMut.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      {data.length === 0 ? (
        <div className="card-surface text-center py-12">
          <Layers className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">No suites yet</div>
          <div className="text-subtitle">Group related checks so they run together across targets.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(s => (
            <div key={s.id} className="card-surface flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="text-section">{s.name}</div>
                <button onClick={() => delMut.mutate(s.id)} className="text-t3 hover:text-dng"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="text-subtitle flex-1">{s.description || "No description"}</div>
              <div className="flex flex-wrap gap-1 mt-3">
                {(s.tags ?? []).map((t: string) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-primary-weak text-primary font-medium">{t}</span>
                ))}
                <span className={`text-[11px] px-2 py-0.5 rounded font-medium ml-auto ${s.enabled ? "bg-[#E7F6EC] text-[#15803D]" : "bg-[#FCF3E2] text-[#B45309]"}`}>{s.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
