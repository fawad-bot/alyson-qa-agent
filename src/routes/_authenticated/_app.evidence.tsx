import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listEvidence } from "@/lib/qa/phase3.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Camera, FileText, Activity, Film, Globe, Layers } from "lucide-react";

const opts = () => queryOptions({ queryKey: ["evidence"], queryFn: () => listEvidence() });

const KIND_ICON: Record<string, any> = {
  screenshot: Camera, log: FileText, trace: Activity, video: Film, har: Globe, dom: Layers,
};

export const Route = createFileRoute("/_authenticated/_app/evidence")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Evidence,
});

function Evidence() {
  const { data } = useSuspenseQuery(opts());
  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Evidence" subtitle="Screenshots, traces, and logs from each run." />
      {data.length === 0 ? (
        <div className="card-surface text-center py-12">
          <Camera className="w-8 h-8 mx-auto text-t3 mb-2" />
          <div className="text-section mb-1">No evidence yet</div>
          <div className="text-subtitle">Evidence is captured automatically when runs detect findings.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((e: any) => {
            const Icon = KIND_ICON[e.kind] ?? FileText;
            return (
              <div key={e.id} className="card-surface">
                <div className="aspect-video bg-canvas rounded-lg flex items-center justify-center mb-3 border border-border">
                  <Icon className="w-10 h-10 text-t3" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary-weak px-1.5 py-0.5 rounded">{e.kind}</span>
                  <span className="text-[11px] text-t3">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                <div className="text-[14px] font-medium leading-tight mb-1">{e.title}</div>
                <div className="text-[12px] text-t2">
                  {e.qa_runs?.projects?.name ?? "—"} · {e.qa_runs?.branch ?? "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
