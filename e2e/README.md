# E2E Smoke Tests

Playwright covers: navigation, run-detail tabs, evidence drawer, and the New Run flow.

## Run

```bash
bun run test:e2e         # all specs (auth specs skip without session)
bun run test:e2e:ui      # Playwright UI mode
```

First time only, install browser binaries:
```bash
bunx playwright install chromium
```

## Authenticated specs

The app uses Google OAuth, so authenticated tests need a captured session.

1. Start the dev server: `bun run dev`
2. In a separate terminal: `bunx playwright codegen http://localhost:8080/auth`
3. Sign in with Google in the launched browser
4. Save storage state:
   ```bash
   mkdir -p .auth
   bunx playwright open --save-storage=.auth/user.json http://localhost:8080
   ```
   (or use the codegen UI's "Save storage" action)
5. Re-run `bun run test:e2e` — authed specs now execute against `.auth/user.json`.

`.auth/` is gitignored; never commit `user.json`.

## CI

Set `E2E_BASE_URL` to point at a deployed preview (skips webServer spin-up). Provide `STORAGE_STATE` via secret if running authed specs.
