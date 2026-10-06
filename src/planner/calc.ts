import type {
  CuratedRecommendation,
  Evidence,
  Ingredient,
  PathwaySubstep,
  Project,
  WorkflowStep,
} from "./model";

export const TOLERANCE = 0.01;

export function fmt(n: number | null | undefined, d = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
}
export const fmtPct = (n: number, d = 1) => `${fmt(n, d)}%`;
export const formatINR = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v)
    ? "Not estimated"
    : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

export const evidenceLabel: Record<Evidence, string> = {
  source: "Source-reported",
  calculated: "Calculated",
  illustrative: "Illustrative input",
  "not-reported": "Not reported",
};

// ---------------------------------------------------------------------------
// Composition and batch quantities
// ---------------------------------------------------------------------------

export interface PartCalc {
  partId: string;
  name: string;
  /** Sum of the defined wt.% values. */
  total: number;
  missing: Ingredient[];
  balanced: boolean;
  /** Mass of this part in the batch, kg. */
  massKg: number;
  /** Share of the mixed system, %. */
  sharePct: number;
}

export interface LineCalc {
  ingredient: Ingredient;
  qtyKg: number | null;
  activeKg: number | null;
  /** Share of the whole mixed system, %. */
  systemPct: number | null;
}

export interface EpoxyCalc {
  eewMid: number;
  stoichPhr: number;
  supplierPhr: number;
  /** kg of Part B needed per kg of Part A to give the supplier phr. */
  requiredBperA: number | null;
  /** Ratio actually set, kg B per kg A. */
  setBperA: number | null;
  deviationPct: number | null;
  resinPct: number | null;
  hardenerPct: number | null;
}

export interface RatioResult {
  id: string;
  label: string;
  value: number | null;
  pass: boolean | null;
  explanation: string;
}

export interface ProjectCalc {
  parts: PartCalc[];
  lines: LineCalc[];
  waterKg: number | null;
  epoxy: EpoxyCalc | null;
  ratios: RatioResult[];
  costInr: number | null;
  costComplete: boolean;
  /** "A : B = 8.00 : 1" style text, or null for single-part products. */
  mixRatioText: string | null;
}

export function projectCalc(p: Project): ProjectCalc {
  const ratioTotal = p.mixRatio
    ? p.parts.reduce((a, part) => a + (p.mixRatio!.parts[part.id] || 0), 0)
    : 0;
  const parts: PartCalc[] = p.parts.map((part) => {
    const ings = p.ingredients.filter((i) => i.partId === part.id);
    const total = ings.reduce((a, i) => a + (i.wtPct ?? 0), 0);
    const missing = ings.filter((i) => i.wtPct === null);
    const share =
      p.parts.length === 1
        ? 100
        : ratioTotal > 0
          ? ((p.mixRatio!.parts[part.id] || 0) / ratioTotal) * 100
          : 0;
    return {
      partId: part.id,
      name: part.name,
      total,
      missing,
      balanced: !missing.length && Math.abs(total - 100) <= TOLERANCE + 1e-9,
      massKg: (p.batchKg * share) / 100,
      sharePct: share,
    };
  });
  const lines: LineCalc[] = p.ingredients.map((ing) => {
    const part = parts.find((x) => x.partId === ing.partId);
    const qtyKg = ing.wtPct === null || !part ? null : (part.massKg * ing.wtPct) / 100;
    return {
      ingredient: ing,
      qtyKg,
      activeKg: qtyKg !== null && ing.activePct != null ? (qtyKg * ing.activePct) / 100 : null,
      systemPct: ing.wtPct === null || !part ? null : (ing.wtPct * part.sharePct) / 100,
    };
  });
  const waterKg =
    p.water?.pctOfPowder != null ? (p.batchKg * p.water.pctOfPowder) / 100 : null;

  let epoxy: EpoxyCalc | null = null;
  if (p.epoxy) {
    const e = p.epoxy;
    const resin = p.ingredients.find((i) => i.id === e.resinId);
    const hard = p.ingredients.find((i) => i.id === e.hardenerId);
    const eewMid = (e.eew[0] + e.eew[1]) / 2;
    const stoichPhr = (e.ahew * 100) / eewMid;
    const requiredBperA =
      resin?.wtPct && hard?.wtPct ? ((resin.wtPct / 100) * (e.supplierPhr / 100)) / (hard.wtPct / 100) : null;
    const a = resin && p.mixRatio?.parts[resin.partId];
    const b = hard && p.mixRatio?.parts[hard.partId];
    const setBperA = a && b ? b / a : null;
    epoxy = {
      eewMid,
      stoichPhr,
      supplierPhr: e.supplierPhr,
      requiredBperA,
      setBperA,
      deviationPct: requiredBperA && setBperA ? ((setBperA - requiredBperA) / requiredBperA) * 100 : null,
      resinPct: resin?.wtPct ?? null,
      hardenerPct: hard?.wtPct ?? null,
    };
  }

  const ratios: RatioResult[] = p.ratioChecks.map((r) => {
    const sum = (ids: string[], active: boolean) => {
      let total = 0;
      for (const id of ids) {
        const l = lines.find((x) => x.ingredient.id === id);
        const v = active ? l?.activeKg : l?.qtyKg;
        if (v == null) return null;
        total += v;
      }
      return total;
    };
    const num = sum(r.numeratorIds, r.numeratorActive);
    const den = sum(r.denominatorIds, false);
    const value = num !== null && den ? num / den : null;
    const pass =
      value === null
        ? null
        : r.op === ">" ? value > r.target : r.op === "≥" ? value >= r.target : r.op === "<" ? value < r.target : value <= r.target;
    return { id: r.id, label: r.label, value, pass, explanation: r.explanation };
  });

  let cost = 0,
    priced = 0;
  for (const l of lines) {
    const price = p.prices[l.ingredient.id];
    if (!price || l.qtyKg === null) continue;
    cost += price.rate * l.qtyKg;
    priced++;
  }
  const mixRatioText =
    p.parts.length > 1 && p.mixRatio
      ? `${p.parts.map((x) => x.name.split(" (")[0]).join(" : ")} = ${p.parts.map((x) => fmt(p.mixRatio!.parts[x.id] ?? 0, (p.mixRatio!.parts[x.id] ?? 0) % 1 ? 2 : 0)).join(" : ")} by weight`
      : null;
  return {
    parts,
    lines,
    waterKg,
    epoxy,
    ratios,
    costInr: priced ? cost : null,
    costComplete: priced > 0 && priced === lines.filter((l) => l.qtyKg !== null).length,
    mixRatioText,
  };
}

