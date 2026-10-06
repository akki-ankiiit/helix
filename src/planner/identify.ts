import type { Category, Ingredient, IngredientFunction, Part, Project, TestRow } from "./model";

// Raw-material library used by "Identifying formulation components". Notes
// are general compatibility guidance (labelled Helix guidance in the UI),
// not supplier data; ingredients without a supporting source are flagged
// "Needs supplier data".
export interface LibraryEntry {
  name: string;
  aliases: string[];
  function: IngredientFunction;
  grade: string;
  compatibility: string;
}

export const library: LibraryEntry[] = [
  { name: "Ordinary Portland cement", aliases: ["opc", "portland cement", "cement", "cem i"], function: "Binder", grade: "OPC 43/53 or CEM I", compatibility: "Strongly alkaline when wet: polymers, cellulose ethers and pigments must be alkali- and cement-compatible." },
  { name: "White cement", aliases: ["white portland cement"], function: "Binder", grade: "White OPC", compatibility: "Use for light colours; same alkali compatibility checks as grey cement." },
  { name: "Calcium aluminate cement", aliases: ["cac", "high alumina cement"], function: "Binder", grade: "CAC", compatibility: "Accelerates set with OPC; small changes alter pot life sharply." },
  { name: "Silica sand", aliases: ["quartz sand", "sand"], function: "Filler", grade: "Graded, washed and dried", compatibility: "Inert; grading controls water demand, slip and finish." },
  { name: "Limestone powder", aliases: ["calcium carbonate", "limestone"], function: "Filler", grade: "Fine ground", compatibility: "Inert in cement; attacked by acids — avoid in acid-exposed systems." },
  { name: "Silica flour", aliases: ["quartz flour"], function: "Filler", grade: "< 75 µm", compatibility: "Inert fine filler; raises viscosity in resin systems." },
  { name: "Redispersible polymer powder", aliases: ["rdp", "vae powder", "latex powder"], function: "Polymer modifier", grade: "VAE or acrylic powder", compatibility: "Improves adhesion and flexibility; affects water demand and air content." },
  { name: "Cellulose ether", aliases: ["mhec", "hpmc", "methyl cellulose", "methyl cellulose ether"], function: "Water retention / thickener", grade: "MHEC / HPMC", compatibility: "Controls water retention, open time and slip; overdosing retards setting." },
  { name: "Calcium formate", aliases: ["accelerator"], function: "Accelerator", grade: "Technical", compatibility: "Speeds early strength; reduces pot life." },
  { name: "Acrylic dispersion", aliases: ["styrene-acrylic dispersion", "polymer dispersion", "acrylic emulsion"], function: "Polymer modifier", grade: "Cement-compatible, ~50% solids", compatibility: "Must be stable with cement; record solids content to calculate polymer/cement." },
  { name: "Liquid epoxy resin", aliases: ["bisphenol-a epoxy resin", "epoxy resin", "liquid bisphenol-a epoxy resin"], function: "Resin", grade: "EEW 182–192 g/eq", compatibility: "Cure with an amine hardener at the supplier phr; crystallises if stored cold." },
  { name: "Amine hardener", aliases: ["polyamine", "amidoamine", "polyamide hardener", "amine curing agent"], function: "Hardener", grade: "AHEW per supplier", compatibility: "Mix at the supplier ratio; moisture and CO₂ cause surface blush." },
  { name: "Fumed silica", aliases: ["pyrogenic silica"], function: "Rheology modifier", grade: "Hydrophilic", compatibility: "Thixotropy and anti-settling in resin systems." },
  { name: "Defoamer", aliases: ["antifoam"], function: "Defoamer", grade: "System-specific", compatibility: "Overdosing causes craters and poor intercoat adhesion." },
  { name: "Citric acid", aliases: [], function: "Acid / descaler", grade: "Anhydrous", compatibility: "Dissolves lime scale; slowly etches cement grout and calcareous stone." },
  { name: "Sulfamic acid", aliases: ["sulphamic acid", "sulphamidic acid"], function: "Acid / descaler", grade: "Technical", compatibility: "Strong acid (eye damage); only for acid-resistant surfaces; incompatible with alkalis." },
  { name: "Amine oxide surfactant", aliases: ["amine oxide", "lauramine oxide"], function: "Surfactant", grade: "Request active content", compatibility: "Stable in acid formulations; check foaming." },
  { name: "Alcohol ethoxylate", aliases: ["nonionic surfactant", "ethoxylated alcohol"], function: "Surfactant", grade: "Request active content", compatibility: "Wetting and soil removal; some grades are eye irritants." },
  { name: "Glycol ether", aliases: ["propylene glycol n-butyl ether", "dpm"], function: "Solvent", grade: "Technical", compatibility: "Improves grease removal; adds VOC." },
  { name: "Water", aliases: ["deionised water", "deionized water"], function: "Carrier", grade: "Potable or deionised", compatibility: "Hard water reduces acid cleaner efficiency." },
  { name: "Pigment", aliases: ["iron oxide", "titanium dioxide"], function: "Pigment", grade: "To colour standard", compatibility: "Check colour consistency between batches and alkali/UV stability." },
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
export function findInLibrary(name: string) {
  const n = norm(name);
  return library.find((e) => norm(e.name) === n || e.aliases.some((a) => n === a || n.includes(a) && a.length > 4));
}

interface Template {
  parts: Part[];
  ingredients: { part: string; name: string }[];
  required: IngredientFunction[];
  tests: Omit<TestRow, "id">[];
}

const blankTest = (property: string, method: string, unit = ""): Omit<TestRow, "id"> => ({
  property,
  method,
  target: "",
  unit,
  conditions: "",
  targetEvidence: "illustrative",
});

export const templates: Record<Category, Template> = {
  "Tile cleaner": {
    parts: [{ id: "L", name: "Cleaner", description: "Single-component liquid" }],
    ingredients: [{ part: "L", name: "Water" }, { part: "L", name: "Citric acid" }, { part: "L", name: "Amine oxide surfactant" }],
    required: ["Carrier", "Acid / descaler", "Surfactant"],
    tests: [blankTest("pH (as supplied)", "pH meter", "pH"), blankTest("Cleaning performance", "Comparative wipe test vs benchmark"), blankTest("Residue after rinsing", "Visual / gloss check"), blankTest("Compatibility with grout and fittings", "Spot test")],
  },
  "Tile adhesive": {
    parts: [{ id: "P", name: "Powder", description: "Dry mortar mixed with water" }],
    ingredients: [{ part: "P", name: "Ordinary Portland cement" }, { part: "P", name: "Silica sand" }, { part: "P", name: "Redispersible polymer powder" }, { part: "P", name: "Cellulose ether" }],
    required: ["Binder", "Filler", "Polymer modifier", "Water retention / thickener"],
    tests: [blankTest("Tensile adhesion — initial", "EN 12004-2 8.3", "N/mm²"), blankTest("Open time", "EN 12004-2 8.1", "N/mm²"), blankTest("Slip", "EN 12004-2 8.2", "mm")],
  },
  "Cementitious grout": {
    parts: [{ id: "P", name: "Powder", description: "Dry grout mixed with water" }],
    ingredients: [{ part: "P", name: "Ordinary Portland cement" }, { part: "P", name: "Silica sand" }, { part: "P", name: "Limestone powder" }, { part: "P", name: "Redispersible polymer powder" }, { part: "P", name: "Cellulose ether" }, { part: "P", name: "Pigment" }],
    required: ["Binder", "Filler"],
    tests: [blankTest("Flexural strength", "EN 13888-2", "N/mm²"), blankTest("Compressive strength", "EN 13888-2", "N/mm²"), blankTest("Abrasion resistance", "EN 13888-2", "mm³"), blankTest("Water absorption", "EN 13888-2", "g"), blankTest("Colour consistency", "Visual comparison with colour standard")],
  },
  "Epoxy grout": {
    parts: [{ id: "A", name: "Part A (resin + filler)", description: "Filled resin" }, { id: "B", name: "Part B (hardener)", description: "Hardener" }],
    ingredients: [{ part: "A", name: "Liquid epoxy resin" }, { part: "A", name: "Silica sand" }, { part: "A", name: "Fumed silica" }, { part: "B", name: "Amine hardener" }],
    required: ["Resin", "Hardener", "Filler"],
    tests: [blankTest("Pot life", "EN ISO 9514", "min"), blankTest("Water cleanability", "ANSI A118.3 E5.1"), blankTest("Compressive strength", "EN 13888-2", "N/mm²")],
  },
  "Epoxy adhesive": {
    parts: [{ id: "A", name: "Part A (resin)", description: "Resin paste" }, { id: "B", name: "Part B (hardener)", description: "Hardener paste" }],
    ingredients: [{ part: "A", name: "Liquid epoxy resin" }, { part: "A", name: "Silica flour" }, { part: "B", name: "Amine hardener" }, { part: "B", name: "Silica flour" }],
    required: ["Resin", "Hardener"],
    tests: [blankTest("Tensile adhesion", "IS 15477:2019", "N/mm²"), blankTest("Shear adhesion", "IS 15477:2019", "N/mm²"), blankTest("Pot life", "EN ISO 9514", "min")],
  },
  "Waterproofing coating": {
    parts: [{ id: "L", name: "Liquid (polymer)", description: "Polymer dispersion" }, { id: "P", name: "Powder", description: "Cement, sand and additives" }],
    ingredients: [{ part: "L", name: "Acrylic dispersion" }, { part: "L", name: "Water" }, { part: "P", name: "Ordinary Portland cement" }, { part: "P", name: "Silica sand" }],
    required: ["Polymer modifier", "Binder", "Filler"],
    tests: [blankTest("Initial tensile adhesion", "EN 14891 A.6.2", "N/mm²"), blankTest("Water impermeability", "EN 14891 A.7"), blankTest("Crack-bridging", "EN 14891 A.8.2", "mm")],
  },
  "General formulation": {
    parts: [{ id: "P", name: "Product", description: "Single component" }],
    ingredients: [],
    required: [],
    tests: [blankTest("Key performance property", "Method to be selected")],
  },
};

export interface IdentifyResult {
  project: Project;
  matched: number;
  needsData: string[];
  missingFunctions: IngredientFunction[];
  seeded: boolean;
}

let seq = 0;
const newId = () => `ing-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/**
 * Matches each ingredient to the library (function, typical grade,
 * compatibility), seeds the category's component skeleton for an empty
 * project, and reports functions the formulation still lacks.
 */
export function identifyComponents(p: Project): IdentifyResult {
  const next = structuredClone(p);
  if (!next.category) throw new Error("Choose a product category in Type first.");
  const t = templates[next.category];
  let seeded = false;
  if (!next.parts.length) next.parts = structuredClone(t.parts);
  if (!next.ingredients.length) {
    seeded = true;
    next.ingredients = t.ingredients.map((x): Ingredient => {
      const lib = findInLibrary(x.name)!;
      return {
        id: newId(),
        partId: x.part,
        name: lib.name,
        function: lib.function,
        grade: lib.grade,
        wtPct: null,
        evidence: "illustrative",
        review: "Needs supplier data",
        basis: "Suggested by the category template; amount to be defined",
        compatibility: lib.compatibility,
      };
    });
  }
  if (next.parts.length > 1 && !next.mixRatio)
    next.mixRatio = { parts: Object.fromEntries(next.parts.map((x) => [x.id, 0])), evidence: "illustrative", note: "Set from supplier data or calculation." };
  if ((next.category === "Tile adhesive" || next.category === "Cementitious grout") && !next.water)
    next.water = { pctOfPowder: null, evidence: "illustrative", note: "Enter the mixing water as % of powder." };
  let matched = 0;
  const needsData: string[] = [];
  for (const i of next.ingredients) {
    const lib = findInLibrary(i.name);
    if (lib) {
      matched++;
      if (!i.compatibility) i.compatibility = lib.compatibility;
      if (!i.grade) i.grade = lib.grade;
    }
    if (!i.sourceId && i.review !== "Needs supplier data") i.review = "Needs supplier data";
    if (i.review === "Needs supplier data") needsData.push(i.name);
  }
  const present = new Set(next.ingredients.map((i) => i.function));
  const missingFunctions = t.required.filter((f) => !present.has(f));
  next.componentsIdentifiedAt = new Date().toISOString();
  return { project: next, matched, needsData, missingFunctions, seeded };
}
