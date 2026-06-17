import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, Cpu, Target, Play, FileBarChart, FlaskConical, ShieldCheck,
  AlertTriangle, Image as ImageIcon, Bell, Wrench, UserCheck, Sparkles,
  Users, KeyRound, Zap, Plug, Settings, LogOut, Bot, Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

type Item = { to: string; label: string; icon: any; badge?: string };

const NAV: { label: string; items: Item[] }[] = [
  { label: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/engines", label: "Engines", icon: Cpu },
  ]},
  { label: "Testing", items: [
    { to: "/targets", label: "Targets", icon: Target },
    { to: "/runs", label: "Runs", icon: Play },
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/suites", label: "Suites", icon: FlaskConical },
    { to: "/gates", label: "Quality Gates", icon: ShieldCheck },
  ]},
  { label: "Findings", items: [
    { to: "/findings", label: "Findings", icon: AlertTriangle },
    { to: "/evidence", label: "Evidence", icon: ImageIcon },
    { to: "/alerts", label: "Alerts", icon: Bell },
  ]},
  { label: "Remediation", items: [
    { to: "/fix-tasks", label: "Fix Tasks", icon: Wrench },
    { to: "/human-review", label: "Human Review", icon: UserCheck, badge: "2 P0" },
    { to: "/auto-fix", label: "Auto-Fix", icon: Sparkles },
  ]},
  { label: "Config", items: [
    { to: "/personas", label: "Personas", icon: Users },
    { to: "/credentials", label: "Credentials", icon: KeyRound },
    { to: "/triggers", label: "Triggers & Roles", icon: Zap },
    { to: "/integrations", label: "Integrations", icon: Plug },
    { to: "/settings", label: "Settings", icon: Settings },
  ]},
];

const AI_CTX: Record<string, { title: string; body: string }> = {
  "/dashboard": { title: "Daily standup", body: "QA Agent ran 24 suites overnight. Pass rate held at 91%. 2 P0 findings are blocking the People-Ops release." },
  "/targets":   { title: "Targets", body: "Add a target to start running checks. I'll auto-detect routes and suggest a suite." },
  "/runs":      { title: "Runs", body: "Trigger a manual run or wait for the next scheduled trigger. I'll surface anomalies as they happen." },
  "/findings":  { title: "Findings", body: "I cluster duplicates and propose owners by code area. Open a finding to see the proposed fix." },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const ctx = AI_CTX[pathname] ?? { title: "Alyson", body: "I'm watching this view. Ask me anything about what's on screen." };

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      <Toaster />
      <aside className="w-[248px] shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary text-white grid place-items-center text-xs font-bold">A</div>
          <div className="font-semibold text-[15px]">Alyson</div>
          <Settings className="ml-auto w-4 h-4 text-t3" />
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {NAV.map(group => (
            <div key={group.label}>
              <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-t3">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13.5px] ${active ? "bg-primary-weak text-primary font-semibold" : "text-ink hover:bg-canvas"}`}>
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-dng-bg text-dng">{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-t2 hover:bg-canvas">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1160px] mx-auto px-8 py-8">{children}</div>
      </main>

      <aside className="w-[360px] shrink-0 bg-surface border-l border-border flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-weak text-primary grid place-items-center"><Bot className="w-4 h-4" /></div>
          <div>
            <div className="font-semibold text-[14px]">Alyson AI</div>
            <div className="text-[11px] text-t3">Context-aware</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="card-surface" style={{ padding: 14 }}>
            <div className="text-eyebrow mb-1">{ctx.title}</div>
            <div className="text-[13.5px] leading-relaxed text-ink">{ctx.body}</div>
          </div>
          <div className="text-[12px] text-t3 px-1">Suggestions update with the page you're viewing.</div>
        </div>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 bg-canvas border border-border rounded-lg px-3 py-2">
            <input placeholder="Ask Alyson…" className="flex-1 bg-transparent outline-none text-[13px]" />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Send className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <div className="text-eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-h1">{title}</h1>
        {subtitle && <p className="text-subtitle mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
