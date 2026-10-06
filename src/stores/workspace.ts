import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Benchmark,
  Brief,
  Job,
  Mode,
  Project,
  RawMaterial,
  Role,
  User,
} from "../domain/models";
import {
  blankBrief,
  fixturePathways,
  fixtureSources,
  initialBenchmarks,
  initialMaterials,
} from "../data/fixtures/workspace";
import { migrateToInr } from "./migrations";
const uid = () => crypto.randomUUID();
export { uid };
interface Workspace {
  user: User | null;
  draft: Brief;
  draftStep: string;
  projects: Project[];
  benchmarks: Benchmark[];
  materials: RawMaterial[];
  jobs: Job[];
  notification: string;
  /** Optional destination for the notification action. */
  notificationLink?: { to: string; label: string };
  login: () => void;
  logout: () => void;
  setMode: (mode: Mode) => void;
  setRole: (role: Role) => void;
  setDraft: (patch: Partial<Brief>) => void;
  setStep: (step: string) => void;
  newDraft: () => void;
  createProject: () => string;
  updateProject: (id: string, fn: (p: Project) => Project) => void;
  addBenchmark: (b: Benchmark) => void;
  setMaterials: (m: RawMaterial[]) => void;
  startJob: (projectId: string, stage: string, fail?: boolean) => void;
  tick: () => void;
  jobAction: (id: string, action: "retry" | "cancel") => void;
  notify: (text: string, link?: { to: string; label: string }) => void;
  reset: () => void;
}
export const useWorkspace = create<Workspace>()(
  persist(
    (set, get) => ({
      user: null,
      draft: blankBrief(),
      draftStep: "product",
      projects: [],
      benchmarks: initialBenchmarks,
      materials: initialMaterials,
      jobs: [],
      notification: "",
      login: () =>
        set({
          user: {
            id: "demo-user",
            name: "Alex Morgan",
            email: "alex@helix.demo",
            role: "Chemist",
            mode:
              (localStorage.getItem("helix-demo-user-mode") as Mode | null) ||
              undefined,
          },
        }),
      logout: () => set({ user: null }),
      setMode: (mode) => {
        localStorage.setItem("helix-demo-user-mode", mode);
        set((s) => ({ user: s.user ? { ...s.user, mode } : null }));
      },
      setRole: (role) =>
        set((s) => ({ user: s.user ? { ...s.user, role } : null })),
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      setStep: (draftStep) => set({ draftStep }),
      newDraft: () =>
        set({
          draft: blankBrief(),
          draftStep: "product",
        }),
      createProject: () => {
        const id = uid(),
          brief = structuredClone(get().draft),
          date = new Date().toISOString();
        const p: Project = {
          id,
          brief,
          revisions: [
            {
              version: 1,
              brief: structuredClone(brief),
              date,
              reason: "Initial brief",
            },
          ],
          owner: get().user?.name || "Demo user",
          updated: date,
          stage: "Literature",
          status: "In progress",
          sources: [],
          pathways: [],
          trials: [],
          results: [],
          testPlan: brief.targets.map((t) => ({
            propertyId: t.propertyId,
            required: t.priority === "Must",
            specimens: 3,
            ageDays: t.unit === "MPa" ? 28 : 0,
            condition: t.condition,
            dueDate: new Date(
              Date.now() + (t.unit === "MPa" ? 28 : 0) * 86400000,
            )
              .toISOString()
              .slice(0, 10),
          })),
          approvals: [],
          comments: [],
          activity: [{ id: uid(), text: "Brief v1 created", date }],
          needsReview: false,
          resultsReviewed: false,
        };
        set((s) => ({
          projects: [p, ...s.projects],
          draft: blankBrief(),
          draftStep: "product",
        }));
        return id;
      },
      updateProject: (id, fn) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...fn(structuredClone(p)), updated: new Date().toISOString() }
              : p,
          ),
        })),
      addBenchmark: (b) => set((s) => ({ benchmarks: [...s.benchmarks, b] })),
      setMaterials: (materials) => set({ materials }),
      startJob: (projectId, stage, fail = false) => {
        if (
          get().jobs.some(
            (j) =>
              j.projectId === projectId &&
              j.stage === stage &&
              (j.status === "Running" || j.status === "Queued"),
          )
        )
          return;
        set((s) => ({
          jobs: [
            {
              id: uid(),
              projectId,
              name: `${stage === "Literature" ? "Read · source search" : "Design · pathway search"} (demo)`,
              stage,
              status: "Queued",
              started: Date.now() + 500,
              duration: 6000,
              progress: 0,
              ...(fail
                ? {
                    error: "Deliberate demo failure. Retry to run the fixture.",
                  }
                : {}),
            },
            ...s.jobs,
          ],
        }));
      },
      tick: () => {
        if (
          !get().jobs.some(
            (j) => j.status === "Running" || j.status === "Queued",
          )
        )
          return;
        const completed: Job[] = [];
        set((s) => ({
          jobs: s.jobs.map((j) => {
            if (j.status === "Queued")
              return Date.now() >= j.started
                ? { ...j, status: "Running" as const }
                : j;
            if (j.status !== "Running") return j;
            const progress = Math.min(
              100,
              Math.floor(((Date.now() - j.started) / j.duration) * 100),
            );
            if (progress === 100) {
              const next = {
                ...j,
                progress,
                status: j.error ? ("Failed" as const) : ("Completed" as const),
                finished: Date.now(),
              };
              completed.push(next);
              return next;
            }
            return { ...j, progress };
          }),
        }));
        for (const job of completed) {
          if (job.status === "Completed")
            get().updateProject(job.projectId, (p) => ({
              ...p,
              ...(job.stage === "Literature"
                ? {
                    sources: [
                      ...p.sources,
                      ...structuredClone(fixtureSources).filter(
                        (source) =>
                          !p.sources.some(
                            (existing) => existing.id === source.id,
                          ),
                      ),
                    ],
                    stage: "Pathways",
                  }
                : {
                    pathways:
                      p.brief.subcategoryId === "tile-0"
                        ? [
                            ...p.pathways,
                            ...structuredClone(fixturePathways).filter(
                              (pathway) =>
                                !p.pathways.some(
                                  (existing) => existing.id === pathway.id,
                                ),
                            ),
                          ]
                        : [],
                    stage: "Pathways",
                  }),
              needsReview: p.trials.length > 0 || p.needsReview,
              activity: [
                {
                  id: uid(),
                  text: `${job.stage} demo simulation completed`,
                  date: new Date().toISOString(),
                },
                ...p.activity,
              ],
            }));
          get().notify(
            job.status === "Completed"
              ? `${job.name} finished.`
              : `${job.name} failed. ${job.error || ""}`,
            {
              to:
                job.status === "Completed"
                  ? `/projects/${job.projectId}?stage=${job.stage}`
                  : "/tasks",
              label: job.status === "Completed" ? "View results" : "Open task queue",
            },
          );
        }
      },
      jobAction: (id, action) =>
        set((s) => ({
          jobs: s.jobs.map((j) =>
            j.id === id
              ? action === "cancel"
                ? { ...j, status: "Cancelled", finished: Date.now() }
                : {
                    ...j,
                    status: "Running",
                    started: Date.now(),
                    error: undefined,
                    progress: 0,
                  }
              : j,
          ),
        })),
      notify: (notification, notificationLink) =>
        set({ notification, notificationLink }),
      reset: () => {
        localStorage.removeItem("helix-demo-user-mode");
        set({
          user: null,
          draft: blankBrief(),
          draftStep: "product",
          projects: [],
          benchmarks: structuredClone(initialBenchmarks),
          materials: structuredClone(initialMaterials),
          jobs: [],
          notification: "",
        });
      },
    }),
    {
      name: "helix-demo-workspace",
      version: 1,
      migrate: (persisted, version) =>
        (version < 1 ? migrateToInr(persisted) : persisted) as Workspace,
      partialize: (s) => ({
        user: s.user,
        draft: s.draft,
        draftStep: s.draftStep,
        projects: s.projects,
        benchmarks: s.benchmarks,
        materials: s.materials,
        jobs: s.jobs,
      }),
    },
  ),
);
