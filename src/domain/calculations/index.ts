import type {
  Analysis,
  Project,
  RawMaterial,
  RecipeRevision,
  SpecimenResult,
  Target,
} from "../models";
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
      errors.push(`${m?.name || id}: invalid quantity`);
    total += pct;
    if (!m) {
      errors.push(`Unknown material: ${id}`);
      complete = false;
      continue;
    }
    if (pct < m.min || pct > m.max)
      errors.push(`${m.name}: outside ${m.min}–${m.max}% limit`);
    if (
      pct > 0 &&
      excluded
        .toLowerCase()
        .split(",")
        .some((x) => x.trim() && m.name.toLowerCase().includes(x.trim()))
    )
      errors.push(`${m.name}: excluded by a hard constraint`);
    if (
      (m.price === null || !Number.isFinite(m.price) || m.currency !== "USD") &&
      pct > 0
    )
      complete = false;
    else cost += ((m.price || 0) * pct) / 100;
  }
  if (!Number.isFinite(total) || Math.abs(total - 100) > TOTAL_TOLERANCE + 1e-9)
    errors.push(`Total must equal 100% (±${TOTAL_TOLERANCE}%)`);
  if (!Number.isFinite(trial.batchKg) || trial.batchKg <= 0)
    errors.push("Batch size must be positive");
  if (!Number.isFinite(trial.water) || trial.water < 0)
    errors.push("Application water must be a non-negative quantity");
  if (ceiling !== undefined && complete && cost > ceiling)
    errors.push("Cost exceeds hard ceiling");
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
export function approvalIssues(
  project: Project,
  trial: RecipeRevision | undefined,
  materials: RawMaterial[],
) {
  if (!trial) return ["Select a recipe"];
  const metrics = recipeMetrics(
    trial,
    materials,
    Number(project.brief.constraints.cost) || undefined,
    project.brief.constraints.excluded,
  );
  const issues = [...metrics.errors];
  if (metrics.cost === null)
    issues.push(
      "Cost is incomplete: resolve missing prices or incompatible currency",
    );
  if (
    project.brief.constraints.cost &&
    project.brief.constraints.currency !== "USD"
  )
    issues.push(
      "Cost ceiling currency differs from material prices; no exchange-rate conversion is configured",
    );
  if (!project.brief.targets.length)
    issues.push("A reviewed test plan and targets are required");
  for (const target of project.brief.targets.filter(
    (t) => t.priority === "Must",
  )) {
    const r = project.results.find(
      (r) => r.trialId === trial.id && r.propertyId === target.propertyId,
    );
    if (
      !r ||
      r.readings.filter((x) => x !== null).length <
        (project.testPlan.find((p) => p.propertyId === target.propertyId)
          ?.specimens || 3) ||
      evaluate(target, r).status !== "Pass"
    )
      issues.push(
        `${target.propertyId}: mandatory test pending or not passing`,
      );
    if (r && !r.reviewed)
      issues.push(
        `${target.propertyId}: specimen evidence needs reviewer sign-off`,
      );
  }
  if (!project.resultsReviewed)
    issues.push("Measured results require reviewer sign-off");
  if (project.needsReview)
    issues.push("Downstream work needs review after a revision");
  return issues;
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
