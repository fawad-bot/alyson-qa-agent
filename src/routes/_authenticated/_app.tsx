import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/qa/AppShell";

export const Route = createFileRoute("/_authenticated/_app")({
  component: () => <AppShell><Outlet /></AppShell>,
});
