import { describe, it, expect } from "vitest";
import { referenceProjects } from "../../src/planner/references";
import {
  balanceProposal,
  planStatus,
  projectCalc,
  recommendations,
  validate,
  validationStatus,
} from "../../src/planner/calc";
import { identifyComponents } from "../../src/planner/identify";
import { blankProject } from "../../src/planner/store";
import type { Project } from "../../src/planner/model";

const byId = (id: string) => structuredClone(referenceProjects.find((p) => p.id === id)!) as Project;
const line = (p: Project, idv: string) => projectCalc(p).lines.find((l) => l.ingredient.id === idv)!;

describe("reference samples", () => {
  it("are the five construction-chemical projects", () => {
    expect(referenceProjects.map((p) => [p.id, p.category])).toEqual([
      ["HX-001", "Tile cleaner"],
      ["HX-002", "Tile adhesive"],
      ["HX-003", "Epoxy grout"],
      ["HX-004", "Epoxy adhesive"],
      ["HX-005", "Waterproofing coating"],
    ]);
  });
  it("contain no pharmaceutical or synthesis content", () => {
    const text = JSON.stringify(referenceProjects).toLowerCase();
    for (const word of ["aspirin", "paracetamol", "acetaminophen", "isopentyl", "benzoin", "tetraphenyl", "synthesis"])
      expect(text).not.toContain(word);
  });
  it.each(referenceProjects.map((p) => [p.id, p]))("%s passes review, is Completed and unvalidated", (_id, p) => {
    expect(validate(p as Project)).toEqual([]);
    expect(planStatus(p as Project)).toBe("Completed");
    expect(validationStatus(p as Project)).toBe("Not performed");
  });
  it("never contain measured results or prices", () => {
    for (const p of referenceProjects) {
      for (const t of p.trials) expect(Object.values(t.results).every((v) => v === null)).toBe(true);
      expect(p.prices).toEqual({});
      expect(projectCalc(p).costInr).toBeNull();
    }
  });
  it("every part totals exactly 100%", () => {
    for (const p of referenceProjects)
      for (const part of projectCalc(p).parts) expect(part.total).toBeCloseTo(100, 9);
  });
  it("cite https sources with versions, and tag TDS as benchmarks", () => {
    for (const p of referenceProjects)
      for (const s of p.sources) {
        expect(s.url.startsWith("https://")).toBe(true);
        expect(s.version.length).toBeGreaterThan(3);
        if (s.kind === "Technical data sheet") expect(s.note).toMatch(/not its formulation/);
      }
  });
});

describe("batch calculations", () => {
  it("HX-002: quantities and mixing water scale with batch size", () => {
    const p = byId("HX-002");
    expect(line(p, "hx2-cement").qtyKg).toBeCloseTo(8.75, 6); // 35% of 25 kg
    expect(projectCalc(p).waterKg).toBeCloseTo(7.0, 6); // 28% of 25 kg
    p.batchKg = 10;
    expect(line(p, "hx2-mc").qtyKg).toBeCloseTo(0.045, 6);
    expect(projectCalc(p).waterKg).toBeCloseTo(2.8, 6);
  });
  it("HX-001: single-part batch of 100 kg", () => {
    const p = byId("HX-001");
    expect(line(p, "hx1-citric").qtyKg).toBeCloseTo(4, 9);
    expect(line(p, "hx1-amine-oxide").activeKg).toBeNull(); // active content not stated
  });
  it("splits a two-component batch by the mixing ratio before applying part percentages", () => {
    const p = byId("HX-005"); // 15 kg, liquid : powder = 1 : 2
    const parts = projectCalc(p).parts;
    expect(parts.find((x) => x.partId === "L")!.massKg).toBeCloseTo(5, 9);
    expect(parts.find((x) => x.partId === "P")!.massKg).toBeCloseTo(10, 9);
    expect(line(p, "hx5-cement").qtyKg).toBeCloseTo(4.0, 9);
    expect(line(p, "hx5-dispersion").activeKg).toBeCloseTo(4.75 * 0.535, 9);
  });
  it("treats missing amounts as missing, not zero", () => {
    const p = byId("HX-002");
    p.ingredients.find((i) => i.id === "hx2-acc")!.wtPct = null;
    const part = projectCalc(p).parts[0];
    expect(part.balanced).toBe(false);
    expect(part.missing.map((i) => i.id)).toEqual(["hx2-acc"]);
    expect(line(p, "hx2-acc").qtyKg).toBeNull();
    expect(validate(p).some((c) => /missing values are not treated as zero/.test(c.message))).toBe(true);
  });
});

