# Helix — construction-chemical formulation

A React + Vite + TypeScript application for developing construction-chemical formulations: tile cleaners, tile adhesives, epoxy grouts and adhesives, and waterproofing coatings. Every project follows seven steps — Type → Data Sources → Describe → Literature → Pathways → Review → Create — and ends with a downloadable formulation-development report.

## Run

Node.js 22+ is recommended.

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run test         # meaningful domain calculation / validation tests
npm run build
npm run preview      # serve the production build
```

End-to-end tests:

```bash
npx playwright install chromium
npm run test:e2e
```

The Playwright configuration uses installed Google Chrome on macOS when available, otherwise Playwright Chromium. Tests cover login and demo entry, the six-step brief (validation, reload, Back), legacy links, stepper/tab state with browser Back/Forward and refresh, iteration history, approval gating, pasted-result validation, INR output in the Final report and PDF, saved-data currency migration, imports and exports, and mobile navigation. A small launcher handles Vite's URL-fragment limitation when the project directory contains `#`. It creates a temporary preserved symlink without moving source files. The unit-test launcher stages source inputs in a temporary directory only on such paths.

## Using Helix

1. Visit `/` and select **Explore demo workspace** (no account needed).
2. Open a **reference sample** (HX-001 … HX-005). Each opens on its Create screen. It shows the plan status (Completed), the project type (Reference sample) and experimental validation (Not performed), followed by the formulation, processing and testing tables, infographics, recommendations and report downloads.
3. Select **Use as starting point** to create an editable copy (HX-101 …). Changes are saved to the copy in this browser; the reference stays unchanged.
4. Or select **New project** and work through the seven steps. In Pathways › Identifying formulation components, Helix suggests a starting component list for the chosen category; you then set the amounts, mixing ratio, processing stages and tests.

Reference samples, sources, evidence labels and remaining gaps are documented in `docs/UX-AUDIT.md`. Compositions are labelled source-supported or illustrative. Finished-product data sheets are used as benchmarks only. No test results, certifications or prices are claimed.

## Deployment

The app is deployed by the Vercel GitHub integration: every push to `main` builds (`npm run build`) and publishes to https://helix-zeta-wheat.vercel.app. `vercel.json` rewrites all paths to `index.html`, so direct links work. Reference samples ship with the app; user projects are saved in the browser (`localStorage` key `helix-planner`).

itecture and integration points

```text
src/
  app/                  Router, session guard, app entry
  components/           Shared accessible controls, branding, workspace shell
  features/             Feature-owned pages, components, CSS Modules
  domain/models/        Typed project, brief, evidence, trial, result, job, approval models
  domain/calculations/  Tested numerical validation, evaluation, paste validation
  data/                 Configurable taxonomy, properties/templates, brand, fixtures
  services/contracts/   Authentication, project, document, job, assistant, report interfaces
  services/demo/        Explicit local implementations and genuine export generation
  stores/               Zustand demo state and persistence
  styles/               Semantic theme tokens and shared CSS Module components
tests/unit/             Numerical / integrity tests
tests/e2e/              Browser workflow acceptance tests
```

Replace demo adapters with authenticated API clients behind `src/services/contracts/index.ts`. The local Zustand store currently owns mutation behavior; move those actions to transactional server commands and hydrate the frontend with returned versions when adding a backend. Server-side enforcement must cover role permissions, recipe locks, immutable result history, concurrent writes, job ownership, approval preconditions, and versioned evidence snapshots. Real authentication must use a secure provider/backend session, ideally with appropriate HttpOnly session cookies; frontend route guards are not authorization.

Use an object store for documents and attachments, server jobs for research, and structured source citations for AI outputs. The assistant's proposed-change contract should continue to require explicit acceptance. Extend recipe basis types before enabling wet-blend or multi-component chemistry.

`VITE_*` environment variables are embedded in the browser bundle. **Never put private API keys in them.** Any private AI/provider credentials belong on the server. No secret is required to run this demo.

Local storage keys: `helix-demo-workspace`, `helix-demo-user-mode`, and `helix-theme`. Browser storage is only for illustrative demo records and preferences, not proprietary production data. Reset demo restores fixtures and signs out while retaining theme preference.

Brand name and descriptor are configured in `src/data/brand.ts`; the original Helix SVG lives in `src/components/ui/Brand.tsx`; accent and theme colors live in `src/styles/tokens.css`. The organization context intentionally represents one workspace rather than adding tenant-administration features.

## Design references

The public Novyte Q sign-in screen (`demo.novyte.ai`) was used as the reference for the procedure names Ask, Read, Design and Execute. `fallback.html` is a maintenance page, and screens behind sign-in were not available, so Novyte's inputs, calculations and outputs are not verified or copied. Helix keeps its own branding, copy and interface and makes no claim to match Novyte. The page-by-page audit, navigation structure, terminology mapping and verification record are in `docs/UX-AUDIT.md`.
# helix
