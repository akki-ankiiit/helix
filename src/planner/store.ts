import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project } from "./model";
import { referenceProjects, referenceIds } from "./references";
import { inputsHash, validate } from "./calc";

// Reference projects ship with the app and are never written to storage, so
// they cannot be altered. User projects (new ones and copies) are saved in
// this browser's localStorage under "helix-planner".

interface PlannerState {
  projects: Project[];
  /** Synthesis-planning projects from the previous version, kept unchanged. */
  archived: unknown[];
  nextNumber: number;
  create: () => string;
  duplicate: (id: string) => string | null;
  update: (id: string, fn: (p: Project) => Project) => boolean;
  generatePlan: (id: string) => { ok: true } | { ok: false; reason: string };
  remove: (id: string) => void;
}

const now = () => new Date().toISOString();

export function blankProject(id: string): Project {
  const t = now();
  return {
    id,
    reference: false,
    title: "",
    category: "",
    task: "",
    focus: "",
    objective: "",
    application: "",
    substrates: [],
    constraints: [],
    batchKg: 10,
    sources: [],
    literature: [],
    approaches: [],
    selectedApproachId: "",
    rationale: "",
    parts: [],
    ingredients: [],
    ratioChecks: [],
    process: [],
    timeline: [],
    tests: [],
    trials: [],
    assumptions: [],
    gaps: [],
    recommendations: [],
    prices: {},
    deliverable: "Formulation-development plan and report",
    created: t,
    updated: t,
  };
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      projects: [],
      archived: [],
      nextNumber: 101,
      create: () => {
        const id = `HX-${get().nextNumber}`;
        set((s) => ({
          projects: [blankProject(id), ...s.projects],
          nextNumber: s.nextNumber + 1,
        }));
        return id;
      },
      duplicate: (id) => {
        const source = findProject(id, get().projects);
        if (!source) return null;
        const newId = `HX-${get().nextNumber}`;
        const t = now();
        const copy: Project = {
          ...structuredClone(source),
          id: newId,
          reference: false,
          title: `${source.title} (my copy)`,
          createdFrom: source.id,
          plan: undefined,
          created: t,
          updated: t,
        };
        set((s) => ({ projects: [copy, ...s.projects], nextNumber: s.nextNumber + 1 }));
        return newId;
      },
      update: (id, fn) => {
        if (referenceIds.has(id)) return false;
        let changed = false;
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            changed = true;
            return { ...fn(structuredClone(p)), updated: now() };
          }),
        }));
        return changed;
      },
      generatePlan: (id) => {
        if (referenceIds.has(id))
          return { ok: false, reason: "Reference projects already have a generated plan. Use as starting point to make your own." };
        const p = get().projects.find((x) => x.id === id);
        if (!p) return { ok: false, reason: "Project not found in this browser." };
        const checks = validate(p);
        if (checks.length)
          return { ok: false, reason: `${checks.length} item${checks.length === 1 ? "" : "s"} must be fixed in Review first.` };
        const plan = {
          generatedAt: now(),
          version: (p.plan?.version || 0) + 1,
          inputsHash: inputsHash(p),
        };
        set((s) => ({
          projects: s.projects.map((x) => (x.id === id ? { ...x, plan } : x)),
        }));
        return { ok: true };
      },
      remove: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
    }),
    {
      name: "helix-planner",
      version: 2,
      // Version 1 held organic-synthesis projects with a different structure.
      // They are archived (not deleted) and can be downloaded from Settings.
      migrate: (persisted, version) => {
        const s = (persisted || {}) as { projects?: unknown[]; archived?: unknown[]; nextNumber?: number };
        if (version < 2)
          return { ...s, archived: [...(s.archived || []), ...(s.projects || [])], projects: [] } as unknown as PlannerState;
        return s as unknown as PlannerState;
      },
    },
  ),
);

export function findProject(id: string | undefined, user: Project[]) {
  if (!id) return undefined;
  return referenceProjects.find((p) => p.id === id) || user.find((p) => p.id === id);
}

export function useProject(id: string | undefined) {
  const user = usePlanner((s) => s.projects);
  return findProject(id, user);
}

export function useAllProjects() {
  const user = usePlanner((s) => s.projects);
  return [...referenceProjects, ...user];
}
