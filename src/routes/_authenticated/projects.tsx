import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { listProjects, createProject, createRun, deleteProject } from "@/lib/qa.functions";
import { Plus, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProjects = useServerFn(listProjects);
  const createProj = useServerFn(createProject);
  const runFn = useServerFn(createRun);
  const delFn = useServerFn(deleteProject);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");

  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchProjects() });

  const create = useMutation({
    mutationFn: () =>
      createProj({ data: { name, repo_url: repo || undefined, default_branch: branch } }),
    onSuccess: () => {
      toast.success("Project created");
      setOpen(false);
      setName(""); setRepo(""); setBranch("main");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const start = useMutation({
    mutationFn: (p: { id: string; branch: string }) =>
      runFn({ data: { project_id: p.id, branch: p.branch } }),
    onSuccess: (run) => {
      toast.success("Run started");
      navigate({ to: "/runs/$id", params: { id: run.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Projects">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="acme-web" /></div>
              <div><Label>Repository URL (optional)</Label><Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/acme/web" /></div>
              <div><Label>Default branch</Label><Input value={branch} onChange={(e) => setBranch(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-card">
        {projects.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : !projects.data?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No projects yet. Create one to start running QA gates.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {projects.data.map((p) => (
              <li key={p.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <Link to="/projects/$id" params={{ id: p.id }} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.repo_url ?? "no repo configured"} · branch <code>{p.default_branch}</code>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => start.mutate({ id: p.id, branch: p.default_branch })} disabled={start.isPending}>
                  <PlayCircle className="h-4 w-4 mr-1" /> Run QA
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete project "${p.name}"?`)) remove.mutate(p.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
