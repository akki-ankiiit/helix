import { useState } from "react";
import { ClipboardPaste, Paperclip, CheckCheck } from "lucide-react";
import type { Project, SpecimenResult } from "../../domain/models";
import { Badge, Button, Empty, Field, Modal, Notice, Reason, s } from "../../components/ui";
import { formatMeasured } from "../../lib/format";
import { useWorkspace, uid } from "../../stores/workspace";
import { mean, parseResultsPaste } from "../../domain/calculations";
import { propertyFor } from "../../data/property-library";
import c from "../projects/Project.module.css";
export function Results({ project: p }: { project: Project }) {
  const state = useWorkspace();
  const [trialId, setTrialId] = useState(p.trials.at(-1)?.id || ""),
    [paste, setPaste] = useState(false),
    [text, setText] = useState(""),
    [preview, setPreview] = useState(false),
    [detail, setDetail] = useState<string | null>(null);
  const trial = p.trials.find((t) => t.id === trialId);
  const canEnter =
    ["Chemist", "Technician", "Admin"].includes(state.user?.role || "") &&
    !trial?.locked;
  const canReview = ["Reviewer", "Admin"].includes(state.user?.role || "");
  function result(id: string): SpecimenResult {
    const target = p.brief.targets.find((t) => t.propertyId === id)!;
    return (
      p.results.find((r) => r.trialId === trialId && r.propertyId === id) || {
        id: uid(),
        trialId,
        propertyId: id,
        readings: [null, null, null],
        unit: target.unit,
        method: target.method,
        condition: target.condition,
        date: new Date().toISOString().slice(0, 10),
        operator: state.user?.name || "",
        failureMode: "",
        comments: "",
        attachments: [],
        reviewed: false,
      }
    );
  }
  function save(r: SpecimenResult) {
    state.updateProject(p.id, (x) => ({
      ...x,
      resultHistory: [
        ...(x.resultHistory || []),
        ...x.results.filter(
          (v) => v.trialId === r.trialId && v.propertyId === r.propertyId,
        ),
      ],
      results: [
        ...x.results.filter(
          (v) => !(v.trialId === r.trialId && v.propertyId === r.propertyId),
        ),
        { ...r, reviewed: false },
      ],
      resultsReviewed: false,
      needsReview: true,
      stage: "Results",
    }));
  }
  const parsed = preview ? parseResultsPaste(text, p.brief.targets) : [];
  const hasComplete = p.brief.targets.every((t) => {
    const r = p.results.find(
      (r) => r.trialId === trialId && r.propertyId === t.propertyId,
    );
    return (
      r &&
      r.readings.every((v) => v !== null && Number.isFinite(v)) &&
      r.readings.length >= 3
    );
  });
  return (
    <div className={s.stack}>
      <p className={s.muted} style={{ fontSize: 13 }}>
        Type each reading as it comes off the test rig; it saves straight away.
        Empty cells stay empty — they are never counted as zero. Seeded
        readings in this demo are illustrative, not real lab data.
      </p>
      {!p.trials.length ? (
        <Empty title="No trial to record results for">
          <p>Add a trial in Design · Trial plan first.</p>
        </Empty>
      ) : (
        <>
          <div className={s.between}>
            <Field label="Trial">
              <select
                value={trialId}
                onChange={(e) => setTrialId(e.target.value)}
              >
                {p.trials.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name} · v{t.version}
                    {t.locked ? " · read-only" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <div className={s.row}>
              <Button
                small
                disabled={!canEnter}
                onClick={() => {
                  setPaste(true);
                  setPreview(false);
                }}
              >
                <ClipboardPaste size={14} />
                Paste from spreadsheet
              </Button>
              <Button
                small
                variant={canReview && hasComplete && !trial?.locked ? "primary" : "default"}
                disabled={!canReview || !hasComplete || !!trial?.locked}
                onClick={() => {
                  state.updateProject(p.id, (x) => ({
                    ...x,
                    results: x.results.map((r) =>
                      r.trialId === trialId ? { ...r, reviewed: true } : r,
                    ),
                    resultsReviewed: trialId === x.trials.at(-1)?.id,
                    needsReview: trialId !== x.trials.at(-1)?.id,
                    activity: [
                      {
                        id: uid(),
                        text: `Results reviewed for ${trial?.name}; numerical evidence and dependencies acknowledged`,
                        date: new Date().toISOString(),
                      },
                      ...x.activity,
                    ],
                  }));
                  state.notify(
                    "Results marked reviewed. Formulation approval is a separate action.",
                  );
                }}
              >
                <CheckCheck size={14} />
                Mark results reviewed
              </Button>
            </div>
          </div>
          {(trial?.locked || !canReview || !hasComplete || !canEnter) && (
            <Reason>
              {trial?.locked
                ? "This trial is read-only because a newer revision exists or it was approved."
                : !hasComplete
                  ? "“Mark results reviewed” is available once every test has all three readings."
                  : !canReview
                    ? "Only a Reviewer or Admin can mark results reviewed. Change your demo role in Settings."
                    : "Only a Chemist, Technician or Admin can enter readings."}
            </Reason>
          )}
          <p className={s.scrollHint}>Scroll sideways to see all specimens →</p>
          <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Specimen readings">
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Test</th>
                  <th scope="col">Unit</th>
                  <th scope="col" className={s.num}>Specimen 1</th>
                  <th scope="col" className={s.num}>Specimen 2</th>
                  <th scope="col" className={s.num}>Specimen 3</th>
                  <th scope="col" className={s.num}>Mean</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className={s.srOnly}>Details</span></th>
                </tr>
              </thead>
              <tbody>
                {p.brief.targets.map((t) => {
                  const r = result(t.propertyId),
                    average = mean(r.readings),
                    plan = p.testPlan.find(
                      (x) => x.propertyId === t.propertyId,
                    );
                  return (
                    <tr key={t.propertyId}>
                      <td>
                        <b>{propertyFor(t.propertyId).name}</b>
                        <small>{t.method}</small>
                        <small>
                          {plan?.ageDays
                            ? `After ${plan.ageDays} days of curing`
                            : "Fresh, straight after mixing"}{" "}
                          · {plan?.required ? "Required" : "Optional"}
                          {plan?.dueDate ? ` · due ${plan.dueDate}` : ""}
                        </small>
                      </td>
                      <td>{t.unit}</td>
                      {[0, 1, 2].map((i) => (
                        <td key={i} className={s.num}>
                          <input
                            className={c.reading}
                            aria-label={`${propertyFor(t.propertyId).name} specimen ${i + 1}`}
                            type="number"
                            min="0"
                            step="any"
                            disabled={!canEnter}
                            placeholder="—"
                            value={r.readings[i] ?? ""}
                            onChange={(e) => {
                              const readings = [...r.readings];
                              readings[i] =
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value);
                              if (readings[i] !== null && readings[i]! < 0)
                                return;
                              save({ ...r, readings });
                            }}
                          />
                        </td>
                      ))}
                      <td className={s.num}>
                        <b>{formatMeasured(average, r.readings)}</b>
                      </td>
                      <td>
                        <Badge
                          tone={
                            r.reviewed
                              ? "green"
                              : r.readings.some((x) => x === null)
                                ? "amber"
                                : "violet"
                          }
                        >
                          {r.reviewed
                            ? "Reviewed"
                            : r.readings.some((x) => x === null)
                              ? `${r.readings.filter((x) => x === null).length} missing`
                              : "Not reviewed"}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          small
                          variant="ghost"
                          onClick={() => setDetail(t.propertyId)}
                        >
                          Details
                          <span className={s.srOnly}> for {propertyFor(t.propertyId).name}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!!p.resultHistory?.length && (
        <details className={s.details}>
          <summary>
            Result correction history ·{" "}
            {
              (p.resultHistory || []).filter((r) => r.trialId === trialId)
                .length
            }{" "}
            retained records for this trial
          </summary>
          <div className={s.tableWrap} style={{ marginTop: 14 }}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Previous specimens</th>
                  <th>Unit</th>
                  <th>Operator / date</th>
                </tr>
              </thead>
              <tbody>
                {p.resultHistory
                  .filter((r) => r.trialId === trialId)
                  .map((r, i) => (
                    <tr key={i}>
                      <td>{propertyFor(r.propertyId).name}</td>
                      <td>
                        {r.readings.map((v) => v ?? "Pending").join(" / ")}
                      </td>
                      <td>{r.unit}</td>
                      <td>
                        {r.operator}
                        <small>{r.date}</small>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {paste && (
        <Modal title="Preview pasted results" onClose={() => setPaste(false)}>
          <div className={s.stack}>
            <Notice>
              Documented tab-separated template: property ID, specimen 1,
              specimen 2, specimen 3, unit. No header row. Blank specimens are
              pending. Test method and conditions use the current test plan.
            </Notice>
            <details className={s.details}>
              <summary>Copyable property IDs & format</summary>
              <pre style={{ overflow: "auto", fontSize: 11 }}>
                {p.brief.targets
                  .map((t) => `${t.propertyId}\t\t\t\t${t.unit}`)
                  .join("\n")}
              </pre>
            </details>
            <Field label="Paste spreadsheet cells">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setPreview(false);
                }}
                placeholder={"slip\t0.4\t0.42\t0.38\tmm"}
                rows={5}
              />
            </Field>
            <Button disabled={!text.trim()} onClick={() => setPreview(true)}>
              Preview column mappings
            </Button>
            {preview && (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Property ID</th>
                      <th>Specimens 1 / 2 / 3</th>
                      <th>Unit</th>
                      <th>Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((r) => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td>{r.propertyId}</td>
                        <td>
                          {r.readings.map((x) => x ?? "Pending").join(" / ")}
                        </td>
                        <td>{r.unit}</td>
                        <td>
                          {r.errors.length ? (
                            <span className={s.error}>
                              {r.errors.join("; ")}
                            </span>
                          ) : (
                            <Badge tone="green">Valid</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className={s.modalActions}>
            <Button onClick={() => setPaste(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={
                !preview ||
                !parsed.length ||
                parsed.some((r) => r.errors.length > 0) ||
                new Set(parsed.map((r) => r.propertyId)).size !== parsed.length
              }
              onClick={() => {
                state.updateProject(p.id, (x) => {
                  const ids = parsed.map((v) => v.propertyId);
                  return {
                    ...x,
                    resultHistory: [
                      ...(x.resultHistory || []),
                      ...x.results.filter(
                        (r) =>
                          r.trialId === trialId && ids.includes(r.propertyId),
                      ),
                    ],
                    results: [
                      ...x.results.filter(
                        (r) =>
                          !(
                            r.trialId === trialId && ids.includes(r.propertyId)
                          ),
                      ),
                      ...parsed.map((r) => ({
                        ...result(r.propertyId),
                        readings: r.readings,
                        reviewed: false,
                      })),
                    ],
                    resultsReviewed: false,
                    needsReview: true,
                  };
                });
                setPaste(false);
                state.notify(
                  "Validated specimen readings applied. Results require review.",
                );
              }}
            >
              Apply validated rows
            </Button>
          </div>
          {new Set(parsed.map((r) => r.propertyId)).size !== parsed.length && (
            <p className={s.error}>
              Duplicate property rows must be resolved before applying.
            </p>
          )}
        </Modal>
      )}
      {detail && (
        <ResultDetails
          record={result(detail)}
          canEdit={canEnter}
          onSave={save}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
function ResultDetails({
  record,
  canEdit,
  onSave,
  onClose,
}: {
  record: SpecimenResult;
  canEdit: boolean;
  onSave: (r: SpecimenResult) => void;
  onClose: () => void;
}) {
  const [r, setR] = useState(record);
  return (
    <Modal
      title={`${propertyFor(r.propertyId).name} · record details`}
      onClose={onClose}
    >
      <div className={s.formGrid}>
        {(
          [
            { key: "date", label: "Test date" },
            { key: "operator", label: "Operator" },
            { key: "failureMode", label: "Failure mode" },
            { key: "unit", label: "Measured unit" },
            { key: "method", label: "Actual test method" },
            { key: "condition", label: "Actual test conditions" },
          ] as const
        ).map((f) => (
          <Field key={f.key} label={f.label}>
            <input
              disabled={!canEdit}
              type={f.key === "date" ? "date" : "text"}
              value={r[f.key]}
              onChange={(e) => setR({ ...r, [f.key]: e.target.value })}
            />
          </Field>
        ))}
        <Field label="Comments" className={s.full}>
          <textarea
            disabled={!canEdit}
            value={r.comments}
            onChange={(e) => setR({ ...r, comments: e.target.value })}
          />
        </Field>
        <Field
          label="Photos & attachments · filename references only"
          className={s.full}
        >
          <input
            type="file"
            multiple
            disabled={!canEdit}
            onChange={(e) =>
              setR({
                ...r,
                attachments: [
                  ...r.attachments,
                  ...Array.from(e.target.files || []).map((f) => f.name),
                ],
              })
            }
          />
        </Field>
        {r.attachments.map((name, i) => (
          <Badge key={i}>
            <Paperclip size={11} />
            {name}
          </Badge>
        ))}
      </div>
      <div className={s.modalActions}>
        <Button onClick={onClose}>Close</Button>
        <Button
          disabled={!canEdit}
          variant="primary"
          onClick={() => {
            onSave(r);
            onClose();
          }}
        >
          Save details
        </Button>
      </div>
    </Modal>
  );
}
