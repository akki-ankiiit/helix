// The project procedure. Step names Ask, Read, Design and Execute are the
// terms shown on the public Novyte Q sign-in screen (verified 6 Oct 2026).
// "Final report" is Helix's own closing step: Novyte's outputs could not be
// verified, so no Novyte term is used for it.
import type { Project } from "../domain/models";

/** Internal stage keys, kept stable for saved data and existing links. */
export type StageKey =
  | "Brief"
  | "Literature"
  | "Pathways"
  | "Trials"
  | "Results"
  | "Analysis"
  | "Final";

export interface ProcedureStep {
  id: "ask" | "read" | "design" | "execute" | "report";
  number: number;
  name: string;
  /** One short, plain sentence: what this step is for. */
  purpose: string;
  stages: { key: StageKey; label: string; description: string }[];
}

export const procedure: ProcedureStep[] = [
  {
    id: "ask",
    number: 1,
    name: "Ask",
    purpose: "Say what the material must do.",
    stages: [
      {
        key: "Brief",
        label: "Brief",
        description:
          "Your product, where it is used, the targets it must meet and any limits on cost or materials.",
      },
    ],
  },
  {
    id: "read",
    number: 2,
    name: "Read",
    purpose: "Collect sources. Every finding shows where it came from.",
    stages: [
      {
        key: "Literature",
        label: "Sources",
        description:
          "Papers, data sheets and notes that support or question each idea, with the excerpt quoted.",
      },
    ],
  },
  {
    id: "design",
    number: 3,
    name: "Design",
    purpose: "Narrow the options to the fewest trials worth running.",
    stages: [
      {
        key: "Pathways",
        label: "Pathways",
        description:
          "A pathway is a recipe direction to test, such as “more polymer” or “lower cost”. Compare them and pick one.",
      },
      {
        key: "Trials",
        label: "Trial plan",
        description:
          "A trial is one recipe made and tested in the lab. Set the recipe, batch size and the tests to run.",
      },
    ],
  },
  {
    id: "execute",
    number: 4,
    name: "Execute",
    purpose: "Record lab results and decide what to try next.",
    stages: [
      {
        key: "Results",
        label: "Results",
        description:
          "Enter three specimen readings for each test. Helix calculates the mean.",
      },
      {
        key: "Analysis",
        label: "Analysis",
        description:
          "Compare each mean with its target. If a target is missed, review the proposed next trial.",
      },
    ],
  },
  {
    id: "report",
    number: 5,
    name: "Final report",
    purpose: "See the outcome, approve the recipe and download the report.",
    stages: [
      {
        key: "Final",
        label: "Final report",
        description:
          "The recommended recipe, how it performed, what it costs and what still needs review.",
      },
    ],
  },
];

export const stageKeys = procedure.flatMap((p) => p.stages.map((s) => s.key));

export const isStageKey = (value: string | null): value is StageKey =>
  !!value && (stageKeys as string[]).includes(value);

export const stepForStage = (key: string) =>
  procedure.find((p) => p.stages.some((s) => s.key === key)) || procedure[0];

export const stageLabel = (key: string) =>
  procedure.flatMap((p) => p.stages).find((s) => s.key === key)?.label || key;

/** "Execute · Results" style label for lists and titles. */
export const stageTitle = (key: string) => {
  const step = stepForStage(key);
  const label = stageLabel(key);
  return step.name === label ? label : `${step.name} · ${label}`;
};

export function isStageComplete(p: Project, key: StageKey) {
  switch (key) {
    case "Brief":
      return p.brief.targets.length > 0;
    case "Literature":
      return p.sources.length > 0;
    case "Pathways":
      return !!p.selectedPathway;
    case "Trials":
      return p.trials.length > 0;
    case "Results":
      return p.resultsReviewed;
    case "Analysis":
      return !p.needsReview && p.results.length > 0;
    case "Final":
      return p.status === "Approved";
  }
}

export const isStepComplete = (p: Project, step: ProcedureStep) =>
  step.stages.every((s) => isStageComplete(p, s.key));

/** The step a project is currently on, for cards and progress bars. */
export function currentStep(p: Project) {
  return stepForStage(isStageKey(p.stage) ? p.stage : "Literature");
}