/** Amount needed to bring a part to exactly 100% by changing one ingredient. */
export function balanceProposal(p: Project, partId: string) {
  const c = projectCalc(p).parts.find((x) => x.partId === partId);
  if (!c || c.missing.length || c.balanced) return null;
  const ings = p.ingredients.filter((i) => i.partId === partId && i.wtPct !== null);
  const filler =
    ings.filter((i) => i.function === "Filler" || i.function === "Carrier").sort((a, b) => (b.wtPct ?? 0) - (a.wtPct ?? 0))[0] ||
    ings.sort((a, b) => (b.wtPct ?? 0) - (a.wtPct ?? 0))[0];
  if (!filler) return null;
  const next = (filler.wtPct ?? 0) + (100 - c.total);
  if (next < 0) return null;
  return { ingredient: filler, from: filler.wtPct ?? 0, to: Math.round(next * 1000) / 1000 };
}

// ---------------------------------------------------------------------------
// Review validation and status
// ---------------------------------------------------------------------------

export interface Check {
  step: WorkflowStep;
  substep?: PathwaySubstep;
  message: string;
}

const httpsUrl = (u: string) => /^https:\/\/[^\s]+\.[^\s]+/.test(u.trim());

export function validate(p: Project, calc = projectCalc(p)): Check[] {
  const c: Check[] = [];
  if (p.title.trim().length < 3) c.push({ step: "type", message: "Enter a project title of at least 3 characters." });
  if (!p.categoryId || !p.subcategoryId) c.push({ step: "type", message: "Choose a product category and product family." });
  if (!p.category) c.push({ step: "type", message: "Choose a formulation type." });
  if (!p.task) c.push({ step: "type", message: "Choose the formulation task." });
  const selected = p.sources.filter((s) => s.selected);
  if (!selected.length) c.push({ step: "sources", message: "Select at least one data source." });
  for (const s of selected)
    if (!httpsUrl(s.url)) c.push({ step: "sources", message: `“${s.title}” needs a full https:// link.` });
  if (p.objective.trim().length < 10) c.push({ step: "describe", message: "Describe the objective in at least one sentence." });
  if (p.application.trim().length < 5) c.push({ step: "describe", message: "Describe where and how the product is applied." });
  if (!p.substrates.filter((x) => x.trim()).length) c.push({ step: "describe", message: "List at least one substrate or surface." });
  if (!(p.batchKg > 0)) c.push({ step: "describe", message: "Enter a batch size greater than 0 kg." });
  const used = p.literature.filter((l) => l.used);
  if (!used.length) c.push({ step: "literature", message: "Mark at least one literature record as used." });
  for (const l of used) {
    const src = p.sources.find((s) => s.id === l.sourceId);
    if (!src?.selected) c.push({ step: "literature", message: `A used record cites “${src?.title || "a missing source"}”, which is not selected in Data Sources.` });
    if (l.finding.trim().length < 5) c.push({ step: "literature", message: "Every used literature record needs a finding." });
  }
  if (!p.approaches.length) c.push({ step: "pathways", substep: "approaches", message: "Add at least one formulation approach." });
  if (!p.selectedApproachId) c.push({ step: "pathways", substep: "approaches", message: "Select the approach to develop." });
  if (p.rationale.trim().length < 10) c.push({ step: "pathways", substep: "approaches", message: "Explain why this approach was selected." });
  if (!p.componentsIdentifiedAt) c.push({ step: "pathways", substep: "components", message: "Run “Identify formulation components”." });
  if (!p.ingredients.length) c.push({ step: "pathways", substep: "components", message: "Add at least one ingredient." });
  for (const part of calc.parts) {
    if (part.missing.length)
      c.push({ step: "pathways", substep: "composition", message: `${part.name}: enter wt.% for ${part.missing.map((i) => i.name).join(", ")} (missing values are not treated as zero).` });
    else if (!part.balanced)
      c.push({ step: "pathways", substep: "composition", message: `${part.name}: composition totals ${fmt(part.total, 2)}%; it must total 100% (±${TOLERANCE}).` });
  }
  if (p.parts.length > 1 && (!p.mixRatio || p.parts.some((x) => !(p.mixRatio!.parts[x.id] > 0))))
    c.push({ step: "pathways", substep: "composition", message: "Set the mixing ratio between the components." });
  if (!p.process.length) c.push({ step: "pathways", substep: "process", message: "Add at least one processing stage." });
  if (!p.tests.length) c.push({ step: "pathways", substep: "experiment", message: "Add at least one performance test." });
  for (const t of p.tests)
    if (!t.method.trim() || !t.target.trim())
      c.push({ step: "pathways", substep: "experiment", message: `${t.property || "A test"}: add a test method and an acceptance criterion.` });
  if (!p.trials.length) c.push({ step: "pathways", substep: "experiment", message: "Add at least one trial batch." });
  return c;
}

