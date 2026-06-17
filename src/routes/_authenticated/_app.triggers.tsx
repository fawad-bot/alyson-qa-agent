import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTriggers, toggleTrigger } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Switch } from "@/components/ui/switch";
import { Zap, GitPullRequest, Eye, Rocket, Moon } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["qa-triggers"], queryFn: () => listTriggers() });

export const Route = createFileRoute("/_authenticated/_app/triggers")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Triggers,
});

const ICONS: Record<string, any> = {
  pull_request: GitPullRequest,
  preview: Eye,
  publish: Rocket,
  nightly: Moon,
};
const DESCRIPTIONS: Record<string, string> = {
  pull_request: "Run a smoke suite on every PR against main.",
  preview: "Full E2E on each preview deploy before merge.",
  publish: "Block publish if any quality gate fails.",
  nightly: "Regression suite every night at 02:00 UTC.",
};

function Triggers() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const toggle = useServerFn(toggleTrigger);

  const mut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggle({ data: { id, enabled } }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["qa-triggers"] }); toast.success(v.enabled ? "Trigger enabled" : "Trigger disabled"); },
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Triggers"
        subtitle="When QA runs start. Connect a source to run automatically on pull requests, previews, and before publish." />

      <div className="space-y-3">
        {data.map(t => {
          const Icon = ICONS[t.kind] ?? Zap;
          return (
            <div key={t.id} className="card-surface flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-primary-weak flex items-center justify-center text-primary"><Icon className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="text-section">{t.label}</div>
                <div className="text-subtitle">{DESCRIPTIONS[t.kind] || ""}</div>
              </div>
              <Switch checked={t.enabled} onCheckedChange={(v) => mut.mutate({ id: t.id, enabled: v })} />
            </div>
          );
        })}
      </div>
    </>
  );
}
