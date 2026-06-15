import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { listRuns, listProjects, listFindings } from "@/lib/qa.functions";
import { StatusBadge, RelativeTime } from "@/components/qa-bits";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const fetchRuns = useServerFn(listRuns);
  const fetchProjects = useServerFn(listProjects);
  const fetchFindings = useServerFn(listFindings);
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => fetchRuns({ data: {} }) });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });
  const findings = useQuery({
    queryKey: ["findings", "open"],
    queryFn: () => fetchFindings({ data: { status: "open" } }),
  });

  const stats = [
    { label: "Projects", value: projects.data?.length ?? 0 },
    { label: "Runs (recent)", value: runs.data?.length ?? 0 },
    { label: "Open findings", value: findings.data?.length ?? 0 },
    {
      label: "Pass rate",
      value: (() => {
        const r = runs.data ?? [];
        const done = r.filter((x) => x.status === "passed" || x.status === "failed");
        if (!done.length) return "—";
        return `${Math.round((done.filter((x) => x.status === "passed").length / done.length) * 100)}%`;
      })(),
    },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent runs</h2>
          <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground">New run →</Link>
        </div>
        {runs.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : !runs.data?.length ? (
          <div className="p-6 text-sm text-muted-foreground">
            No runs yet. <Link to="/projects" className="underline">Create a project</Link> to kick one off.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left font-medium px-4 py-2">Project</th>
                <th className="text-left font-medium px-4 py-2">Branch · commit</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
                <th className="text-left font-medium px-4 py-2">Started</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {runs.data.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.projects?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.branch ?? "—"} · <span className="font-mono text-xs">{r.commit_sha?.slice(0, 7) ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground"><RelativeTime iso={r.started_at} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/runs/$id" params={{ id: r.id }} className="text-xs underline">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
