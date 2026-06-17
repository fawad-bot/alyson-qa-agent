import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listPersonas, createPersona, deletePersona } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["personas"], queryFn: () => listPersonas() });

export const Route = createFileRoute("/_authenticated/_app/personas")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Personas,
});

function Personas() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const create = useServerFn(createPersona);
  const del = useServerFn(deletePersona);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "viewer", description: "" });

  const createMut = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["personas"] }); setOpen(false); setForm({ name: "", role: "viewer", description: "" }); toast.success("Persona created"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personas"] }),
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Test Personas"
        subtitle="Role profiles the agent uses to exercise authentication, authorization, and tenant boundaries."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />New persona</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New persona</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Builder Bob" /></div>
                <div><Label>Role</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="builder" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
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
          <Users className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">No personas yet</div>
          <div className="text-subtitle">Add Admin, Builder, Viewer, and any external profiles you want exercised.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(p => (
            <div key={p.id} className="card-surface">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-section">{p.name}</div>
                  <div className="text-[11px] px-2 py-0.5 rounded bg-primary-weak text-primary font-medium inline-block mt-1 uppercase">{p.role}</div>
                </div>
                <button onClick={() => delMut.mutate(p.id)} className="text-t3 hover:text-dng"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="text-subtitle">{p.description || "No description"}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
