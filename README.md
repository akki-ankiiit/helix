# Helix — AI for Materials

A React + Vite + strict TypeScript frontend for the journey from a material requirement to an evidence-informed laboratory decision. The first screen is a split-layout login with an original molecular illustration. The authenticated application includes a persistent intake, materials workspace, and connected six-stage formulation workflow.

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

The Playwright configuration uses installed Google Chrome on macOS when available, otherwise Playwright Chromium. Tests cover login and demo entry, intake persistence and mode switching, iteration history, approval gating, pasted-result validation, and responsive theme coverage. A small launcher handles Vite's URL-fragment limitation when the project directory contains `#`. It creates a temporary preserved symlink without moving source files. The unit-test launcher stages source inputs in a temporary directory only on such paths.

## Demo entry and a suggested walkthrough

1. Visit `/`. Unauthenticated users are redirected to `/login`.
2. Select **Explore demo workspace**. No account or credentials are needed. New users go directly to **Your mode**, then category selection.
3. Choose Scientist or Non-scientist, then Tile, stone and flooring → Tile and stone adhesives. Enter a project name, review benchmarks, targets, constraints, and start a versioned brief.
4. Alternatively, open **Projects → Exterior large-format tile adhesive** to explore the completed demonstration history.
5. In **Analysis**, select **T01 · baseline**. Slip is 0.68 mm against a ≤ 0.50 mm user-defined target. Accept the proposed iteration to create another trial without deleting its parent or results.
6. The seeded **T02** has passing illustrative measurements but is not approved. In **Settings**, switch the _demo role_ to Reviewer, open **Results**, and select **Review results**. Then open **Final**, acknowledge the review scope, and approve the submitted recipe. Approval locks the recipe and snapshots price context.
7. Switch to Chemist and use **New draft revision** in Trials to edit a copy of an approved recipe. The approved version remains available.

Credential sign-in deliberately returns an honest unavailable-service error. Arbitrary credentials are never accepted or stored. Password recovery never claims to send mail. The remember-me control is reserved for the production authentication adapter; explicit demo sessions persist locally until sign-out/reset. Demo mode preference is retained for the local demo user across sign-outs.

## Implemented workspace

- **Login:** field validation with React Hook Form / Zod, password visibility, keyboard submission, loading/error states, theme control, explicit demo entry, recovery-unavailable screen.
- **Intake:** six categories and exactly 33 selectable product families; draft chemistry/form metadata; four primary steps; conditional use cases; progressive brief preview; benchmark library, manual benchmark values, and review-before-import extraction fixture; spreadsheet-style targets; full four-group property library; unique ranked objectives; constraints; versioned review.
- **Projects:** search and status filters, list/grid views, meaningful R&D counts, drafts, recent activity, empty workspace, persistent stage URLs, collapsible stages and brief summary.
- **Literature:** labeled fixture research sequence, source references, pin/exclude, document-name references, cited excerpts, inference/evidence distinction, missing-source warnings.
- **Pathways:** ranked fixture directions, transparent heuristic scores, composition sketches, estimates, risks, comparison, selection, and versioned variant planning.
- **Trials:** editable dry-blend matrix; limits, totals, costs, masses, explicit application water; duplicates/revisions; reviewed material swaps; mixing parameter records and test plan. Editing a recipe that already has measurements automatically creates a new revision.
- **Results:** individual specimen readings, means, methods/conditions/units, operator/date/failure mode, comments, filename attachments, validated TSV paste preview. Corrections retain previous entries in local result history. Reviewing results and approving the recipe are distinct actions.
- **Analysis:** target/benchmark/prediction/measurement matrix, operator-aware evaluations, insufficient-evidence states, accepted/rejected/edited iteration proposals and preserved recipe history.
- **Final:** mandatory-test and numerical-validation gates, independent role-aware review, change requests, approval events, locked recipe and material-price snapshot, specification/dossier exports.
- **Libraries:** searchable benchmarks with provenance; raw-material master with editable limits, suppliers, prices and alternatives; genuine .xlsx import with mapping and row validation; draft templates and version metadata.
- **Reports:** genuine Excel workbooks and an explicit print-to-PDF dossier flow, with units and project/revision/demo context.
- **Task queue:** navigation-independent deterministic jobs, failed-job demonstration, retry/cancel, timestamps and output links.
- **Ask Helix:** contextual local responses using current project records, low-confidence states, citations, explicit before/after acceptance for proposed brief changes.
- **Settings:** presentation mode, role simulation, theme, integration status, empty workspace, and reset demo.
- **Themes:** semantic light/dark tokens, persisted Light/Dark/System preference applied before the first render, DM Sans bundled locally, reduced-motion support.

## Scientific and prototype boundaries

All chemistry, prices, benchmark products, research documents, pathways, and seeded laboratory readings are **illustrative**. None is a real competitor-performance claim, verified laboratory result, official standard limit, certified classification, regulatory clearance, or production formulation recommendation.

The detailed connected formulation fixture is the **exterior tile-adhesive** project. The waterproofing and admixture projects have coherent family-specific briefs/targets and reference benchmarks, but do not pretend to have complete chemistry models. Other product families load editable **draft** templates. Where no pathway fixture is configured, the UI explicitly requests R&D input rather than fabricating a recipe. All 33 families support intake and versioned brief creation.

The numerical recipe implementation uses **dry-blend wt %** only. Application water is a percentage of dry mass and remains outside the 100% dry total. Wet-basis and multi-component systems require additional domain implementations; they are not mixed into the existing calculation. No silent normalization is performed. Total tolerance is ±0.01 percentage points.

Prices use USD/kg. Missing prices and incompatible currencies produce incomplete-cost states; no exchange-rate conversion is inferred. A non-USD cost ceiling blocks approval until reconciled. Budget bands do not imply numeric ceilings. Structured material min/max limits, excluded-material names, cost ceilings, and composition totals are checked automatically. Free-text supplier, equipment, regulatory, and site constraints require explicit human review.

The EN 12004 reference is stored as **unverified metadata**. No licensed standard text or official limit is bundled. Project target numbers are not represented as standard requirements. Categorical property definitions can be included in a brief but are deliberately **not numerically evaluated**. Borderline evaluation requires an explicit tolerance in the target model; no universal tolerance is assumed.

Three specimen readings are required for the current mandatory test plans. Means preserve missing versus zero values. Evaluation requires matching units, test method, and conditioning. Plans expose aged-test requirements; this demo does not integrate laboratory scheduling, instrument calibration, or external LIMS data.

Document uploads retain **filename references only**, not durable file bytes. Demo extraction always loads a supplied fixture; it never parses an arbitrary document. Photos/attachments likewise retain labeled filename references. Production document storage, malware scanning, extraction, and review require backend adapters. Only the documented first-worksheet `.xlsx` material template is supported, up to 1,000 rows.

Collaboration, notifications, role changes, and approvals are local demonstrations. There is no multi-user synchronization or learning model. The deterministic assistant does not connect to an LLM, produce unrestricted answers, or automatically edit records. Pathway variants revise planning priorities; numeric estimates remain unchanged until evidence exists.

## Architecture and integration points

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

The public Novyte workflow was reviewed only as competitive context for evidence, experiment planning, and decision traceability. Helix uses its own branding, copy, illustration, and interface, without adopting proprietary engine, performance, timing, or benchmark claims.
# helix
