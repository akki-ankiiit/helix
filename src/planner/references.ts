// Five construction-chemical reference projects. Each is a completed
// formulation-DEVELOPMENT plan: Helix generated the plan; no laboratory or
// field testing has been performed, so every trial result is empty.
import type {
  Approach,
  Evidence,
  Ingredient,
  IngredientFunction,
  LiteratureRecord,
  ProcessStep,
  Project,
  ReviewStatus,
  TestRow,
  TimelineItem,
  Trial,
} from "./model";
import { S } from "./sources";
import { inputsHash } from "./calc";

const REF_DATE = "2026-10-06T00:00:00.000Z";
let n = 0;
const id = (p: string) => `${p}-${++n}`;

const ing = (
  partId: string,
  key: string,
  name: string,
  fn: IngredientFunction,
  grade: string,
  wtPct: number | null,
  evidence: Evidence,
  review: ReviewStatus,
  basis: string,
  extra: Partial<Ingredient> = {},
): Ingredient => ({ id: key, partId, name, function: fn, grade, wtPct, evidence, review, basis, ...extra });

const lit = (sourceId: string, finding: string, applies: string, limitations: string, evidence: Evidence = "source"): LiteratureRecord => ({
  id: id("lit"),
  sourceId,
  finding,
  applies,
  limitations,
  evidence,
  used: true,
});

const ap = (a: Omit<Approach, "id"> & { id: string }): Approach => a;

const step = (stage: string, equipment: string, order: string, requirement: string, duration: string, checkpoint: string, evidence: Evidence, sourceId?: string): ProcessStep => ({
  id: id("proc"),
  stage,
  equipment,
  order,
  requirement,
  duration,
  checkpoint,
  evidence,
  sourceId,
});

const test = (t: Omit<TestRow, "id">): TestRow => ({ id: id("test"), ...t });
const tl = (label: string, time: string, evidence: Evidence, sourceId?: string, note?: string): TimelineItem => ({ id: id("tl"), label, time, evidence, sourceId, note });
const trials = (tests: TestRow[], list: Omit<Trial, "id" | "results">[]): Trial[] =>
  list.map((t, i) => ({ ...t, id: `T${i + 1}`, results: Object.fromEntries(tests.map((x) => [x.id, null])) }));

const base = {
  reference: true,
  prices: {},
  created: REF_DATE,
  updated: REF_DATE,
  componentsIdentifiedAt: REF_DATE,
};

const finish = (p: Omit<Project, "plan">): Project => {
  const project = p as Project;
  project.plan = { generatedAt: REF_DATE, version: 1, inputsHash: inputsHash(project) };
  return project;
};

// ---------------------------------------------------------------------------
// HX-001 · Tile cleaner for ceramic and porcelain surfaces
// ---------------------------------------------------------------------------
const hx1 = (() => {
  const tests = [
    test({ property: "pH (as supplied)", method: "pH meter at 25 °C", target: "2 – 3", unit: "pH", conditions: "Neat product, 25 °C", targetEvidence: "source", sourceId: S.stepan1115.id }),
    test({ property: "Storage stability", method: "Supplier protocol: 3 freeze–thaw cycles; 4 weeks at 50 °C, 25 °C and 4 °C", target: "No separation, colour or pH drift", unit: "", conditions: "Sealed containers", targetEvidence: "source", sourceId: S.stepan1115.id }),
    test({ property: "Cleaning performance (soap scum, hard-water marks)", method: "Comparative wipe test on soiled ceramic and porcelain tiles vs a commercial benchmark (no standard method verified)", target: "Equal to or better than benchmark", unit: "", conditions: "Spray, 4–5 min contact, wipe, rinse", targetEvidence: "illustrative", sourceId: S.stepan1126.id }),
    test({ property: "Residue after rinsing", method: "Visual and gloss check on black glazed tile after drying (no standard method verified)", target: "No visible film or streaks", unit: "", conditions: "Single rinse with water", targetEvidence: "illustrative" }),
    test({ property: "Tile chemical resistance", method: "ISO 10545-13:2016", target: "No visible attack on test tiles (limits not read)", unit: "", conditions: "Per standard", targetEvidence: "not-reported", sourceId: S.iso10545.id }),
    test({ property: "Compatibility with grout and fittings", method: "Spot test on cementitious and epoxy grout, aluminium and stainless steel", target: "No etching, colour change or corrosion after contact time", unit: "", conditions: "Neat product, 5 min contact, rinse", targetEvidence: "illustrative", sourceId: S.filaDeterdek.id }),
  ];
  return finish({
    ...base,
    id: "HX-001",
    title: "Tile cleaner for ceramic and porcelain surfaces",
    category: "Tile cleaner",
    task: "New formulation",
    focus: "Cleaning performance, surface compatibility, residue and a suitable formulation approach",
    objective: "Develop a mildly acidic, low-hazard spray cleaner that removes soap scum and hard-water marks from glazed ceramic and porcelain tiles without leaving residue or attacking grout and fittings.",
    application: "Ready-to-use spray for routine cleaning of bathroom and kitchen wall and floor tiles. Not for post-installation cement haze (a stronger acid route is shown as an alternative).",
    substrates: ["Glazed ceramic tiles", "Porcelain (vitrified) tiles", "Cementitious and epoxy grout joints", "Stainless steel and aluminium fittings (incidental contact)"],
    constraints: [
      "Not for marble, limestone or other acid-sensitive stone (both acid cleaner TDS sources exclude them).",
      "Low hazard preferred: avoid strong mineral acids for a consumer spray.",
      "Must rinse clean without leaving a film.",
      "Cost not estimated: no verified raw-material prices in ₹ are available.",
    ],
    batchKg: 100,
    sources: [S.stepan1115, S.stepan1126, S.filaDeterdek, S.filaSds, S.faber, S.filaCleanerPro, S.iso10545],
    literature: [
      lit(S.stepan1115.id, "Starting formulation: deionised water 91.0, citric acid 4.0, amine oxide surfactant (AMMONYX LO Special) 5.0 % by weight; pH 2–3; effective on ceramic tiles and non-porous bathroom surfaces.", "Selected approach · composition", "Soap-scum cleaner; percentages as listed (active basis not stated); no cement-haze data."),
      lit(S.stepan1126.id, "Variant with 1.0% propylene glycol n-butyl ether for grease cutting; citric acid added to adjust pH to 2–3; heavy soil needs 4–5 minutes' contact before wiping and rinsing.", "Trial variant · use instructions", "Different surfactant system; only one performance claim (lime-soap dispersion) without a method."),
      lit(S.filaDeterdek.id, "Buffered acid cleaner for end-of-installation cement residues on porcelain, glazed ceramic and acid-resistant stone; diluted 1:5–1:10; 5 minutes' contact; not for polished marble or acid-sensitive materials.", "Alternative approach · substrate limits", "Finished product; composition not disclosed."),
      lit(S.filaSds.id, "Sulphamidic acid 8–15%, glycol ether < 5%, ethoxylated alcohol < 2%; pH 0.50; Eye Dam. 1 (H318); incompatible with alkalis.", "Alternative approach · hazards", "Ranges only — cannot be used as a recipe."),
      lit(S.faber.id, "Acid cement remover pH 1.5 ± 0.5, diluted 1 : 2, 5–10 minutes' contact, acid-resistant surfaces only; wait at least 2 days after grouting; follow with a neutral cleaner.", "Alternative approach · use sequence", "Finished product; ingredients not disclosed."),
      lit(S.filaCleanerPro.id, "Neutral concentrated maintenance cleaner for porcelain, ceramic and stone; 1:200 needs no rinse.", "Maintenance alternative", "Finished product; no numeric pH; no composition."),
      lit(S.iso10545.id, "Standard method for the chemical resistance of ceramic tiles at room temperature.", "Compatibility testing", "Only the catalogue page was read; test solutions and classes not verified."),
    ],
    approaches: [
      ap({ id: "hx1-a1", name: "Mild citric-acid cleaner with amine oxide", application: "Routine removal of soap scum and hard-water marks from glazed ceramic and porcelain", advantages: "Disclosed supplier starting formulation; low hazard; simple to make", constraints: "Not strong enough for cement haze; acid-sensitive stone excluded", sourceIds: [S.stepan1115.id, S.stepan1126.id], recommendation: "Recommended" }),
      ap({ id: "hx1-a2", name: "Buffered sulfamic-acid cement-haze remover", application: "Post-installation cement and grout haze, efflorescence", advantages: "Removes inorganic deposits that citric acid does not", constraints: "pH ≈ 0.5, serious eye damage hazard; no disclosed formulation (SDS ranges only)", sourceIds: [S.filaDeterdek.id, S.filaSds.id, S.faber.id], recommendation: "Alternative" }),
      ap({ id: "hx1-a3", name: "Neutral concentrated maintenance cleaner", application: "Daily maintenance including natural stone", advantages: "Safe on most surfaces; no rinse at high dilution", constraints: "Does not remove mineral deposits; no disclosed formulation", sourceIds: [S.filaCleanerPro.id], recommendation: "Not recommended" }),
    ],
    selectedApproachId: "hx1-a1",
    rationale: "The objective is a low-hazard routine cleaner for ceramic and porcelain. Only the citric-acid route has a disclosed supplier starting formulation (Stepan 1115), so composition can be source-supported. The sulfamic-acid route is kept as an alternative for cement haze; its SDS gives ranges only, so it would need separate development.",
    parts: [{ id: "L", name: "Cleaner", description: "Single-component liquid" }],
    ingredients: [
      ing("L", "hx1-water", "Deionised water", "Carrier", "Deionised", 91.0, "source", "Source-supported", "Stepan 1115", { sourceId: S.stepan1115.id, compatibility: "Use deionised water to avoid hardness salts reacting with the acid." }),
      ing("L", "hx1-citric", "Citric acid", "Acid / descaler", "Anhydrous, technical grade", 4.0, "source", "Source-supported", "Stepan 1115 (listed as builder)", { sourceId: S.stepan1115.id, compatibility: "Dissolves lime scale; slowly etches cementitious grout and calcareous stone — keep contact time short and rinse." }),
      ing("L", "hx1-amine-oxide", "Amine oxide surfactant (AMMONYX LO Special)", "Surfactant", "As supplied; active content not stated in source", 5.0, "source", "Needs supplier data", "Stepan 1115", { sourceId: S.stepan1115.id, activePct: null, compatibility: "Amine oxides remain effective at acidic pH; request the supplier TDS for active content." }),
    ],
    ratioChecks: [],
    process: [
      step("Charge water", "Stainless-steel or HDPE mixing vessel with low-shear stirrer", "1", "Add the full quantity of deionised water", "Not stated", "Vessel clean and dry", "illustrative"),
      step("Dissolve acid", "Same vessel", "2", "Add citric acid while stirring until fully dissolved", "Until clear", "Clear solution, no undissolved crystals", "illustrative"),
      step("Add surfactant", "Same vessel", "3", "Add amine oxide slowly to avoid foaming", "Not stated", "Homogeneous, water-thin liquid", "illustrative"),
      step("Adjust pH", "Calibrated pH meter", "4", "Adjust with citric acid to pH 2–3", "Not stated", "pH 2–3", "source", S.stepan1126.id),
      step("Fill and label", "Trigger-spray bottles", "5", "Fill, cap and label with hazard and surface warnings", "Not stated", "Label warns: not for marble or acid-sensitive stone", "source", S.filaDeterdek.id),
    ],
    timeline: [
      tl("Spray on soiled surface", "0 min", "source", S.stepan1126.id),
      tl("Contact time for heavy soil", "4–5 min", "source", S.stepan1126.id),
      tl("Wipe with wet sponge or cloth", "After contact", "source", S.stepan1126.id),
      tl("Rinse with water", "Immediately after wiping", "source", S.stepan1115.id),
    ],
    tests,
    trials: trials(tests, [
      { name: "T1 · Stepan 1115 as published", change: "None (control)", purpose: "Baseline pH, stability and cleaning performance" },
      { name: "T2 · Glycol-ether variant", change: "+1.0% propylene glycol n-butyl ether, water −1.0% (from Stepan 1126)", purpose: "Check grease cutting and residue" },
      { name: "T3 · Higher acid", change: "Citric acid 4.0 → 6.0%, water −2.0% (illustrative)", purpose: "Check hard-water removal against grout compatibility" },
    ]),
    assumptions: [
      "Stepan percentages are treated as as-supplied quantities; the source does not state the active basis.",
      "Processing order is general good practice (acid dissolved before surfactant); the source gives no mixing procedure for No. 1115.",
      "Cleaning and residue tests are in-house comparative methods; no standard method was verified.",
    ],
    gaps: [
      "No supplier formulation for a cement-haze (sulfamic or phosphoric acid) cleaner was found.",
      "Active content of the amine oxide is not stated.",
      "No cleaning-performance or residue test standard was verified.",
    ],
    recommendations: [
      { text: "Run the grout and metal-fitting spot test before any cleaning trials.", reason: "Citric acid slowly etches cementitious grout; acid cleaners must be limited to acid-resistant surfaces.", sourceId: S.faber.id, uncertainty: "Grout types vary; epoxy grout is usually more resistant.", action: { step: "pathways", sub: "experiment", label: "Open the test matrix" } },
    ],
    deliverable: "Formulation-development plan and compatibility-testing report template",
  });
})();