export function inputsHash(p: Project) {
  const { plan: _a, updated: _b, created: _c, ...rest } = p;
  void _a;
  void _b;
  void _c;
  const text = JSON.stringify(rest);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export type PlanStatus = "Draft" | "In progress" | "Ready to create" | "Completed" | "Plan out of date";

export function planStatus(p: Project, checks = validate(p)): PlanStatus {
  if (p.plan) return p.plan.inputsHash === inputsHash(p) ? "Completed" : "Plan out of date";
  if (!checks.length) return "Ready to create";
  if (!p.title.trim() || !p.category) return "Draft";
  return "In progress";
}

/** Experimental validation is only claimed when measured results exist. */
export function validationStatus(p: Project) {
  const measured = p.trials.reduce((n, t) => n + Object.values(t.results).filter((v) => v !== null).length, 0);
  return measured ? `Partly performed (${measured} result${measured === 1 ? "" : "s"} entered)` : "Not performed";
}

export const substepDone = (p: Project, sub: PathwaySubstep, checks = validate(p)) =>
  !checks.some((x) => x.step === "pathways" && x.substep === sub);
export function stepDone(p: Project, step: WorkflowStep, checks = validate(p)) {
  if (step === "review") return checks.length === 0;
  if (step === "create") return planStatus(p, checks) === "Completed";
  return !checks.some((x) => x.step === step);
}

// ---------------------------------------------------------------------------
// Recommendations: each has a reason, evidence, uncertainty and next action
// ---------------------------------------------------------------------------

export interface RecommendationView extends CuratedRecommendation {
  proposal?: { partId: string; ingredientId: string; from: number; to: number };
}

export function recommendations(p: Project, calc = projectCalc(p)): RecommendationView[] {
  const out: RecommendationView[] = [];
  for (const part of calc.parts) {
    const prop = balanceProposal(p, part.partId);
    if (prop)
      out.push({
        text: `${part.name} totals ${fmt(part.total, 2)}%. Proposed: change ${prop.ingredient.name} from ${fmt(prop.from, 2)}% to ${fmt(prop.to, 2)}% to balance it to 100%.`,
        reason: "Batch quantities are only meaningful when each component totals 100% on its stated basis.",
        uncertainty: "Changing the main filler shifts binder and additive proportions slightly; re-check workability.",
        action: { step: "pathways", sub: "composition", label: "Review composition" },
        proposal: { partId: part.partId, ingredientId: prop.ingredient.id, from: prop.from, to: prop.to },
      });
    if (part.missing.length)
      out.push({
        text: `Define wt.% for ${part.missing.map((i) => i.name).join(", ")} in ${part.name}.`,
        reason: "Missing amounts are shown as missing, never treated as zero, so the batch cannot be calculated yet.",
        uncertainty: "Use supplier dosage guidance where available.",
        action: { step: "pathways", sub: "composition", label: "Enter amounts" },
      });
  }
  const needs = p.ingredients.filter((i) => i.review === "Needs supplier data");
  if (needs.length)
    out.push({
      text: `Request supplier data (TDS/SDS, active content, recommended dosage) for: ${needs.map((i) => i.name).join(", ")}.`,
      reason: "These ingredients have no supporting document in the project yet.",
      uncertainty: "Grades with the same function can differ in solids, dosage and compatibility.",
      action: { step: "sources", label: "Add a data source" },
    });
  if (calc.epoxy && calc.epoxy.deviationPct !== null && Math.abs(calc.epoxy.deviationPct) > 2)
    out.push({
      text: `The set mixing ratio gives ${fmt(calc.epoxy.deviationPct, 1)}% ${calc.epoxy.deviationPct > 0 ? "more" : "less"} hardener than the supplier's ${calc.epoxy.supplierPhr} phr recommendation.`,
      reason: "Off-ratio resin/hardener mixes can cure incompletely and lose strength and chemical resistance.",
      sourceId: p.epoxy?.phrSourceId,
      uncertainty: "Fillers and diluents may justify a small offset; confirm with the hardener supplier.",
      action: { step: "pathways", sub: "composition", label: "Check mixing ratio" },
    });
  for (const r of calc.ratios)
    if (r.pass === false)
      out.push({
        text: `${r.label} is ${fmt(r.value, 2)}, outside the criterion.`,
        reason: r.explanation,
        sourceId: p.ratioChecks.find((x) => x.id === r.id)?.sourceId,
        uncertainty: "The criterion is a literature guide value, not a validated limit for this formulation.",
        action: { step: "pathways", sub: "composition", label: "Adjust composition" },
      });
  if (validationStatus(p) === "Not performed")
    out.push({
      text: `Run the ${p.trials.length} planned trial batch${p.trials.length === 1 ? "" : "es"} and record results for the ${p.tests.length} tests in the matrix.`,
      reason: "No measured results exist yet, so the formulation is unvalidated.",
      uncertainty: "Targets come from standards or benchmarks; laboratory results may differ.",
      action: { step: "pathways", sub: "experiment", label: "Open the test matrix" },
    });
  return [...p.recommendations, ...out];
}

// ---------------------------------------------------------------------------
// Plan summary shared by the Create screen and the exports
// ---------------------------------------------------------------------------

export function planSummary(p: Project, calc = projectCalc(p)) {
  const approach = p.approaches.find((a) => a.id === p.selectedApproachId);
  const parts = calc.parts.map((x) => `${x.name} ${x.balanced ? "totals 100%" : `totals ${fmt(x.total, 2)}%`}`).join("; ");
  const headline = `${p.category || "Formulation"} plan: ${approach?.name ?? "no approach selected"}`;
  const bits = [
    `${p.ingredients.length} ingredients across ${p.parts.length} component${p.parts.length === 1 ? "" : "s"} (${parts}).`,
    calc.mixRatioText ? `Mixing ratio ${calc.mixRatioText}.` : "",
    calc.waterKg !== null ? `Mixing water ${fmt(p.water!.pctOfPowder, 1)}% of powder (${fmt(calc.waterKg, 2)} kg per ${fmt(p.batchKg, 0)} kg batch).` : "",
    `${p.tests.length} performance tests and ${p.trials.length} trial batches are planned. Experimental validation: ${validationStatus(p).toLowerCase()}.`,
  ];
  return { headline, explanation: bits.filter(Boolean).join(" "), approach };
}
