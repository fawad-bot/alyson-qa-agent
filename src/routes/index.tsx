import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, ShieldCheck, Workflow, Eye } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alyson QA — Autonomous QA for shipping teams" },
      { name: "description", content: "Run AI-powered code review, Playwright, MCP browser agents, visual & video QA on every change. Block bad deploys before they ship." },
      { property: "og:title", content: "Alyson QA — Autonomous QA for shipping teams" },
      { property: "og:description", content: "15 QA gates from static checks to live MCP browser agents. Persistent run history, findings, and approval gates." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <span className="font-semibold tracking-tight">Alyson QA</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/auth" className="text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/auth" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 15 QA gates, one verdict
        </div>
        <h1 className="text-5xl font-semibold tracking-tight leading-[1.05]">
          Ship only what survives every QA agent.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          Static checks, AI review, Playwright, MCP browser agents, visual and video QA — all
          run on every change with persistent history and resolvable findings.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-1 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth" className="inline-flex items-center gap-1 rounded-md border border-border px-5 py-2.5 text-sm hover:bg-accent">
            View demo
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Workflow, title: "15-gate pipeline", body: "Phase 1 pre-merge gates block bad code. Phase 2 post-deploy agents catch what only shows up in production." },
          { icon: Eye, title: "MCP + Video QA", body: "Claude/GPT/Gemini drive your live app via MCP. AI reviews the screen recording." },
          { icon: ShieldCheck, title: "Findings that stick", body: "Every security, a11y, and visual issue becomes a tracked record you can resolve." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-5">
            <Icon className="h-5 w-5 mb-3 text-muted-foreground" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} Alyson QA</span>
          <Link to="/auth">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
