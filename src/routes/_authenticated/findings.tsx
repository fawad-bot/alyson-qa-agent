import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { listFindings, updateFindingStatus } from "@/lib/qa.functions";
import { StatusBadge, SeverityBadge, RelativeTime } from "@/components/qa-bits";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/findings")({
  component: FindingsPage,
});

const STATUSES = ["open", "acknowledged", "resolved", "ignored"] as const;
type S = typeof STATUSES[number];

function FindingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<S | "all">("open");
  const fetchFindings = useServerFn(listFindings);
  const updateStatus = useServerFn(updateFindingStatus);

  const findings = useQuery({
    queryKey: ["findings", filter],
    queryFn: () => fetchFindings({ data: filter === "all" ? {} : { status: filter } }),
  });

  const update = useMutation({
    mutationFn: (p: { id: string; status: S }) => updateStatus({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["findings"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Findings">
      <div className="flex gap-2 mb-4">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs capitalize border ${
              filter === s ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        {findings.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : !findings.data?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No findings.</div>
        ) : (
          <ul className="divide-y divide-border">
            {findings.data.map((f) => (
              <li key={f.id} className="p-3 flex items-start gap-3">
                <SeverityBadge severity={f.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {f.projects?.name ?? "—"} · {f.kind} · <RelativeTime iso={f.created_at} />
                  </div>
                  {f.description && <div className="text-sm text-muted-foreground mt-1">{f.description}</div>}
                  {f.location && <div className="text-xs font-mono text-muted-foreground mt-1">{f.location}</div>}
                </div>
                <StatusBadge status={f.status} />
                <div className="flex flex-col gap-1">
                  {f.status === "open" && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => update.mutate({ id: f.id, status: "acknowledged" })}>Ack</Button>
                      <Button size="sm" onClick={() => update.mutate({ id: f.id, status: "resolved" })}>Resolve</Button>
                    </>
                  )}
                  {f.status === "acknowledged" && (
                    <Button size="sm" onClick={() => update.mutate({ id: f.id, status: "resolved" })}>Resolve</Button>
                  )}
                  {(f.status === "resolved" || f.status === "ignored") && (
                    <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: f.id, status: "open" })}>Reopen</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
