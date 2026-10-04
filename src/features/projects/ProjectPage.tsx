import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  GitBranch,
  FlaskConical,
  ClipboardList,
  ChartNoAxesCombined,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  Download,
  Send,
  Check,
} from "lucide-react";
import { Badge, Button, Field, Modal, Notice, s } from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import { categoryFor, subcategoryFor } from "../../data/taxonomy";
import { Literature } from "../literature/Literature";
import { Pathways } from "../pathways/Pathways";
import { Trials } from "../trials/Trials";
import { Results } from "../results/Results";
import { Analysis } from "../analysis/Analysis";
import { Final } from "../approvals/Final";
import { Constraints, UseCase, useCaseSummary } from "../intake/Intake";
import { TargetEditor } from "../intake/TargetEditor";
import { BenchmarkPicker } from "../benchmarks/BenchmarkPicker";
import { reports } from "../../services/demo/reports";
import c from "./Project.module.css";
const stages = [
  {
    name: "Literature",
    icon: BookOpen,
    description: "Investigate the evidence and identify useful findings.",
  },
  {
    name: "Pathways",
    icon: GitBranch,
    description: "Compare approaches and choose a direction to test.",
  },
  {
    name: "Trials",
    icon: FlaskConical,
    description: "Define controlled formulations and the test plan.",
  },
  {
    name: "Results",
    icon: ClipboardList,
    description: "Capture measured evidence, one specimen at a time.",
  },
  {
    name: "Analysis",
    icon: ChartNoAxesCombined,
    description: "Compare against targets and decide what comes next.",
  },
  {
    name: "Final",
    icon: ShieldCheck,
    description: "Review the complete record and approve a revision.",
  },
];
export function ProjectPage() {
  const { projectId } = useParams(),
    [params, setParams] = useSearchParams();
  const state = useWorkspace();
  const p = state.projects.find((p) => p.id === projectId);
  const [briefOpen, setBriefOpen] = useState(false),
    [edit, setEdit] = useState(false),
    [editTab, setEditTab] = useState("Application"),
    [draft, setDraft] = useState(p?.brief),
    [comment, setComment] = useState("");
  useEffect(() => {
    if (
      !edit ||
      !draft ||
      !p ||
      JSON.stringify(draft) === JSON.stringify(p.brief)
    )
      return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [edit, draft, p]);
  if (!p)
    return (
      <div className={s.empty}>
        <h1>Project not found</h1>
        <Link to="/projects">Return to projects</Link>
      </div>
    );
  const active = params.get("stage") || p.stage;
  function stage(name: string) {
    setParams({ stage: name });
  }
  const isComplete = (name: string) =>
    name === "Literature"
      ? p.sources.length > 0
      : name === "Pathways"
        ? !!p.selectedPathway
        : name === "Trials"
          ? p.trials.length > 0
          : name === "Results"
            ? p.resultsReviewed
            : name === "Analysis"
              ? !p.needsReview && p.results.length > 0
              : p.status === "Approved";
  const canEdit = ["Chemist", "Admin"].includes(state.user?.role || "");
  return (
    <>
      <header className={c.header}>
        <div className={c.code}>
          <Link to="/projects">PROJECTS</Link> /{" "}
          {p.id.startsWith("helix")
            ? p.id.toUpperCase()
            : `HLX-${p.id.slice(0, 6).toUpperCase()}`}
        </div>
        <div className={c.titleRow}>
          <h1>{p.brief.name}</h1>
          <div className={s.row}>
            <Badge tone={p.status === "Approved" ? "green" : "violet"}>
              {p.status}
            </Badge>
            <Button small onClick={() => reports.workbook(p)}>
              <Download size={13} />
              Export workbook
            </Button>
          </div>
        </div>
        <div className={c.meta}>
          <span>{categoryFor(p.brief.categoryId)?.name}</span>
          <span>•</span>
          <span>{subcategoryFor(p.brief.subcategoryId)?.name}</span>
          <span>•</span>
          <span>{p.owner}</span>
          <span>•</span>
          <span>Brief v{p.revisions.length}</span>
          <Badge>Illustrative demo</Badge>
        </div>
      </header>
      <div className={c.brief}>
        <button
          className={c.briefToggle}
          onClick={() => setBriefOpen(!briefOpen)}
          aria-expanded={briefOpen}
        >
          <div className={s.row}>
            <FileText size={16} color="var(--accent)" />
            <b>Formulation brief</b>
            <span className={s.muted}>
              {p.brief.targets.length} targets · {p.brief.benchmarkIds.length}{" "}
              benchmarks
            </span>
          </div>
          <ChevronDown
            size={15}
            style={{ transform: briefOpen ? "rotate(180deg)" : "" }}
          />
        </button>
        {briefOpen && (
          <div className={c.briefContent}>
            <p>{useCaseSummary(p.brief)}</p>
            <p>
              Cost ceiling:{" "}
              {p.brief.constraints.cost
                ? `${p.brief.constraints.currency} ${p.brief.constraints.cost}/kg`
                : "Not defined"}{" "}
              · Standards: R&D confirmation required.
            </p>
            <div className={s.between} style={{ marginTop: 16 }}>
              <Badge tone="amber">Unverified standards / draft methods</Badge>
              <Button
                small
                disabled={!canEdit}
                onClick={() => {
                  setDraft(structuredClone(p.brief));
                  setEdit(true);
                }}
              >
                <Pencil size={12} />
                Revise brief
              </Button>
            </div>
            <details style={{ fontSize: 11, marginTop: 15 }}>
              <summary>Brief version history</summary>
              {p.revisions.map((r) => (
                <p key={r.version}>
                  v{r.version} · {new Date(r.date).toLocaleDateString()} ·{" "}
                  {r.reason}
                </p>
              ))}
            </details>
          </div>
        )}
      </div>
      <nav className={c.pipeline} aria-label="Formulation stages">
        {stages.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={
              active === name ? c.current : isComplete(name) ? c.completed : ""
            }
            onClick={() => stage(name)}
          >
            {isComplete(name) ? <Check size={13} /> : <Icon size={14} />} {name}
          </button>
        ))}
      </nav>
      {stages.map(({ name, icon: Icon, description }, i) => {
        const job = state.jobs.find(
          (j) => j.projectId === p.id && j.stage === name,
        );
        const status =
          job?.status === "Running"
            ? "Running simulation"
            : job?.status === "Failed"
              ? "Failed"
              : isComplete(name)
                ? "Complete"
                : name === "Final" && p.status === "In review"
                  ? "Review needed"
                  : name === "Results" && p.trials.length
                    ? p.brief.targets.every((t) =>
                        p.results.some(
                          (r) =>
                            r.trialId === p.trials.at(-1)?.id &&
                            r.propertyId === t.propertyId &&
                            r.readings.every((v) => v !== null),
                        ),
                      )
                      ? "Review needed"
                      : "Pending results"
                    : name === "Analysis" && p.needsReview
                      ? "Review needed"
                      : i > 0 && !isComplete(stages[i - 1].name)
                        ? "Waiting"
                        : "Ready";
        return (
          <section
            key={name}
            className={`${c.stage} ${active === name ? c.stageOpen : ""}`}
          >
            <button
              className={c.stageHead}
              onClick={() => stage(active === name ? "collapsed" : name)}
              aria-expanded={active === name}
            >
              <div className={s.row}>
                <span className={c.stageIcon}>
                  <Icon size={17} />
                </span>
                <div>
                  <h2>
                    <span
                      style={{
                        color: "var(--muted)",
                        fontWeight: 400,
                        marginRight: 8,
                      }}
                    >
                      0{i + 1}
                    </span>
                    {name}
                  </h2>
                  <small>{description}</small>
                </div>
              </div>
              <div className={s.row}>
                <Badge
                  tone={
                    status === "Complete"
                      ? "green"
                      : /review|Pending|Waiting/.test(status)
                        ? "amber"
                        : status === "Failed"
                          ? "red"
                          : "violet"
                  }
                >
                  {status}
                </Badge>
                {active === name ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronRight size={15} />
                )}
              </div>
            </button>
            {active === name && (
              <div className={c.stageBody}>
                {name === "Literature" ? (
                  <Literature project={p} />
                ) : name === "Pathways" ? (
                  <Pathways project={p} onNext={() => stage("Trials")} />
                ) : name === "Trials" ? (
                  <Trials project={p} />
                ) : name === "Results" ? (
                  <Results project={p} />
                ) : name === "Analysis" ? (
                  <Analysis project={p} onTrials={() => stage("Trials")} />
                ) : (
                  <Final project={p} />
                )}
              </div>
            )}
          </section>
        );
      })}
      <div className={s.grid2} style={{ marginTop: 24 }}>
        <section className={s.panel}>
          <div className={s.panelHeader}>
            <h2>Project conversation</h2>
            <Badge>Local demo</Badge>
          </div>
          {p.comments.map((comment) => (
            <div className={c.comment} key={comment.id}>
              <div className={s.between}>
                <h3 style={{ fontSize: 12 }}>{comment.author}</h3>
                <small>{new Date(comment.date).toLocaleDateString()}</small>
              </div>
              <p>{comment.text}</p>
            </div>
          ))}
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
                    text: comment,
                    author: state.user?.name || "Demo user",
                    date: new Date().toISOString(),
                  },
                ],
              }));
              setComment("");
            }}
            style={{ marginTop: 18 }}
          >
            <Field label="Add a comment">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share context for the next decision…"
              />
            </Field>
            <Button small disabled={!comment.trim()} style={{ marginTop: 12 }}>
              <Send size={12} />
              Add comment
            </Button>
          </form>
        </section>
        <section className={s.panel}>
          <div className={s.panelHeader}>
            <h2>Decision trail</h2>
            <Badge>{p.activity.length} events</Badge>
          </div>
          <div className={c.timeline}>
            {p.activity.slice(0, 6).map((a) => (
              <div className={c.event} key={a.id}>
                <span className={c.eventDot} />
                <div>
                  {a.text}
                  <small>{new Date(a.date).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
          <p className={s.muted} style={{ fontSize: 10 }}>
            Comments and activity are stored locally. No multi-user
            synchronization is connected.
          </p>
        </section>
      </div>
      {edit && draft && (
        <Modal
          title={`Revise brief · v${p.revisions.length + 1}`}
          onClose={() => {
            if (
              JSON.stringify(draft) === JSON.stringify(p.brief) ||
              window.confirm("Discard unsaved brief edits?")
            )
              setEdit(false);
          }}
        >
          <div className={s.stack}>
            <Notice warning>
              A revision preserves earlier briefs and marks downstream analysis
              for review. Existing trial evidence is retained.
            </Notice>
            <div className={s.tabs}>
              {["Application", "Benchmarks", "Targets", "Constraints"].map(
                (t) => (
                  <button
                    key={t}
                    className={editTab === t ? s.active : ""}
                    onClick={() => setEditTab(t)}
                  >
                    {t}
                  </button>
                ),
              )}
            </div>
            {editTab === "Application" ? (
              <UseCase
                brief={draft}
                plain={state.user?.mode === "Non-scientist"}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
              />
            ) : editTab === "Benchmarks" ? (
              <BenchmarkPicker
                selected={draft.benchmarkIds}
                onChange={(benchmarkIds) =>
                  setDraft({ ...draft, benchmarkIds })
                }
              />
            ) : editTab === "Targets" ? (
              <TargetEditor
                brief={draft}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
              />
            ) : (
              <Constraints
                brief={draft}
                onChange={(patch) => setDraft({ ...draft, ...patch })}
                plain={state.user?.mode === "Non-scientist"}
              />
            )}
          </div>
          <div className={s.modalActions}>
            <Button onClick={() => setEdit(false)}>
              Discard unsaved edits
            </Button>
            <Button
              variant="primary"
              disabled={
                !draft.name.trim() ||
                !draft.targets.length ||
                draft.targets.some((t) => !t.value.trim())
              }
              onClick={() => {
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
                      x.testPlan.find(
                        (plan) => plan.propertyId === t.propertyId,
                      ) || {
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
                      text: "Brief revision created; downstream analysis marked for review",
                      date: new Date().toISOString(),
                    },
                    ...x.activity,
                  ],
                }));
                setEdit(false);
                state.notify("Brief revision saved. Prior versions retained.");
              }}
            >
              Save new revision
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
