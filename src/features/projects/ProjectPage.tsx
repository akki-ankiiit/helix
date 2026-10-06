import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileSpreadsheet,
  Pencil,
  Send,
  ChartColumn,
} from "lucide-react";
import {
  Badge,
  Button,
  Empty,
  Field,
  Modal,
  Notice,
  Reason,
  Status,
  Stepper,
  Tabs,
  s,
} from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import { categoryFor, subcategoryFor } from "../../data/taxonomy";
import { propertyFor, templateFor } from "../../data/property-library";
import {
  isStageComplete,
  isStageKey,
  procedure,
  stepForStage,
  type StageKey,
} from "../../data/procedure";
import { projectOutcome } from "../../domain/calculations";
import { formatDate, formatINR, plural } from "../../lib/format";
import type { Project } from "../../domain/models";
import { Literature } from "../literature/Literature";
import { Pathways } from "../pathways/Pathways";
import { Trials } from "../trials/Trials";
import { Results } from "../results/Results";
import { Analysis } from "../analysis/Analysis";
import { Final } from "../approvals/Final";
import { Constraints, UseCase, useCaseSummary } from "../intake/Intake";
import { TargetEditor, targetErrors } from "../intake/TargetEditor";
import { BenchmarkPicker } from "../benchmarks/BenchmarkPicker";
import { reports } from "../../services/demo/reports";
import c from "./Project.module.css";

const allStages = procedure.flatMap((step) => step.stages);

export function projectCode(p: Project) {
  return p.id.startsWith("helix")
    ? p.id.toUpperCase()
    : `HLX-${p.id.slice(0, 6).toUpperCase()}`;
}

export function ProjectPage() {
  const { projectId } = useParams(),
    [params, setParams] = useSearchParams();
  const state = useWorkspace();
  const p = state.projects.find((p) => p.id === projectId);
  const [edit, setEdit] = useState(false);
  if (!p)
    return (
      <div className={s.panel}>
        <h1 className={s.srOnly}>Project not found</h1>
        <Empty title="Project not found">
          <p>
            It may have been deleted, or the link is wrong. Projects are saved
            in this browser only.
          </p>
          <Link className={`${s.button} ${s.primary}`} to="/projects">
            Go to projects
          </Link>
        </Empty>
      </div>
    );
  const requested = params.get("stage");
  const active: StageKey = isStageKey(requested)
    ? requested
    : isStageKey(p.stage)
      ? p.stage
      : "Literature";
  const step = stepForStage(active);
  const index = allStages.findIndex((x) => x.key === active);
  const prev = allStages[index - 1],
    next = allStages[index + 1];
  const go = (key: StageKey) => setParams({ stage: key });
  const jobFor = (key: string) =>
    state.jobs.find(
      (j) =>
        j.projectId === p.id &&
        j.stage === key &&
        (j.status === "Running" || j.status === "Failed"),
    );
  const outcome = projectOutcome(p, state.materials);
  const canEdit = ["Chemist", "Admin"].includes(state.user?.role || "");

  return (
    <>
      <header className={c.header}>
        <div className={c.titleRow}>
          <div>
            <h1>{p.brief.name}</h1>
            <p className={c.meta}>
              {projectCode(p)} · {subcategoryFor(p.brief.subcategoryId)?.name}{" "}
              · {p.owner} · Brief v{p.revisions.length} · Updated{" "}
              {formatDate(p.updated)}
            </p>
          </div>
          <div className={c.headerActions}>
            <Status value={p.status} />
            <Button small onClick={() => reports.print(p)}>
              <Download size={13} />
              Download report (PDF)
            </Button>
            <Button small variant="ghost" onClick={() => reports.workbook(p)}>
              <FileSpreadsheet size={13} />
              Export workbook (.xlsx)
            </Button>
          </div>
        </div>
        {p.trials.length > 0 && active !== "Final" && (
          <Link
            to={`/projects/${p.id}?stage=Final`}
            className={`${c.outcomeStrip} ${c[`outcome_${outcome.kind}`] || ""}`}
          >
            <ChartColumn size={16} aria-hidden="true" />
            <span>
              <b>Current outcome:</b> {outcome.headline}
            </span>
            <span className={c.outcomeLink}>
              View final report <ArrowRight size={13} />
            </span>
          </Link>
        )}
      </header>
      <Stepper
        label="Project procedure"
        onSelect={(id) => {
          const target = procedure.find((x) => x.id === id)!;
          go(
            (target.stages.find((st) => !isStageComplete(p, st.key)) ||
              target.stages[0]).key,
          );
        }}
        steps={procedure.map((x) => {
          const attention = x.stages.some(
            (st) =>
              jobFor(st.key)?.status === "Failed" ||
              (st.key === "Analysis" && p.needsReview && p.results.length > 0),
          );
          const done = x.stages.every((st) => isStageComplete(p, st.key));
          return {
            id: x.id,
            number: x.number,
            name: x.name,
            detail:
              x.stages.length > 1 || x.stages[0].label !== x.name
                ? x.stages.map((st) => st.label).join(" · ")
                : undefined,
            current: x.id === step.id,
            state:
              x.id === step.id
                ? "current"
                : attention
                  ? "attention"
                  : done
                    ? "complete"
                    : "upcoming",
          };
        })}
      />
      <section className={c.stepBody} aria-labelledby="step-heading">
        <div className={c.stepHeading}>
          <p className={c.stepEyebrow}>
            Step {step.number} of {procedure.length}
          </p>
          <h2 id="step-heading">{step.name}</h2>
          <p className={s.lead}>{step.purpose}</p>
        </div>
        {step.stages.length > 1 && (
          <Tabs
            label={`${step.name} views`}
            active={active}
            onSelect={(key) => go(key as StageKey)}
            items={step.stages.map((st) => ({
              id: st.key,
              label: st.label,
              done: isStageComplete(p, st.key),
            }))}
          />
        )}
        <p className={c.stageDescription}>
          {step.stages.find((st) => st.key === active)?.description}
        </p>
        <div className={c.stageContent}>
          {active === "Brief" ? (
            <BriefView project={p} canEdit={canEdit} onEdit={() => setEdit(true)} />
          ) : active === "Literature" ? (
            <Literature project={p} />
          ) : active === "Pathways" ? (
            <Pathways project={p} />
          ) : active === "Trials" ? (
            <Trials project={p} />
          ) : active === "Results" ? (
            <Results project={p} />
          ) : active === "Analysis" ? (
            <Analysis project={p} onTrials={() => go("Trials")} />
          ) : (
            <Final project={p} onGo={go} />
          )}
        </div>
        <nav className={s.stepFooter} aria-label="Step navigation">
          {prev ? (
            <Button variant="ghost" onClick={() => go(prev.key)}>
              <ArrowLeft size={14} />
              Back to {prev.label}
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button
              variant={isStageComplete(p, active) ? "primary" : "default"}
              onClick={() => go(next.key)}
            >
              Next: {next.label}
              <ArrowRight size={14} />
            </Button>
          )}
        </nav>
      </section>
      <ProjectActivity project={p} />
      {edit && <ReviseBrief project={p} onClose={() => setEdit(false)} />}
    </>
  );
}

