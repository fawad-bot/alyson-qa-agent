import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listFixTasks, updateFixTaskStatus } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["fix-tasks"], queryFn: () => listFixTasks() });

export const Route = createFileRoute("/_authenticated/_app/human-review")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: HumanReview,
});

function HumanReview() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const update = useServerFn(updateFixTaskStatus);
  const reviewItems = data.filter(t => t.requires_human_review && t.status !== "resolved" && t.status !== "wont_fix");

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => update({ data: { id, status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fix-tasks"] }); toast.success("Decision recorded"); },
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Human Review"
        subtitle="Findings that require a human decision. Security, authorization, and legal-sensitive issues are never auto-closed." />

      {reviewItems.length === 0 ? (
        <div className="card-surface text-center py-12">
          <UserCheck className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">Nothing waiting on you</div>
          <div className="text-subtitle">When a finding needs a human call, it lands here.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {reviewItems.map(t => (
            <div key={t.id} className="card-surface">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${t.priority === "p0" ? "bg-[#FBEAE8] text-[#DC2626]" : "bg-[#FCF3E2] text-[#B45309]"}`}>{t.priority}</span>
                    <div className="text-section">{t.title}</div>
                  </div>
                  <div className="text-subtitle">{t.summary || "No additional context."}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: t.id, status: "wont_fix" })}>Accept risk</Button>
                  <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: t.id, status: "in_progress" })}>Send to fix</Button>
                  <Button size="sm" onClick={() => decide.mutate({ id: t.id, status: "resolved" })}>Resolve</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
