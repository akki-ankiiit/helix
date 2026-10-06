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
import { formatINR, formatMeasured, formatNumber } from "../../lib/format";
import { Empty, Reason } from "../../components/ui";
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
  const priceOf = (id: string) => {
    const m = (trial?.materialsSnapshot || state.materials).find((x) => x.id === id);
    return m && m.price !== null && m.currency === "INR" ? m.price : null;
  };
  const celluloseP = priceOf("cellulose"),
    fillerP = priceOf("filler");
  const costChange =
    celluloseP !== null && fillerP !== null
      ? ((proposed - old) / 100) * (celluloseP - fillerP)
      : null;
  const resultsFor = (id: string) =>
    p.results.find((r) => r.trialId === trialId && r.propertyId === id)?.readings || [];
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
      <p className={s.muted} style={{ fontSize: 13 }}>
        A result is only judged when it uses the same unit, test method and
        conditions as its target. Missing or mismatched results never count as
        a pass.
      </p>
      {p.needsReview && p.results.length > 0 && (
        <Notice warning>
          Something changed after the last review (brief, recipe or prices). A
          Reviewer must check the results again before approval.
        </Notice>
      )}
      {!p.trials.length ? (
        <Empty title="Nothing to analyse yet">
          <p>Add a trial and record its results first.</p>
        </Empty>
      ) : (
        <>
          <Field label="Trial to analyse">
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
                <small>
                  {{ Pass: "Meet target", Fail: "Miss target", Pending: "Awaiting readings", "Not evaluated": "Cannot compare" }[status]}
                </small>
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
                  <th scope="col">Test</th>
                  <th scope="col" className={s.num}>Target</th>
                  <th scope="col" className={s.num}>Benchmark</th>
                  <th scope="col" className={s.num}>Estimate</th>
                  <th scope="col" className={s.num}>Measured mean</th>
                  <th scope="col" className={s.num}>Difference from target</th>
                  <th scope="col">Result</th>
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
                    <td className={s.num}>
                      {a.target.operator} {a.target.value}
                      {a.target.operator === "Between"
                        ? ` – ${a.target.max}`
                        : ""}
                    </td>
                    <td className={s.num}>
                      {p.brief.benchmarkIds
                        .map(
                          (id) =>
                            state.benchmarks.find((b) => b.id === id)?.values[
                              a.propertyId
                            ] ?? "—",
                        )
                        .join(" / ") || "—"}
                    </td>
                    <td className={s.num}>
                      {p.pathways.find((x) => x.id === p.selectedPathway)
                        ?.predictions[a.propertyId] ?? "—"}
                    </td>
                    <td className={s.num}>
                      {formatMeasured(a.mean, resultsFor(a.propertyId))}
                    </td>
                    <td className={s.num}>
                      {a.difference === null
                        ? "—"
                        : `${a.difference > 0 ? "+" : a.difference < 0 ? "−" : ""}${formatMeasured(Math.abs(a.difference), resultsFor(a.propertyId))}`}
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
                  <h3>Proposed next trial</h3>
                </div>
                <Badge tone="amber">
                  Suggestion · low confidence
                </Badge>
              </div>
              <p>
                Try a little more cellulose ether (it thickens the mix and can
                reduce slip), taking the same amount out of the limestone filler
                so the total stays at 100%. This is something to test, not a
                guaranteed fix.
              </p>
              <div className={s.tableWrap} style={{ marginTop: 18 }}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th scope="col">Ingredient</th>
                      <th scope="col" className={s.num}>Now (dry wt %)</th>
                      <th scope="col" className={s.num}>Proposed (dry wt %)</th>
                      <th scope="col">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Cellulose ether</td>
                      <td className={s.num}>{formatNumber(old)}</td>
                      <td className={s.num}>{formatNumber(proposed)}</td>
                      <td>Check whether slip falls</td>
                    </tr>
                    <tr>
                      <td>Limestone filler</td>
                      <td className={s.num}>{formatNumber(trial.percentages.filler ?? 0)}</td>
                      <td className={s.num}>
                        {formatNumber((trial.percentages.filler || 0) - (proposed - old))}
                      </td>
                      <td>Keeps the total at 100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Estimated cost change:{" "}
                <b>
                  {costChange === null
                    ? "unknown (a price is missing)"
                    : `${costChange >= 0 ? "+" : "−"}${formatINR(Math.abs(costChange))}/kg`}
                </b>
                , using current library prices. Also check water demand and
                working time. Source: HELIX-FIXTURE-002.
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
          {!canEdit && fail && (
            <Reason>Only a Chemist or Admin can accept or reject the proposal. Change your demo role in Settings.</Reason>
          )}
          {!fail && assessments.every((a) => a.status === "Pass") && (
            <Notice>
              This trial meets every target. A Reviewer still needs to check the
              results. Meeting your targets does not prove compliance with any
              standard.
            </Notice>
          )}
          {fail && p.brief.subcategoryId !== "tile-0" && (
            <Notice warning>
              A target is missed. This demo has no proposal model for this
              product family, so plan the next trial manually in Design · Trial
              plan.
            </Notice>
          )}
        </>
      )}
      {edit && (
        <Modal title="Edit iteration proposal" onClose={() => setEdit(false)}>
          <Field
            label="Proposed cellulose ether"
            unit="dry wt %"
            hint="Allowed 0–1%. The filler changes by the same amount. Nothing is saved until you accept."
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
              Update proposal
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
