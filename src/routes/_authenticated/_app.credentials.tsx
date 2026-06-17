import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listCredentials, createCredential, deleteCredential, listPersonas } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

const credOpts = () => queryOptions({ queryKey: ["credentials"], queryFn: () => listCredentials() });
const persOpts = () => queryOptions({ queryKey: ["personas"], queryFn: () => listPersonas() });

export const Route = createFileRoute("/_authenticated/_app/credentials")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(credOpts());
    context.queryClient.ensureQueryData(persOpts());
  },
  component: Credentials,
});

function Credentials() {
  const { data } = useSuspenseQuery(credOpts());
  const { data: personas } = useSuspenseQuery(persOpts());
  const qc = useQueryClient();
  const create = useServerFn(createCredential);
  const del = useServerFn(deleteCredential);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", kind: "password" as const, vault_ref: "", persona_id: "", expires_at: "" });

  const createMut = useMutation({
    mutationFn: () => create({
      data: {
        name: form.name,
        kind: form.kind,
        vault_ref: form.vault_ref,
        persona_id: form.persona_id || null,
        expires_at: form.expires_at || null,
      },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["credentials"] }); setOpen(false); setForm({ name: "", kind: "password", vault_ref: "", persona_id: "", expires_at: "" }); toast.success("Reference added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credentials"] }),
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Credentials"
        subtitle="References the agent uses to authenticate as each persona during a run."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />Add reference</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add credential reference</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Admin staging login" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.kind} onValueChange={(v: any) => setForm({ ...form, kind: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="password">Password</SelectItem>
                        <SelectItem value="oauth">OAuth</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="session">Session token</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Persona</Label>
                    <Select value={form.persona_id} onValueChange={(v) => setForm({ ...form, persona_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>
                        {personas.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Vault reference</Label><Input value={form.vault_ref} onChange={e => setForm({ ...form, vault_ref: e.target.value })} placeholder="vault://staging/admin-login" /></div>
                <div><Label>Expires (optional)</Label><Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMut.mutate()} disabled={!form.name || !form.vault_ref || createMut.isPending}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      <div className="card-surface !bg-[#FCF3E2] !border-[#F0D9A0] mb-4 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-[#B45309] mt-0.5" />
        <div className="text-sm text-[#7A4A07]">
          <b>Credentials live in a secure vault.</b> The agent only receives temporary references; raw secrets never reach the browser.
        </div>
      </div>

      {data.length === 0 ? (
        <div className="card-surface text-center py-12">
          <KeyRound className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">No references yet</div>
          <div className="text-subtitle">Point the agent at a vault entry so it can sign in as each persona.</div>
        </div>
      ) : (
        <div className="card-surface !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F7F9] text-t3 text-[11px] uppercase tracking-wide">
              <tr><th className="text-left px-4 py-2.5">Name</th><th className="text-left px-4 py-2.5">Type</th><th className="text-left px-4 py-2.5">Persona</th><th className="text-left px-4 py-2.5">Vault ref</th><th className="text-left px-4 py-2.5">Expires</th><th className="px-4 py-2.5"></th></tr>
            </thead>
            <tbody>
              {data.map((c: any) => {
                const expSoon = c.expires_at && new Date(c.expires_at).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 14;
                return (
                  <tr key={c.id} className="border-t border-[#E8EBF0]">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-t2 uppercase text-[11px]">{c.kind}</td>
                    <td className="px-4 py-3 text-t2">{c.personas?.name || <span className="text-t3">—</span>}</td>
                    <td className="px-4 py-3"><code className="text-xs bg-[#F6F7F9] px-2 py-0.5 rounded">{c.vault_ref}</code></td>
                    <td className="px-4 py-3"><span className={expSoon ? "text-[#B45309] font-medium" : "text-t2"}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => delMut.mutate(c.id)} className="text-t3 hover:text-dng"><Trash2 className="w-4 h-4" /></button></td>
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
