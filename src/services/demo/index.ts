import type {
  AskService,
  AuthenticationService,
  DocumentService,
  FormulationService,
  ProjectService,
} from "../contracts";
import { fixtureSources } from "../../data/fixtures/workspace";
import { useWorkspace } from "../../stores/workspace";
import { evaluate } from "../../domain/calculations";
import { propertyFor } from "../../data/property-library";
import { formatINR, formatMeasured } from "../../lib/format";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const authentication: AuthenticationService = {
  async signIn() {
    await delay(700);
    throw new Error(
      "No authentication service is connected. Use “Explore demo workspace” to enter the local demonstration.",
    );
  },
  async recover() {
    throw new Error(
      "Password recovery is unavailable: no authentication provider is connected. No email has been sent.",
    );
  },
};
export const projectService: ProjectService = {
  async list() {
    return useWorkspace.getState().projects;
  },
  async create(brief) {
    useWorkspace.getState().setDraft(brief);
    return useWorkspace.getState().createProject();
  },
};
export const documents: DocumentService = {
  async extractFixture() {
    await delay(700);
    return structuredClone(fixtureSources);
  },
};
export const formulation: FormulationService = {
  async run(id, stage) {
    useWorkspace.getState().startJob(id, stage);
  },
};
export const askHelix: AskService = {
  async ask(prompt, p) {
    await delay(550);
    if (!p)
      return {
        answer:
          "Open a project to discuss its brief, targets, and recorded trials. This deterministic demo assistant uses local project records only.",
        citation: "No current project · insufficient evidence",
      };
    const trial = p.trials.at(-1);
    if (/lower.cost|variant/i.test(prompt))
      return {
        answer:
          "There is insufficient measured evidence to recommend a recipe change. You can explicitly move the lowest-cost objective to the top of this brief for a new research pass. No composition will change.",
        citation: `Brief v${p.revisions.length}; illustrative pathways`,
        change: {
          before: p.brief.constraints.preference || "No cost preference",
          after: "Prioritize lower raw-material cost in the next research pass",
          kind: "objective",
        },
      };
    if (/not.*met|fail|target/i.test(prompt)) {
      const evaluations = p.brief.targets.map((t) => ({
        t,
        e: evaluate(
          t,
          p.results.find(
            (r) => r.trialId === trial?.id && r.propertyId === t.propertyId,
          ),
        ),
      }));
      return {
        answer:
          evaluations
            .map(
              ({ t, e }) =>
                `${propertyFor(t.propertyId).plain}: ${e.status}${e.mean !== null ? ` (${formatMeasured(e.mean, p.results.find((r) => r.trialId === trial?.id && r.propertyId === t.propertyId)?.readings)} ${t.unit})` : ""}.`,
            )
            .join(" ") +
          " These are illustrative demo records. Passing these targets does not establish a certified classification.",
        citation: `${trial?.name || "No trial"} · results grid; brief v${p.revisions.length}`,
      };
    }
    if (/compare/i.test(prompt))
      return {
        answer: p.pathways.length
          ? p.pathways
              .map(
                (x) =>
                  `${x.name}: estimated ${formatINR(x.cost)}/kg; ${x.rationale}`,
              )
              .join(" ") +
            " Scores are illustrative heuristics, not validated predictions."
          : "No pathways are available yet. Complete step 2, Read, first.",
        citation: "Pathway fixture · low confidence",
      };
    return {
      answer: `${p.brief.name} is a ${p.brief.useCase.environment?.toLowerCase() || ""} project with ${p.brief.targets.length} targets and ${p.brief.benchmarkIds.length} benchmark(s). ${p.trials.length} trial revisions are retained. ${p.brief.constraints.cost ? `Cost ceiling: ${p.brief.constraints.currency && p.brief.constraints.currency !== "INR" ? `${p.brief.constraints.currency} ${p.brief.constraints.cost}` : formatINR(Number(p.brief.constraints.cost))}/kg.` : "No exact cost ceiling is set."} ${p.needsReview ? "Downstream analysis needs review." : "See the test grid for measured evidence."}`,
      citation: `Project brief v${p.revisions.length} · local demo records`,
    };
  },
};
