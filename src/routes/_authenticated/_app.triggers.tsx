import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/qa/AppShell";

export const Route = createFileRoute("/_authenticated/_app/triggers")({
  component: () => (
    <>
      <PageHeader eyebrow="QA Agent" title="Triggers & Roles" subtitle="Schedules, webhooks, and permissions." />
      <div className="card-surface">
        <div className="text-section mb-1">Coming online</div>
        <div className="text-subtitle">This section will be wired to live data in the next build phase.</div>
      </div>
    </>
  ),
});
