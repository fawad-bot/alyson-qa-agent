import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe, updateProfile } from "@/lib/qa.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const fetchMe = useServerFn(getMe);
  const update = useServerFn(updateProfile);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  useEffect(() => {
    if (me.data?.profile) {
      setName(me.data.profile.display_name ?? "");
      setAvatar(me.data.profile.avatar_url ?? "");
    }
  }, [me.data]);

  const save = useMutation({
    mutationFn: () => update({ data: { display_name: name, avatar_url: avatar || null } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Settings">
      <div className="max-w-xl space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Profile</h2>
          <div className="space-y-3">
            <div><Label>Display name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Avatar URL</Label><Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" /></div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-2">Account</h2>
          <div className="text-sm text-muted-foreground">Role: <span className="text-foreground">{me.data?.isAdmin ? "Admin" : "Member"}</span></div>
          <div className="text-xs text-muted-foreground mt-1">User ID: <code>{me.data?.userId}</code></div>
        </section>
      </div>
    </AppShell>
  );
}
