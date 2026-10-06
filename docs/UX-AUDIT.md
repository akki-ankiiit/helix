# Helix — construction-chemical formulation update: audit and verification

Date: 6 Oct 2026.

## Domain correction

- **Removed:** the five organic-synthesis reference projects (aspirin, paracetamol, isopentyl acetate, salicylic acid, tetraphenylcyclopentadienone), along with their reaction parsing, stoichiometric yield calculations, PubChem lookups, literature and outputs. They were replaced in full, not renamed.
- **Kept:** user projects created in the synthesis version. They are archived unchanged in browser storage (planner store v1 → v2 migration). Settings lists them and offers a JSON download.

## Workflow and navigation

| Layer | Purpose |
| --- | --- |
| Sidebar (global) | Projects, Reports, Settings, How Helix works |
| Breadcrumb | `Projects › HX-00n · title` on project pages only |
| Workflow stepper (one) | 1 Type · 2 Data Sources · 3 Describe · 4 Literature · 5 Pathways · 6 Review · 7 Create |
| Local tabs (Pathways only) | 5.a Analyzing formulation pathways · 5.b Identifying formulation components · 5.c Optimizing composition and ratios · 5.d Setting process conditions · 5.e Structuring experiment |
| Page actions | One primary action per task area; secondary actions are lower emphasis; destructive actions use danger styling |

Every step and substep has its own URL (`/projects/:id/:step`, `/projects/:id/pathways/:substep`), so refresh, Back/Forward and direct links all work.

## Reference samples (all: Plan status Completed · Project type Reference sample · Experimental validation Not performed)

| ID | Project | Composition basis | Key calculation |
| --- | --- | --- | --- |
| HX-001 | Tile cleaner for ceramic and porcelain surfaces | **Source-supported:** Stepan Formulation 1115 (water 91.0 / citric acid 4.0 / amine oxide 5.0; pH 2–3) | 100 kg batch quantities; active content flagged as not stated |
| HX-002 | Cementitious tile adhesive | **Source-supported:** Dow Techline 9 C2TE starting formulation (sums to 100.00) | Batch scaling; mixing water 28% of powder (7.0 kg per 25 kg) |
| HX-003 | Two-component epoxy tile grout | **Illustrative:** EEW 185–192 (EPON 828), AHEW 90 / 50 phr (Evonik Ancamide 503) | A : B = 100 : 12 calculated from the supplier phr; stoichiometric check 47.7 phr |
| HX-004 | Two-component epoxy bonding adhesive | **Illustrative:** EEW 182–192 (D.E.R. 331), AHEW 101 / 55 phr (Ancamine MCA) | Composition designed to give exactly 2 : 1; stoichiometric check 54.0 phr |
| HX-005 | Cementitious waterproofing coating | **Illustrative**, within BASF patent ranges; Acronal 5442 at 52.5–54.5% solids | Liquid : powder 1 : 2; polymer solids : cement 0.64 (> 0.6 guide) |

- **Finished-product TDS documents are benchmarks only.** These are Laticrete, Mapei Kerapoxy and Mapelastic, Sika, FILA, Faber and Dr. Fixit. No proprietary recipe is inferred from them.
- **Nothing is invented.** No test results, certifications or prices appear. Costs show "Not estimated", and trial results show "Not tested".

## Page-by-page fixes and verification

| Page / area | Problem | Fix | Verified |
| --- | --- | --- | --- |
| Projects | Pharmaceutical samples | Five construction-chemical samples; cards with category icon, purpose, focus, status and one "View project" action; table with Project, Product category, Selected approach, Ingredients, Plan status, Experimental validation, Final report and Actions; search, category/status/owner filters, sorting, Sources dialog, Use as starting point, Duplicate, Delete | e2e |
| Type | Synthesis types | Category cards (tile cleaner, tile adhesive, epoxy grout, epoxy adhesive, waterproofing) with icons and what each is judged on; formulation task; title; focus | e2e |
| Data Sources | Reaction databases | Grouped by document type (TDS, supplier formulation, raw-material data sheet, SDS, standard, publication, test data), with version/date and "what it supports"; TDS benchmark warning; add form with https validation | e2e |
| Describe | No batch or substrates | Objective, application, substrates (required), constraints, and a batch size that recalculates quantities | e2e |
| Literature | Free text only | Literature table (source, document type, finding, applicability, limitations, link) with a document-type filter; editable records in copies | e2e |
| 5.a Approaches | Synthesis routes | Pathway-comparison table with Select actions; category-specific judging criteria; rationale | e2e |
| 5.b Components | PubChem lookup | Library-based identification: function, compatibility, supporting source and review status. Suggests a starting component list for empty projects, flags missing required functions and needed supplier data. **Blob shows while running and clears on success or failure** | e2e |
| 5.c Composition | Stoichiometric yield | Formulation table per component (wt.% totals validated against 100%; missing ≠ zero; active/solids content). Mixing ratio and water inputs, epoxy calculation panel, component-ratio table, accept-to-apply proposals, composition chart, mixing diagram, cost table | unit + e2e |
| 5.d Process | Reaction conditions | Processing-conditions table (stage, equipment, addition order, requirement, duration if supported, checkpoint, source); processing-flow diagram; application/curing timeline | e2e |
| 5.e Experiment | Measurements | Performance-testing matrix (no compliance claims); trial batches with result entry; performance chart plots only measured results | e2e |
| Review | — | Per-step summary, substep checks and fix links; explains "Completed" ≠ tested | e2e |
| Create | — | Status triplet, outcome, project-summary graphic, key figures, all tables and infographics, traceable recommendations (suggestion, reason, evidence, uncertainty, next action), assumptions and gaps, report and workbook downloads, revise / use as starting point | e2e |
| Reports | — | Report (.html) and workbook (.xlsx) for every project with a plan; print to PDF | e2e |
| Buttons and palette | Glow, outer shadows, lift on hover | Restored the last committed (HEAD) flat button rules and `--shadow` token. Accent `#6d4aff` unchanged. Subtle hover; visible focus ring | visual |
| Icons | Mixed | lucide-react only. Icon-only buttons have accessible names and tooltips; status is always shown in text | e2e (accessible names) |
| Settings | Synthesis wording | Archived projects download, previous-version formulation data download, currency note, reset | e2e |

## Remaining gaps

- **HX-003, HX-004 and HX-005 compositions are illustrative.** No public supplier formulation was found for epoxy grout, epoxy adhesive or 2K cementitious coatings. Every gap is listed in the project.
- **Some standard limits were not verified.** These are the EN 13888-1 Table 3 (RG) limits and the current EN 14891 edition. EN 12004 class criteria come from secondary sources.
- **No pricing.** No verified ₹ raw-material prices are available.
- **Browser-only storage.** User projects are stored per browser; there is no server-side storage.
- **Unrouted legacy code.** The older formulation-workspace code remains in `src/features` but is not routed.
