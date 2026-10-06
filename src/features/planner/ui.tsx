import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Breakdown,
  Button,
  Empty,
  Field,
  Figure,
  Modal,
  TargetChart,
  s,
} from "../../components/ui";
import type {
  Evidence,
  Ingredient,
  IngredientFunction,
  Project,
  ReviewStatus,
  SourceKind,
} from "../../planner/model";
import { ingredientFunctions } from "../../planner/model";
import {
  evidenceLabel,
  fmt,
  formatINR,
  validationStatus,
  type ProjectCalc,
} from "../../planner/calc";
import { usePlanner } from "../../planner/store";
import c from "./planner.module.css";

export function useEditor(p: Project) {
  const update = usePlanner((st) => st.update);
  return (fn: (d: Project) => void) =>
    update(p.id, (d) => {
      fn(d);
      return d;
    });
}

const tagClass: Record<Evidence, string> = {
  source: s.data_entered,
  calculated: s.data_calculated,
  illustrative: s.data_estimate,
  "not-reported": s.data_missing,
};
export function EvidenceTag({ kind }: { kind: Evidence }) {
  return (
    <span className={`${s.dataTag} ${tagClass[kind]}`}>
      {evidenceLabel[kind]}
    </span>
  );
}
const reviewClass: Record<ReviewStatus, string> = {
  "Source-supported": s.data_entered,
  Illustrative: s.data_estimate,
  "Needs supplier data": s.data_missing,
};
export function ReviewTag({ value }: { value: ReviewStatus }) {
  return <span className={`${s.dataTag} ${reviewClass[value]}`}>{value}</span>;
}

export function EvidenceLegend() {
  return (
    <p className={c.legend}>
      <EvidenceTag kind="source" /> stated in a cited source{" "}
      <EvidenceTag kind="calculated" /> worked out by Helix{" "}
      <EvidenceTag kind="illustrative" /> development input, not a source value{" "}
      <EvidenceTag kind="not-reported" /> not available; must be obtained
    </p>
  );
}

export function Editable({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset disabled={readOnly} className={c.editable}>
      {children}
    </fieldset>
  );
}

export function SourceLink({
  p,
  id,
  children,
}: {
  p: Project;
  id?: string;
  children?: ReactNode;
}) {
  const src = p.sources.find((x) => x.id === id);
  if (!src) return null;
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noreferrer"
      className={c.sourceLink}
      title={`${src.title} (${src.version})`}
    >
      {children ?? src.publisher}
      <ExternalLink size={11} aria-label="(opens in a new tab)" />
    </a>
  );
}

