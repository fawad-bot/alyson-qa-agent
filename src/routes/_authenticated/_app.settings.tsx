import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["settings"], queryFn: () => getSettings() });

export const Route = createFileRoute("/_authenticated/_app/settings")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Settings,
});

function Settings() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const update = useServerFn(updateSettings);
  const [form, setForm] = useState(data);
  useEffect(() => setForm(data), [data]);

  const mut = useMutation({
    mutationFn: () => update({
      data: {
        workspace_name: form.workspace_name,
        default_mode: form.default_mode as any,
        default_gate: form.default_gate as any,
        evidence_retention_days: form.evidence_retention_days,
        ai_starts_runs: form.ai_starts_runs,
        ai_auto_fix: form.ai_auto_fix,
      },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Settings saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Settings"
        subtitle="Workspace defaults for runs, evidence, reporting, and the AI assistant." />

      <div className="space-y-4 max-w-2xl">
        <div className="card-surface space-y-4">
          <div className="text-section">Workspace</div>
          <div><Label>Workspace name</Label><Input value={form.workspace_name} onChange={e => setForm({ ...form, workspace_name: e.target.value })} /></div>
        </div>

        <div className="card-surface space-y-4">
          <div className="text-section">Defaults</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Default run mode</Label>
              <Select value={form.default_mode} onValueChange={(v) => setForm({ ...form, default_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="smoke">Smoke</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                  <SelectItem value="full_e2e">Full E2E</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default quality gate</Label>
              <Select value={form.default_gate} onValueChange={(v) => setForm({ ...form, default_gate: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lenient">Lenient</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Evidence retention (days)</Label>
            <Input type="number" min={1} max={365} value={form.evidence_retention_days}
              onChange={e => setForm({ ...form, evidence_retention_days: Number(e.target.value) })} />
          </div>
        </div>

        <div className="card-surface space-y-3">
          <div className="text-section">AI assistant</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Allow AI to start runs</div>
              <div className="text-xs text-t3">The chat assistant can kick off QA runs on your behalf.</div>
            </div>
            <Switch checked={form.ai_starts_runs} onCheckedChange={(v) => setForm({ ...form, ai_starts_runs: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Allow AI to draft auto-fixes</div>
              <div className="text-xs text-t3">Patches are still gated on your approval before merge.</div>
            </div>
            <Switch checked={form.ai_auto_fix} onCheckedChange={(v) => setForm({ ...form, ai_auto_fix: v })} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Save changes</Button>
        </div>
      </div>
    </>
  );
}
