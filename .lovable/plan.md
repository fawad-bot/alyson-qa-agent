
## Goal

Replace the current single-iframe (`prototype.html`) app with a fully routed TanStack Start React app that matches `qa-agent-prototype.html` 1:1 in layout, brand, components, and interaction. All data mocked, all "real backend" actions simulated via local state + toasts. The prototype HTML stays as a reference but is no longer rendered.

## Approach

Build in 4 phases, each deployable on its own.

### Phase 1 — Foundation

1. Lock design tokens in `src/styles.css` (colors, radii, spacing, tabular nums, Inter via root `<link>`) per handoff §4.
2. Three-pane app shell as a pathless layout route `src/routes/_app.tsx`:
   - Left sidebar 252px — grouped nav (Overview / Targets / Runs / Quality / Work / Configuration), badges, footer user card (UZ).
   - Center main, scroll, max content width 1160px.
   - Right "Alyson AI" panel 360px, collapsible to ~52px rail, context-aware copy keyed by route via an `AI_CTX` map.
4. Shared primitives in `src/components/qa/`:
   `KpiCard`, `SeverityBadge`, `StatusBadge`, `SourceChip`, `ToolChip`, `Banner`, `OptionCard`, `Stepper`, `RunTimeline`, `FindingCard`, `EvidenceCard`, `FixTaskCard`, `PersonaCard`, `GatePreset`, `Drawer` (with scrim), `Toast` (sonner), `FutureBadge` ("Soon").
5. Seed mock data in `src/lib/qa/mock.ts`: 5 targets, 3 headline findings (verbatim copy from prototype `FINDINGS` map), personas, dashboard KPIs, run stages list, `AI_CTX` map.

### Phase 2 — Read-only screens

Create the 21 route files under `src/routes/_app/`:

```
/  /engines  /targets  /runs  /reports  /suites  /gates
/findings  /evidence  /alerts  /fix-tasks  /human-review
/auto-fix  /personas  /credentials  /triggers
/integrations  /settings
```

Plus wizards and detail:
```
/targets/new  /runs/new  /runs/$id
```

Each route gets its own `head()` with unique title/description. People Ops shows as blocked by 2 P0 everywhere it appears (dashboard, runs, alerts, findings, fix tasks, human review).

### Phase 3 — Interactions

- **Add Target wizard** (`/targets/new`) — multi-step option cards (source type → details → persona/suite → review). Final button "Create Target" → toast + navigate to `/targets`.
- **New QA Run wizard** (`/runs/new`) — target → QA mode (Quick / Full E2E / Publish Readiness cards) → suites/personas → review. "Start QA Run" → navigate to `/runs/$id` with a fresh simulated run.
- **Run Detail** (`/runs/$id`) — 12-stage timeline that advances on a timer, 6 metric cards, 7 tabs (Findings / Evidence / Test Plan / Console / Network / Generated Tests / Report). Running stage pulses.
- **Drawers** — Finding drawer (severity, area, route, run, owner, status, "What happened", evidence links, green Recommended fix box, dark Cursor prompt code block; footer: Generate Fix Task, Re-run Check, Accept Risk, Mark Resolved, Send to Software Factory `disabled+Soon`). Evidence viewer drawer (image/log/trace).
- **Future Integration** placeholders rendered visible-but-disabled with `Soon` badge: Send to Software Factory (finding drawers + fix tasks), Alyson Software Factory (Integrations + Settings).

### Phase 4 — Polish

- AI panel context-aware copy per route (1-line summary + 2–3 suggested prompts; sending a prompt fires a toast).
- Empty states, hover states, focus rings.
- Verify acceptance checklist from handoff §10.

## Technical notes

- TanStack Start file-based routing under `src/routes/_app/*`. `_app.tsx` is the shell with `<Outlet />`. Index page (`/`) lives in `src/routes/_app/index.tsx` — replaces current placeholder.
- Remove the existing iframe-only `src/routes/index.tsx` content; keep `prototype.html` in `public/` as reference only.
- All state local (React state + small Zustand store for run simulation if needed). No Supabase tables, no server functions.
- shadcn primitives already installed (Button, Card, Tabs, Sheet, Dialog, Badge, Sonner, etc.) — wrap into the QA-specific components above.
- Typography & color tokens applied via `src/styles.css` only — no hardcoded hex in components.

## Out of scope

- Real test execution / browser automation.
- Real auth, real DB, real AI calls.
- Wiring Software Factory integration (stays disabled).

## Deliverable

A clickable, fully-routed React app matching every screen in `qa-agent-prototype.html`, with simulated runs and drawers, ready to demo.
