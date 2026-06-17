import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listFixTasks, createFixTask, updateFixTaskStatus, deleteFixTask } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle2, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["fix-tasks"], queryFn: () => listFixTasks() });

export const Route = createFileRoute("/_authenticated/_app/fix-tasks")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: FixTasks,
});

const PRIORITY_COLOR: Record<string, string> = {
  p0: "bg-[#FBEAE8] text-[#DC2626]",
  p1: "bg-[#FCF3E2] text-[#B45309]",
  p2: "bg-[#EAF1FE] text-[#2563EB]",
  p3: "bg-[#F1F5F9] text-[#475569]",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-[#EAF1FE] text-[#2563EB]",
  in_progress: "bg-[#FCF3E2] text-[#B45309]",
  needs_review: "bg-[#FBEAE8] text-[#DC2626]",
  resolved: "bg-[#E7F6EC] text-[#15803D]",
  wont_fix: "bg-[#F1F5F9] text-[#475569]",
};

function FixTasks() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const create = useServerFn(createFixTask);
  const update = useServerFn(updateFixTaskStatus);
  const del = useServerFn(deleteFixTask);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    title: "", summary: "", priority: "p2" as const,
    auto_fixable: false, requires_human_review: false, assignee: "",
  });

  const createMut = useMutation({
    mutationFn: () => create({ data: { ...form, assignee: form.assignee || undefined } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fix-tasks"] });
      setOpen(false);
      setForm({ title: "", summary: "", priority: "p2", auto_fixable: false, requires_human_review: false, assignee: "" });
      toast.success("Task created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => update({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fix-tasks"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fix-tasks"] }),
  });

  const filtered = data.filter(t => {
    if (filter === "all") return true;
    if (filter === "blockers") return t.priority === "p0";
    if (filter === "auto") return t.auto_fixable;
    if (filter === "review") return t.requires_human_review;
    return t.status === filter;
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Fix Tasks"
        subtitle="Tasks created from QA findings. Auto-fixable items can be drafted by the agent; human-gated issues route to review."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />New task</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New fix task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Tenant isolation broken on /api/orders" /></div>
                <div><Label>Summary</Label><Textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p0">P0 — Blocker</SelectItem>
                        <SelectItem value="p1">P1 — High</SelectItem>
                        <SelectItem value="p2">P2 — Medium</SelectItem>
                        <SelectItem value="p3">P3 — Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assignee</Label><Input value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })} placeholder="@engineer" /></div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.auto_fixable} onCheckedChange={v => setForm({ ...form, auto_fixable: !!v })} />
                    Auto-fixable
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.requires_human_review} onCheckedChange={v => setForm({ ...form, requires_human_review: !!v })} />
                    Needs human review
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMut.mutate()} disabled={!form.title || createMut.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {[
          { k: "all", l: "All" }, { k: "blockers", l: "Blockers" }, { k: "auto", l: "Auto-fixable" },
          { k: "review", l: "Human review" }, { k: "open", l: "Open" }, { k: "resolved", l: "Resolved" },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium border ${filter === f.k ? "bg-primary text-white border-primary" : "bg-white text-t2 border-[#E8EBF0] hover:bg-[#F6F7F9]"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface text-center py-12">
          <ClipboardCheck className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">No tasks yet</div>
          <div className="text-subtitle">Create one manually or generate them from run findings.</div>
        </div>
      ) : (
        <div className="card-surface !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F6F7F9] text-t3 text-[11px] uppercase tracking-wide">
              <tr><th className="text-left px-4 py-2.5">Task</th><th className="text-left px-4 py-2.5">Priority</th><th className="text-left px-4 py-2.5">Status</th><th className="text-left px-4 py-2.5">Assignee</th><th className="px-4 py-2.5"></th></tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-t border-[#E8EBF0]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{t.title}</div>
                    <div className="text-xs text-t3 mt-0.5 flex gap-2">
                      {t.auto_fixable && <span className="text-[#2563EB]">⚡ auto-fix</span>}
                      {t.requires_human_review && <span className="text-[#B45309]">👤 review</span>}
                      {t.summary && <span className="truncate max-w-md">{t.summary}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3">
                    <Select value={t.status} onValueChange={(v) => updateMut.mutate({ id: t.id, status: v })}>
                      <SelectTrigger className={`h-7 text-[11px] w-[130px] ${STATUS_COLOR[t.status]} border-0 font-medium`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="needs_review">Needs review</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="wont_fix">Won't fix</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-t2">{t.assignee || <span className="text-t3">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => delMut.mutate(t.id)} className="text-t3 hover:text-dng"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
