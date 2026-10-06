import type {
  Analysis,
  Project,
  RawMaterial,
  RecipeRevision,
  SpecimenResult,
  Target,
} from "../models";
import { CURRENCY, formatINR } from "../../lib/format";
import { propertyFor } from "../../data/property-library";
export const TOTAL_TOLERANCE = 0.01;
export function recipeMetrics(
  trial: RecipeRevision,
  materials: RawMaterial[],
  ceiling?: number,
  excluded = "",
) {
  materials = trial.materialsSnapshot || materials;
  let total = 0,
    cost = 0,
    complete = true;
  const errors: string[] = [];
  for (const [id, pct] of Object.entries(trial.percentages)) {
    const m = materials.find((m) => m.id === id);
    if (!Number.isFinite(pct) || pct < 0)
      errors.push(`${m?.name || id}: enter a quantity of 0% or more`);
    total += pct;
    if (!m) {
      errors.push(`${id}: this material is not in the library`);
      complete = false;
      continue;
    }
    if (pct < m.min || pct > m.max)
      errors.push(`${m.name}: must be between ${m.min}% and ${m.max}%`);
    if (
      pct > 0 &&
      excluded
        .toLowerCase()
        .split(",")
        .some((x) => x.trim() && m.name.toLowerCase().includes(x.trim()))
    )
      errors.push(`${m.name}: excluded by the brief (hard constraint)`);
    if (
      (m.price === null || !Number.isFinite(m.price) || m.currency !== CURRENCY) &&
      pct > 0
    )
      complete = false;
    else cost += ((m.price || 0) * pct) / 100;
  }
  if (!Number.isFinite(total) || Math.abs(total - 100) > TOTAL_TOLERANCE + 1e-9)
    errors.push(`Total must equal 100% (±${TOTAL_TOLERANCE}%). It is ${Number.isFinite(total) ? total.toFixed(2) : "invalid"}%`);
  if (!Number.isFinite(trial.batchKg) || trial.batchKg <= 0)
    errors.push("Batch size must be more than 0 kg");
  if (!Number.isFinite(trial.water) || trial.water < 0)
    errors.push("Application water must be 0% or more");
  if (ceiling !== undefined && complete && cost > ceiling)
    errors.push(`Cost ${formatINR(cost)}/kg is above the ${formatINR(ceiling)}/kg ceiling`);
  return {
    total,
    cost: complete ? cost : null,
    errors,
    masses: Object.fromEntries(
      Object.entries(trial.percentages).map(([id, p]) => [
        id,
        (trial.batchKg * p) / 100,
      ]),
    ),
  };
}
export const mean = (readings: (number | null)[]) => {
  const nums = readings.filter(
    (x): x is number => x !== null && Number.isFinite(x),
  );
  // Remove representational noise at machine precision, not a scientific
  // tolerance: e.g. the mean of 0.1, 0.2, 0.3 should compare equal to 0.2.
  return nums.length
    ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toPrecision(15))
    : null;
};
export function evaluate(target: Target, result?: SpecimenResult): Analysis {
  const value = result ? mean(result.readings) : null;
  const base = { propertyId: target.propertyId, mean: value, difference: null };
  if (value === null) return { ...base, status: "Pending" };
  if (result?.readings.some((reading) => reading === null))
    return { ...base, status: "Pending" };
  if (
    result?.unit !== target.unit ||
    result.method !== target.method ||
    result.condition !== target.condition ||
    target.value.trim() === "" ||
    !Number.isFinite(Number(target.value))
  )
    return { ...base, status: "Not evaluated" };
  const n = Number(target.value),
    upper = Number(target.max);
  if (
    target.operator === "Between" &&
    (target.max.trim() === "" || !Number.isFinite(upper) || upper < n)
  )
    return { ...base, status: "Not evaluated" };
  const pass =
    target.operator === "≥"
      ? value >= n
      : target.operator === "≤"
        ? value <= n
        : target.operator === "="
          ? value === n
          : value >= n && value <= upper;
  const distance =
    target.operator === "Between"
      ? Math.min(Math.abs(value - n), Math.abs(value - upper))
      : Math.abs(value - n);
  return {
    propertyId: target.propertyId,
    mean: value,
    difference: value - n,
    status: pass
      ? "Pass"
      : target.tolerance !== undefined && distance <= target.tolerance
        ? "Borderline"
        : "Fail",
  };
}
export interface ApprovalCheck {
  /** What is wrong, in plain words. */
  message: string;
  /** How to fix it. */
  fix: string;
  /** The project step where it can be fixed. */
  stage: "Brief" | "Trials" | "Results" | "Analysis";
}
/** Every reason the latest recipe cannot be approved yet. */
export function approvalChecks(
  project: Project,
  trial: RecipeRevision | undefined,
  materials: RawMaterial[],
): ApprovalCheck[] {
  if (!trial)
    return [
      {
        message: "There is no trial recipe yet",
        fix: "Create a trial in Design · Trial plan.",
        stage: "Trials",
      },
    ];
  const { constraints } = project.brief;
  const ceilingInInr = !constraints.currency || constraints.currency === CURRENCY;
  const metrics = recipeMetrics(
    trial,
    materials,
    ceilingInInr ? Number(constraints.cost) || undefined : undefined,
    constraints.excluded,
  );
  const checks: ApprovalCheck[] = metrics.errors.map((message) => ({
    message,
    fix: "Correct the recipe in Design · Trial plan.",
    stage: "Trials",
  }));
  if (metrics.cost === null)
    checks.push({
      message: "Cost is incomplete: an ingredient has no price in ₹",
      fix: "Add the missing price in Raw materials.",
      stage: "Trials",
    });
  if (constraints.cost && !ceilingInInr)
    checks.push({
      message: `The cost ceiling is in ${constraints.currency}, but prices are in ₹`,
      fix: "Re-enter the cost ceiling in ₹ in the brief.",
      stage: "Brief",
    });
  if (!project.brief.targets.length)
    checks.push({
      message: "The brief has no targets",
      fix: "Add at least one target to the brief.",
      stage: "Brief",
    });
  for (const target of project.brief.targets.filter(
    (t) => t.priority === "Must",
  )) {
    const name = propertyFor(target.propertyId)?.name || target.propertyId;
    const r = project.results.find(
      (r) => r.trialId === trial.id && r.propertyId === target.propertyId,
    );
    const needed =
      project.testPlan.find((p) => p.propertyId === target.propertyId)
        ?.specimens || 3;
    const status = r ? evaluate(target, r).status : "Pending";
    if (!r || r.readings.filter((x) => x !== null).length < needed)
      checks.push({
        message: `${name}: ${needed} specimen readings are needed`,
        fix: "Enter the missing readings in Execute · Results.",
        stage: "Results",
      });
    else if (status !== "Pass")
      checks.push({
        message:
          status === "Not evaluated"
            ? `${name}: result cannot be compared (unit, method or condition differs from the target)`
            : `${name}: does not meet the target`,
        fix:
          status === "Not evaluated"
            ? "Check the record details in Execute · Results."
            : "Plan another trial from Execute · Analysis.",
        stage: status === "Not evaluated" ? "Results" : "Analysis",
      });
    // Only list per-test sign-off once the overall review has happened;
    // otherwise the single "results need review" item below covers it.
    if (r && !r.reviewed && project.resultsReviewed)
      checks.push({
        message: `${name}: this result has not been reviewed`,
        fix: "A Reviewer must select “Mark results reviewed” in Execute · Results.",
        stage: "Results",
      });
  }
  if (!project.resultsReviewed)
    checks.push({
      message: "Results have not been reviewed",
      fix: "A Reviewer must select “Mark results reviewed” in Execute · Results.",
      stage: "Results",
    });
  if (project.needsReview)
    checks.push({
      message: "Something changed after the last review (brief, recipe or prices)",
      fix: "Review the latest results again in Execute · Results.",
      stage: "Results",
    });
  return checks;
}
export function approvalIssues(
  project: Project,
  trial: RecipeRevision | undefined,
  materials: RawMaterial[],
) {
  return approvalChecks(project, trial, materials).map((c) => c.message);
}
export interface CostLine {
  id: string;
  name: string;
  percent: number;
  massKg: number;
  price: number | null;
  /** ₹ contributed to one kg of dry blend; null when the price is missing. */
  perKg: number | null;
}
/** Per-ingredient cost contribution. Lines sum to recipeMetrics().cost. */
export function costBreakdown(
  trial: RecipeRevision,
  materials: RawMaterial[],
): CostLine[] {
  const library = trial.materialsSnapshot || materials;
  return Object.entries(trial.percentages).map(([id, percent]) => {
    const m = library.find((x) => x.id === id);
    const price =
      m && m.price !== null && m.currency === CURRENCY ? m.price : null;
    return {
      id,
      name: m?.name || id,
      percent,
      massKg: (trial.batchKg * percent) / 100,
      price,
      perKg: price === null ? null : (price * percent) / 100,
    };
  });
}
export type OutcomeKind =
  | "approved"
  | "ready"
  | "review"
  | "failing"
  | "incomplete"
  | "no-trial";
