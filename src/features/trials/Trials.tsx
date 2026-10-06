import { useState } from "react";
import { Copy, LockKeyhole, Plus, RefreshCw } from "lucide-react";
import type { Project, RecipeRevision } from "../../domain/models";
import { Badge, Button, Empty, Field, Modal, Notice, Reason, s } from "../../components/ui";
import { formatINR, formatNumber } from "../../lib/format";
import { useWorkspace, uid } from "../../stores/workspace";
import { recipeMetrics, TOTAL_TOLERANCE } from "../../domain/calculations";
import { propertyFor } from "../../data/property-library";
import c from "../projects/Project.module.css";
export function Trials({ project: p }: { project: Project }) {
  const state = useWorkspace();
  const [swap, setSwap] = useState<string | null>(null),
    [replacement, setReplacement] = useState(""),
    [error, setError] = useState("");
  const canEdit = ["Chemist", "Admin"].includes(state.user?.role || "");
  function update(id: string, fn: (t: RecipeRevision) => RecipeRevision) {
    if (!canEdit) return;
    const original = p.trials.find((t) => t.id === id);
    if (!original || original.locked) return;
    if (p.results.some((r) => r.trialId === id)) {
      const version = p.trials.length + 1;
      const revised = fn({
        ...structuredClone(original),
        id: uid(),
        parentId: id,
        version,
        name: `T${String(version).padStart(2, "0")} · revised recipe`,
        locked: false,
        materialsSnapshot: undefined,
      });
      state.updateProject(p.id, (x) => ({
        ...x,
        trials: [
          ...x.trials.map((t) =>
            t.id === id
              ? {
                  ...t,
                  locked: true,
                  materialsSnapshot: structuredClone(state.materials),
                }
              : t,
          ),
          revised,
        ],
        needsReview: true,
        resultsReviewed: false,
        status: "In progress",
        activity: [
          {
            id: uid(),
            text: `Recipe revision v${version} created; prior measured evidence preserved`,
            date: new Date().toISOString(),
          },
          ...x.activity,
        ],
      }));
      state.notify(
        "A recipe with measured evidence was revised. The original is now read-only; enter new results for the new trial.",
      );
      return;
    }
    state.updateProject(p.id, (x) => ({
      ...x,
      trials: x.trials.map((t) => (t.id === id && !t.locked ? fn(t) : t)),
      needsReview: true,
      resultsReviewed: false,
    }));
  }
  function duplicate(trial?: RecipeRevision) {
    const t: RecipeRevision = trial
      ? {
          ...structuredClone(trial),
          id: uid(),
          parentId: trial.id,
          locked: false,
          materialsSnapshot: undefined,
          version: p.trials.length + 1,
          name: `T${String(p.trials.length + 1).padStart(2, "0")} · ${trial.locked ? "draft revision" : "duplicate"}`,
        }
      : {
          id: uid(),
          name: "T01 · baseline",
          version: 1,
          percentages: {
            cement: 35,
            sand: 56,
            polymer: 4,
            cellulose: 0.4,
            filler: 4.5,
            starch: 0.1,
          },
          batchKg: 5,
          water: 24,
          basis: "Dry blend",
          locked: false,
        };
    state.updateProject(p.id, (x) => ({
      ...x,
      trials: [...x.trials, t],
      stage: "Trials",
      status: "In progress",
      needsReview: true,
      resultsReviewed: false,
    }));
    state.notify(
      trial
        ? "New trial revision created. Historical recipes and results preserved."
        : "Illustrative baseline loaded for qualified R&D review.",
    );
  }
  return (
    <div className={s.stack}>
      <p className={s.muted} style={{ fontSize: 13 }}>
        Quantities are dry-blend weight % and must add up to 100% (±
        {TOTAL_TOLERANCE}%). Water is entered separately as a % of the dry
        mass. Helix never rescales your numbers. The example recipe needs R&amp;D
        review before use.
      </p>
      <div className={s.sectionTitle}>
        <h3>Recipes {p.trials.length > 0 && <Badge>{p.trials.length} trials</Badge>}</h3>
        <div className={s.row}>
          <Button
            small
            variant="primary"
            disabled={
              !canEdit ||
              !p.selectedPathway ||
              p.brief.subcategoryId !== "tile-0"
            }
            onClick={() => duplicate(p.trials.at(-1))}
          >
            <Plus size={13} />
            {p.trials.length ? "Add trial (copy latest)" : "Add first trial"}
          </Button>
        </div>
      </div>
      {(!canEdit || !p.selectedPathway || p.brief.subcategoryId !== "tile-0") && (
        <Reason>
          {!canEdit
            ? "You can view recipes. Only a Chemist or Admin can edit them; change your demo role in Settings."
            : !p.selectedPathway
              ? "Select a pathway in Design · Pathways before adding a trial."
              : "This demo has no starting recipe for this product family. Your R&D team needs to add one."}
        </Reason>
      )}
      {!p.trials.length ? (
        <Empty title={p.selectedPathway ? "No trials yet" : "Select a pathway first"}>
          <p>
            {p.selectedPathway
              ? "Add your first trial to set its recipe, batch size and tests."
              : "Trials start from the pathway you choose in the previous view."}
          </p>
        </Empty>
      ) : (
        <>
          <p className={s.scrollHint}>Scroll sideways to see every trial →</p>
          <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Recipe matrix">
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Ingredient</th>
                  <th scope="col">Grade and supplier</th>
                  <th scope="col" className={s.num}>Price (₹/kg) and limits</th>
                  {p.trials.map((t) => (
                    <th scope="col" key={t.id}>
                      <div className={s.row}>
                        {t.name}
                        {t.locked && <LockKeyhole size={11} />}
                      </div>
                      <small style={{ display: "block", marginTop: 5 }}>
                        Revision {t.version} ·{" "}
                        {t.locked ? "Read-only" : "Draft"}
                      </small>
                      <Button
                        small
                        variant="ghost"
                        disabled={!canEdit}
                        onClick={() => duplicate(t)}
                      >
                        <Copy size={11} />
                        {t.locked ? "New draft revision" : "Duplicate"}
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.materials
                  .filter((m) => p.trials.some((t) => m.id in t.percentages))
                  .map((m) => (
                    <tr key={m.id}>
                      <td>
                        <b>{m.name}</b>
                        <small>{m.function}</small>
                        <Button
                          small
                          variant="ghost"
                          disabled={!canEdit || p.trials.every((t) => t.locked)}
                          onClick={() => {
                            setSwap(m.id);
                            setReplacement("");
                          }}
                        >
                          <RefreshCw size={10} />
                          Swap
                        </Button>
                      </td>
                      <td>
                        {m.grade}
                        <small>{m.supplier}</small>
                      </td>
                      <td className={s.num}>
                        {m.price === null || m.currency !== "INR" ? (
                          <Badge tone="amber">No ₹ price</Badge>
                        ) : (
                          formatINR(m.price)
                        )}
                        <small>
                          Allowed {m.min}–{m.max}%
                        </small>
                      </td>
                      {p.trials.map((t) => (
                        <td key={t.id} className={s.num}>
                          <input
                            aria-label={`${t.name} ${m.name} percentage`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={t.percentages[m.id] ?? 0}
                            disabled={t.locked || !canEdit}
                            style={{ width: 85 }}
                            onChange={(e) =>
                              update(t.id, (t) => ({
                                ...t,
                                percentages: {
                                  ...t.percentages,
                                  [m.id]:
                                    e.target.value === ""
                                      ? NaN
                                      : Number(e.target.value),
                                },
                              }))
                            }
                          />{" "}
                          <span className={s.muted}>%</span>
                          <small>
                            {formatNumber(
                              ((t.percentages[m.id] || 0) * t.batchKg) / 100,
                              3,
                            )}{" "}
                            kg
                          </small>
                        </td>
                      ))}
                    </tr>
                  ))}
                <tr className={s.totalRow}>
                  <td>Total dry blend</td>
                  <td />
                  <td className={s.num}>Must be 100%</td>
                  {p.trials.map((t) => {
                    const m = recipeMetrics(
                      t,
                      state.materials,
                      Number(p.brief.constraints.cost) || undefined,
                      p.brief.constraints.excluded,
                    );
                    return (
                      <td key={t.id} className={s.num}>
                        <b
                          style={{
                            color: m.errors.length
                              ? "var(--red)"
                              : "var(--green)",
                          }}
                        >
                          {m.total.toFixed(2)}%
                        </b>
                        <small>
                          {m.cost === null
                            ? "Cost incomplete"
                            : `${formatINR(m.cost)}/kg`}
                        </small>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td>Batch size (dry)</td>
                  <td />
                  <td className={s.num}>kg</td>
                  {p.trials.map((t) => (
                    <td key={t.id} className={s.num}>
                      <input
                        type="number"
                        min="0.01"
                        step="0.1"
                        aria-label={`${t.name} batch kg`}
                        value={t.batchKg}
                        disabled={t.locked || !canEdit}
                        onChange={(e) =>
                          update(t.id, (t) => ({
                            ...t,
                            batchKg: Number(e.target.value),
                          }))
                        }
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Application water</td>
                  <td>Not part of the 100%</td>
                  <td className={s.num}>% of dry mass</td>
                  {p.trials.map((t) => (
                    <td key={t.id} className={s.num}>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        aria-label={`${t.name} application water`}
                        value={t.water}
                        disabled={t.locked || !canEdit}
                        onChange={(e) =>
                          update(t.id, (t) => ({
                            ...t,
                            water: Math.max(0, Number(e.target.value)),
                          }))
                        }
                      />
                      <small>
                        {formatNumber((t.batchKg * t.water) / 100, 3)} kg water
                      </small>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Checks</td>
                  <td colSpan={2}>Limits, total, cost ceiling and excluded materials</td>
                  {p.trials.map((t) => {
                    const m = recipeMetrics(
                      t,
                      state.materials,
                      Number(p.brief.constraints.cost) || undefined,
                      p.brief.constraints.excluded,
                    );
                    return (
                      <td
                        key={t.id}
                        style={{ whiteSpace: "normal", minWidth: 180 }}
                      >
                        {m.errors.length ? (
                          m.errors.map((err) => (
                            <small key={err} className={s.error}>
                              {err}
                            </small>
                          ))
                        ) : (
                          <Badge tone="green">All checks pass</Badge>
                        )}
                        {m.cost === null && (
                          <small className={s.error}>
                            An ingredient has no ₹ price, so cost is incomplete
                          </small>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className={c.protocol}>
            <section>
              <h3>How to mix</h3>
              <Badge tone="amber">Illustrative · review before use</Badge>
              <ol>
                <li>
                  Review supplier handling information and equipment
                  compatibility.
                </li>
                <li>
                  Weigh mineral ingredients and premix in a suitable dry mixer.
                </li>
                <li>
                  Introduce the polymer and minor additives using a controlled
                  blending sequence.
                </li>
                <li>
                  Record application water separately; document mixing history.
                </li>
              </ol>
              <div className={s.formGrid} style={{ marginTop: 15 }}>
                <Field label={`Mix time for ${p.trials.at(-1)?.name.split(" · ")[0]}`} unit="min" optional hint="Set by R&D for your mixer.">
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={p.trials.at(-1)?.mixTime || ""}
                    placeholder="Not set"
                    disabled={!canEdit || p.trials.at(-1)?.locked}
                    onChange={(e) =>
                      update(p.trials.at(-1)!.id, (t) => ({
                        ...t,
                        mixTime: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="Mixer speed" unit="rpm" optional hint="Depends on the equipment.">
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={p.trials.at(-1)?.mixSpeed || ""}
                    placeholder="Not set"
                    disabled={!canEdit || p.trials.at(-1)?.locked}
                    onChange={(e) =>
                      update(p.trials.at(-1)!.id, (t) => ({
                        ...t,
                        mixSpeed: e.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <p style={{ marginTop: 14 }}>
                Equipment: {p.brief.constraints.equipment || "Confirm with R&D"}
                . Handling: obtain current supplier SDS. No operating parameters
                are validated.
              </p>
            </section>
            <section>
              <h3>Tests to run</h3>
              <p>
                Three specimen readings per test. R&amp;D must confirm specimen
                size and method.
              </p>
              <div className={s.list} style={{ marginTop: 14 }}>
                {p.testPlan.map((t) => (
                  <div key={t.propertyId}>
                    <h3 style={{ fontSize: 12, marginBottom: 3 }}>
                      {propertyFor(t.propertyId).name}
                    </h3>
                    <p>
                      {t.specimens} specimens ·{" "}
                      {t.ageDays === 0
                        ? "Fresh (tested straight after mixing)"
                        : `After ${t.ageDays} days of curing`}{" "}
                      · {t.required ? "Required" : "Optional"}
                    </p>
                    <p>{t.condition}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
      {swap && (
        <Modal title="Review a material swap" onClose={() => setSwap(null)}>
          <div className={s.stack}>
            <Notice warning>
              Swapping affects the latest unlocked trial only and marks analysis
              for review. Grades and compatibility require R&D confirmation.
            </Notice>
            <p>Before: {state.materials.find((m) => m.id === swap)?.name}</p>
            <Field label="Replacement material">
              <select
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              >
                <option value="">Choose a material</option>
                {state.materials
                  .filter((m) => m.id !== swap)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.function}
                    </option>
                  ))}
              </select>
            </Field>
            {error && <p className={s.error}>{error}</p>}
          </div>
          <div className={s.modalActions}>
            <Button onClick={() => setSwap(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!replacement}
              onClick={() => {
                const trial = [...p.trials].reverse().find((t) => !t.locked);
                if (!trial) return;
                if ((trial.percentages[replacement] || 0) > 0) {
                  setError(
                    "Replacement already exists in this recipe. Review and combine dosages manually rather than silently merging.",
                  );
                  return;
                }
                update(trial.id, (t) => {
                  const percentages = {
                    ...t.percentages,
                    [replacement]: t.percentages[swap],
                  };
                  delete percentages[swap];
                  return { ...t, percentages };
                });
                setSwap(null);
              }}
            >
              Accept swap
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
