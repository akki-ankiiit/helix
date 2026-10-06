import { describe, it, expect } from "vitest";
import {
  approvalIssues,
  evaluate,
  mean,
  parseResultsPaste,
  recipeMetrics,
} from "../../src/domain/calculations";
import {
  initialMaterials,
  seedProjects,
} from "../../src/data/fixtures/workspace";
import { taxonomy } from "../../src/data/taxonomy";
import {
  costBreakdown,
  projectOutcome,
} from "../../src/domain/calculations";
import {
  formatINR,
  formatMeasured,
  usdToInr,
  USD_TO_INR,
} from "../../src/lib/format";
import { migrateToInr } from "../../src/stores/migrations";
import { normaliseIntakeStep } from "../../src/data/intake-steps";
import { properties, defaultTargets } from "../../src/data/property-library";
describe("configurable taxonomy", () => {
  it("contains six categories and 34 unique families (incl. tile cleaners)", () => {
    expect(taxonomy).toHaveLength(6);
    expect(
      new Set(taxonomy.flatMap((c) => c.subcategories.map((s) => s.id))).size,
    ).toBe(34);
  });
  it("loads valid draft properties for every family", () => {
    for (const sub of taxonomy.flatMap((c) => c.subcategories)) {
      for (const t of defaultTargets(sub.id))
        expect(properties.some((p) => p.id === t.propertyId)).toBe(true);
    }
  });
});
describe("dry blend calculations", () => {
  it("calculates totals, batch masses, and weighted cost", () => {
    const t = seedProjects()[0].trials[0];
    const r = recipeMetrics(t, initialMaterials);
    expect(r.total).toBeCloseTo(100, 8);
    expect(r.errors).toEqual([]);
    expect(r.masses.cement).toBeCloseTo(1.75);
    // ₹ per kg of dry blend, from the INR-converted fixture prices.
    expect(r.cost).toBeCloseTo(21.4999, 4);
  });
  it("rejects invalid totals, negatives, material limits, and ceiling breaches", () => {
    const t = seedProjects()[0].trials[0];
    t.percentages.cement = -2;
    t.percentages.polymer = 10;
    const r = recipeMetrics(t, initialMaterials, 0.01);
    expect(r.errors.some((e) => e.includes("0% or more"))).toBe(true);
    expect(r.errors.some((e) => e.includes("must be between"))).toBe(true);
    expect(r.errors.some((e) => e.includes("100%"))).toBe(true);
    expect(r.errors.some((e) => e.includes("ceiling"))).toBe(true);
  });
  it("never treats missing prices as free", () => {
    const ms = initialMaterials.map((m) =>
      m.id === "cement" ? { ...m, price: null } : m,
    );
    expect(recipeMetrics(seedProjects()[0].trials[0], ms).cost).toBeNull();
  });
  it("checks excluded hard constraints", () => {
    expect(
      recipeMetrics(
        seedProjects()[0].trials[0],
        initialMaterials,
        undefined,
        "Portland cement",
      ).errors.join(),
    ).toContain("excluded");
  });
});
describe("evidence evaluation", () => {
  const p = seedProjects()[0],
    target = p.brief.targets.find((t) => t.propertyId === "slip")!,
    r = p.results.find((r) => r.propertyId === "slip")!;
  it("distinguishes missing readings from zero", () => {
    expect(mean([null, null])).toBeNull();
    expect(mean([0, null])).toBe(0);
    expect(
      evaluate(target, { ...r, readings: [null, null, null] }).status,
    ).toBe("Pending");
  });
  it("detects baseline failure and later pass", () => {
    expect(evaluate(target, r).status).toBe("Fail");
    expect(
      evaluate(
        target,
        p.results.find(
          (r) => r.propertyId === "slip" && r.trialId === "trial-2",
        ),
      ).status,
    ).toBe("Pass");
  });
  it("does not compare incompatible units, methods, or conditions", () => {
    for (const patch of [
      { unit: "cm" },
      { method: "Other method" },
      { condition: "Other age" },
    ])
      expect(evaluate(target, { ...r, ...patch }).status).toBe("Not evaluated");
  });
  it("uses explicit tolerance only", () => {
    expect(evaluate(target, { ...r, readings: [0.51] }).status).toBe("Fail");
    expect(
      evaluate({ ...target, tolerance: 0.02 }, { ...r, readings: [0.51] })
        .status,
    ).toBe("Borderline");
  });
  it("evaluates every numeric operator", () => {
    expect(mean([0.1, 0.2, 0.3])).toBe(0.2);
    const result = { ...r, readings: [0.5] };
    expect(
      evaluate({ ...target, operator: "≥", value: ".5" }, result).status,
    ).toBe("Pass");
    expect(
      evaluate({ ...target, operator: "=", value: ".5" }, result).status,
    ).toBe("Pass");
    expect(
      evaluate(
        { ...target, operator: "Between", value: ".3", max: ".6" },
        result,
      ).status,
    ).toBe("Pass");
    expect(
      evaluate(
        { ...target, operator: "Between", value: ".6", max: ".3" },
        result,
      ).status,
    ).toBe("Not evaluated");
  });
  it("validates paste rows before application", () => {
    const rows = parseResultsPaste(
      "slip\t0.4\t\t0.5\tmm\nunknown\tbad\t1\t2\tMPa",
      p.brief.targets,
    );
    expect(rows[0].readings).toEqual([0.4, null, 0.5]);
    expect(rows[0].errors).toHaveLength(0);
    expect(rows[1].errors.length).toBeGreaterThan(0);
  });
});
describe("approval gate", () => {
  it("requires results review even with passing numbers", () => {
    const p = seedProjects()[0];
    expect(approvalIssues(p, p.trials[1], initialMaterials)).toContain(
      "Results have not been reviewed",
    );
    p.resultsReviewed = true;
    p.results = p.results.map((r) => ({ ...r, reviewed: true }));
    expect(approvalIssues(p, p.trials[1], initialMaterials)).toEqual([]);
  });
  it("blocks missing mandatory specimens and changed downstream work", () => {
    const p = seedProjects()[0];
    p.resultsReviewed = true;
    p.results = p.results.filter((r) => r.propertyId !== "slip");
    p.needsReview = true;
    const issues = approvalIssues(p, p.trials[1], initialMaterials);
    expect(issues.some((x) => x.includes("Slip: 3 specimen readings are needed"))).toBe(true);
    expect(issues.some((x) => x.includes("Something changed"))).toBe(true);
  });
});
describe("locked cost context", () => {
  it("retains approved material prices when the master changes", () => {
    const trial = {
      ...seedProjects()[0].trials[1],
      materialsSnapshot: structuredClone(initialMaterials),
    };
    const before = recipeMetrics(trial, initialMaterials).cost;
    const updated = initialMaterials.map((m) => ({ ...m, price: 100 }));
    expect(recipeMetrics(trial, updated).cost).toBe(before);
  });
  it("blocks incomplete costs and does not accept another trial's review", () => {
    const p = seedProjects()[0];
    p.resultsReviewed = true;
    const issues = approvalIssues(
      p,
      p.trials[1],
      initialMaterials.map((m) => ({ ...m, price: null })),
    );
    expect(issues.some((issue) => issue.includes("incomplete"))).toBe(true);
    expect(issues.some((issue) => issue.includes("has not been reviewed"))).toBe(
      true,
    );
  });
});

