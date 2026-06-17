import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listIntegrations, toggleIntegration } from "@/lib/qa/phase4.functions";
import { PageHeader } from "@/components/qa/AppShell";
import { Button } from "@/components/ui/button";
import { Github, Cloud, MessageSquare, ListChecks, Database, Wrench } from "lucide-react";
import { toast } from "sonner";

const opts = () => queryOptions({ queryKey: ["integrations"], queryFn: () => listIntegrations() });

export const Route = createFileRoute("/_authenticated/_app/integrations")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(opts()); },
  component: Integrations,
});

const ICONS: Record<string, any> = {
  github: Github, vercel: Cloud, slack: MessageSquare,
  jira: ListChecks, aws_s3: Database, software_factory: Wrench,
};

function Integrations() {
  const { data } = useSuspenseQuery(opts());
  const qc = useQueryClient();
  const toggle = useServerFn(toggleIntegration);

  const mut = useMutation({
    mutationFn: ({ provider, connect }: { provider: string; connect: boolean }) =>
      toggle({ data: { provider, connect } }),
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["integrations"] }); toast.success(v.connect ? "Connected" : "Disconnected"); },
  });

  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Integrations"
        subtitle="Connect the agent to your source, hosting, storage, and work-tracking tools." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((i: any) => {
          const Icon = ICONS[i.provider] ?? Cloud;
          const connected = i.status === "connected";
          return (
            <div key={i.provider} className="card-surface flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-[#F6F7F9] flex items-center justify-center text-ink"><Icon className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="text-section flex items-center gap-2">
                  {i.label}
                  {connected && <span className="text-[11px] px-2 py-0.5 rounded bg-[#E7F6EC] text-[#15803D] font-medium">Connected</span>}
                </div>
                <div className="text-subtitle">{i.description}</div>
              </div>
              <Button size="sm" variant={connected ? "outline" : "default"}
                onClick={() => mut.mutate({ provider: i.provider, connect: !connected })}>
                {connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
