export type Mode = "Scientist" | "Non-scientist";
export type Role = "Chemist" | "Technician" | "Reviewer" | "Admin";
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  mode?: Mode;
}
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
}
export interface Subcategory {
  id: string;
  name: string;
  chemistry: string;
  form: string;
}
export interface StandardReference {
  identifier: string;
  edition: string;
  method: string;
  source: string;
  status: "Unverified" | "Reviewed";
}
export interface PropertyDefinition {
  id: string;
  name: string;
  plain: string;
  group: string;
  unit: string;
  method: string;
  kind?: "text" | "number";
}
export interface PropertyTemplate {
  id: string;
  propertyIds: string[];
  status: "Draft" | "Reviewed";
  version: number;
  standard?: StandardReference;
}
export interface Target {
  propertyId: string;
  operator: "≥" | "≤" | "=" | "Between";
  value: string;
  max: string;
  priority: "Must" | "Important" | "Nice to have";
  unit: string;
  method: string;
  condition: string;
  tolerance?: number;
}
export interface Constraint {
  cost: string;
  currency: string;
  budget: string;
  required: string;
  excluded: string;
  supplier: string;
  equipment: string;
  compliance: string;
  site: string;
  notes: string;
  preference: string;
}
export interface Brief {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  useCase: Record<string, string>;
  benchmarkIds: string[];
  targets: Target[];
  objectives: string[];
  constraints: Constraint;
}
export interface BriefRevision {
  version: number;
  brief: Brief;
  date: string;
  reason: string;
}
export type Provenance =
  "TDS" | "MSDS/SDS" | "Lab-tested" | "User-entered" | "Unverified extraction";
export interface Benchmark {
  id: string;
  name: string;
  manufacturer: string;
  version: string;
  date: string;
  provenance: Provenance;
  values: Record<string, number>;
  notes: string;
}
export interface Source {
  id: string;
  title: string;
  type: string;
  owner: string;
  date: string;
  summary: string;
  excerpt: string;
  quality: string;
  reference: string;
  pinned: boolean;
  excluded: boolean;
}
export interface Pathway {
  id: string;
  name: string;
  rationale: string;
  cost: number;
  scores: number[];
  equipment: string;
  risk: string;
  ranges: string[];
  predictions: Record<string, number>;
  citations: string[];
  version: number;
}
export interface RawMaterial {
  id: string;
  name: string;
  function: string;
  grade: string;
  supplier: string;
  price: number | null;
  currency: string;
  priceDate: string;
  stock: string;
  approved: boolean;
  min: number;
  max: number;
  sds: string;
  alternatives: string[];
}
export interface RecipeRevision {
  id: string;
  name: string;
  version: number;
  percentages: Record<string, number>;
  batchKg: number;
  water: number;
  basis: "Dry blend";
  locked: boolean;
  parentId?: string;
  materialsSnapshot?: RawMaterial[];
  mixTime?: string;
  mixSpeed?: string;
}
export interface TestPlan {
  propertyId: string;
  required: boolean;
  specimens: number;
  ageDays: number;
  condition: string;
  dueDate?: string;
}
export interface SpecimenResult {
  id: string;
  trialId: string;
  propertyId: string;
  readings: (number | null)[];
  unit: string;
  method: string;
  condition: string;
  date: string;
  operator: string;
  failureMode: string;
  comments: string;
  attachments: string[];
  reviewed: boolean;
}
export type Evaluation =
  "Pass" | "Borderline" | "Fail" | "Pending" | "Not evaluated";
export interface Analysis {
  propertyId: string;
  mean: number | null;
  status: Evaluation;
  difference: number | null;
}
export interface Approval {
  id: string;
  action: string;
  actor: string;
  date: string;
  recipeId: string;
  briefVersion?: number;
  note: string;
}
export interface Activity {
  id: string;
  text: string;
  date: string;
}
export interface Comment {
  id: string;
  text: string;
  author: string;
  date: string;
}
export interface Project {
  id: string;
  brief: Brief;
  revisions: BriefRevision[];
  owner: string;
  updated: string;
  stage: string;
  status: string;
  sources: Source[];
  pathways: Pathway[];
  selectedPathway?: string;
  trials: RecipeRevision[];
  results: SpecimenResult[];
  resultHistory?: SpecimenResult[];
  testPlan: TestPlan[];
  approvals: Approval[];
  comments: Comment[];
  activity: Activity[];
  needsReview: boolean;
  resultsReviewed: boolean;
  iterationRejected?: string;
}
export interface Job {
  id: string;
  projectId: string;
  name: string;
  stage: string;
  status: "Queued" | "Running" | "Completed" | "Failed" | "Cancelled";
  started: number;
  finished?: number;
  duration: number;
  progress: number;
  error?: string;
}
