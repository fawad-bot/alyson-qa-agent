// Canonical list of QA gates seeded for every new run.
export type GateSeed = { name: string; phase: "phase1" | "phase2"; ordering: number };

export const QA_GATE_SEEDS: GateSeed[] = [
  { name: "Static Code Validation", phase: "phase1", ordering: 1 },
  { name: "Event Contract Validation", phase: "phase1", ordering: 2 },
  { name: "Component Presence", phase: "phase1", ordering: 3 },
  { name: "AI Code Review", phase: "phase1", ordering: 4 },
  { name: "Security Agent", phase: "phase1", ordering: 5 },
  { name: "Accessibility Agent", phase: "phase1", ordering: 6 },
  { name: "Playwright E2E", phase: "phase2", ordering: 7 },
  { name: "AI Playwright Coverage", phase: "phase2", ordering: 8 },
  { name: "Visual QA", phase: "phase2", ordering: 9 },
  { name: "MCP Browser Agent", phase: "phase2", ordering: 10 },
  { name: "Video QA", phase: "phase2", ordering: 11 },
  { name: "OpenReplay Session QA", phase: "phase2", ordering: 12 },
  { name: "Legal & Compliance", phase: "phase2", ordering: 13 },
  { name: "Landing Page Conversion", phase: "phase2", ordering: 14 },
  { name: "Deployment Gate", phase: "phase2", ordering: 15 },
];
