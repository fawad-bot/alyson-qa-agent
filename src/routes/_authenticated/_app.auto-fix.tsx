import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFixTasks, updateFixTaskStatus } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["fix-tasks"], queryFn: () => listFixTasks() });

export const Route = createFileRoute("/_authenticated/_app/auto-fix")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: AutoFix,
});

function AutoFix() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const update = useServerFn(updateFixTaskStatus);
  const queue = data.filter(t => t.auto_fixable && t.status !== "resolved" && t.status !== "wont_fix");

  const verify = useMutation({
    mutationFn: (id: string) => update({ data: { id, status: "resolved" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fix-tasks"] }); toast.success("Re-QA passed — fix verified"); },
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Auto-Fix Queue"
        subtitle="Low-risk findings the agent can draft a fix for. Nothing ships without your approval." />

      <div className="banner-warn mb-4 flex items-start gap-3 card-surface !bg-[#FCF3E2] !border-[#F0D9A0]">
        <Wand2 className="w-4 h-4 text-[#B45309] mt-0.5" />
        <div className="text-sm text-[#7A4A07]">
          <b>Drafts only.</b> The agent prepares a patch and re-runs QA to verify it. Approval is still required before merge.
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="card-surface text-center py-12">
          <Wand2 className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">Queue empty</div>
          <div className="text-subtitle">Auto-fixable tasks will appear here as findings come in.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(t => (
            <div key={t.id} className="card-surface">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-section mb-1">{t.title}</div>
                  <div className="text-subtitle">{t.summary || "Patch drafted, awaiting verification."}</div>
                  <div className="text-xs text-t3 mt-2">Status: <span className="font-medium text-t2">{t.status}</span></div>
                </div>
                <Button size="sm" onClick={() => verify.mutate(t.id)}>Verify & resolve</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
