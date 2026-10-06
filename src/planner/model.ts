// Construction-chemical formulation projects. Every project follows the
// seven-step workflow: Type → Data Sources → Describe → Literature →
// Pathways → Review → Create.

/** Where a value comes from. Shown next to values throughout Helix. */
export type Evidence = "source" | "calculated" | "illustrative" | "not-reported";

export const categories = [
  "Tile cleaner",
  "Tile adhesive",
  "Epoxy grout",
  "Epoxy adhesive",
  "Waterproofing coating",
] as const;
export type Category = (typeof categories)[number];

export const tasks = [
  "New formulation",
  "Reformulation",
  "Cost or supply review",
  "Troubleshooting",
] as const;
export type Task = (typeof tasks)[number];

export type SourceKind =
  | "Technical data sheet"
  | "Supplier formulation"
  | "Raw-material data sheet"
  | "Safety data sheet"
  | "Standard"
  | "Technical publication"
  | "Test data";

export interface SourceRef {
  id: string;
  kind: SourceKind;
  title: string;
  publisher: string;
  url: string;
  /** Version or date as printed on the document. */
  version: string;
  accessed: string;
  /** What this project uses the source for. */
  usedFor: string;
  /** Finished-product TDS data is a benchmark, never a disclosed recipe. */
  note?: string;
  selected: boolean;
}

export interface LiteratureRecord {
  id: string;
  sourceId: string;
  finding: string;
  /** Which product or stage the finding applies to. */
  applies: string;
  limitations: string;
  evidence: Evidence;
  used: boolean;
}

export type Recommendation = "Recommended" | "Alternative" | "Not recommended";

export interface Approach {
  id: string;
  name: string;
  application: string;
  advantages: string;
  constraints: string;
  sourceIds: string[];
  recommendation: Recommendation;
}

export interface Part {
  id: string;
  name: string;
  /** e.g. "Liquid", "Powder", "Resin", "Hardener". */
  description: string;
}

export const ingredientFunctions = [
  "Binder",
  "Filler",
  "Resin",
  "Hardener",
  "Polymer modifier",
  "Water retention / thickener",
  "Rheology modifier",
  "Accelerator",
  "Defoamer",
  "Acid / descaler",
  "Surfactant",
  "Solvent",
  "Carrier",
  "Pigment",
  "Additive",
] as const;
export type IngredientFunction = (typeof ingredientFunctions)[number];

export type ReviewStatus = "Source-supported" | "Illustrative" | "Needs supplier data";

export interface Ingredient {
  id: string;
  partId: string;
  name: string;
  function: IngredientFunction;
  grade: string;
  /** Composition of its part, wt.% as supplied. null = not yet defined. */
  wtPct: number | null;
  /** Active or solids content of the supplied material, % (null = not stated). */
  activePct?: number | null;
  evidence: Evidence;
  sourceId?: string;
  basis: string;
  review: ReviewStatus;
  /** Compatibility note shown during component identification. */
  compatibility?: string;
}

export interface MixRatio {
  /** Parts by weight for each part id. */
  parts: Record<string, number>;
  evidence: Evidence;
  sourceId?: string;
  note: string;
}

export interface WaterDemand {
  /** Mixing water as % of the powder mass. */
  pctOfPowder: number | null;
  evidence: Evidence;
  sourceId?: string;
  note: string;
}

/** Epoxy resin/hardener stoichiometry (only where EEW and AHEW are known). */
export interface EpoxyData {
  resinId: string;
  hardenerId: string;
  eew: [number, number];
  eewSourceId: string;
  ahew: number;
  ahewSourceId: string;
  /** Supplier-recommended parts of hardener per 100 parts resin. */
  supplierPhr: number;
  phrSourceId: string;
}

/** A ratio between ingredient groups in the mixed system, e.g. polymer solids : cement. */
export interface RatioCheck {
  id: string;
  label: string;
  numeratorIds: string[];
  /** Use active/solids content for the numerator. */
  numeratorActive: boolean;
  denominatorIds: string[];
  op: ">" | "≥" | "<" | "≤";
  target: number;
  sourceId?: string;
  explanation: string;
}

export interface ProcessStep {
  id: string;
  stage: string;
  equipment: string;
  order: string;
  requirement: string;
  duration: string;
  checkpoint: string;
  evidence: Evidence;
  sourceId?: string;
}

export interface TestRow {
  id: string;
  property: string;
  method: string;
  /** Text shown in the matrix, e.g. "≥ 1.0 N/mm²". */
  target: string;
  /** Numeric target for charts (optional). */
  targetValue?: number;
  targetOp?: "≥" | "≤";
  unit: string;
  conditions: string;
  targetEvidence: Evidence;
  sourceId?: string;
}

export interface Trial {
  id: string;
  name: string;
  change: string;
  purpose: string;
  /** Measured results by test id; null = not tested. */
  results: Record<string, number | null>;
}

export interface TimelineItem {
  id: string;
  label: string;
  time: string;
  evidence: Evidence;
  sourceId?: string;
  note?: string;
}

export interface CuratedRecommendation {
  text: string;
  reason: string;
  sourceId?: string;
  uncertainty: string;
  action: { step: WorkflowStep; sub?: PathwaySubstep; label: string };
}

export interface Price {
  rate: number;
  source: string;
  date: string;
}

export interface Plan {
  generatedAt: string;
  version: number;
  inputsHash: string;
}

export interface Project {
  id: string;
  reference: boolean;
  title: string;
  category: Category | "";
  task: Task | "";
  focus: string;
  objective: string;
  application: string;
  substrates: string[];
  constraints: string[];
  batchKg: number;
  sources: SourceRef[];
  literature: LiteratureRecord[];
  approaches: Approach[];
  selectedApproachId: string;
  rationale: string;
  componentsIdentifiedAt?: string;
  parts: Part[];
  ingredients: Ingredient[];
  mixRatio?: MixRatio;
  water?: WaterDemand;
  epoxy?: EpoxyData;
  ratioChecks: RatioCheck[];
  process: ProcessStep[];
  timeline: TimelineItem[];
  tests: TestRow[];
  trials: Trial[];
  assumptions: string[];
  gaps: string[];
  recommendations: CuratedRecommendation[];
  prices: Record<string, Price>;
  deliverable: string;
  plan?: Plan;
  createdFrom?: string;
  created: string;
  updated: string;
}

export const workflow = [
  { id: "type", name: "Type", purpose: "Select the product category and the formulation task." },
  { id: "sources", name: "Data Sources", purpose: "Select technical references, supplier documents, standards and test data." },
  { id: "describe", name: "Describe", purpose: "Define the application, substrates, constraints and batch size." },
  { id: "literature", name: "Literature", purpose: "Review the technical evidence and how far it applies." },
  { id: "pathways", name: "Pathways", purpose: "Compare formulation approaches and build the formulation and processing plan." },
  { id: "review", name: "Review", purpose: "Check the formulation, calculations, processing plan, evidence and tests." },
  { id: "create", name: "Create", purpose: "Generate the final formulation-development plan and report." },
] as const;
export type WorkflowStep = (typeof workflow)[number]["id"];

export const pathwaySubsteps = [
  { id: "approaches", name: "Analyzing formulation pathways", short: "Approaches" },
  { id: "components", name: "Identifying formulation components", short: "Components" },
  { id: "composition", name: "Optimizing composition and ratios", short: "Composition" },
  { id: "process", name: "Setting process conditions", short: "Process" },
  { id: "experiment", name: "Structuring experiment", short: "Experiment" },
] as const;
export type PathwaySubstep = (typeof pathwaySubsteps)[number]["id"];