// ---------------------------------------------------------------------------
// HX-002 · Cementitious tile adhesive
// ---------------------------------------------------------------------------
const hx2 = (() => {
  const tests = [
    test({ property: "Tensile adhesion — initial", method: "EN 12004-2 clause 8.3", target: "≥ 1.0 N/mm²", targetValue: 1.0, targetOp: "≥", unit: "N/mm²", conditions: "28 d at 23 °C", targetEvidence: "source", sourceId: S.dowTechline.id }),
    test({ property: "Tensile adhesion — after water immersion", method: "EN 12004-2 clause 8.3", target: "≥ 1.0 N/mm²", targetValue: 1.0, targetOp: "≥", unit: "N/mm²", conditions: "7 d at 23 °C + 21 d in water", targetEvidence: "source", sourceId: S.dowTechline.id }),
    test({ property: "Tensile adhesion — after heat ageing", method: "EN 12004-2 clause 8.3", target: "≥ 1.0 N/mm²", targetValue: 1.0, targetOp: "≥", unit: "N/mm²", conditions: "14 d at 23 °C + 14 d at 70 °C + 1 d at 23 °C", targetEvidence: "source", sourceId: S.dowTechline.id }),
    test({ property: "Tensile adhesion — after freeze–thaw", method: "EN 12004-2 clause 8.3", target: "≥ 1.0 N/mm²", targetValue: 1.0, targetOp: "≥", unit: "N/mm²", conditions: "7 d + 21 d water + 25 cycles", targetEvidence: "source", sourceId: S.dowTechline.id }),
    test({ property: "Extended open time (E)", method: "EN 12004-2 clause 8.1", target: "≥ 0.5 N/mm² after 30 min", targetValue: 0.5, targetOp: "≥", unit: "N/mm²", conditions: "Tiles placed after 30 min", targetEvidence: "source", sourceId: S.dowTechline.id }),
    test({ property: "Slip (T)", method: "EN 12004-2 clause 8.2", target: "≤ 0.5 mm", targetValue: 0.5, targetOp: "≤", unit: "mm", conditions: "Vertical application", targetEvidence: "source", sourceId: S.dowTechline.id }),
    test({ property: "Shear adhesion — dry (IS Type 2)", method: "IS 15477:2019 Annex", target: "≥ 1.25 N/mm²", targetValue: 1.25, targetOp: "≥", unit: "N/mm²", conditions: "27 ± 2 °C, 65 ± 5% RH", targetEvidence: "source", sourceId: S.is15477.id }),
  ];
  return finish({
    ...base,
    id: "HX-002",
    title: "Cementitious tile adhesive",
    category: "Tile adhesive",
    task: "New formulation",
    focus: "Binder, fillers, additives, water demand, workability and adhesion requirements",
    objective: "Develop a polymer-modified cementitious adhesive targeting class C2TE (EN 12004-1) and IS 15477 Type 2 for vitrified and porcelain tiles on walls and floors.",
    application: "Thin-bed (≈ 3 mm) fixing of low-porosity vitrified and porcelain tiles on cement render and concrete, interior and exterior, including vertical application without slip.",
    substrates: ["Cement–sand render", "Concrete (cured)", "Cementitious screed"],
    constraints: [
      "Water demand must give a workable, non-slumping mortar on walls.",
      "Open time of at least 30 minutes is required for the E classification.",
      "Use cement grades available in India (CEM I 52.5 R per the starting formulation; equivalent local grade to be confirmed).",
      "Cost not estimated: no verified raw-material prices in ₹ are available.",
    ],
    batchKg: 25,
    sources: [S.dowTechline, S.laticrete335, S.laticrete335eu, S.is15477, S.en12004],
    literature: [
      lit(S.dowTechline.id, "C2TE starting formulation (parts by weight): OPC CEM I 52.5 R 35; silica sand 0.09–0.5 mm 38.05; silica sand 0.125–0.5 mm 23; redispersible powder (DLP 2001) 3; accelerator 0.5; methyl cellulose (WALOCEL VP-M-6604) 0.45; water demand 28%.", "Selected approach · composition", "Tentative starting point; no test results given; 2012 document pre-dates EN 12004-1:2017; water-demand basis not stated."),
      lit(S.dowTechline.id, "Class criteria restated from ISO 13007-1: C2 tensile adhesion ≥ 1 N/mm² after four storage conditions; E ≥ 0.5 N/mm² after ≥ 30 min; T slip ≤ 0.5 mm. Typical RDP: 0.5–2.5% (standard), 2.5–5% (improved), 5–25% (deformable).", "Targets · pathway comparison", "Secondary restatement of the standard."),
      lit(S.laticrete335eu.id, "Water 27–29% of powder (6.75–7.25 L per 25 kg); C2 TE S1 requirement column with EN 12004-2 clauses.", "Water demand basis · test methods", "Finished product; composition not disclosed (benchmark only)."),
      lit(S.laticrete335.id, "Benchmark at 21 °C: open time 30 min, adjustability 30 min, pot life 4 h, heavy traffic 16–24 h; claims C2TE S1 and IS 15477 Type 3 TS1.", "Benchmark · application timeline", "Typical values of a commercial product, not targets for this formulation."),
      lit(S.is15477.id, "Type 2 (vitrified tiles, porosity ≤ 3%): tensile adhesion dry ≥ 1.0, wet ≥ 1.0; shear adhesion dry ≥ 1.25, heat ageing ≥ 1.0, wet ≥ 1.0 N/mm²; slip ≤ 0.5 mm; conditioning 27 ± 2 °C, 65 ± 5% RH.", "Indian targets", "Scanned copy with OCR errors; Amendment No. 1 not reviewed."),
      lit(S.en12004.id, "EN 12004-2:2017 test methods: open time 8.1, slip 8.2, tensile adhesion 8.3, transverse deformation 8.6.", "Test methods", "Catalogue page only."),
    ],
    approaches: [
      ap({ id: "hx2-a1", name: "Standard cementitious adhesive (C1)", application: "Porous ceramic tiles, interior, small formats", advantages: "Low polymer (0.5–2.5% RDP); economical", constraints: "Does not meet C2 adhesion for vitrified tiles", sourceIds: [S.dowTechline.id], recommendation: "Not recommended" }),
      ap({ id: "hx2-a2", name: "Improved polymer-modified adhesive (C2TE)", application: "Vitrified and porcelain tiles, walls and floors, interior/exterior", advantages: "Disclosed starting formulation; meets the objective's class; slip and open-time control from cellulose ether", constraints: "Needs CEM I 52.5 R or equivalent; 3% RDP raises cost", sourceIds: [S.dowTechline.id, S.laticrete335eu.id], recommendation: "Recommended" }),
      ap({ id: "hx2-a3", name: "Highly deformable adhesive (C2TE S1/S2)", application: "Large-format tiles, facades, heated floors", advantages: "Accommodates substrate movement", constraints: "RDP 5–25%; higher cost and water demand; beyond current objective", sourceIds: [S.dowTechline.id, S.laticrete335.id], recommendation: "Alternative" }),
    ],
    selectedApproachId: "hx2-a2",
    rationale: "The C2TE target for low-porosity tiles is met in the literature by the 'improved quality' range (2.5–5% RDP, 0.35–0.8% cellulose ether). Dow's C2TE starting formulation sits in that range and is fully disclosed, so the composition can be source-supported. Deformable S1/S2 grades are kept as a later extension.",
    parts: [{ id: "P", name: "Powder", description: "Single-component dry mortar, mixed with water on site" }],
    ingredients: [
      ing("P", "hx2-cement", "Ordinary Portland cement", "Binder", "CEM I 52.5 R (local equivalent to confirm)", 35, "source", "Source-supported", "Dow Techline 9 C2TE", { sourceId: S.dowTechline.id, compatibility: "Alkaline when wet; polymer and cellulose ether grades must be cement-compatible." }),
      ing("P", "hx2-sand1", "Silica sand", "Filler", "0.09–0.5 mm", 38.05, "source", "Source-supported", "Dow Techline 9 C2TE", { sourceId: S.dowTechline.id, compatibility: "Grading affects water demand and slip." }),
      ing("P", "hx2-sand2", "Silica sand", "Filler", "0.125–0.5 mm", 23, "source", "Source-supported", "Dow Techline 9 C2TE", { sourceId: S.dowTechline.id }),
      ing("P", "hx2-rdp", "Redispersible polymer powder", "Polymer modifier", "DLP 2001 or equivalent VAE powder", 3, "source", "Source-supported", "Dow Techline 9 C2TE", { sourceId: S.dowTechline.id, compatibility: "Improves adhesion and deformability; check air content and water demand when changing grade." }),
      ing("P", "hx2-acc", "Accelerator", "Accelerator", "Grade not specified in source (e.g. calcium formate)", 0.5, "source", "Needs supplier data", "Dow Techline 9 C2TE", { sourceId: S.dowTechline.id, compatibility: "Identity not given in the source; confirm with supplier." }),
      ing("P", "hx2-mc", "Methyl cellulose ether", "Water retention / thickener", "WALOCEL VP-M-6604 or equivalent MHEC", 0.45, "source", "Source-supported", "Dow Techline 9 C2TE", { sourceId: S.dowTechline.id, compatibility: "Controls water retention, open time and slip; higher doses retard setting." }),
    ],
    water: { pctOfPowder: 28, evidence: "source", sourceId: S.dowTechline.id, note: "Dow states 'water demand 28%'; treated as % of dry powder, consistent with Laticrete Europe's 27–29% (6.75–7.25 L per 25 kg)." },
    ratioChecks: [],
    process: [
      step("Raw-material check", "Calibrated balance", "Before weighing", "Confirm cement grade and age, sand grading and additive lot against the formulation table", "Not stated", "Certificates match the specification", "illustrative"),
      step("Weigh", "Calibrated balance", "1 · cement and sand; 2 · minor additives", "Weigh each ingredient to the batch quantities", "Not stated", "Batch total matches the table", "illustrative"),
      step("Dry blend", "Plough-share or ribbon blender", "Fillers and cement first, then RDP, cellulose ether and accelerator", "Blend until homogeneous; pre-disperse minor additives in part of the sand", "Not stated (to be established in trials)", "Uniform colour; minor additives evenly distributed", "illustrative"),
      step("Pack", "Valve bags, 25 kg", "After blending", "Pack and seal against moisture", "Not stated", "Bag weight 25 kg ± tolerance", "illustrative"),
      step("Laboratory mixing for tests", "Mixer per EN 12004-2", "Powder into water", "Mix 28% water by powder mass using the EN 12004-2 procedure", "Per EN 12004-2 (not reproduced)", "Workable, non-slumping paste", "source", S.en12004.id),
      step("Application trial", "6 × 6 mm notched trowel", "After mixing and any rest time", "Apply ≈ 3 mm bed; place tiles within the open time", "Benchmark open time 30 min", "Full contact on lifted tile", "source", S.laticrete335.id),
    ],
    timeline: [
      tl("Mix powder with water", "0 min", "source", S.en12004.id),
      tl("Open time (benchmark product)", "≈ 30 min", "source", S.laticrete335.id, "LATICRETE 335 at 21 °C — not this formulation"),
      tl("Adjustability (benchmark)", "≈ 30 min", "source", S.laticrete335.id),
      tl("Pot life (benchmark)", "≈ 4 h", "source", S.laticrete335.id),
      tl("Heavy traffic (benchmark)", "16–24 h", "source", S.laticrete335.id),
      tl("Tensile adhesion test age", "28 days", "source", S.dowTechline.id),
    ],
    tests,
    trials: trials(tests, [
      { name: "T1 · Dow C2TE starting formulation", change: "None (control)", purpose: "Baseline against all C2TE and IS Type 2 targets" },
      { name: "T2 · Higher polymer", change: "RDP 3 → 4%, sand 0.09–0.5 mm −1% (illustrative)", purpose: "Adhesion margin after water and heat ageing" },
      { name: "T3 · Water-demand check", change: "Water 26% and 30% at the same powder", purpose: "Effect of water on slip and open time" },
    ]),
    assumptions: [
      "Water demand (28%) is taken as % of dry powder; Dow does not state the basis.",
      "Processing equipment and order are general dry-mortar practice; the sources give no production procedure.",
      "CEM I 52.5 R is from the European starting formulation; an Indian equivalent must be confirmed.",
    ],
    gaps: [
      "No published test results exist for the Dow starting formulation.",
      "Accelerator identity is not given in the source.",
      "EN 12004-1:2017 criteria are taken from secondary sources (Dow 2012, Laticrete Europe).",
    ],
    recommendations: [
      { text: "Confirm an Indian cement equivalent to CEM I 52.5 R before trials.", reason: "Cement strength class affects adhesion and open time.", sourceId: S.dowTechline.id, uncertainty: "Local OPC 53 grade composition differs from CEM I.", action: { step: "describe", label: "Update constraints" } },
    ],
    deliverable: "Formulation plan, batch calculations and performance-testing matrix",
  });
})();

