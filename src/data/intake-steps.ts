// Steps of the "Ask" stage: creating a new project brief.
export const intakeSteps = [
  {
    id: "product",
    name: "Product",
    purpose: "Choose the type of product you are making.",
    optional: false,
  },
  {
    id: "application",
    name: "Application",
    purpose: "Name the project and describe where and how it is used.",
    optional: false,
  },
  {
    id: "benchmarks",
    name: "Benchmarks",
    purpose: "Pick up to three existing products to compare against.",
    optional: true,
  },
  {
    id: "targets",
    name: "Targets",
    purpose: "Set the test results the product must reach.",
    optional: false,
  },
  {
    id: "constraints",
    name: "Constraints",
    purpose: "Add limits on cost, materials or equipment.",
    optional: true,
  },
  {
    id: "review",
    name: "Review",
    purpose: "Check everything, then start the project.",
    optional: false,
  },
] as const;

export type IntakeStep = (typeof intakeSteps)[number]["id"];

const legacy: Record<string, IntakeStep> = {
  mode: "product",
  category: "product",
  subcategory: "product",
  "use-case": "application",
  brief: "benchmarks",
};

/** Maps saved or linked step names from earlier versions to current ones. */
export function normaliseIntakeStep(step?: string | null): IntakeStep {
  if (!step) return "product";
  if (intakeSteps.some((s) => s.id === step)) return step as IntakeStep;
  return legacy[step] || "product";
}

export const intakePath = (step?: string | null) =>
  `/projects/new/${normaliseIntakeStep(step)}`;
