import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listGates, createGate, toggleGate, deleteGate } from "@/lib/qa/phase3.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["gates"], queryFn: () => listGates() });
const OP_LABEL: Record<string, string> = { lt: "<", lte: "≤", gt: ">", gte: "≥", eq: "=" };

export const Route = createFileRoute("/_authenticated/_app/gates")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Gates,
});

function Gates() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const create = useServerFn(createGate);
  const tog = useServerFn(toggleGate);
  const del = useServerFn(deleteGate);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", metric: "lcp_ms", operator: "lt" as const, threshold: 2500, severity: "high" as const });

  const createMut = useMutation({
    mutationFn: () => create({ data: { ...form, threshold: Number(form.threshold) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gates"] }); setOpen(false); toast.success("Gate added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const togMut = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => tog({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gates"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gates"] }); toast.success("Removed"); },
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Quality Gates" subtitle="Block releases when QA criteria fail."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />New gate</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New quality gate</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="LCP under 2.5s" /></div>
                <div><Label>Metric</Label><Input value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })} placeholder="lcp_ms / a11y_violations / coverage_pct" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Operator</Label>
                    <Select value={form.operator} onValueChange={(v: any) => setForm({ ...form, operator: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(OP_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{k} ({v})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Threshold</Label><Input type="number" value={form.threshold} onChange={e => setForm({ ...form, threshold: Number(e.target.value) })} /></div>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v: any) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["low","medium","high","critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMut.mutate()} disabled={!form.name || !form.metric || createMut.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      {data.length === 0 ? (
        <div className="card-surface text-center py-12">
          <ShieldCheck className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">No quality gates yet</div>
          <div className="text-subtitle">Add a gate to block releases that miss your standards.</div>
        </div>
      ) : (
        <div className="card-surface p-0 overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-canvas text-t3 text-[11px] uppercase tracking-wider">
              <tr><th className="text-left px-4 py-2.5">Gate</th><th className="text-left px-4 py-2.5">Rule</th><th className="text-left px-4 py-2.5">Severity</th><th className="text-left px-4 py-2.5">Enabled</th><th></th></tr>
            </thead>
            <tbody>
              {data.map(g => (
                <tr key={g.id} className="border-t border-border hover:bg-canvas/60">
                  <td className="px-4 py-3 font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-t2 tabular-nums">{g.metric} {OP_LABEL[g.operator]} {g.threshold}</td>
                  <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded font-medium ${g.severity === "critical" || g.severity === "high" ? "bg-[#FBEAE8] text-[#DC2626]" : "bg-[#FCF3E2] text-[#B45309]"}`}>{g.severity}</span></td>
                  <td className="px-4 py-3"><Switch checked={g.enabled} onCheckedChange={(v) => togMut.mutate({ id: g.id, enabled: v })} /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => delMut.mutate(g.id)} className="text-t3 hover:text-dng"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