describe("Indian rupee formatting", () => {
  it("uses Indian digit grouping and two decimals", () => {
    expect(formatINR(125000)).toBe("₹1,25,000.00");
    expect(formatINR(12345678.9)).toBe("₹1,23,45,678.90");
    expect(formatINR(125000, 0)).toBe("₹1,25,000");
  });
  it("shows missing values as a dash, never ₹0", () => {
    expect(formatINR(null)).toBe("—");
    expect(formatINR(Number.NaN)).toBe("—");
  });
  it("converts at the documented reference rate", () => {
    expect(USD_TO_INR.rate).toBe(95.96);
    expect(usdToInr(0.16)).toBe(15.35);
    expect(usdToInr(5.2)).toBe(498.99);
  });
});
describe("measured-value precision", () => {
  it("matches the precision of the readings", () => {
    expect(formatMeasured(32, [31, 32, 33])).toBe("32");
    expect(formatMeasured(0.38, [0.36, 0.4, 0.38])).toBe("0.38");
    expect(formatMeasured(null, [])).toBe("—");
  });
});
describe("saved-data migration", () => {
  it("converts saved USD prices, ceilings and pathway estimates to INR once", () => {
    const project = seedProjects()[0];
    const legacy = {
      draftStep: "use-case",
      draft: { ...project.brief, constraints: { ...project.brief.constraints, currency: "USD", cost: "0.30" } },
      materials: initialMaterials.map((m) => ({ ...m, currency: "USD", price: m.id === "cement" ? 0.16 : null })),
      projects: [
        {
          ...project,
          brief: { ...project.brief, constraints: { ...project.brief.constraints, currency: "USD", cost: "0.30" } },
          pathways: project.pathways.map((p) => ({ ...p, cost: 0.21 })),
        },
      ],
    };
    const next = migrateToInr(legacy);
    expect(next.draftStep).toBe("application");
    expect(next.materials![0]).toMatchObject({ currency: "INR", price: 15.35 });
    expect(next.materials![1].price).toBeNull();
    expect(next.projects![0].brief.constraints).toMatchObject({ currency: "INR", cost: "28.79" });
    expect(next.projects![0].pathways[0].cost).toBe(20.15);
    expect(next.projects![0].activity[0].text).toContain("95.96");
  });
  it("leaves non-USD currencies for the user to reconcile", () => {
    const project = seedProjects()[0];
    const next = migrateToInr({
      projects: [{ ...project, brief: { ...project.brief, constraints: { ...project.brief.constraints, currency: "EUR", cost: "1" } } }],
    });
    expect(next.projects![0].brief.constraints.currency).toBe("EUR");
  });
  it("maps old intake step names", () => {
    expect(normaliseIntakeStep("category")).toBe("product");
    expect(normaliseIntakeStep("brief")).toBe("benchmarks");
    expect(normaliseIntakeStep("targets")).toBe("targets");
    expect(normaliseIntakeStep("nonsense")).toBe("product");
  });
});
describe("final report figures", () => {
  it("cost breakdown lines add up to the recipe cost", () => {
    const t = seedProjects()[0].trials[1];
    const total = costBreakdown(t, initialMaterials).reduce((a, l) => a + (l.perKg ?? 0), 0);
    expect(total).toBeCloseTo(recipeMetrics(t, initialMaterials).cost!, 9);
  });
  it("recommends the passing trial but lists remaining checks", () => {
    const p = seedProjects()[0];
    const o = projectOutcome(p, initialMaterials);
    expect(o.kind).toBe("review");
    expect(o.passCount).toBe(4);
    expect(o.headline).toBe("T02 meets all 4 targets");
  });
  it("reports a failing latest trial", () => {
    const p = seedProjects()[0];
    p.trials = [p.trials[0]];
    const o = projectOutcome(p, initialMaterials);
    expect(o.kind).toBe("failing");
    expect(o.failCount).toBe(1);
  });
  it("reports missing readings as incomplete, not as a failure", () => {
    const p = seedProjects()[0];
    p.results = p.results.filter((r) => !(r.trialId === "trial-2" && r.propertyId === "slip"));
    expect(projectOutcome(p, initialMaterials).kind).toBe("incomplete");
  });
});