// ---------------------------------------------------------------------------
// HX-003 · Two-component epoxy tile grout
// ---------------------------------------------------------------------------
const hx3 = (() => {
  const notVerified = "See EN 13888-1 Table 3 (RG limits not verified)";
  const tests = [
    test({ property: "Pot life", method: "EN ISO 9514 (as used for epoxy products)", target: "≥ 45 min at 23 °C (benchmark)", targetValue: 45, targetOp: "≥", unit: "min", conditions: "23 °C, 50% RH", targetEvidence: "source", sourceId: S.kerapoxy.id }),
    test({ property: "Water cleanability", method: "ANSI A118.3 E5.1", target: "Water cleanable within working time", unit: "", conditions: "Per ANSI A118.3", targetEvidence: "source", sourceId: S.spectralock.id }),
    test({ property: "Compressive strength", method: "EN 13888-2", target: notVerified, unit: "N/mm²", conditions: "Per EN 13888-2", targetEvidence: "not-reported", sourceId: S.en13888.id }),
    test({ property: "Flexural strength", method: "EN 13888-2", target: notVerified, unit: "N/mm²", conditions: "Per EN 13888-2", targetEvidence: "not-reported", sourceId: S.en13888.id }),
    test({ property: "Abrasion resistance", method: "EN 13888-2", target: notVerified, unit: "mm³", conditions: "Per EN 13888-2", targetEvidence: "not-reported", sourceId: S.en13888.id }),
    test({ property: "Water absorption", method: "EN 13888-2", target: notVerified, unit: "g", conditions: "Per EN 13888-2", targetEvidence: "not-reported", sourceId: S.en13888.id }),
    test({ property: "Chemical resistance", method: "EN 13888-2:2022 clause 9.5", target: "Report against the agents required by the specifier", unit: "", conditions: "Per EN 13888-2", targetEvidence: "source", sourceId: S.en13888.id }),
  ];
  return finish({
    ...base,
    id: "HX-003",
    title: "Two-component epoxy tile grout",
    category: "Epoxy grout",
    task: "New formulation",
    focus: "Resin/hardener system, fillers, mixing ratio, application, cleanability and curing",
    objective: "Develop a filled, two-component epoxy grout for ceramic and porcelain tile joints with a mixing ratio set from supplier resin and hardener data, a practical cleaning window, and a test matrix aligned with EN 13888 class RG.",
    application: "Grouting joints of floor and wall tiles in kitchens, bathrooms and food areas where stain and chemical resistance are needed; applied with a rubber float and cleaned while fresh.",
    substrates: ["Ceramic and porcelain tile joints (2–10 mm)", "Tiles fixed with cementitious or epoxy adhesive"],
    constraints: [
      "No public starting formulation for epoxy grout was found: composition is illustrative and must be developed.",
      "Mixing ratio must follow supplier phr data for the chosen resin and hardener.",
      "Must be cleanable from tile faces with water before cure.",
      "Cost not estimated: no verified raw-material prices in ₹ are available.",
    ],
    batchKg: 10,
    sources: [S.epon828, S.der331, S.evonikGuide, S.dowHandbook, S.kerapoxy, S.spectralock, S.en13888],
    literature: [
      lit(S.epon828.id, "Liquid BPA epoxy, EEW 185–192 g/eq; used for chemical-resistant flooring and grouts; inert silica fillers reduce shrinkage.", "Resin selection · EEW", "2005 bulletin (third-party copy)."),
      lit(S.evonikGuide.id, "Ancamide 503 (amidoamine): AHEW 90, use level 50 phr with EEW 182–192 resin, gel time 70 min (150 g, 77 °F); listed for tile grouts.", "Hardener selection · mixing ratio", "Unfilled gel time; filled grout will differ."),
      lit(S.dowHandbook.id, "phr = AHEW × 100 / EEW; medium fillers up to 200 phr, coarse sand up to 800 phr; fumed silica as anti-settling thixotrope.", "Ratio calculation · filler loading", "1999 handbook; general guidance, not a grout recipe."),
      lit(S.kerapoxy.id, "Benchmark: A : B = 9 : 1 in pre-weighed packs; pot life 45 min at +23 °C; light foot traffic 24 h at +20 °C; in service after 4 days; chemical attack and pools after 10 days; clean while fresh with abrasive pad and water.", "Benchmark · timeline · cleaning", "Finished product; composition only described generally (epoxy resin, silica sand, special components)."),
      lit(S.spectralock.id, "Three-part kit (A, B, powder C); water cleanable at 80 min (ANSI A118.3 E5.1); working time 120 / 80 / 30 min at 4 / 21 / 35 °C.", "Benchmark · cleanability · temperature effect", "Finished product; different packaging (three parts)."),
      lit(S.en13888.id, "Reaction resin grout (RG) defined; RG requirements are in Table 3, which is not in the free preview; chemical resistance tested to EN 13888-2:2022, 9.5.", "Test matrix", "RG limit values not verified."),
    ],
    approaches: [
      ap({ id: "hx3-a1", name: "Amidoamine-cured BPA epoxy with graded silica (2 parts)", application: "Floor and wall tile joints, food and wet areas", advantages: "Hardener listed by its supplier for tile grouts; long gel time aids cleaning; simple two-pack format", constraints: "No disclosed grout formulation; filler grading and thixotropy must be developed", sourceIds: [S.evonikGuide.id, S.epon828.id, S.dowHandbook.id], recommendation: "Recommended" }),
      ap({ id: "hx3-a2", name: "Amine-adduct-cured epoxy (faster cure)", application: "Fast-return-to-service floors", advantages: "Faster cure", constraints: "Shorter gel time (≈ 50 min unfilled) narrows the cleaning window", sourceIds: [S.evonikGuide.id], recommendation: "Alternative" }),
      ap({ id: "hx3-a3", name: "Three-part kit (resin, hardener, filler powder)", application: "Site-mixed kits with colour powders", advantages: "Filler and colour added on site; long shelf life of components", constraints: "More mixing errors on site; outside the two-pack objective", sourceIds: [S.spectralock.id], recommendation: "Alternative" }),
    ],
    selectedApproachId: "hx3-a1",
    rationale: "Ancamide 503 is listed by its supplier for tile grouts and has a long gel time, which suits the cleaning window grouts need. Its supplier gives 50 phr with standard liquid BPA resin (EEW 182–192), so the mixing ratio can be calculated rather than guessed. Filler type follows resin-supplier and handbook guidance; exact proportions are illustrative and must be optimised in trials.",
    parts: [
      { id: "A", name: "Part A (resin + filler)", description: "Pigmented, filled epoxy paste" },
      { id: "B", name: "Part B (hardener)", description: "Liquid amidoamine hardener" },
    ],
    ingredients: [
      ing("A", "hx3-resin", "Liquid bisphenol-A epoxy resin", "Resin", "EEW 185–192 g/eq (EPON 828 / D.E.R. 331 type)", 24.0, "illustrative", "Illustrative", "Resin level chosen for a filler-rich grout; EEW from supplier data", { sourceId: S.epon828.id, compatibility: "Cure with a compatible amine at the supplier phr; store above 25 °C to avoid crystallisation (D.E.R. 331)." }),
      ing("A", "hx3-sand", "Graded silica sand", "Filler", "0.1–0.3 mm", 70.0, "illustrative", "Illustrative", "Silica filler per resin-supplier guidance; grading to suit 2–10 mm joints", { sourceId: S.dowHandbook.id, compatibility: "Inert; reduces shrinkage and exotherm." }),
      ing("A", "hx3-flour", "Silica flour", "Filler", "< 75 µm", 3.0, "illustrative", "Illustrative", "Fine fraction for packing and smooth finish", { sourceId: S.dowHandbook.id }),
      ing("A", "hx3-fumed", "Fumed silica", "Rheology modifier", "Hydrophilic, fumed", 1.5, "illustrative", "Illustrative", "Anti-settling / thixotropy per Dow handbook", { sourceId: S.dowHandbook.id, compatibility: "Prevents sand settling in the pack and sag in vertical joints." }),
      ing("A", "hx3-pigment", "Pigment", "Pigment", "To colour standard", 1.0, "illustrative", "Needs supplier data", "Colour; grade not yet selected", { compatibility: "Check colour consistency between batches and pigment wetting by the resin." }),
      ing("A", "hx3-defoamer", "Defoamer for epoxy", "Defoamer", "Grade not selected", 0.5, "illustrative", "Needs supplier data", "Reduce entrapped air from mixing", { compatibility: "Over-dosing causes surface defects." }),
      ing("B", "hx3-hardener", "Amidoamine hardener (Ancamide 503)", "Hardener", "AHEW 90 g/eq", 100.0, "source", "Source-supported", "Evonik product guide", { sourceId: S.evonikGuide.id, compatibility: "Use level 50 phr with standard liquid BPA epoxy; listed for tile grouts." }),
    ],
    mixRatio: { parts: { A: 100, B: 12 }, evidence: "calculated", sourceId: S.evonikGuide.id, note: "Part B per 100 Part A = 24% resin × 50 phr ÷ 100% hardener = 12 parts (A : B ≈ 8.33 : 1)." },
    epoxy: { resinId: "hx3-resin", hardenerId: "hx3-hardener", eew: [185, 192], eewSourceId: S.epon828.id, ahew: 90, ahewSourceId: S.evonikGuide.id, supplierPhr: 50, phrSourceId: S.evonikGuide.id },
    ratioChecks: [
      { id: "hx3-r1", label: "Filler loading (filler ÷ resin)", numeratorIds: ["hx3-sand", "hx3-flour", "hx3-fumed"], numeratorActive: false, denominatorIds: ["hx3-resin"], op: "≤", target: 8, sourceId: S.dowHandbook.id, explanation: "Dow handbook: coarse sand may be loaded up to 800 phr (8 parts per part of resin); higher loadings risk poor wetting and porosity." },
    ],
    process: [
      step("Part A dispersion", "High-speed disperser in a jacketed vessel", "1 · resin, defoamer, pigment; 2 · fumed silica; 3 · silica flour and sand gradually", "Disperse pigment and fumed silica fully before adding sand", "Not stated (establish in trials)", "Uniform colour; no lumps; target paste viscosity", "illustrative"),
      step("Pack in matched pairs", "Filling line, pre-weighed A and B packs", "A and B packed together", "Supply pre-measured packs; users must not guess quantities", "—", "Pack weights give A : B = 100 : 12", "source", S.kerapoxy.id),
      step("Site mixing", "Low-speed electric mixer", "Pour all of Part B into Part A", "Mix whole packs at low speed to avoid overheating, which shortens working time", "Until uniform colour", "No streaks; full packs used", "source", S.kerapoxy.id),
      step("Application", "Hard rubber float", "Immediately after mixing", "Fill joints fully; remove excess diagonally", "Within pot life (benchmark 45 min at 23 °C)", "Joints full and flush", "source", S.kerapoxy.id),
      step("Cleaning", "Abrasive pad, sponge, clean water", "While fresh, before hardening", "Wet surface, emulsify residues, remove with sponge; hardened residue can only be removed mechanically or with a dedicated remover", "Within working time", "No film on tile faces", "source", S.kerapoxy.id),
      step("Curing", "—", "After cleaning", "Protect from traffic, water and chemicals during cure", "Benchmark: 24 h foot traffic; 10 days chemicals", "Hard, tack-free joints", "source", S.kerapoxy.id),
    ],
    timeline: [
      tl("Mix A + B", "0 min", "source", S.kerapoxy.id),
      tl("Pot life (benchmark)", "45 min at +23 °C", "source", S.kerapoxy.id, "Mapei Kerapoxy — not this formulation"),
      tl("Gel time of hardener (unfilled)", "70 min, 150 g at 77 °F", "source", S.evonikGuide.id),
      tl("Light foot traffic (benchmark)", "24 h at +20 °C", "source", S.kerapoxy.id),
      tl("Ready for use (benchmark)", "4 days", "source", S.kerapoxy.id),
      tl("Chemical exposure / pools (benchmark)", "10 days", "source", S.kerapoxy.id),
    ],
    tests,
    trials: trials(tests, [
      { name: "T1 · Planned ratio (50 phr)", change: "None (control): A : B = 100 : 12", purpose: "Baseline pot life, cleanability and strength" },
      { name: "T2 · Stoichiometric ratio", change: "Hardener at calculated 47.7 phr (A : B ≈ 100 : 11.5)", purpose: "Compare cure and chemical resistance with the supplier phr" },
      { name: "T3 · Finer filler grading", change: "Sand 70 → 60%, silica flour 3 → 13% (illustrative)", purpose: "Finish, cleanability and narrow-joint filling" },
    ]),
    assumptions: [
      "EEW mid-point (188.5 g/eq) used for the stoichiometric check; the supplier's 50 phr is used for the planned ratio.",
      "Part B is undiluted hardener; any filler in Part B would change the ratio and must be recalculated.",
      "All Part A proportions are illustrative development inputs, not a validated recipe.",
    ],
    gaps: [
      "No public epoxy grout starting formulation found.",
      "EN 13888-1 Table 3 (RG) limits not verified.",
      "Pigment and defoamer grades not selected.",
    ],
    recommendations: [
      { text: "Measure pot life and cleaning window of T1 at 23 °C and 35 °C first.", reason: "Benchmark working time falls from 80 to 30 min between 21 °C and 35 °C; Indian site temperatures are often high.", sourceId: S.spectralock.id, uncertainty: "Filled grout behaves differently from the unfilled hardener data.", action: { step: "pathways", sub: "experiment", label: "Open the test matrix" } },
    ],
    deliverable: "Component tables, mixing calculations, application plan and test matrix",
  });
})();

