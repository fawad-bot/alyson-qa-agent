import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/qa/AppShell";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  component: () => (
    <>
      <PageHeader eyebrow="QA Agent" title="Settings" subtitle="Workspace, billing, and preferences." />
      <div className="card-surface">
        <div className="text-section mb-1">Coming online</div>
        <div className="text-subtitle">This section will be wired to live data in the next build phase.</div>
      </div>
    </>
  ),
});
