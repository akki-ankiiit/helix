import type {
  Brief,
  Pathway,
  Project,
  RawMaterial,
  RecipeRevision,
} from "../domain/models";
import { USD_TO_INR, usdToInr } from "../lib/format";
import { normaliseIntakeStep } from "../data/intake-steps";

// Saved browser data from earlier versions priced everything in US$. Convert
// it once, at the documented reference rate, so user edits are preserved and
// every amount is in ₹. Other currencies are left untouched and flagged by
// the approval checks, because no rate for them is configured.

const material = (m: RawMaterial): RawMaterial =>
  m.currency === "USD"
    ? {
        ...m,
        currency: "INR",
        price: m.price === null ? null : usdToInr(m.price),
      }
    : m;

const brief = (b: Brief): Brief =>
  b.constraints.currency === "USD"
    ? {
        ...b,
        constraints: {
          ...b.constraints,
          currency: "INR",
          cost:
            b.constraints.cost.trim() && Number.isFinite(Number(b.constraints.cost))
              ? String(usdToInr(Number(b.constraints.cost)))
              : b.constraints.cost,
        },
      }
    : b;

const trial = (t: RecipeRevision): RecipeRevision =>
  t.materialsSnapshot
    ? { ...t, materialsSnapshot: t.materialsSnapshot.map(material) }
    : t;

const pathway = (p: Pathway): Pathway => ({ ...p, cost: usdToInr(p.cost) });

const project = (p: Project): Project => {
  const converted =
    p.brief.constraints.currency === "USD" ||
    p.trials.some((t) => t.materialsSnapshot?.some((m) => m.currency === "USD"));
  return {
    ...p,
    brief: brief(p.brief),
    revisions: p.revisions.map((r) => ({ ...r, brief: brief(r.brief) })),
    trials: p.trials.map(trial),
    pathways: p.pathways.map(pathway),
    activity: converted
      ? [
          {
            id: `inr-${p.id}`,
            text: `Prices converted from US$ to ₹ at ₹${USD_TO_INR.rate} = US$1 (${USD_TO_INR.source})`,
            date: new Date().toISOString(),
          },
          ...p.activity,
        ]
      : p.activity,
  };
};

interface PersistedV0 {
  draft?: Brief;
  draftStep?: string;
  projects?: Project[];
  materials?: RawMaterial[];
  [key: string]: unknown;
}

export function migrateToInr(state: unknown) {
  const s = (state || {}) as PersistedV0;
  // Only rewrite keys that exist, so missing ones fall back to defaults.
  const next: PersistedV0 = { ...s };
  if (s.draft) next.draft = brief(s.draft);
  if (s.draftStep !== undefined) next.draftStep = normaliseIntakeStep(s.draftStep);
  if (s.projects) next.projects = s.projects.map(project);
  if (s.materials) next.materials = s.materials.map(material);
  return next;
}