function BriefView({
  project: p,
  canEdit,
  onEdit,
}: {
  project: Project;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const state = useWorkspace();
  const k = p.brief.constraints;
  const standard = templateFor(p.brief.subcategoryId).standard;
  return (
    <div className={s.stack}>
      <div className={c.briefGrid}>
        <div>
          <h3>Product</h3>
          <p>
            {categoryFor(p.brief.categoryId)?.name} ›{" "}
            {subcategoryFor(p.brief.subcategoryId)?.name}
          </p>
        </div>
        <div>
          <h3>Application</h3>
          <p>{useCaseSummary(p.brief)}</p>
          {p.brief.description && <p className={s.muted}>{p.brief.description}</p>}
        </div>
        <div>
          <h3>Benchmarks</h3>
          <p>
            {p.brief.benchmarkIds
              .map((id) => state.benchmarks.find((b) => b.id === id)?.name)
              .filter(Boolean)
              .join(", ") || "None selected"}
          </p>
        </div>
        <div>
          <h3>Cost limit</h3>
          <p>
            {k.cost
              ? k.currency && k.currency !== "INR"
                ? `${k.currency} ${k.cost}/kg — re-enter in ₹`
                : `${formatINR(Number(k.cost))} per kg of dry blend (excl. GST and delivery)`
              : "No limit set"}
          </p>
        </div>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className={s.srOnly}>Targets in brief v{p.revisions.length}</caption>
          <thead>
            <tr>
              <th scope="col">Test</th>
              <th scope="col">Target</th>
              <th scope="col">Priority</th>
              <th scope="col">Method and conditions</th>
            </tr>
          </thead>
          <tbody>
            {p.brief.targets.map((t) => (
              <tr key={t.propertyId}>
                <td>
                  <b>{propertyFor(t.propertyId).name}</b>
                  <small>{propertyFor(t.propertyId).plain}</small>
                </td>
                <td>
                  {t.operator} {t.value}
                  {t.operator === "Between" ? `–${t.max}` : ""} {t.unit}
                </td>
                <td>{t.priority}</td>
                <td style={{ whiteSpace: "normal" }}>
                  {t.method}
                  <small>{t.condition}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {standard && (
        <Notice warning>
          {standard.identifier} is listed for reference only. It has not been
          verified, and the targets above are project targets, not official
          limits.
        </Notice>
      )}
      <div className={s.row}>
        <Button disabled={!canEdit} onClick={onEdit}>
          <Pencil size={13} />
          Revise brief
        </Button>
        {!canEdit && (
          <Reason>
            Only a Chemist or Admin can revise the brief. Change your demo role
            in Settings.
          </Reason>
        )}
      </div>
      <details className={s.details}>
        <summary>Brief version history ({p.revisions.length})</summary>
        {p.revisions
          .slice()
          .reverse()
          .map((r) => (
            <p key={r.version}>
              v{r.version} · {formatDate(r.date)} · {r.reason}
            </p>
          ))}
      </details>
    </div>
  );
}

function ReviseBrief({
  project: p,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const state = useWorkspace();
  const [draft, setDraft] = useState(() => structuredClone(p.brief)),
    [tab, setTab] = useState("Application"),
    [tried, setTried] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(p.brief);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const errors = [
    ...(draft.name.trim().length < 3
      ? ["Enter a project name of at least 3 characters (Application tab)."]
      : []),
    ...targetErrors(draft).map((e) => `${e} (Targets tab)`),
  ];
  const close = () => {
    if (!dirty || window.confirm("Discard your unsaved changes to the brief?"))
      onClose();
  };
  const plain = state.user?.mode === "Non-scientist";
  return (
    <Modal title={`Revise brief · creates v${p.revisions.length + 1}`} onClose={close}>
      <div className={s.stack}>
        <p className={s.muted} style={{ fontSize: 13 }}>
          Saving creates a new version. Earlier versions and lab results are
          kept, and results will need to be reviewed again.
        </p>
        <Tabs
          label="Brief sections"
          active={tab}
          onSelect={setTab}
          items={["Application", "Benchmarks", "Targets", "Constraints"].map(
            (t) => ({ id: t, label: t }),
          )}
        />
        {tab === "Application" ? (
          <UseCase
            brief={draft}
            plain={plain}
            showErrors={tried}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
          />
        ) : tab === "Benchmarks" ? (
          <BenchmarkPicker
            selected={draft.benchmarkIds}
            onChange={(benchmarkIds) => setDraft({ ...draft, benchmarkIds })}
          />
        ) : tab === "Targets" ? (
          <TargetEditor
            brief={draft}
            showErrors={tried}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
          />
        ) : (
          <Constraints
            brief={draft}
            plain={plain}
            onChange={(patch) => setDraft({ ...draft, ...patch })}
          />
        )}
        {tried && errors.length > 0 && (
          <div role="alert" className={s.error}>
            {errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
      </div>
      <div className={s.modalActions}>
        <Button onClick={close}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!dirty}
          onClick={() => {
            if (errors.length) {
              setTried(true);
              return;
            }
            state.updateProject(p.id, (x) => ({
              ...x,
              brief: draft,
              revisions: [
                ...x.revisions,
                {
                  version: x.revisions.length + 1,
                  brief: structuredClone(draft),
                  date: new Date().toISOString(),
                  reason: "User revised brief",
                },
              ],
              testPlan: draft.targets.map(
                (t) =>
                  x.testPlan.find((plan) => plan.propertyId === t.propertyId) || {
                    propertyId: t.propertyId,
                    required: t.priority === "Must",
                    specimens: 3,
                    ageDays: 28,
                    condition: t.condition,
                  },
              ),
              needsReview: true,
              resultsReviewed: false,
              status: "In progress",
              activity: [
                {
                  id: uid(),
                  text: `Brief v${x.revisions.length + 1} saved; results need review again`,
                  date: new Date().toISOString(),
                },
                ...x.activity,
              ],
            }));
            onClose();
            state.notify(
              `Brief v${p.revisions.length + 1} saved. Earlier versions are kept.`,
            );
          }}
        >
          Save as v{p.revisions.length + 1}
        </Button>
      </div>
    </Modal>
  );
}

function ProjectActivity({ project: p }: { project: Project }) {
  const state = useWorkspace();
  const [comment, setComment] = useState("");
  return (
    <details className={c.activity}>
      <summary>
        Comments and decision trail
        <Badge>
          {plural(p.comments.length, "comment")} ·{" "}
          {plural(p.activity.length, "event")}
        </Badge>
      </summary>
      <div className={s.grid2}>
        <section>
          <h3>Comments</h3>
          {p.comments.map((x) => (
            <div className={c.comment} key={x.id}>
              <div className={s.between}>
                <b>{x.author}</b>
                <small>{formatDate(x.date)}</small>
              </div>
              <p>{x.text}</p>
            </div>
          ))}
          {!p.comments.length && <p className={s.muted}>No comments yet.</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              state.updateProject(p.id, (x) => ({
                ...x,
                comments: [
                  ...x.comments,
                  {
                    id: uid(),
                    text: comment.trim(),
                    author: state.user?.name || "Demo user",
                    date: new Date().toISOString(),
                  },
                ],
              }));
              setComment("");
            }}
            style={{ marginTop: 16 }}
          >
            <Field label="Add a comment">
              <textarea
                value={comment}
                rows={2}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share context for the next decision"
              />
            </Field>
            <Button small disabled={!comment.trim()} style={{ marginTop: 10 }}>
              <Send size={12} />
              Post comment
            </Button>
          </form>
        </section>
        <section>
          <h3>Decision trail</h3>
          <div className={c.timeline}>
            {p.activity.slice(0, 8).map((a) => (
              <div className={c.event} key={a.id}>
                <span className={c.eventDot} />
                <div>
                  {a.text}
                  <small>{formatDate(a.date)}</small>
                </div>
              </div>
            ))}
          </div>
          <p className={s.muted} style={{ fontSize: 12 }}>
            Saved in this browser only. Not shared with other users.
          </p>
        </section>
      </div>
    </details>
  );
}
