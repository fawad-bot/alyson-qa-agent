## Scope reality check

The prototype has 21 screens, wizards, drawers, simulated runs, and a context-aware chat panel. Building all of it as DB-backed real React routes is a multi-turn build. I'll ship it in 4 phases, each independently usable. Approving this plan starts **Phase 1**; I'll return for approval before each next phase.

The database already has: `profiles`, `projects` (= Targets), `qa_runs`, `run_gates`, `findings`, `user_roles`. I'll extend the schema as each phase needs it — no big speculative schema up front.

## Phase 1 — Foundation (this turn)

1. **Design tokens in `src/styles.css`** — replace the default oklch palette with the Alyson tokens (`#F6F7F9`, `#2563EB`, `#EAF1FE`, Inter via `<link>` in `__root.tsx`). H1/Subtitle/Eyebrow/KPI typography utility classes.
2. **Auth**
   - Enable Google via `configure_social_auth` (managed). Email/password stays on.
   - `src/routes/auth.tsx` — sign in / sign up tabs + Google button.
   - `src/routes/_authenticated/route.tsx` is integration-managed; rely on it.
3. **App shell** — `src/routes/_authenticated/_app.tsx` pathless layout: 248px sidebar (all 21 destinations with section grouping + badges) + main `<Outlet />` + 360px AI panel reading current route for context copy. Sign-out in sidebar footer.
4. **Replace iframe** — `src/routes/index.tsx` redirects: signed-in → `/dashboard`, signed-out → `/auth`. Delete iframe code (prototype HTML stays in `public/` as visual reference only).
5. **Dashboard** — `_authenticated/_app/dashboard.tsx` — 6 KPI cards (runs today, pass rate, P0/P1, MTTR, auto-fix rate) reading aggregates from `qa_runs` + `findings` via a `getDashboardStats` server fn.
6. **All 21 route files created as headed placeholders** — each renders its page title + subtitle in the locked typography, so nav works everywhere. Real content fills in over Phases 2-4.

## Phase 2 — Targets, Runs, Findings (core CRUD)

- `/targets` list + `/targets/new` wizard → `projects` table.
- `/runs` list, `/runs/new` wizard, `/runs/$id` detail (12-stage `run_gates` timeline, 6 metric cards, 7 tabs).
- `/findings` list + drawer (severity, owner, status, "What happened", evidence, fix box) → `findings` table.
- Run simulator: server fn creates a `qa_runs` row + 12 `run_gates` rows + seeds findings on completion. Client polls every 2s.

## Phase 3 — Suites, Gates, Reports, Evidence, Alerts

- New tables: `test_suites`, `evidence_items`, `alerts`, `quality_gates`.
- Read-only screens for Suites, Gates, Reports (aggregations over runs), Evidence viewer drawer, Alerts feed.

## Phase 4 — Fix Tasks, Human Review, Auto-Fix, Personas, Credentials, Triggers, Integrations, Settings

- Tables: `fix_tasks`, `human_review_items`, `auto_fix_proposals`, `personas`, `credentials` (encrypted via Vault is out of scope — stored as encrypted JSON in DB), `triggers`, `integrations`, `engines`.
- People-Ops still gated behind "2 P0" blocker (computed client-side from findings).
- Software Factory integration tile stays disabled with `Soon` badge.

## Out of scope (won't build)

- Actually running tests against external sites (no Playwright / browser automation — would need a real worker fleet).
- Real AI conversations in the right panel (stays scripted, route-aware).
- Real Software Factory webhook.
- Email/Slack alert delivery (UI only, no SMTP).
- Encryption-at-rest for credentials beyond Postgres defaults.

## Technical decisions

- All reads/writes via `createServerFn` (`requireSupabaseAuth`) — no edge functions.
- "Single org" = no org table; every signed-in user can read all rows (RLS policy `TO authenticated USING (true)`). Writes still stamp `owner_id = auth.uid()` for audit.
- TanStack Query for all reads (`ensureQueryData` in loader, `useSuspenseQuery` in component).

After approval I'll execute Phase 1 end-to-end. Tell me if you want to drop anything or change priority order before I start.