import { useEffect } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Copy, Download } from "lucide-react";
import { Badge, Button, Empty, Status, Stepper, s } from "../../components/ui";
import { pathwaySubsteps, workflow, type PathwaySubstep, type WorkflowStep } from "../../planner/model";
import { planStatus, stepDone, validate, validationStatus } from "../../planner/calc";
import { usePlanner, useProject } from "../../planner/store";
import { downloadReport } from "../../planner/report";
import { useWorkspace } from "../../stores/workspace";
import { familyLabel } from "../../planner/families";
import { DescribeStep, LiteratureStep, SourcesStep, TypeStep } from "./Steps";
import { PathwaysStep } from "./Pathways";
import { CreateStep, ReviewStep } from "./Final";
import c from "./planner.module.css";

const isStep = (v?: string): v is WorkflowStep => workflow.some((w) => w.id === v);
const isSub = (v?: string): v is PathwaySubstep => pathwaySubsteps.some((x) => x.id === v);

export function ProjectEntry() {
  const { projectId } = useParams();
  const p = useProject(projectId);
  if (!p) return <ProjectMissing id={projectId} />;
  const checks = validate(p);
  const first = planStatus(p, checks) === "Completed" ? "create" : workflow.find((w) => !stepDone(p, w.id, checks))?.id || "review";
  return <Navigate replace to={`/projects/${p.id}/${first === "pathways" ? "pathways/approaches" : first}`} />;
}

function ProjectMissing({ id }: { id?: string }) {
  const legacy = useWorkspace((x) => x.projects.some((p) => p.id === id));
  return (
    <div className={s.panel}>
      <h1 className={s.srOnly}>Project not found</h1>
      <Empty title={legacy ? "This project is from the previous version of Helix" : "Project not found"}>
        <p>
          {legacy
            ? "Formulation projects from the previous version are kept in this browser. You can download their data from Settings."
            : "The link may be wrong, or the project was created in another browser. Your own projects are saved only in the browser where you made them."}
        </p>
        <div className={s.row}>
          <Link className={`${s.button} ${s.primary}`} to="/projects">Go to projects</Link>
          {legacy && <Link className={s.button} to="/settings">Open Settings</Link>}
        </div>
      </Empty>
    </div>
  );
}

