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
import { properties, defaultTargets } from "../../src/data/property-library";
describe("configurable taxonomy", () => {
  it("contains exactly six categories and 33 unique families", () => {
    expect(taxonomy).toHaveLength(6);
    expect(
      new Set(taxonomy.flatMap((c) => c.subcategories.map((s) => s.id))).size,
    ).toBe(33);
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
    expect(r.cost).toBeCloseTo(0.22405, 5);
  });
  it("rejects invalid totals, negatives, material limits, and ceiling breaches", () => {
    const t = seedProjects()[0].trials[0];
    t.percentages.cement = -2;
    t.percentages.polymer = 10;
    const r = recipeMetrics(t, initialMaterials, 0.01);
    expect(r.errors.some((e) => e.includes("invalid quantity"))).toBe(true);
    expect(r.errors.some((e) => e.includes("outside"))).toBe(true);
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
      "Measured results require reviewer sign-off",
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
    expect(issues.some((x) => x.includes("mandatory"))).toBe(true);
    expect(issues.some((x) => x.includes("Downstream"))).toBe(true);
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
    expect(issues.some((issue) => issue.includes("specimen evidence"))).toBe(
      true,
    );
  });
});