describe("component ratios", () => {
  it("HX-003: supplier phr gives A : B = 100 : 12; stoichiometric check 47.7 phr", () => {
    const e = projectCalc(byId("HX-003")).epoxy!;
    expect(e.eewMid).toBe(188.5);
    expect(e.stoichPhr).toBeCloseTo(47.75, 2);
    expect(e.requiredBperA).toBeCloseTo(0.12, 9);
    expect(e.setBperA).toBeCloseTo(0.12, 9);
    expect(e.deviationPct).toBeCloseTo(0, 9);
  });
  it("HX-004: the designed composition yields exactly 2 : 1", () => {
    const e = projectCalc(byId("HX-004")).epoxy!;
    expect(e.requiredBperA).toBeCloseTo(0.5, 9);
    expect(e.setBperA).toBe(0.5);
    expect(e.stoichPhr).toBeCloseTo(54.01, 2);
  });
  it("flags an off-ratio epoxy mix and recommends the supplier ratio", () => {
    const p = byId("HX-004");
    p.mixRatio!.parts.B = 0.8; // 2 : 0.8
    expect(projectCalc(p).epoxy!.deviationPct).toBeCloseTo(-20, 6);
    expect(recommendations(p).some((r) => /less hardener than the supplier's 55 phr/.test(r.text))).toBe(true);
  });
  it("HX-005: polymer solids : cement ≈ 0.64 meets the > 0.6 guide; 1 : 3 does not", () => {
    const p = byId("HX-005");
    expect(projectCalc(p).ratios[0].value).toBeCloseTo(0.635, 3);
    expect(projectCalc(p).ratios[0].pass).toBe(true);
    p.mixRatio!.parts = { L: 1, P: 3 };
    expect(projectCalc(p).ratios[0].value).toBeCloseTo(0.4235, 3);
    expect(projectCalc(p).ratios[0].pass).toBe(false);
  });
});

describe("proposals and status", () => {
  it("proposes (but does not apply) a filler change to balance a part", () => {
    const p = byId("HX-002");
    p.ingredients.find((i) => i.id === "hx2-rdp")!.wtPct = 4;
    const prop = balanceProposal(p, "P")!;
    expect(prop.ingredient.id).toBe("hx2-sand1");
    expect(prop.to).toBeCloseTo(37.05, 6);
    expect(p.ingredients.find((i) => i.id === "hx2-sand1")!.wtPct).toBe(38.05);
    expect(recommendations(p).some((r) => r.proposal?.to === 37.05)).toBe(true);
  });
  it("marks the plan out of date after an edit", () => {
    const p = byId("HX-001");
    p.batchKg = 50;
    expect(planStatus(p)).toBe("Plan out of date");
  });
  it("reports validation as performed only when results exist", () => {
    const p = byId("HX-002");
    p.trials[0].results[p.tests[0].id] = 1.2;
    expect(validationStatus(p)).toMatch(/Partly performed/);
  });
});

describe("component identification", () => {
  it("seeds a category skeleton for an empty project and reports missing data", () => {
    const p = { ...blankProject("HX-101"), category: "Waterproofing coating" as const };
    const r = identifyComponents(p);
    expect(r.seeded).toBe(true);
    expect(r.project.parts.map((x) => x.id)).toEqual(["L", "P"]);
    expect(r.project.ingredients.every((i) => i.wtPct === null)).toBe(true);
    expect(r.missingFunctions).toEqual([]);
    expect(r.project.componentsIdentifiedAt).toBeTruthy();
  });
  it("requires a category", () => {
    expect(() => identifyComponents(blankProject("HX-102"))).toThrow(/category/);
  });
  it("reports a missing required function", () => {
    const p = byId("HX-002");
    p.ingredients = p.ingredients.filter((i) => i.function !== "Water retention / thickener");
    expect(identifyComponents({ ...p, reference: false }).missingFunctions).toEqual(["Water retention / thickener"]);
  });
});