export function Workspace() {
  const params = useParams();
  const { projectId, sub: rawSub } = params;
  const rawStep = rawSub !== undefined ? "pathways" : params.step;
  const p = useProject(projectId);
  const navigate = useNavigate();
  const duplicate = usePlanner((x) => x.duplicate);
  const notify = useWorkspace((x) => x.notify);
  const step: WorkflowStep = isStep(rawStep) ? rawStep : "type";
  const sub: PathwaySubstep = isSub(rawSub) ? rawSub : "approaches";
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, sub]);
  if (!p) return <ProjectMissing id={projectId} />;
  if (!isStep(rawStep)) return <Navigate replace to={`/projects/${p.id}`} />;
  if (step === "pathways" && !isSub(rawSub)) return <Navigate replace to={`/projects/${p.id}/pathways/approaches`} />;
  const checks = validate(p);
  const status = planStatus(p, checks);
  const index = workflow.findIndex((w) => w.id === step);
  const prev = workflow[index - 1],
    next = workflow[index + 1];
  const go = (id: WorkflowStep) => navigate(`/projects/${p.id}/${id === "pathways" ? "pathways/approaches" : id}`);
  const readOnly = p.reference;
  function copy() {
    const id = duplicate(p!.id);
    if (!id) return;
    notify(`Copy ${id} created from ${p!.id}. Your changes are saved to the copy; the reference project stays unchanged.`, {
      to: `/projects/${id}/type`,
      label: "Open copy",
    });
    navigate(`/projects/${id}/type`);
  }
  return (
    <>
      <header className={c.header}>
        <div className={c.titleRow}>
          <div>
            <h1>{p.title || "Untitled project"}</h1>
            <p className={c.meta}>
              {p.id}
              {p.subcategoryId && ` · ${familyLabel(p.categoryId, p.subcategoryId)}`}
              {p.category && ` · ${p.category}`}
              {p.task && ` · ${p.task}`}
              {p.createdFrom && ` · Copied from ${p.createdFrom}`}
            </p>
            <div className={c.badges}>
              <span className={c.badgeLabel}>Plan status</span> <Status value={status} />
              <span className={c.badgeLabel}>Project type</span> <Badge tone={p.reference ? "violet" : "neutral"}>{p.reference ? "Reference sample" : "User project"}</Badge>
              <span className={c.badgeLabel}>Experimental validation</span> <Badge tone="amber">{validationStatus(p)}</Badge>
            </div>
          </div>
          <div className={c.headerActions}>
            {p.plan && (
              <Button small onClick={() => downloadReport(p)}>
                <Download size={13} /> Download report
              </Button>
            )}
            {p.reference ? (
              <Button small onClick={copy}>
                <Copy size={13} /> Use as starting point
              </Button>
            ) : (
              <Button small variant="ghost" onClick={copy}>
                <Copy size={13} /> Duplicate
              </Button>
            )}
          </div>
        </div>
        {p.reference && (
          <p className={c.banner} role="note">
            This is a reference sample: a completed development plan, not a tested formulation. It is read-only so it stays intact. Select <b>Use as starting point</b> to make an editable copy; your changes are saved to the copy in this browser.
          </p>
        )}
      </header>
      <Stepper
        label="Project workflow"
        onSelect={(id) => go(id as WorkflowStep)}
        steps={workflow.map((w, i) => {
          const done = stepDone(p, w.id, checks);
          const hasIssue = w.id !== "review" && w.id !== "create" && checks.some((x) => x.step === w.id);
          return {
            id: w.id,
            number: i + 1,
            name: w.name,
            current: w.id === step,
            state: w.id === step ? "current" : done ? "complete" : hasIssue && i < index ? "attention" : "upcoming",
          };
        })}
      />
      <section className={c.stepBody} aria-labelledby="step-heading">
        <div className={c.stepHeading}>
          <p className={c.stepEyebrow}>
            Step {index + 1} of {workflow.length}
          </p>
          <h2 id="step-heading">{workflow[index].name}</h2>
          <p className={s.lead}>{workflow[index].purpose}</p>
        </div>
        {step === "type" && <TypeStep p={p} readOnly={readOnly} checks={checks} />}
        {step === "sources" && <SourcesStep p={p} readOnly={readOnly} checks={checks} />}
        {step === "describe" && <DescribeStep p={p} readOnly={readOnly} checks={checks} />}
        {step === "literature" && <LiteratureStep p={p} readOnly={readOnly} checks={checks} />}
        {step === "pathways" && (
          <PathwaysStep p={p} readOnly={readOnly} checks={checks} sub={sub} onSub={(x) => navigate(`/projects/${p.id}/pathways/${x}`)} />
        )}
        {step === "review" && <ReviewStep p={p} checks={checks} />}
        {step === "create" && <CreateStep p={p} checks={checks} />}
        <nav className={s.stepFooter} aria-label="Step navigation">
          {prev ? (
            <Button variant="ghost" onClick={() => go(prev.id)}>
              <ArrowLeft size={14} /> Back to {prev.name}
            </Button>
          ) : (
            <Link to="/projects" className={`${s.button} ${s.ghost}`}>
              <ArrowLeft size={14} /> All projects
            </Link>
          )}
          {next && (
            <Button
              variant={step === "review" ? (checks.length ? "default" : "primary") : stepDone(p, step, checks) ? "primary" : "default"}
              onClick={() => go(next.id)}
            >
              {step === "review" ? "Continue to Create" : `Next: ${next.name}`}
              <ArrowRight size={14} />
            </Button>
          )}
        </nav>
        {step !== "review" && step !== "create" && !readOnly && (
          <p className={c.saved}>Changes save automatically in this browser.</p>
        )}
      </section>
    </>
  );
}