// ---------------------------------------------------------------------------
// HX-004 · Two-component epoxy bonding adhesive
// ---------------------------------------------------------------------------
const hx4 = (() => {
  const tests = [
    test({ property: "Tensile adhesion — dry (IS Type 5)", method: "IS 15477:2019 Annex", target: "≥ 2.0 N/mm²", targetValue: 2.0, targetOp: "≥", unit: "N/mm²", conditions: "27 ± 2 °C, 65 ± 5% RH", targetEvidence: "source", sourceId: S.is15477.id }),
    test({ property: "Shear adhesion — dry (IS Type 5)", method: "IS 15477:2019 Annex", target: "≥ 6.0 N/mm²", targetValue: 6.0, targetOp: "≥", unit: "N/mm²", conditions: "27 ± 2 °C, 65 ± 5% RH", targetEvidence: "source", sourceId: S.is15477.id }),
    test({ property: "Shear adhesion — after heat ageing (IS Type 5)", method: "IS 15477:2019 Annex", target: "≥ 3.0 N/mm²", targetValue: 3.0, targetOp: "≥", unit: "N/mm²", conditions: "Per standard", targetEvidence: "source", sourceId: S.is15477.id }),
    test({ property: "Pot life", method: "EN ISO 9514", target: "≥ 45 min at 23 °C (development target)", targetValue: 45, targetOp: "≥", unit: "min", conditions: "200 g mass, 23 °C", targetEvidence: "illustrative", sourceId: S.sikadur31.id }),
    test({ property: "Bond to damp concrete", method: "Pull-off test on mat-damp concrete (method to be selected)", target: "Failure in concrete, not at the bond line", unit: "", conditions: "Concrete ≥ 28 days, mat damp", targetEvidence: "illustrative", sourceId: S.sikadur31.id }),
    test({ property: "Cure at low temperature", method: "Hardness / tack-free check at 10 °C", target: "Tack-free within the working day (to define)", unit: "", conditions: "10 °C", targetEvidence: "illustrative" }),
  ];
  return finish({
    ...base,
    id: "HX-004",
    title: "Two-component epoxy bonding adhesive",
    category: "Epoxy adhesive",
    task: "New formulation",
    focus: "Bonding application, substrate preparation, component compatibility, pot life and cure performance",
    objective: "Develop a thixotropic two-component epoxy adhesive with an easy 2 : 1 mixing ratio for bonding tiles, stone and fixtures to concrete, metal and existing tiles, targeting IS 15477 Type 5 adhesion.",
    application: "Spot or full-bed bonding where cementitious adhesives are unsuitable: tiles on metal or glass, stone cladding pins and repairs, tile-on-tile, and bonding to mat-damp concrete.",
    substrates: ["Concrete (≥ 28 days, laitance removed)", "Steel (blast-cleaned)", "Existing ceramic tiles (abraded)", "Natural stone"],
    constraints: [
      "Mixing ratio 2 : 1 by weight for site convenience (design choice; supported by the calculated hardener demand).",
      "Components in contrasting colours so mixing can be checked visually.",
      "Must bond to mat-damp concrete.",
      "Cost not estimated: no verified raw-material prices in ₹ are available.",
    ],
    batchKg: 6,
    sources: [S.der331, S.evonikGuide, S.dowHandbook, S.sikadur31, S.latapoxy300, S.is15477],
    literature: [
      lit(S.der331.id, "Liquid BPA epoxy, EEW 182–192 g/eq, viscosity 11 000–14 000 mPa·s; store above 25 °C to avoid crystallisation.", "Resin selection", "Older third-party copy of the data sheet."),
      lit(S.evonikGuide.id, "Ancamine MCA: AHEW 101, use level 55 phr with EEW 182–192 resin, gel time 32 min; noted for adhesion to cold, damp concrete and concrete bonding.", "Hardener selection · ratio", "Unfilled data; values read from a product-guide table row."),
      lit(S.dowHandbook.id, "phr = AHEW × 100 / EEW; fumed silica gives thixotropy and anti-settling.", "Ratio calculation · rheology", "General guidance."),
      lit(S.sikadur31.id, "Benchmark: A : B = 2 : 1 by weight or volume, contrasting colours; pot life ≈ 55 min at +23 °C (200 g); mix ≥ 3 min at ≤ 300 rpm; concrete ≥ 28 days, clean, laitance-free, dry or mat damp; steel to Sa 2.5; ≥ 3 °C above dew point.", "Benchmark · substrate preparation · mixing", "Finished product; composition not disclosed."),
      lit(S.latapoxy300.id, "Benchmark: R2T / IS 15477 Type 5 claims; substrate clean, sound, 28-day-old concrete; grout after at least 24 h at 21 °C; pot life 45 min.", "Benchmark · tile bonding use", "Three-component kit; finished product."),
      lit(S.is15477.id, "Type 5 (resin adhesives for glass/metal substrates): tensile adhesion dry ≥ 2.0; shear adhesion dry ≥ 6.0, after heat ageing ≥ 3.0 N/mm².", "Targets", "Scanned copy; Amendment No. 1 not reviewed."),
    ],
    approaches: [
      ap({ id: "hx4-a1", name: "Cycloaliphatic-amine-cured BPA epoxy, filled and thixotropic, 2 : 1", application: "Tiles, stone and fixtures on concrete, metal and tiles, including damp concrete", advantages: "Hardener noted for damp-concrete bonding; simple 2 : 1 ratio; non-sag paste", constraints: "Gel time ≈ 32 min unfilled — pot life needs checking at high temperature", sourceIds: [S.evonikGuide.id, S.der331.id, S.sikadur31.id], recommendation: "Recommended" }),
      ap({ id: "hx4-a2", name: "Amidoamine-cured epoxy (long pot life)", application: "Large-area bonding in hot conditions", advantages: "Longer working time", constraints: "Slower cure; weaker damp-surface claims", sourceIds: [S.evonikGuide.id], recommendation: "Alternative" }),
      ap({ id: "hx4-a3", name: "Reactive cementitious adhesive (Type 3)", application: "Tiles on concrete only", advantages: "Lower cost, water clean-up", constraints: "Not suitable for metal or glass substrates (Type 5 use)", sourceIds: [S.is15477.id], recommendation: "Not recommended" }),
    ],
    selectedApproachId: "hx4-a1",
    rationale: "The target substrates include metal and damp concrete, which require a reaction-resin (IS Type 5) adhesive. Ancamine MCA is noted by its supplier for bonding to cold, damp concrete. With 60% resin in Part A, 55 phr hardener and 66% hardener in Part B, the calculated ratio is exactly 2 : 1 — matching the convenient ratio of the benchmark product.",
    parts: [
      { id: "A", name: "Part A (resin)", description: "Filled, thixotropic epoxy paste — white" },
      { id: "B", name: "Part B (hardener)", description: "Filled, thixotropic hardener paste — grey" },
    ],
    ingredients: [
      ing("A", "hx4-resin", "Liquid bisphenol-A epoxy resin", "Resin", "EEW 182–192 g/eq (D.E.R. 331 type)", 60.0, "illustrative", "Illustrative", "Resin level for a high-strength paste; EEW from supplier data", { sourceId: S.der331.id, compatibility: "Store above 25 °C to avoid crystallisation." }),
      ing("A", "hx4-flourA", "Silica flour", "Filler", "< 75 µm", 36.0, "illustrative", "Illustrative", "Inert filler for body and reduced exotherm", { sourceId: S.dowHandbook.id }),
      ing("A", "hx4-fumedA", "Fumed silica", "Rheology modifier", "Hydrophilic, fumed", 3.0, "illustrative", "Illustrative", "Thixotropy for non-sag application", { sourceId: S.dowHandbook.id }),
      ing("A", "hx4-white", "Titanium dioxide pigment", "Pigment", "Rutile", 1.0, "illustrative", "Needs supplier data", "White colour for mix control" ),
      ing("B", "hx4-hardener", "Cycloaliphatic amine hardener (Ancamine MCA)", "Hardener", "AHEW 101 g/eq", 66.0, "illustrative", "Illustrative", "Level set so that A : B = 2 : 1 delivers the supplier's 55 phr", { sourceId: S.evonikGuide.id, compatibility: "Supplier notes adhesion to cold, damp concrete; protect from moisture and CO₂ during storage." }),
      ing("B", "hx4-flourB", "Silica flour", "Filler", "< 75 µm", 31.0, "illustrative", "Illustrative", "Body to match Part A consistency", { sourceId: S.dowHandbook.id }),
      ing("B", "hx4-fumedB", "Fumed silica", "Rheology modifier", "Hydrophilic, fumed", 2.0, "illustrative", "Illustrative", "Thixotropy", { sourceId: S.dowHandbook.id }),
      ing("B", "hx4-black", "Carbon black / grey pigment", "Pigment", "To contrast with Part A", 1.0, "illustrative", "Needs supplier data", "Contrasting colour for mix control" ),
    ],
    mixRatio: { parts: { A: 2, B: 1 }, evidence: "calculated", sourceId: S.evonikGuide.id, note: "Part B per Part A = 60% resin × 55 phr ÷ 66% hardener = 0.50 → A : B = 2 : 1." },
    epoxy: { resinId: "hx4-resin", hardenerId: "hx4-hardener", eew: [182, 192], eewSourceId: S.der331.id, ahew: 101, ahewSourceId: S.evonikGuide.id, supplierPhr: 55, phrSourceId: S.evonikGuide.id },
    ratioChecks: [],
    process: [
      step("Part A and B manufacture", "Planetary or dual-shaft mixer under vacuum", "1 · liquids; 2 · pigment; 3 · fumed silica; 4 · silica flour", "Disperse fully; de-aerate under vacuum", "Not stated (establish in trials)", "Smooth, non-sag paste in each part", "illustrative"),
      step("Pack", "Twin packs or cartridges", "A and B in matched pairs", "Pack in contrasting colours at 2 : 1 by weight", "—", "Pack weights give 2 : 1", "source", S.sikadur31.id),
      step("Substrate preparation", "Grinder, blast equipment, vacuum", "Before mixing", "Concrete ≥ 28 days, sound, laitance-free, dry or mat damp; steel blast-cleaned to Sa 2.5; existing tiles abraded and degreased", "—", "Substrate ≥ 3 °C above dew point", "source", S.sikadur31.id),
      step("Site mixing", "Slow-speed drill with paddle (≤ 300 rpm)", "Add all of Part B to Part A", "Mix to a uniform colour; avoid aeration", "≥ 3 min", "Uniform grey with no streaks", "source", S.sikadur31.id),
      step("Application", "Notched trowel or spatula", "Immediately after mixing", "Apply to the substrate (and back-butter for full contact); place and press within open time", "Within pot life", "Full contact; no squeeze-out left on faces", "source", S.latapoxy300.id),
      step("Cure", "—", "After placement", "Do not load or grout until cured", "Grout after ≥ 24 h at 21 °C (benchmark)", "Hard, tack-free bond line", "source", S.latapoxy300.id),
    ],
    timeline: [
      tl("Concrete age before bonding", "≥ 28 days", "source", S.sikadur31.id),
      tl("Mix A + B", "≥ 3 min", "source", S.sikadur31.id),
      tl("Gel time of hardener (unfilled)", "32 min", "source", S.evonikGuide.id),
      tl("Pot life (benchmark)", "≈ 55 min at +23 °C, 200 g", "source", S.sikadur31.id, "Sikadur-31 — not this formulation"),
      tl("Grout tiles (benchmark)", "≥ 24 h at 21 °C", "source", S.latapoxy300.id),
    ],
    tests,
    trials: trials(tests, [
      { name: "T1 · Planned 2 : 1", change: "None (control)", purpose: "Baseline adhesion and pot life" },
      { name: "T2 · Stoichiometric hardener", change: "Hardener at calculated 54.0 phr (B ≈ 49% of A)", purpose: "Compare cure and heat-aged shear" },
      { name: "T3 · Damp substrate", change: "Same mix on mat-damp vs dry concrete", purpose: "Confirm bond to damp concrete" },
    ]),
    assumptions: [
      "All proportions are illustrative development inputs; no public epoxy adhesive formulation was found.",
      "EEW mid-point 187 g/eq used for the stoichiometric check.",
      "Benchmark times and pot life describe commercial products, not this formulation.",
    ],
    gaps: [
      "No public epoxy adhesive starting formulation.",
      "Ancamine MCA values were read from a product-guide table; confirm with its individual TDS.",
      "Pull-off test method for damp concrete not yet selected.",
    ],
    recommendations: [
      { text: "Check pot life of T1 at 35 °C before scaling the batch.", reason: "The hardener's unfilled gel time is only 32 min; larger masses and higher temperatures shorten pot life.", sourceId: S.sikadur31.id, uncertainty: "Fillers extend pot life somewhat; measure rather than estimate.", action: { step: "pathways", sub: "experiment", label: "Open the test matrix" } },
    ],
    deliverable: "Formulation-development plan and bond-performance testing matrix",
  });
})();