let seq = 0;
export const nid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`;

// ---------------------------------------------------------------------------
// Formulation table
// ---------------------------------------------------------------------------

export function FormulationTable({
  p,
  calc,
  readOnly,
}: {
  p: Project;
  calc: ProjectCalc;
  readOnly: boolean;
}) {
  const edit = useEditor(p);
  const [fn, setFn] = useState<"All functions" | IngredientFunction>(
    "All functions",
  );
  const set = (idv: string, patch: Partial<Ingredient>) =>
    edit((d) => {
      Object.assign(
        d.ingredients.find((x) => x.id === idv)!,
        patch,
      );
    });
  const functionsUsed = [...new Set(p.ingredients.map((i) => i.function))];
  return (
    <div className={s.stack}>
      {functionsUsed.length > 3 && (
        <label className={c.inlineFilter}>
          Show
          <select
            aria-label="Filter ingredients by function"
            value={fn}
            onChange={(e) => setFn(e.target.value as typeof fn)}
          >
            <option>All functions</option>
            {functionsUsed.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      )}
      {calc.parts.map((part) => {
        const rows = calc.lines.filter(
          (l) =>
            l.ingredient.partId === part.partId &&
            (fn === "All functions" || l.ingredient.function === fn),
        );
        return (
          <section key={part.partId} aria-label={`Formulation of ${part.name}`}>
            {p.parts.length > 1 && (
              <h4 className={c.partHeading}>
                {part.name}
                <span>
                  {fmt(part.massKg, 2)} kg in a {fmt(p.batchKg, 2)} kg batch (
                  {fmt(part.sharePct, 1)}% of the mixed system)
                </span>
              </h4>
            )}
            <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
            <div
              className={s.tableWrap}
              tabIndex={0}
              role="region"
              aria-label={`Formulation table: ${part.name}`}
            >
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">Ingredient</th>
                    <th scope="col">Function</th>
                    <th scope="col">Grade or specification</th>
                    <th scope="col" className={s.num}>
                      Composition, wt.%
                    </th>
                    <th scope="col" className={s.num}>
                      Batch quantity
                    </th>
                    <th scope="col">Unit</th>
                    <th scope="col">Source or basis</th>
                    <th scope="col">Review status</th>
                    {!readOnly && (
                      <th scope="col">
                        <span className={s.srOnly}>Remove</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ ingredient: i, qtyKg, activeKg }) => (
                    <tr key={i.id}>
                      <td style={{ whiteSpace: "normal", minWidth: 170 }}>
                        {readOnly ? (
                          <b>{i.name}</b>
                        ) : (
                          <input
                            aria-label="Ingredient name"
                            value={i.name}
                            onChange={(e) =>
                              set(i.id, { name: e.target.value })
                            }
                          />
                        )}
                        {i.activePct != null && (
                          <small>
                            Active/solids {fmt(i.activePct, 1)}% →{" "}
                            {activeKg != null
                              ? `${fmt(activeKg, 3)} kg active`
                              : "—"}
                          </small>
                        )}
                        {i.activePct === null && (
                          <small>Active content not stated</small>
                        )}
                      </td>
                      <td>
                        {readOnly ? (
                          i.function
                        ) : (
                          <select
                            aria-label={`${i.name} function`}
                            value={i.function}
                            onChange={(e) =>
                              set(i.id, {
                                function: e.target.value as IngredientFunction,
                              })
                            }
                          >
                            {ingredientFunctions.map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ whiteSpace: "normal", minWidth: 150 }}>
                        {readOnly ? (
                          i.grade
                        ) : (
                          <input
                            aria-label={`${i.name} grade`}
                            value={i.grade}
                            onChange={(e) =>
                              set(i.id, { grade: e.target.value })
                            }
                          />
                        )}
                      </td>
                      <td className={s.num}>
                        {readOnly ? (
                          i.wtPct === null ? (
                            <span className={s.error}>Missing</span>
                          ) : (
                            fmt(i.wtPct, 2)
                          )
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            inputMode="decimal"
                            style={{ width: 90 }}
                            aria-label={`${i.name} composition in wt.%`}
                            value={i.wtPct ?? ""}
                            placeholder="Missing"
                            onChange={(e) =>
                              set(i.id, {
                                wtPct:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                                evidence: "illustrative",
                                review:
                                  i.review === "Source-supported"
                                    ? "Illustrative"
                                    : i.review,
                              })
                            }
                          />
                        )}
                      </td>
                      <td className={s.num}>
                        {qtyKg === null ? "—" : fmt(qtyKg, 3)}
                      </td>
                      <td>kg</td>
                      <td style={{ whiteSpace: "normal", minWidth: 160 }}>
                        {i.basis}
                        {i.sourceId && (
                          <small>
                            <SourceLink p={p} id={i.sourceId} />
                          </small>
                        )}
                      </td>
                      <td>
                        <ReviewTag value={i.review} />
                      </td>
                      {!readOnly && (
                        <td>
                          <Button
                            small
                            variant="ghost"
                            aria-label={`Remove ${i.name}`}
                            title={`Remove ${i.name}`}
                            onClick={() =>
                              edit((d) => {
                                d.ingredients = d.ingredients.filter(
                                  (x) => x.id !== i.id,
                                );
                              })
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className={s.totalRow}>
                    <td colSpan={3}>
                      Total {part.name}{" "}
                      {part.balanced ? (
                        <span className={c.okText}>
                          <Check size={13} aria-hidden="true" /> balanced
                        </span>
                      ) : part.missing.length ? (
                        <span className={s.error}>
                          {part.missing.length} value
                          {part.missing.length === 1 ? "" : "s"} missing
                        </span>
                      ) : (
                        <span className={s.error}>must total 100%</span>
                      )}
                    </td>
                    <td className={s.num}>{fmt(part.total, 2)}</td>
                    <td className={s.num}>
                      {part.missing.length
                        ? "—"
                        : fmt((part.massKg * part.total) / 100, 3)}
                    </td>
                    <td>kg</td>
                    <td colSpan={readOnly ? 2 : 3} />
                  </tr>
                </tbody>
              </table>
            </div>
            {!readOnly && (
              <Button
                small
                style={{ marginTop: 8 }}
                onClick={() =>
                  edit((d) => {
                    d.ingredients.push({
                      id: nid("ing"),
                      partId: part.partId,
                      name: "New ingredient",
                      function: "Additive",
                      grade: "",
                      wtPct: null,
                      evidence: "illustrative",
                      review: "Needs supplier data",
                      basis: "Added by user",
                    });
                  })
                }
              >
                <Plus size={13} aria-hidden="true" /> Add ingredient
                {p.parts.length > 1 ? ` to ${part.name}` : ""}
              </Button>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Approach comparison
// ---------------------------------------------------------------------------

export function ApproachTable({
  p,
  readOnly,
  onSelect,
}: {
  p: Project;
  readOnly: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className={s.tableWrap}
      tabIndex={0}
      role="region"
      aria-label="Pathway comparison"
    >
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">Approach</th>
            <th scope="col">Intended application</th>
            <th scope="col">Advantages</th>
            <th scope="col">Constraints</th>
            <th scope="col">Evidence</th>
            <th scope="col">Recommendation</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {p.approaches.map((a) => {
            const selected = a.id === p.selectedApproachId;
            return (
              <tr key={a.id} className={selected ? c.selectedRow : ""}>
                <td style={{ whiteSpace: "normal", minWidth: 170 }}>
                  <b>{a.name}</b>
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 150 }}>
                  {a.application}
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 150 }}>
                  {a.advantages}
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 150 }}>
                  {a.constraints}
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 120 }}>
                  {a.sourceIds.length ? (
                    a.sourceIds.map((x) => (
                      <small key={x}>
                        <SourceLink p={p} id={x} />
                      </small>
                    ))
                  ) : (
                    <span className={s.muted}>None yet</span>
                  )}
                </td>
                <td>
                  <span
                    className={`${c.reco} ${c[`reco_${a.recommendation.replace(/ /g, "")}`]}`}
                  >
                    {a.recommendation}
                  </span>
                </td>
                <td>
                  {selected ? (
                    <span className={c.okText}>
                      <Check size={14} aria-hidden="true" /> Selected
                    </span>
                  ) : (
                    <Button
                      small
                      disabled={readOnly}
                      onClick={() => onSelect(a.id)}
                      title={
                        readOnly
                          ? "Reference projects are read-only"
                          : undefined
                      }
                    >
                      Select
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Processing conditions
// ---------------------------------------------------------------------------

const processCols = [
  ["stage", "Stage"],
  ["equipment", "Equipment"],
  ["order", "Addition order"],
  ["requirement", "Processing requirement"],
  ["duration", "Duration, if supported"],
  ["checkpoint", "Checkpoint"],
] as const;

export function ProcessTable({
  p,
  readOnly,
}: {
  p: Project;
  readOnly: boolean;
}) {
  const edit = useEditor(p);
  return (
    <>
      <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
      <div
        className={s.tableWrap}
        tabIndex={0}
        role="region"
        aria-label="Processing conditions"
      >
        <table className={s.table}>
          <thead>
            <tr>
              {processCols.map(([, h]) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
              <th scope="col">Source</th>
              {!readOnly && (
                <th scope="col">
                  <span className={s.srOnly}>Remove</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {p.process.map((row, i) => (
              <tr key={row.id}>
                {processCols.map(([k]) => (
                  <td
                    key={k}
                    style={{
                      whiteSpace: "normal",
                      minWidth: k === "requirement" ? 200 : 120,
                    }}
                  >
                    {readOnly ? (
                      k === "stage" ? (
                        <b>
                          {i + 1}. {row[k]}
                        </b>
                      ) : (
                        row[k] || "—"
                      )
                    ) : (
                      <textarea
                        rows={2}
                        aria-label={`${row.stage || `Stage ${i + 1}`} ${k}`}
                        value={row[k]}
                        onChange={(e) =>
                          edit((d) => {
                            const r = d.process.find((x) => x.id === row.id)!;
                            r[k] = e.target.value;
                            r.evidence = "illustrative";
                          })
                        }
                      />
                    )}
                  </td>
                ))}
                <td style={{ minWidth: 120 }}>
                  <EvidenceTag kind={row.evidence} />
                  {row.sourceId && (
                    <small>
                      <SourceLink p={p} id={row.sourceId} />
                    </small>
                  )}
                </td>
                {!readOnly && (
                  <td>
                    <Button
                      small
                      variant="ghost"
                      aria-label={`Remove stage ${i + 1}`}
                      title="Remove stage"
                      onClick={() =>
                        edit((d) => {
                          d.process = d.process.filter((x) => x.id !== row.id);
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {!p.process.length && (
              <tr>
                <td colSpan={8} className={s.muted}>
                  No processing stages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button
          small
          style={{ marginTop: 8 }}
          onClick={() =>
            edit((d) => {
              d.process.push({
                id: nid("proc"),
                stage: "",
                equipment: "",
                order: String(d.process.length + 1),
                requirement: "",
                duration: "",
                checkpoint: "",
                evidence: "illustrative",
              });
            })
          }
        >
          <Plus size={13} aria-hidden="true" /> Add processing stage
        </Button>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Performance-testing matrix and trials
// ---------------------------------------------------------------------------

export function testVerdict(p: Project, testId: string) {
  const t = p.tests.find((x) => x.id === testId)!;
  const entries = p.trials
    .map((tr) => ({
      trial: tr.name.split(" · ")[0],
      value: tr.results[testId] ?? null,
    }))
    .filter((x) => x.value !== null);
  if (!entries.length) return { text: "Not performed", results: "Not tested" };
  const results = entries
    .map((x) => `${x.trial}: ${fmt(x.value, 2)}`)
    .join(" · ");
  if (t.targetValue === undefined || !t.targetOp)
    return { text: "Result entered — assess against criterion", results };
  const pass = entries
    .filter((x) =>
      t.targetOp === "≥"
        ? x.value! >= t.targetValue!
        : x.value! <= t.targetValue!,
    )
    .map((x) => x.trial);
  return {
    text: pass.length
      ? `Meets target: ${pass.join(", ")}`
      : "Below target in all trials",
    results,
  };
}

export function TestMatrix({ p, readOnly }: { p: Project; readOnly: boolean }) {
  const edit = useEditor(p);
  return (
    <>
      <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
      <div
        className={s.tableWrap}
        tabIndex={0}
        role="region"
        aria-label="Performance-testing matrix"
      >
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Property</th>
              <th scope="col">Test method or reference</th>
              <th scope="col">Target or acceptance criterion</th>
              <th scope="col">Test conditions</th>
              <th scope="col">Result</th>
              <th scope="col">Validation status</th>
              {!readOnly && (
                <th scope="col">
                  <span className={s.srOnly}>Remove</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {p.tests.map((t) => {
              const v = testVerdict(p, t.id);
              const cell = (
                k: "property" | "method" | "target" | "conditions",
                min = 140,
              ) => (
                <td style={{ whiteSpace: "normal", minWidth: min }}>
                  {readOnly ? (
                    k === "property" ? (
                      <b>{t[k]}</b>
                    ) : (
                      t[k] || "—"
                    )
                  ) : (
                    <input
                      aria-label={`${t.property || "Test"} ${k}`}
                      value={t[k]}
                      onChange={(e) =>
                        edit((d) => {
                          d.tests.find((x) => x.id === t.id)![k] =
                            e.target.value;
                        })
                      }
                    />
                  )}
                  {k === "target" && (
                    <small>
                      <EvidenceTag kind={t.targetEvidence} />{" "}
                      {t.sourceId && <SourceLink p={p} id={t.sourceId} />}
                    </small>
                  )}
                </td>
              );
              return (
                <tr key={t.id}>
                  {cell("property", 160)}
                  {cell("method")}
                  {cell("target", 170)}
                  {cell("conditions")}
                  <td style={{ whiteSpace: "normal", minWidth: 120 }}>
                    {v.results}
                  </td>
                  <td style={{ minWidth: 130 }}>
                    <span
                      className={
                        v.text === "Not performed"
                          ? c.statusPending
                          : v.text.startsWith("Meets")
                            ? c.okText
                            : c.statusWarn
                      }
                    >
                      {v.text}
                    </span>
                  </td>
                  {!readOnly && (
                    <td>
                      <Button
                        small
                        variant="ghost"
                        aria-label={`Remove ${t.property || "test"}`}
                        title="Remove test"
                        onClick={() =>
                          edit((d) => {
                            d.tests = d.tests.filter((x) => x.id !== t.id);
                            d.trials.forEach((tr) => delete tr.results[t.id]);
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!p.tests.length && (
              <tr>
                <td colSpan={7} className={s.muted}>
                  No tests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={c.note}>
        No standards compliance is claimed. Targets are acceptance criteria for
        development; compliance requires testing by an appropriate laboratory.
      </p>
      {!readOnly && (
        <Button
          small
          onClick={() =>
            edit((d) => {
              const tid = nid("test");
              d.tests.push({
                id: tid,
                property: "",
                method: "",
                target: "",
                unit: "",
                conditions: "",
                targetEvidence: "illustrative",
              });
              d.trials.forEach((tr) => (tr.results[tid] = null));
            })
          }
        >
          <Plus size={13} aria-hidden="true" /> Add test
        </Button>
      )}
    </>
  );
}

export function TrialsTable({
  p,
  readOnly,
}: {
  p: Project;
  readOnly: boolean;
}) {
  const edit = useEditor(p);
  return (
    <>
      <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
      <div
        className={s.tableWrap}
        tabIndex={0}
        role="region"
        aria-label="Trial batches and results"
      >
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Trial batch</th>
              <th scope="col">Change from plan</th>
              <th scope="col">Purpose</th>
              {p.tests.map((t) => (
                <th key={t.id} scope="col" className={s.num}>
                  {t.property}
                  {t.unit && ` (${t.unit})`}
                </th>
              ))}
              {!readOnly && (
                <th scope="col">
                  <span className={s.srOnly}>Remove</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {p.trials.map((tr) => (
              <tr key={tr.id}>
                <td style={{ whiteSpace: "normal", minWidth: 160 }}>
                  {readOnly ? (
                    <b>{tr.name}</b>
                  ) : (
                    <input
                      aria-label="Trial name"
                      value={tr.name}
                      onChange={(e) =>
                        edit((d) => {
                          d.trials.find((x) => x.id === tr.id)!.name =
                            e.target.value;
                        })
                      }
                    />
                  )}
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 180 }}>
                  {readOnly ? (
                    tr.change
                  ) : (
                    <input
                      aria-label={`${tr.name} change`}
                      value={tr.change}
                      onChange={(e) =>
                        edit((d) => {
                          d.trials.find((x) => x.id === tr.id)!.change =
                            e.target.value;
                        })
                      }
                    />
                  )}
                </td>
                <td style={{ whiteSpace: "normal", minWidth: 160 }}>
                  {readOnly ? (
                    tr.purpose
                  ) : (
                    <input
                      aria-label={`${tr.name} purpose`}
                      value={tr.purpose}
                      onChange={(e) =>
                        edit((d) => {
                          d.trials.find((x) => x.id === tr.id)!.purpose =
                            e.target.value;
                        })
                      }
                    />
                  )}
                </td>
                {p.tests.map((t) => (
                  <td key={t.id} className={s.num}>
                    {readOnly ? (
                      tr.results[t.id] == null ? (
                        <span className={s.muted}>Not tested</span>
                      ) : (
                        fmt(tr.results[t.id], 2)
                      )
                    ) : (
                      <input
                        type="number"
                        step="any"
                        style={{ width: 90 }}
                        aria-label={`${tr.name.split(" · ")[0]} result for ${t.property}`}
                        value={tr.results[t.id] ?? ""}
                        placeholder="Not tested"
                        onChange={(e) =>
                          edit((d) => {
                            d.trials.find((x) => x.id === tr.id)!.results[
                              t.id
                            ] =
                              e.target.value === ""
                                ? null
                                : Number(e.target.value);
                          })
                        }
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td>
                    <Button
                      small
                      variant="ghost"
                      aria-label={`Remove ${tr.name}`}
                      title="Remove trial"
                      onClick={() =>
                        edit((d) => {
                          d.trials = d.trials.filter((x) => x.id !== tr.id);
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button
          small
          onClick={() =>
            edit((d) => {
              const n = d.trials.length + 1;
              d.trials.push({
                id: `T${n}-${Date.now().toString(36)}`,
                name: `T${n} · New trial`,
                change: "",
                purpose: "",
                results: Object.fromEntries(d.tests.map((t) => [t.id, null])),
              });
            })
          }
        >
          <Plus size={13} aria-hidden="true" /> Add trial batch
        </Button>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Cost and literature tables
// ---------------------------------------------------------------------------

export function CostTable({
  p,
  calc,
  readOnly,
}: {
  p: Project;
  calc: ProjectCalc;
  readOnly: boolean;
}) {
  const edit = useEditor(p);
  return (
    <div
      className={s.tableWrap}
      tabIndex={0}
      role="region"
      aria-label="Cost table"
    >
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col">Material</th>
            <th scope="col" className={s.num}>
              Quantity (kg)
            </th>
            <th scope="col" className={s.num}>
              Unit rate, ₹/kg
            </th>
            <th scope="col" className={s.num}>
              Estimated cost, ₹
            </th>
            <th scope="col">Price source and date</th>
          </tr>
        </thead>
        <tbody>
          {calc.lines.map((l) => {
            const price = p.prices[l.ingredient.id];
            return (
              <tr key={l.ingredient.id}>
                <td>
                  {l.ingredient.name}
                  {p.parts.length > 1 && (
                    <small>
                      {p.parts.find((x) => x.id === l.ingredient.partId)?.name}
                    </small>
                  )}
                </td>
                <td className={s.num}>
                  {l.qtyKg === null ? "—" : fmt(l.qtyKg, 3)}
                </td>
                <td className={s.num}>
                  {readOnly ? (
                    price ? (
                      formatINR(price.rate)
                    ) : (
                      "Not estimated"
                    )
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="any"
                      style={{ width: 100 }}
                      aria-label={`${l.ingredient.name} rate in ₹ per kg`}
                      value={price?.rate ?? ""}
                      placeholder="Not estimated"
                      onChange={(e) =>
                        edit((d) => {
                          if (e.target.value === "")
                            delete d.prices[l.ingredient.id];
                          else
                            d.prices[l.ingredient.id] = {
                              rate: Number(e.target.value),
                              source: price?.source || "",
                              date:
                                price?.date ||
                                new Date().toISOString().slice(0, 10),
                            };
                        })
                      }
                    />
                  )}
                </td>
                <td className={s.num}>
                  {price && l.qtyKg !== null
                    ? formatINR(price.rate * l.qtyKg)
                    : "Not estimated"}
                </td>
                <td style={{ minWidth: 200 }}>
                  {readOnly || !price ? (
                    price ? (
                      `${price.source || "Source not given"} · ${price.date}`
                    ) : (
                      "No pricing evidence"
                    )
                  ) : (
                    <input
                      aria-label={`${l.ingredient.name} price source`}
                      value={price.source}
                      placeholder="Supplier quote, date"
                      onChange={(e) =>
                        edit((d) => {
                          d.prices[l.ingredient.id].source = e.target.value;
                        })
                      }
                    />
                  )}
                </td>
              </tr>
            );
          })}
          <tr className={s.totalRow}>
            <td>Total per {fmt(p.batchKg, 2)} kg batch</td>
            <td className={s.num}>
              {fmt(
                calc.lines.reduce((a, l) => a + (l.qtyKg ?? 0), 0),
                3,
              )}
            </td>
            <td />
            <td className={s.num}>
              {calc.costInr === null
                ? "Not estimated"
                : formatINR(calc.costInr)}
            </td>
            <td>
              {calc.costInr !== null && !calc.costComplete
                ? "Partial: some materials have no rate"
                : calc.costInr !== null
                  ? "User-entered estimate"
                  : "No verified ₹ prices available"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function LiteratureTable({ p }: { p: Project }) {
  const kinds = [
    ...new Set(
      p.literature
        .map((l) => p.sources.find((x) => x.id === l.sourceId)?.kind)
        .filter(Boolean),
    ),
  ] as SourceKind[];
  const [kind, setKind] = useState<"All document types" | SourceKind>(
    "All document types",
  );
  const rows = p.literature.filter(
    (l) =>
      l.used &&
      (kind === "All document types" ||
        p.sources.find((x) => x.id === l.sourceId)?.kind === kind),
  );
  return (
    <div className={s.stack}>
      {kinds.length > 1 && (
        <label className={c.inlineFilter}>
          Show
          <select
            aria-label="Filter literature by document type"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option>All document types</option>
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      )}
      <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
      <div
        className={s.tableWrap}
        tabIndex={0}
        role="region"
        aria-label="Literature table"
      >
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">Document type</th>
              <th scope="col">Relevant finding</th>
              <th scope="col">Applicable product or stage</th>
              <th scope="col">Limitations</th>
              <th scope="col">Link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const src = p.sources.find((x) => x.id === l.sourceId);
              return (
                <tr key={l.id}>
                  <td style={{ whiteSpace: "normal", minWidth: 170 }}>
                    <b>{src?.title ?? "Missing source"}</b>
                    <small>
                      {src?.publisher} · {src?.version}
                    </small>
                  </td>
                  <td>{src?.kind}</td>
                  <td style={{ whiteSpace: "normal", minWidth: 260 }}>
                    {l.finding}
                  </td>
                  <td style={{ whiteSpace: "normal", minWidth: 140 }}>
                    {l.applies}
                  </td>
                  <td style={{ whiteSpace: "normal", minWidth: 180 }}>
                    {l.limitations}
                  </td>
                  <td>
                    {src && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className={c.sourceLink}
                      >
                        Open{" "}
                        <ExternalLink
                          size={11}
                          aria-label="(opens in a new tab)"
                        />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={6} className={s.muted}>
                  No literature records used yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Infographics
// ---------------------------------------------------------------------------

export function CompositionChart({
  p,
  calc,
}: {
  p: Project;
  calc: ProjectCalc;
}) {
  return (
    <Figure
      title="Formulation composition by function"
      takeaway={calc.parts
        .map((part) => {
          const groups = groupByFunction(p, part.partId);
          const top = groups[0];
          return top
            ? `${part.name}: ${top.name.toLowerCase()} makes up ${fmt(top.share, 1)}%.`
            : `${part.name}: no amounts yet.`;
        })
        .join(" ")}
      note="Shares are wt.% of each component as supplied. Missing amounts are excluded, not counted as zero."
      values={{
        headers: ["Component", "Function", "wt.%"],
        rows: calc.parts.flatMap((part) =>
          groupByFunction(p, part.partId).map((g) => [
            part.name,
            g.name,
            fmt(g.share, 2),
          ]),
        ),
      }}
    >
      <div className={c.chartParts}>
        {calc.parts.map((part) => {
          const groups = groupByFunction(p, part.partId);
          return (
            <div key={part.partId}>
              {p.parts.length > 1 && (
                <h4 className={c.chartPartTitle}>{part.name}</h4>
              )}
              {groups.length ? (
                <Breakdown
                  label={`Composition of ${part.name} by function`}
                  items={groups.map((g) => ({
                    name: g.name,
                    share: g.share,
                    display: `${fmt(g.share, 2)}%`,
                  }))}
                />
              ) : (
                <p className={s.muted}>No amounts entered yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </Figure>
  );
}

function groupByFunction(p: Project, partId: string) {
  const map = new Map<string, number>();
  for (const i of p.ingredients.filter(
    (x) => x.partId === partId && x.wtPct !== null,
  ))
    map.set(i.function, (map.get(i.function) || 0) + i.wtPct!);
  return [...map]
    .map(([name, share]) => ({ name, share }))
    .sort((a, b) => b.share - a.share);
}

export function ProcessFlow({ p }: { p: Project }) {
  if (!p.process.length) return null;
  return (
    <figure className={c.diagram}>
      <figcaption>
        <h3>Processing flow</h3>
        <p>
          From preparation to finishing, with the check made at each stage.
          Durations are shown only where a source supports them.
        </p>
      </figcaption>
      <ol className={c.flow}>
        {p.process.map((row, i) => (
          <li key={row.id} className={c.flowItem}>
            <div className={c.flowCard}>
              <span className={c.flowNum}>{i + 1}</span>
              <b>{row.stage}</b>
              <small>{row.requirement}</small>
              <small className={c.checkpoint}>
                Check: {row.checkpoint || "—"}
              </small>
              {row.duration &&
                row.duration !== "Not stated" &&
                row.duration !== "—" && <small>Time: {row.duration}</small>}
            </div>
            {i < p.process.length - 1 && (
              <div className={c.flowArrow} aria-hidden="true">
                <ArrowRight size={18} className={c.arrowH} />
                <ArrowDown size={18} className={c.arrowV} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}

export function MixingDiagram({ p, calc }: { p: Project; calc: ProjectCalc }) {
  if (p.parts.length < 2 && calc.waterKg === null) return null;
  const items =
    p.parts.length > 1
      ? calc.parts.map((x) => ({
          label: x.name,
          kg: x.massKg,
          share: x.sharePct,
        }))
      : [
          {
            label: calc.parts[0]?.name ?? "Powder",
            kg: p.batchKg,
            share: (100 * p.batchKg) / (p.batchKg + (calc.waterKg ?? 0)),
          },
          {
            label: "Mixing water",
            kg: calc.waterKg ?? 0,
            share:
              (100 * (calc.waterKg ?? 0)) / (p.batchKg + (calc.waterKg ?? 0)),
          },
        ];
  const total = items.reduce((a, x) => a + x.kg, 0);
  return (
    <figure className={c.diagram}>
      <figcaption>
        <h3>
          {p.parts.length > 1 ? "Two-component mixing" : "Powder and water"}
        </h3>
        <p>
          {p.parts.length > 1
            ? `${calc.mixRatioText ?? "Mixing ratio not set"}. Component percentages describe each part; the mixing ratio combines them.`
            : `Mixing water ${fmt(p.water?.pctOfPowder, 1)}% of powder mass.`}
        </p>
      </figcaption>
      <div className={c.mixRow}>
        {items.map((x, i) => (
          <div key={x.label} className={c.mixItem}>
            {i > 0 && (
              <span className={c.mixOp} aria-hidden="true">
                +
              </span>
            )}
            <div className={c.mixBox}>
              <b>{x.label}</b>
              <span>{fmt(x.kg, 2)} kg</span>
              <small>{fmt(x.share, 1)}% of mix</small>
            </div>
          </div>
        ))}
        <div className={c.mixItem}>
          <span className={c.mixOp} aria-hidden="true">
            =
          </span>
          <div className={`${c.mixBox} ${c.mixResult}`}>
            <b>Mixed system</b>
            <span>{fmt(total, 2)} kg</span>
            {calc.epoxy && (
              <small>
                Hardener{" "}
                {fmt(
                  ((calc.epoxy.setBperA ?? 0) * (calc.epoxy.hardenerPct ?? 0)) /
                    ((calc.epoxy.resinPct ?? 1) / 100),
                  1,
                )}{" "}
                phr of resin
              </small>
            )}
            {calc.ratios.map((r) => (
              <small key={r.id}>
                {r.label}: {fmt(r.value, 2)}
              </small>
            ))}
          </div>
        </div>
      </div>
      <p className={c.note}>
        Text equivalent:{" "}
        {items.map((x) => `${x.label} ${fmt(x.kg, 2)} kg`).join(" + ")} ={" "}
        {fmt(total, 2)} kg.
      </p>
    </figure>
  );
}

export function Timeline({ p }: { p: Project }) {
  if (!p.timeline.length) return null;
  return (
    <figure className={c.diagram}>
      <figcaption>
        <h3>
          {p.category === "Tile cleaner"
            ? "Use sequence"
            : "Application and curing timeline"}
        </h3>
        <p>
          Times come from cited sources. Items marked as benchmarks describe
          commercial products, not this formulation.
        </p>
      </figcaption>
      <ol className={c.timeline}>
        {p.timeline.map((t) => (
          <li key={t.id}>
            <span className={c.tlDot} aria-hidden="true" />
            <div>
              <b>{t.time}</b>
              <span>{t.label}</span>
              {t.note && <small>{t.note}</small>}
              <small>
                <EvidenceTag kind={t.evidence} />{" "}
                {t.sourceId && <SourceLink p={p} id={t.sourceId} />}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}

export function PerformanceChart({ p }: { p: Project }) {
  const numeric = p.tests.filter(
    (t) => t.targetValue !== undefined && t.targetOp,
  );
  const anyMeasured = p.trials.some((tr) =>
    numeric.some((t) => tr.results[t.id] != null),
  );
  return (
    <Figure
      title="Performance comparison of trial batches"
      takeaway={
        anyMeasured
          ? "Measured results by trial against each numeric target."
          : "No measured results yet. The chart appears once trial results are entered; targets are listed below."
      }
      note="Only measured results are plotted. Targets are acceptance criteria, not results."
      values={{
        headers: [
          "Property",
          "Target",
          ...p.trials.map((t) => t.name.split(" · ")[0]),
        ],
        rows: p.tests.map((t) => [
          t.property,
          t.target,
          ...p.trials.map((tr) =>
            tr.results[t.id] == null ? "Not tested" : fmt(tr.results[t.id], 2),
          ),
        ]),
      }}
    >
      {anyMeasured ? (
        <TargetChart
          rows={numeric.map((t) => ({
            name: t.property,
            unit: t.unit,
            targetText: t.target,
            min: t.targetOp === "≥" ? t.targetValue : undefined,
            max: t.targetOp === "≤" ? t.targetValue : undefined,
            series: p.trials.map((tr, i) => {
              const v = tr.results[t.id] ?? null;
              return {
                label: tr.name.split(" · ")[0],
                value: v,
                display: fmt(v, 2),
                tone: i === 0 ? ("previous" as const) : ("current" as const),
                meets:
                  v === null
                    ? null
                    : t.targetOp === "≥"
                      ? v >= t.targetValue!
                      : v <= t.targetValue!,
              };
            }),
          }))}
        />
      ) : (
        <Empty title="No measured results">
          <p>Experimental validation: {validationStatus(p).toLowerCase()}.</p>
        </Empty>
      )}
    </Figure>
  );
}

export function ProjectSummaryGraphic({
  p,
  calc,
}: {
  p: Project;
  calc: ProjectCalc;
}) {
  const approach = p.approaches.find((a) => a.id === p.selectedApproachId);
  const boxes = [
    { label: "Objective", text: p.objective },
    { label: "Selected approach", text: approach?.name ?? "Not selected" },
    {
      label: "Formulation",
      text: `${p.ingredients.length} ingredients · ${p.parts.length} component${p.parts.length === 1 ? "" : "s"}${calc.mixRatioText ? ` · ${calc.mixRatioText}` : ""}${calc.waterKg !== null ? ` · water ${fmt(p.water?.pctOfPowder, 1)}%` : ""}`,
    },
    {
      label: "Required validation",
      text: `${p.tests.length} tests · ${p.trials.length} trials · experimental validation ${validationStatus(p).toLowerCase()}`,
    },
  ];
  return (
    <figure className={c.diagram}>
      <figcaption>
        <h3>Project summary</h3>
        <p>
          How the objective leads to the formulation and what still has to be
          proven.
        </p>
      </figcaption>
      <ol className={c.summaryFlow}>
        {boxes.map((b, i) => (
          <li key={b.label}>
            <div className={c.summaryBox}>
              <span>
                {i + 1}. {b.label}
              </span>
              <p>{b.text}</p>
            </div>
            {i < boxes.length - 1 && (
              <ArrowRight
                size={16}
                className={c.summaryArrow}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function SourcesModal({
  p,
  onClose,
}: {
  p: Project;
  onClose: () => void;
}) {
  return (
    <Modal title={`Sources · ${p.id}`} onClose={onClose}>
      <ul className={c.sourceList}>
        {p.sources
          .filter((x) => x.selected)
          .map((x) => (
            <li key={x.id}>
              <a href={x.url} target="_blank" rel="noreferrer">
                {x.title}{" "}
                <ExternalLink size={12} aria-label="(opens in a new tab)" />
              </a>
              <small>
                {x.kind} · {x.publisher} · {x.version}
              </small>
              <small>Used for: {x.usedFor}</small>
            </li>
          ))}
      </ul>
    </Modal>
  );
}

export function useConfirm() {
  const [pending, setPending] = useState<null | {
    title: string;
    body: string;
    action: () => void;
    label: string;
  }>(null);
  const dialog = pending && (
    <Modal title={pending.title} onClose={() => setPending(null)}>
      <p className={s.muted}>{pending.body}</p>
      <div className={s.modalActions}>
        <Button onClick={() => setPending(null)}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            pending.action();
            setPending(null);
          }}
        >
          {pending.label}
        </Button>
      </div>
    </Modal>
  );
  return { ask: setPending, dialog };
}

export { Field };
