import { useState } from "react";
import { ArrowRight, GitBranch, Check, Pencil, X } from "lucide-react";
import type { Project } from "../../domain/models";
import {
  Badge,
  Button,
  Field,
  Modal,
  Notice,
  Status,
  s,
} from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import { evaluate } from "../../domain/calculations";
import { propertyFor } from "../../data/property-library";
import c from "../projects/Project.module.css";
export function Analysis({
  project: p,
  onTrials,
}: {
  project: Project;
  onTrials: () => void;
}) {
  const state = useWorkspace();
  const [trialId, setTrialId] = useState(p.trials.at(-1)?.id || ""),
    [edit, setEdit] = useState(false),
    [reject, setReject] = useState(false),
    [reason, setReason] = useState(""),
    [cellulose, setCellulose] = useState("0.50");
  const trial = p.trials.find((t) => t.id === trialId);
  const assessments = p.brief.targets.map((t) => ({
    target: t,
    ...evaluate(
      t,
      p.results.find(
        (r) => r.trialId === trialId && r.propertyId === t.propertyId,
      ),
    ),
  }));
  const fail = assessments.some((x) => x.status === "Fail");
  const canEdit = ["Chemist", "Admin"].includes(state.user?.role || "");
  const proposed = Number(cellulose),
    old = trial?.percentages.cellulose || 0;
  function accept() {
    if (!trial) return;
    const percentages = {
      ...trial.percentages,
      cellulose: proposed,
      filler: (trial.percentages.filler || 0) - (proposed - old),
    };
    const id = uid();
    state.updateProject(p.id, (x) => ({
      ...x,
      trials: x.trials
        .map((t) =>
          t.id === trialId
            ? {
                ...t,
                locked: true,
                materialsSnapshot:
                  t.materialsSnapshot || structuredClone(state.materials),
              }
            : t,
        )
        .concat({
          ...structuredClone(trial),
          id,
          parentId: trialId,
          version: x.trials.length + 1,
          name: `T${String(x.trials.length + 1).padStart(2, "0")} · accepted iteration`,
          percentages,
          locked: false,
          materialsSnapshot: undefined,
        }),
      stage: "Trials",
      status: "In progress",
      needsReview: true,
      resultsReviewed: false,
      iterationRejected: undefined,
      activity: [
        {
          id: uid(),
          text: `Iteration created from ${trial.name}: cellulose ${old}% → ${proposed}%; prior evidence retained`,
          date: new Date().toISOString(),
        },
        ...x.activity,
      ],
    }));
    state.notify(
      "New trial revision created. Enter new measured results after the experiment.",
    );
    onTrials();
  }
  return (
    <div className={s.stack}>
      <Notice>
        Evaluation uses the configured operator, unit, test method, and
        conditions. No default “borderline” tolerance is assumed. Blank or
        incompatible evidence is not a pass.
      </Notice>
      {p.needsReview && (
        <Notice warning>
          Downstream review needed: inputs or results have changed. A reviewer
          must reconcile the evidence before final approval.
        </Notice>
      )}
      {!p.trials.length ? (
        <div className={s.empty}>
          No trial evidence is available yet. Plan trials and enter specimen
          readings first.
        </div>
      ) : (
        <>
          <Field label="Compare trial revision">
            <select
              value={trialId}
              onChange={(e) => setTrialId(e.target.value)}
            >
              {p.trials.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · v{t.version}
                </option>
              ))}
            </select>
          </Field>
          <div className={c.evaluation}>
            {["Pass", "Fail", "Pending", "Not evaluated"].map((status) => (
              <div key={status}>
                <small>{status}</small>
                <strong
                  style={{
                    color:
                      status === "Pass"
                        ? "var(--green)"
                        : status === "Fail"
                          ? "var(--red)"
                          : "var(--muted)",
                  }}
                >
                  {assessments.filter((x) => x.status === status).length}
                </strong>
              </div>
            ))}
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Target</th>
                  <th>Benchmark fixture</th>
                  <th>Prediction estimate</th>
                  <th>Measured fixture</th>
                  <th>Δ from lower target</th>
                  <th>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.propertyId}>
                    <td>
                      <b>{propertyFor(a.propertyId).name}</b>
                      <small>
                        {a.target.unit} · {a.target.priority}
                      </small>
                    </td>
                    <td>
                      {a.target.operator} {a.target.value}
                      {a.target.operator === "Between"
                        ? ` – ${a.target.max}`
                        : ""}
                    </td>
                    <td>
                      {p.brief.benchmarkIds
                        .map(
                          (id) =>
                            state.benchmarks.find((b) => b.id === id)?.values[
                              a.propertyId
                            ] ?? "—",
                        )
                        .join(" / ") || "—"}
                    </td>
                    <td>
                      {p.pathways.find((x) => x.id === p.selectedPathway)
                        ?.predictions[a.propertyId] ?? "Insufficient data"}
                    </td>
                    <td>{a.mean === null ? "Pending" : a.mean.toFixed(3)}</td>
                    <td>
                      {a.difference === null
                        ? "—"
                        : `${a.difference > 0 ? "+" : ""}${a.difference.toFixed(3)}`}
                    </td>
                    <td>
                      <Status value={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fail && p.brief.subcategoryId === "tile-0" && trial && (
            <div className={c.proposal}>
              <div className={s.between}>
                <div className={s.row}>
                  <GitBranch size={18} color="var(--accent)" />
                  <h3>A focused next experiment</h3>
                </div>
                <Badge tone="amber">
                  Illustrative proposal · low confidence
                </Badge>
              </div>
              <p>
                Investigate a small cellulose-ether increase while holding the
                dry-blend total constant. This is an experiment proposal, not a
                guaranteed fix.
              </p>
              <div className={s.tableWrap} style={{ marginTop: 18 }}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Previous</th>
                      <th>Proposed</th>
                      <th>Expected direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cellulose ether</td>
                      <td>{old.toFixed(2)}%</td>
                      <td>{proposed.toFixed(2)}%</td>
                      <td>Test fresh-state slip response</td>
                    </tr>
                    <tr>
                      <td>Limestone filler</td>
                      <td>{trial.percentages.filler?.toFixed(2)}%</td>
                      <td>
                        {(
                          (trial.percentages.filler || 0) -
                          (proposed - old)
                        ).toFixed(2)}
                        %
                      </td>
                      <td>Balance dry-blend composition</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Rationale: controlled rheology experiment [HELIX-FIXTURE-002].
                Estimated cost change: USD{" "}
                {(((proposed - old) / 100) * (5.2 - 0.07)).toFixed(4)}/kg using
                fixture prices. Check water demand and working time. Material
                limits and the cost ceiling must still pass.
              </p>
              {p.iterationRejected ? (
                <Notice warning>
                  Proposal rejected: {p.iterationRejected}
                  <Button
                    small
                    onClick={() =>
                      state.updateProject(p.id, (x) => ({
                        ...x,
                        iterationRejected: undefined,
                      }))
                    }
                  >
                    Reopen proposal
                  </Button>
                </Notice>
              ) : (
                <div className={s.row} style={{ marginTop: 20 }}>
                  <Button
                    variant="primary"
                    disabled={
                      !canEdit ||
                      proposed < 0 ||
                      proposed > 1 ||
                      (trial.percentages.filler || 0) - (proposed - old) < 0
                    }
                    onClick={accept}
                  >
                    <Check size={14} />
                    Accept iteration
                  </Button>
                  <Button disabled={!canEdit} onClick={() => setEdit(true)}>
                    <Pencil size={13} />
                    Edit proposal
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!canEdit}
                    onClick={() => setReject(true)}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
          {!fail && assessments.every((a) => a.status === "Pass") && (
            <Notice>
              All configured targets pass for this trial. Results still require
              independent review. No broader standard compliance is implied.
            </Notice>
          )}
          <details className={s.details}>
            <summary>Traceability & interpretation</summary>
            <p>
              Previous recipes and their specimen results are retained. Baseline
              T01 in the seeded project fails the slip target (0.68 mm vs ≤ 0.50
              mm); its later T02 fixture records 0.38 mm. That example does not
              establish causality or validate the chemistry.
            </p>
          </details>
        </>
      )}
      {edit && (
        <Modal title="Edit iteration proposal" onClose={() => setEdit(false)}>
          <Field
            label="Proposed cellulose ether · dry wt %"
            hint="Filler adjustment is shown in the preview; nothing changes until accepted."
          >
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={cellulose}
              onChange={(e) => setCellulose(e.target.value)}
            />
          </Field>
          <div className={s.modalActions}>
            <Button variant="primary" onClick={() => setEdit(false)}>
              Review proposal
              <ArrowRight size={14} />
            </Button>
          </div>
        </Modal>
      )}
      {reject && (
        <Modal
          title="Record a rejection reason"
          onClose={() => setReject(false)}
        >
          <Field label="Why should this proposal not proceed?">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className={s.modalActions}>
            <Button onClick={() => setReject(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!reason.trim()}
              onClick={() => {
                state.updateProject(p.id, (x) => ({
                  ...x,
                  iterationRejected: reason,
                  activity: [
                    {
                      id: uid(),
                      text: `Iteration rejected: ${reason}`,
                      date: new Date().toISOString(),
                    },
                    ...x.activity,
                  ],
                }));
                setReject(false);
              }}
            >
              Reject & retain reason
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