// ---------------------------------------------------------------------------
// HX-005 · Cementitious waterproofing coating
// ---------------------------------------------------------------------------
const hx5 = (() => {
  const tests = [
    test({ property: "Initial tensile adhesion", method: "EN 14891 A.6.2", target: "≥ 0.5 N/mm²", targetValue: 0.5, targetOp: "≥", unit: "N/mm²", conditions: "Standard conditions", targetEvidence: "source", sourceId: S.en14891.id }),
    test({ property: "Tensile adhesion after water contact", method: "EN 14891 A.6.3", target: "≥ 0.5 N/mm²", targetValue: 0.5, targetOp: "≥", unit: "N/mm²", conditions: "After water immersion", targetEvidence: "source", sourceId: S.mapelastic.id }),
    test({ property: "Water impermeability", method: "EN 14891 A.7", target: "No penetration", unit: "", conditions: "Under pressure, per standard", targetEvidence: "source", sourceId: S.en14891.id }),
    test({ property: "Crack-bridging at +23 °C", method: "EN 14891 A.8.2", target: "≥ 0.75 mm", targetValue: 0.75, targetOp: "≥", unit: "mm", conditions: "+23 °C", targetEvidence: "source", sourceId: S.en14891.id }),
    test({ property: "Crack-bridging at low temperature", method: "EN 14891 A.8.3", target: "≥ 0.75 mm", targetValue: 0.75, targetOp: "≥", unit: "mm", conditions: "Low temperature per class (−5 °C or −20 °C)", targetEvidence: "source", sourceId: S.mapelastic.id }),
    test({ property: "Pot life", method: "Consistency check over time", target: "≥ 40 min at 30 °C (development target)", targetValue: 40, targetOp: "≥", unit: "min", conditions: "30 °C", targetEvidence: "illustrative", sourceId: S.pidifin.id }),
  ];
  return finish({
    ...base,
    id: "HX-005",
    title: "Cementitious waterproofing coating",
    category: "Waterproofing coating",
    task: "New formulation",
    focus: "Binder system, modifiers, application, adhesion, curing and water resistance",
    objective: "Develop a flexible two-component polymer-modified cementitious coating for wet areas and terraces, applied in two coats beneath tiles, with a test matrix aligned to EN 14891 class CM.",
    application: "Brush-applied waterproofing of bathrooms, balconies, terraces and water tanks beneath tile adhesive; two coats of about 1 mm with fibre mesh at corners.",
    substrates: ["Concrete", "Cement–sand plaster and screed", "Brick masonry (plastered)"],
    constraints: [
      "Polymer solids : cement must exceed 0.6 for flexibility (literature guide).",
      "No public supplier formulation table was found; composition is illustrative within patent-disclosed ranges.",
      "No Indian Standard specifies this coating type (IS 2645 covers integral admixtures).",
      "Cost not estimated: no verified raw-material prices in ₹ are available.",
    ],
    batchKg: 15,
    sources: [S.basfPatent, S.acronal, S.wacker, S.pidifin, S.sikatop, S.mapelastic, S.en14891, S.is2645],
    literature: [
      lit(S.basfPatent.id, "Typical 2K slurry: dry part 10–50% silica sand, 30–50% Portland cement, 0–50% limestone, 0–20% calcium aluminate cement, 0–10% additives; wet part 30–70% polymer; wet : dry 1 : 2 to 3 : 1; polymer/cement > 0.6 needed for flexibility; two coats ≈ 1 mm each.", "Composition ranges · ratio check", "Patent description of prior art; not a validated product."),
      lit(S.acronal.id, "Styrene-acrylic dispersion for flexible cementitious membranes; solids 52.5–54.5%; crosslinks in alkaline pH for crack bridging; thickener can go in the dry component.", "Polymer selection · active content", "Raw-material data; dosage not specified."),
      lit(S.wacker.id, "2K systems combine a dry-mix powder (cement, fillers, additives) with a polymer dispersion on site.", "System structure", "Marketing brochure."),
      lit(S.pidifin.id, "Benchmark: 1 part polymer : 2 parts powder; add powder slowly to liquid; do not part-mix or dilute; second coat 6–8 h later, perpendicular; fibre mesh at fillets; air cure 3–5 days; pond test after curing; pot life 40 min at 30 °C.", "Benchmark · process · timeline", "Finished product; composition only described generally."),
      lit(S.sikatop.id, "Benchmark: liquid : powder = 1 : 4; ≈ 1.5 kg/m² per coat; cure at least 7 days.", "Benchmark · ratio comparison", "Finished product; less flexible type."),
      lit(S.mapelastic.id, "Benchmark: liquid : powder = 1 : 3; second layer after 4–5 h; EN 14891 CM O2 P requirements: adhesion ≥ 0.5 N/mm², crack bridging ≥ 0.75 mm at +23 °C and −20 °C, no water penetration.", "Targets · benchmark", "Finished product."),
      lit(S.en14891.id, "EN 14891: CM = cementitious; all adhesion tests ≥ 0.5 N/mm², crack bridging ≥ 0.75 mm, no water penetration; O = low-temperature crack bridging; P = chlorinated water.", "Targets", "Secondary summary of the 2007 edition."),
      lit(S.is2645.id, "Covers integral waterproofing compounds dosed into mortar and concrete (≤ 3% of cement), not surface coatings.", "Standards gap", "Not applicable as a specification for this coating."),
    ],
    approaches: [
      ap({ id: "hx5-a1", name: "Flexible 2K acrylic–cement coating (liquid : powder 1 : 2)", application: "Wet areas, terraces and tanks beneath tiles", advantages: "High polymer/cement ratio gives flexibility and crack bridging; brush applied", constraints: "Higher polymer cost; needs air curing", sourceIds: [S.basfPatent.id, S.acronal.id, S.pidifin.id], recommendation: "Recommended" }),
      ap({ id: "hx5-a2", name: "Semi-flexible 2K coating (1 : 4)", application: "Rigid substrates with low movement", advantages: "Less polymer", constraints: "Polymer/cement below 0.6 — reduced flexibility", sourceIds: [S.sikatop.id, S.basfPatent.id], recommendation: "Alternative" }),
      ap({ id: "hx5-a3", name: "Integral waterproofing admixture", application: "Dosed into plaster or concrete", advantages: "No separate coating step", constraints: "Does not bridge cracks; covered by IS 2645, not this objective", sourceIds: [S.is2645.id], recommendation: "Not recommended" }),
    ],
    selectedApproachId: "hx5-a1",
    rationale: "Wet areas under tiles need crack bridging, which the literature links to polymer/cement > 0.6. A 1 : 2 liquid : powder ratio with a 53.5%-solids acrylic dispersion and 40% cement in the powder gives about 0.64. The ratio sits at the low end of the patent's range and matches the benchmark product's mixing proportion.",
    parts: [
      { id: "L", name: "Liquid (polymer)", description: "Acrylic dispersion component" },
      { id: "P", name: "Powder", description: "Cement, sand and additives" },
    ],
    ingredients: [
      ing("L", "hx5-dispersion", "Styrene-acrylic dispersion (Acronal 5442 type)", "Polymer modifier", "Solids 52.5–54.5%", 95.0, "illustrative", "Illustrative", "Within the patent's 30–70% polymer range (as solids ≈ 51%)", { sourceId: S.acronal.id, activePct: 53.5, compatibility: "Cement-compatible; crosslinks in alkaline pH (supplier TDS)." }),
      ing("L", "hx5-defoamerL", "Liquid defoamer", "Defoamer", "Grade not selected", 0.5, "illustrative", "Needs supplier data", "Patent example uses a liquid defoamer", { sourceId: S.basfPatent.id }),
      ing("L", "hx5-water", "Water", "Carrier", "Potable", 4.5, "illustrative", "Illustrative", "Balance to 100%", {}),
      ing("P", "hx5-cement", "Ordinary Portland cement", "Binder", "OPC 43/53 grade", 40.0, "illustrative", "Illustrative", "Within patent range 30–50%", { sourceId: S.basfPatent.id, compatibility: "Alkaline; activates the dispersion crosslinking." }),
      ing("P", "hx5-sand", "Silica sand", "Filler", "0.06–0.6 mm", 45.0, "illustrative", "Illustrative", "Within patent range 10–50%", { sourceId: S.basfPatent.id }),
      ing("P", "hx5-limestone", "Limestone powder", "Filler", "Fine ground", 14.2, "illustrative", "Illustrative", "Within patent range 0–50%", { sourceId: S.basfPatent.id }),
      ing("P", "hx5-defoamerP", "Powder defoamer", "Defoamer", "Grade not selected", 0.5, "illustrative", "Needs supplier data", "Patent example uses a powder defoamer", { sourceId: S.basfPatent.id }),
      ing("P", "hx5-thickener", "Acrylic thickener (powder)", "Rheology modifier", "Grade per dispersion supplier", 0.3, "illustrative", "Needs supplier data", "Dispersion TDS recommends a dry-component rheology additive", { sourceId: S.acronal.id }),
    ],
    mixRatio: { parts: { L: 1, P: 2 }, evidence: "illustrative", sourceId: S.pidifin.id, note: "Liquid : powder = 1 : 2 by weight, within the patent's 1 : 2 – 3 : 1 range and equal to the benchmark product's proportion." },
    ratioChecks: [
      { id: "hx5-r1", label: "Polymer solids : cement", numeratorIds: ["hx5-dispersion"], numeratorActive: true, denominatorIds: ["hx5-cement"], op: ">", target: 0.6, sourceId: S.basfPatent.id, explanation: "The patent states polymer/cement > 0.6 is required for the flexibility demanded of these slurries." },
    ],
    process: [
      step("Liquid component", "Low-shear stirrer, closed vessel", "1 · dispersion; 2 · defoamer; 3 · water", "Stir gently to avoid foam", "Not stated", "Homogeneous, foam-free liquid", "illustrative"),
      step("Powder component", "Ribbon or plough-share blender", "1 · sand and limestone; 2 · cement; 3 · defoamer and thickener", "Blend until homogeneous; pack moisture-proof", "Not stated", "Uniform powder", "illustrative"),
      step("Site mixing", "Slow-speed drill with paddle", "Powder slowly into the liquid under continuous stirring", "Use full packs; do not part-mix; do not dilute", "Until lump-free", "Smooth, brushable slurry", "source", S.pidifin.id),
      step("First coat", "Stiff nylon brush", "On pre-wetted, sound substrate", "Apply evenly; embed glass-fibre mesh at angle fillets and corners", "Within pot life (benchmark 40 min at 30 °C)", "Continuous film, about 1 mm", "source", S.pidifin.id),
      step("Second coat", "Stiff nylon brush", "Perpendicular to the first coat", "Apply when the first coat has set", "6–8 h after first coat (benchmark)", "Pinhole-free film, total ≈ 2 mm", "source", S.pidifin.id),
      step("Curing and water test", "—", "After second coat", "Air cure; do not flood-cure; pond test only after full cure", "3–5 days (benchmark)", "No leakage in pond test", "source", S.pidifin.id),
    ],
    timeline: [
      tl("Mix powder into liquid", "0 min", "source", S.pidifin.id),
      tl("Pot life (benchmark)", "≈ 40 min at 30 °C", "source", S.pidifin.id, "Dr. Fixit Pidifin 2K — not this formulation"),
      tl("Second coat (benchmark)", "6–8 h", "source", S.pidifin.id),
      tl("Air cure (benchmark)", "3–5 days", "source", S.pidifin.id),
      tl("Pond test / tiling (benchmark)", "After 3–5 days (tiling after ≈ 5 days in another benchmark)", "source", S.mapelastic.id),
    ],
    tests,
    trials: trials(tests, [
      { name: "T1 · Planned 1 : 2", change: "None (control): polymer/cement ≈ 0.64", purpose: "Baseline adhesion, crack bridging and impermeability" },
      { name: "T2 · Leaner 1 : 3", change: "Liquid : powder 1 : 3 (polymer/cement ≈ 0.42)", purpose: "Show the effect of falling below 0.6 on crack bridging" },
      { name: "T3 · Limestone to sand", change: "Limestone 14.2 → 4.2%, sand 45 → 55% (illustrative)", purpose: "Effect of filler on brushability and pinholes" },
    ]),
    assumptions: [
      "Dispersion solids taken as the mid-point of the supplier range (53.5%).",
      "All proportions are illustrative within patent ranges; no supplier table was available.",
      "Benchmark times describe a commercial product, not this formulation.",
    ],
    gaps: [
      "No public supplier starting formulation with a stated liquid : powder ratio.",
      "EN 14891 current edition not read; criteria from a 2007 summary and a manufacturer's requirement column.",
      "No Indian Standard for 2K cementitious coatings identified.",
    ],
    recommendations: [
      { text: "Include T2 (1 : 3) in the first trial round to confirm the polymer/cement threshold for this dispersion.", reason: "The > 0.6 guide comes from a patent and may differ for other polymers.", sourceId: S.basfPatent.id, uncertainty: "Crack bridging also depends on film thickness and curing.", action: { step: "pathways", sub: "experiment", label: "Review trials" } },
    ],
    deliverable: "Formulation plan, processing sequence, application infographic and test matrix",
  });
})();

export const referenceProjects: Project[] = [hx1, hx2, hx3, hx4, hx5];
export const referenceIds = new Set(referenceProjects.map((p) => p.id));
