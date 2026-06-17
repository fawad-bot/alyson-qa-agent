import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listEvidence } from "@/lib/qa/phase3.functions";
import { captureEvidenceScreenshot } from "@/lib/qa/screenshots.functions";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/qa/AppShell";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Camera, FileText, Activity, Film, Globe, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [selected, setSelected] = useState<any>(null);
  const Icon = selected ? (KIND_ICON[selected.kind] ?? FileText) : FileText;
  const qc = useQueryClient();
  const captureFn = useServerFn(captureEvidenceScreenshot);
  const capture = useMutation({
    mutationFn: (evidenceId: string) => captureFn({ data: { evidenceId } }),
    onSuccess: async (res: any) => {
      if (!res?.ok) {
        toast.error(res?.error ?? "Capture failed");
        return;
      }
      toast.success("Screenshot captured");
      await qc.invalidateQueries({ queryKey: ["evidence"] });
      setSelected((s: any) => (s ? { ...s, url: res.url } : s));
    },
    onError: (e: any) => toast.error(e?.message ?? "Capture failed"),
  });

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
            const CardIcon = KIND_ICON[e.kind] ?? FileText;
            const thumb = e.kind === "screenshot" && e.url ? e.url : null;
            const pending = !e.url;
            return (
              <button key={e.id} data-testid="evidence-card" onClick={() => setSelected(e)} className="card-surface text-left hover:border-primary/40 transition-colors">
                <div className="aspect-video bg-canvas rounded-lg flex flex-col items-center justify-center mb-3 border border-border overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={e.title} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <CardIcon className="w-8 h-8 text-t3 mb-1" />
                      {pending && <span className="text-[10px] uppercase tracking-wider text-t3">Capture pending</span>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary-weak px-1.5 py-0.5 rounded">{e.kind}</span>
                  <span className="text-[11px] text-t3">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                <div className="text-[14px] font-medium leading-tight mb-1">{e.title}</div>
                <div className="text-[12px] text-t2">
                  {e.qa_runs?.projects?.name ?? "—"} · {e.qa_runs?.branch ?? "—"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent data-testid="evidence-drawer" className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle>{selected.title}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="aspect-video bg-canvas rounded-lg flex flex-col items-center justify-center border border-border overflow-hidden">
                  {selected.kind === "screenshot" && selected.url ? (
                    <img src={selected.url} alt={selected.title} className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <Icon className="w-12 h-12 text-t3 mb-2" />
                      <span className="text-[12px] text-t2">No asset captured yet</span>
                      {selected.kind === "screenshot" && (
                        <span className="text-[11px] text-t3 mt-1 px-6 text-center">
                          Capture a real screenshot of the target URL via ScreenshotOne.
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded uppercase bg-primary-weak text-primary">{selected.kind}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-canvas text-t2">{new Date(selected.created_at).toLocaleString()}</span>
                  {selected.kind === "screenshot" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto h-7 text-[12px]"
                      disabled={capture.isPending}
                      onClick={() => capture.mutate(selected.id)}
                    >
                      {capture.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Camera className="w-3 h-3 mr-1" />}
                      {selected.url ? "Re-capture" : "Capture screenshot"}
                    </Button>
                  )}
                </div>
                <div><div className="text-eyebrow mb-1">Run</div><div className="text-[13.5px]">{selected.qa_runs?.projects?.name ?? "—"} · {selected.qa_runs?.branch ?? "—"}</div></div>
                {selected.url && (
                  <div><div className="text-eyebrow mb-1">Asset URL</div><a href={selected.url} target="_blank" rel="noreferrer" className="text-[13px] text-primary hover:underline break-all">{selected.url}</a></div>
                )}
                <div>
                  <div className="text-eyebrow mb-1">Payload</div>
                  <pre className="bg-canvas border border-border rounded-lg p-3 text-[12px] font-mono text-t2 overflow-x-auto">{JSON.stringify(selected.payload ?? {}, null, 2)}</pre>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
