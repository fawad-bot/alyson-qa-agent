import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/qa/AppShell";
import { Cpu, Eye, ShieldAlert, Accessibility, Gauge, Globe, FileSearch, Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/engines")({
  component: Engines,
});

const ENGINES = [
  { key: "playwright", name: "Playwright", icon: Bot, category: "Functional E2E",
    detects: "User-flow regressions, broken navigation, form submission failures.",
    status: "active" },
  { key: "lighthouse", name: "Lighthouse", icon: Gauge, category: "Performance & PWA",
    detects: "LCP, CLS, TBT regressions, render-blocking assets, PWA misconfig.",
    status: "active" },
  { key: "axe", name: "axe-core", icon: Accessibility, category: "Accessibility",
    detects: "WCAG 2.2 AA violations: contrast, ARIA, focus order, semantic structure.",
    status: "active" },
  { key: "zap", name: "OWASP ZAP", icon: ShieldAlert, category: "Security",
    detects: "Auth bypass, IDOR, injection, mixed-content, cookie misconfig.",
    status: "active" },
  { key: "pa11y", name: "Pa11y", icon: Eye, category: "Accessibility",
    detects: "Secondary a11y pass; cross-checks axe findings.",
    status: "active" },
  { key: "k6", name: "k6", icon: Cpu, category: "Load",
    detects: "p95 latency under sustained load, error-rate spikes, throughput cliffs.",
    status: "active" },
  { key: "broken-links", name: "Link Crawler", icon: Globe, category: "Health",
    detects: "Dead internal links, redirect chains, broken canonicals.",
    status: "active" },
  { key: "ai-explorer", name: "AI Explorer", icon: FileSearch, category: "Exploratory",
    detects: "Unscripted edge-case probes driven by the Alyson model — surfaces issues human suites miss.",
    status: "beta" },
];

function Engines() {
  return (
    <>
      <PageHeader eyebrow="QA Agent" title="Agent Engines"
        subtitle="The probes Alyson runs against every target. Each engine contributes findings into the same triage queue." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ENGINES.map(e => {
          const Icon = e.icon;
          return (
            <div key={e.key} className="card-surface">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-primary-weak text-primary flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="text-section">{e.name}</div>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${e.status === "active" ? "bg-[#E7F6EC] text-[#15803D]" : "bg-[#FCF3E2] text-[#B45309]"}`}>{e.status}</span>
                  </div>
                  <div className="text-[11px] uppercase font-semibold tracking-wide text-t3 mb-1.5">{e.category}</div>
                  <div className="text-subtitle">{e.detects}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