export interface Outcome {
  kind: OutcomeKind;
  headline: string;
  explanation: string;
  passCount: number;
  failCount: number;
  pendingCount: number;
  otherCount: number;
  total: number;
}
/** The single recommendation shown on the Final report and in exports. */
export function projectOutcome(
  project: Project,
  materials: RawMaterial[],
): Outcome {
  const trial = project.trials.at(-1);
  const assessments = project.brief.targets.map((t) =>
    evaluate(
      t,
      project.results.find(
        (r) => r.trialId === trial?.id && r.propertyId === t.propertyId,
      ),
    ),
  );
  const count = (s: string) => assessments.filter((a) => a.status === s).length;
  const passCount = count("Pass"),
    failCount = count("Fail") + count("Borderline"),
    pendingCount = count("Pending"),
    otherCount = count("Not evaluated"),
    total = assessments.length;
  const base = { passCount, failCount, pendingCount, otherCount, total };
  if (!trial)
    return {
      ...base,
      kind: "no-trial",
      headline: "No trial yet",
      explanation:
        "There is no recipe to report on. Complete Read and Design, then make and test a trial.",
    };
  const name = trial.name.split(" · ")[0];
  const approved = project.approvals.some(
    (a) =>
      a.action === "Approved" &&
      a.recipeId === trial.id &&
      (a.briefVersion || 1) === project.revisions.length &&
      project.status === "Approved",
  );
  if (approved)
    return {
      ...base,
      kind: "approved",
      headline: `${name} is approved`,
      explanation: `${name} met ${passCount} of ${total} targets and was approved by a reviewer. The recipe and its prices are locked. Approval is an internal demo step, not a certification.`,
    };
  if (failCount)
    return {
      ...base,
      kind: "failing",
      headline: `${name} misses ${failCount} of ${total} targets`,
      explanation: `The latest trial does not meet every target yet, so it is not recommended. Review the proposed next trial in Execute · Analysis.`,
    };
  if (pendingCount || otherCount)
    return {
      ...base,
      kind: "incomplete",
      headline: `${name}: results are incomplete`,
      explanation: `${passCount} of ${total} targets are met so far. ${pendingCount ? `${pendingCount} still need readings. ` : ""}${otherCount ? `${otherCount} cannot be compared because the unit, method or condition differs from the target. ` : ""}Finish Execute · Results before deciding.`,
    };
  const remaining = approvalChecks(project, trial, materials);
  if (remaining.length)
    return {
      ...base,
      kind: "review",
      headline: `${name} meets all ${total} targets`,
      explanation: `${name} is the recommended recipe. Before it can be approved, ${remaining.length === 1 ? "one check remains" : `${remaining.length} checks remain`} (listed below).`,
    };
  return {
    ...base,
    kind: "ready",
    headline: `${name} meets all ${total} targets and is ready for approval`,
    explanation: `${name} is the recommended recipe. All results are reviewed. A Reviewer can now approve it.`,
  };
}
export function parseResultsPaste(text: string, targets: Target[]) {
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const [propertyId, a, b, c, unit] = line.split("\t");
      const target = targets.find((t) => t.propertyId === propertyId);
      const readings = [a, b, c].map((v) =>
        v === undefined || v.trim() === "" ? null : Number(v),
      );
      const errors: string[] = [];
      if (!target) errors.push("Unknown property ID");
      if (readings.some((v) => v !== null && (!Number.isFinite(v) || v < 0)))
        errors.push("Readings must be non-negative numbers");
      if (unit !== target?.unit) errors.push("Unit does not match");
      return { row: index + 1, propertyId, readings, unit, errors };
    });
}
