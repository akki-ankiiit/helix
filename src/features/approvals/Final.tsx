import { useState } from "react";
import {
  CheckCheck,
  Download,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
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
import {
  approvalIssues,
  evaluate,
  recipeMetrics,
} from "../../domain/calculations";
import { reports } from "../../services/demo/reports";
import { useCaseSummary } from "../intake/Intake";
import c from "../projects/Project.module.css";
export function Final({ project: p }: { project: Project }) {
  const state = useWorkspace(),
    [request, setRequest] = useState(false),
    [note, setNote] = useState(""),
    [ack, setAck] = useState(false);
  const trial = p.trials.at(-1),
    issues = approvalIssues(p, trial, state.materials);
  const reviewer = ["Reviewer", "Admin"].includes(state.user?.role || "");
  const approved = p.approvals.some(
    (a) =>
      a.action === "Approved" &&
      a.recipeId === trial?.id &&
      (a.briefVersion || 1) === p.revisions.length &&
      p.status === "Approved",
  );
  const metrics = trial ? recipeMetrics(trial, state.materials) : null;
  const canSubmit = ["Chemist", "Admin"].includes(state.user?.role || "");
  function event(action: string, note: string) {
    state.updateProject(p.id, (x) => ({
      ...x,
      status:
        action === "Approved"
          ? "Approved"
          : action === "Changes requested"
            ? "In progress"
            : "In review",
      stage: "Final",
      trials:
        action === "Approved"
          ? x.trials.map((t) =>
              t.id === trial?.id
                ? {
                    ...t,
                    locked: true,
                    materialsSnapshot: structuredClone(state.materials),
                  }
                : t,
            )
          : x.trials,
      approvals: [
        ...x.approvals,
        {
          id: uid(),
          action,
          actor: `${state.user?.name} (${state.user?.role})`,
          date: new Date().toISOString(),
          recipeId: trial?.id || "",
          briefVersion: x.revisions.length,
          note,
        },
      ],
      activity: [
        {
          id: uid(),
          text: `${action}: ${trial?.name}`,
          date: new Date().toISOString(),
        },
        ...x.activity,
      ],
    }));
    state.notify(`${action} recorded in the local demo history.`);
  }
  return (
    <div className={s.stack}>
      <Notice>
        {state.user?.mode === "Non-scientist"
          ? "Your product specification and R&D handoff. The underlying recipe and laboratory evidence remain available below."
          : "The final dossier brings the recipe, evidence, constraints, and review history together."}{" "}
        Demo approval is an internal workflow state, not certification.
      </Notice>
      <div className={s.between}>
        <h3>
          {state.user?.mode === "Non-scientist"
            ? "Product specification"
            : "Formulation dossier"}
        </h3>
        <Button small onClick={() => reports.print(p)}>
          <Download size={14} />
          Export final dossier / PDF
        </Button>
      </div>
      <p className={s.muted} style={{ fontSize: 13 }}>
        {useCaseSummary(p.brief)}
      </p>
      <div className={s.grid3}>
        <div className={s.panel}>
          <div className={s.row}>
            <LockKeyhole size={15} />
            <h3>Recipe revision</h3>
          </div>
          <div className={s.metric}>{trial ? `v${trial.version}` : "—"}</div>
          <small className={s.muted}>
            {trial?.name || "No recipe"} ·{" "}
            {approved
              ? "Locked / approved"
              : trial?.locked
                ? "Historical / read-only"
                : "Draft"}
          </small>
        </div>
        <div className={s.panel}>
          <h3>Dry batch / water</h3>
          <div className={s.metric}>
            {trial?.batchKg || "—"} <small>kg</small>
          </div>
          <small className={s.muted}>
            {trial?.water || "—"}% application water, separate
          </small>
        </div>
        <div className={s.panel}>
          <h3>Estimated cost / kg</h3>
          <div className={s.metric}>
            {metrics?.cost !== null && metrics?.cost !== undefined
              ? `$${metrics.cost.toFixed(3)}`
              : "Incomplete"}
          </div>
          <small className={s.muted}>USD · fixture price dates: Sep 2026</small>
        </div>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Target</th>
              <th>Required value</th>
              <th>Measured mean</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {p.brief.targets.map((t) => {
              const a = evaluate(
                t,
                p.results.find(
                  (r) =>
                    r.trialId === trial?.id && r.propertyId === t.propertyId,
                ),
              );
              return (
                <tr key={t.propertyId}>
                  <td>
                    {t.propertyId}
                    <small>
                      {t.method} · {t.condition}
                    </small>
                  </td>
                  <td>
                    {t.operator} {t.value} {t.unit}
                  </td>
                  <td>{a.mean === null ? "Pending" : a.mean.toFixed(3)}</td>
                  <td>
                    <Status value={a.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <details className={s.details}>
        <summary>Composition, evidence & known limitations</summary>
        {trial &&
          Object.entries(trial.percentages).map(([id, v]) => (
            <p key={id}>
              {state.materials.find((m) => m.id === id)?.name}: {v.toFixed(2)}{" "}
              dry wt % / {((trial.batchKg * v) / 100).toFixed(3)} kg
            </p>
          ))}
        <p>
          Sources:{" "}
          {p.sources
            .filter((s) => !s.excluded)
            .map((s) => s.reference)
            .join(", ") || "Missing sources"}
          .
        </p>
        <p>
          All scientific data is illustrative. Standard references are
          unverified; aged durability and actual handling review may be absent.
          Unstructured constraints and supplier restrictions require qualified
          reviewer assessment. A target pass is not a compliance claim.
        </p>
      </details>
      <div className={c.approval}>
        <div className={s.between}>
          <div className={s.row}>
            <ShieldCheck size={20} color="var(--accent)" />
            <h3>Technical review & approval</h3>
          </div>
          <Badge tone={approved ? "green" : "amber"}>
            {approved ? "Approved · locked" : p.status}
          </Badge>
        </div>
        {issues.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 12 }}>Approval is blocked until:</h3>
            <ul
              style={{
                fontSize: 12,
                color: "var(--muted)",
                lineHeight: 1.9,
                paddingLeft: 18,
              }}
            >
              {issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {!approved && (
          <>
            <label
              className={s.check}
              style={{ margin: "20px 0", alignItems: "flex-start" }}
            >
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                disabled={!reviewer}
              />
              I have reviewed the declared basis, mandatory tests, unstructured
              constraints, source gaps, and unverified standard references. This
              is a demo workflow approval only.
            </label>
            <div className={`${s.row} ${s.wrap}`}>
              <Button
                disabled={!canSubmit || !trial || !!metrics?.errors.length}
                onClick={() =>
                  event(
                    "Submitted for review",
                    "Recipe and measured evidence submitted for independent review.",
                  )
                }
              >
                <Send size={14} />
                Submit for review
              </Button>
              <Button
                variant="primary"
                disabled={
                  !reviewer ||
                  issues.length > 0 ||
                  !ack ||
                  p.status !== "In review"
                }
                onClick={() =>
                  event(
                    "Approved",
                    "Mandatory measured targets reviewed; demo-only internal approval.",
                  )
                }
              >
                <CheckCheck size={15} />
                Approve formulation
              </Button>
              <Button
                disabled={!reviewer || !trial}
                onClick={() => setRequest(true)}
              >
                Request changes
              </Button>
            </div>
            <p className={s.muted} style={{ fontSize: 10, marginTop: 14 }}>
              Current role: {state.user?.role}. Chemist submits; Reviewer
              approves after results sign-off. Demo roles are selectable in
              Settings. Production permissions must be enforced server-side.
            </p>
          </>
        )}
      </div>
      <div>
        <h3>Approval history</h3>
        <div className={c.timeline}>
          {p.approvals.length ? (
            p.approvals.map((a) => (
              <div className={c.event} key={a.id}>
                <span className={c.eventDot} />
                <div>
                  <b>{a.action}</b>
                  <small>
                    {a.actor} · {new Date(a.date).toLocaleDateString()} · recipe{" "}
                    {a.recipeId}
                  </small>
                  <p
                    style={{
                      fontSize: 12,
                      marginTop: 7,
                      color: "var(--muted)",
                    }}
                  >
                    {a.note}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className={s.muted} style={{ fontSize: 12 }}>
              No review events yet.
            </p>
          )}
        </div>
      </div>
      {request && (
        <Modal
          title="Request formulation changes"
          onClose={() => setRequest(false)}
        >
          <Field label="Review comments">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain the evidence or changes needed."
            />
          </Field>
          <div className={s.modalActions}>
            <Button onClick={() => setRequest(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!note.trim()}
              onClick={() => {
                event("Changes requested", note);
                setRequest(false);
              }}
            >
              Record request
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
