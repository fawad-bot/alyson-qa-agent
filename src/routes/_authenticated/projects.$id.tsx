import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { getProject, listRuns, listFindings } from "@/lib/qa.functions";
import { StatusBadge, SeverityBadge, RelativeTime } from "@/components/qa-bits";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const fetchProject = useServerFn(getProject);
  const fetchRuns = useServerFn(listRuns);
  const fetchFindings = useServerFn(listFindings);

  const project = useQuery({ queryKey: ["project", id], queryFn: () => fetchProject({ data: { id } }) });
  const runs = useQuery({ queryKey: ["runs", id], queryFn: () => fetchRuns({ data: { projectId: id } }) });
  const findings = useQuery({ queryKey: ["findings", id], queryFn: () => fetchFindings({ data: { projectId: id } }) });

  return (
    <AppShell title={project.data?.name ?? "Project"}>
      <div className="rounded-lg border border-border bg-card p-4 mb-6">
        <div className="text-xs text-muted-foreground">Repository</div>
        <div className="font-mono text-sm">{project.data?.repo_url ?? "—"}</div>
        <div className="mt-2 text-xs text-muted-foreground">Default branch · {project.data?.default_branch}</div>
      </div>

      <h2 className="text-sm font-semibold mb-2">Runs</h2>
      <div className="rounded-lg border border-border bg-card mb-6">
        {!runs.data?.length ? (
          <div className="p-6 text-sm text-muted-foreground">No runs for this project yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {runs.data.map((r) => (
              <li key={r.id} className="p-3 flex items-center gap-3">
                <StatusBadge status={r.status} />
                <span className="text-sm text-muted-foreground">{r.branch} · <span className="font-mono text-xs">{r.commit_sha?.slice(0, 7) ?? "—"}</span></span>
                <span className="text-xs text-muted-foreground"><RelativeTime iso={r.started_at} /></span>
                <Link to="/runs/$id" params={{ id: r.id }} className="ml-auto text-xs underline">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="text-sm font-semibold mb-2">Findings</h2>
      <div className="rounded-lg border border-border bg-card">
        {!findings.data?.length ? (
          <div className="p-6 text-sm text-muted-foreground">No findings.</div>
        ) : (
          <ul className="divide-y divide-border">
            {findings.data.map((f) => (
              <li key={f.id} className="p-3 flex items-center gap-3">
                <SeverityBadge severity={f.severity} />
                <StatusBadge status={f.status} />
                <span className="text-sm">{f.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{f.kind}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
