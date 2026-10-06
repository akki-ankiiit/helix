import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, CircleCheck, Copy, Download, FileSpreadsheet, Printer, Sparkles } from "lucide-react";
import { Button, Notice, Reason, s } from "../../components/ui";
import type { PathwaySubstep, Project, WorkflowStep } from "../../planner/model";
import { pathwaySubsteps, workflow } from "../../planner/model";
import {
  fmt,
  formatINR,
  planStatus,
  planSummary,
  projectCalc,
  recommendations,
  validationStatus,
  type Check,
} from "../../planner/calc";
import { usePlanner } from "../../planner/store";
import { downloadReport, downloadWorkbook, printReport } from "../../planner/report";
import { formatDate } from "../../lib/format";
import { useWorkspace } from "../../stores/workspace";
import { familyLabel } from "../../planner/families";
import {
  ApproachTable,
  CompositionChart,
  CostTable,
  EvidenceLegend,
  FormulationTable,
  LiteratureTable,
  MixingDiagram,
  PerformanceChart,
  ProcessFlow,
  ProcessTable,
  ProjectSummaryGraphic,
  TestMatrix,
  Timeline,
  TrialsTable,
} from "./ui";
import { RecommendationList } from "./Pathways";
import c from "./planner.module.css";

const pathFor = (p: Project, step: WorkflowStep, sub?: PathwaySubstep) =>
  `/projects/${p.id}/${step}${step === "pathways" ? `/${sub || "approaches"}` : ""}`;

export function StatusTriplet({ p, status }: { p: Project; status: string }) {
  const v = validationStatus(p);
  return (
    <dl className={c.triplet}>
      <div><dt>Plan status</dt><dd className={status === "Completed" ? c.okText : c.statusWarn}>{status}</dd></div>
      <div><dt>Project type</dt><dd>{p.reference ? "Reference sample" : "User project"}</dd></div>
      <div><dt>Experimental validation</dt><dd className={v === "Not performed" ? c.statusPending : ""}>{v}</dd></div>
    </dl>
  );
}

export function ReviewStep({ p, checks }: { p: Project; checks: Check[] }) {
  const calc = projectCalc(p);
  const summaries: Record<string, string> = {
    type: `${p.title || "Untitled"} · ${familyLabel(p.categoryId, p.subcategoryId) || "no category or family"} · ${p.category || "no formulation type"} · ${p.task || "no task"}`,
    sources: `${p.sources.filter((x) => x.selected).length} selected (${[...new Set(p.sources.filter((x) => x.selected).map((x) => x.kind))].join(", ") || "none"})`,
    describe: `${p.objective || "No objective"} · batch ${fmt(p.batchKg, 2)} kg · ${p.substrates.filter(Boolean).length} substrate(s)`,
    literature: `${p.literature.filter((l) => l.used).length} record(s) used`,
    pathways: `${p.approaches.find((a) => a.id === p.selectedApproachId)?.name || "No approach selected"} · ${p.ingredients.length} ingredients · ${calc.parts.map((x) => `${x.name} ${fmt(x.total, 2)}%`).join(", ") || "no components"}${calc.mixRatioText ? ` · ${calc.mixRatioText}` : ""} · ${p.process.length} processing stages · ${p.tests.length} tests · ${p.trials.length} trials`,
  };
  return (
    <div className={s.stack}>
      {checks.length ? (
        <div className={c.checkList} role="alert">
          <b><AlertTriangle size={15} aria-hidden="true" /> {checks.length} item{checks.length === 1 ? "" : "s"} to fix before you can create the plan.</b>
          <p>Each item links to where it can be fixed. Your entries are kept.</p>
        </div>
      ) : (
        <div className={c.okBox} role="status">
          <b><CheckCircle2 size={15} aria-hidden="true" /> The formulation, calculations, processing plan, evidence and tests are complete.</b>
          <p>Experimental validation: {validationStatus(p).toLowerCase()}. Untested results do not block the plan; they remain listed as work to do.</p>
        </div>
      )}
      <ol className={c.reviewList}>
        {workflow.slice(0, 5).map((w, i) => {
          const issues = checks.filter((x) => x.step === w.id);
          return (
            <li key={w.id} className={issues.length ? c.reviewBad : ""}>
              <div className={c.reviewHead}>
                <h3>
                  {issues.length ? <AlertTriangle size={15} aria-label="Needs attention" /> : <CheckCircle2 size={15} aria-label="Complete" />}
                  {i + 1}. {w.name}
                </h3>
                <Link to={pathFor(p, w.id)} className={s.textLink}>{p.reference ? "View" : "Edit"} {w.name}</Link>
              </div>
              <p>{summaries[w.id]}</p>
              {w.id === "pathways" && (
                <ul className={c.subChecks}>
                  {pathwaySubsteps.map((sub, j) => {
                    const bad = issues.some((x) => x.substep === sub.id);
                    return <li key={sub.id}>{bad ? <AlertTriangle size={13} aria-label="Needs attention" /> : <CheckCircle2 size={13} aria-label="Complete" />} 5.{"abcde"[j]} {sub.name}</li>;
                  })}
                </ul>
              )}
              {issues.length > 0 && (
                <ul className={c.issues}>
                  {issues.map((x) => <li key={x.message}>{x.message} <Link to={pathFor(p, x.step, x.substep)}>Fix</Link></li>)}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <Notice>
        <b>What happens next:</b> “Generate plan” in Create saves a versioned formulation-development plan and enables the report download. If you change anything afterwards, the plan is marked out of date until you generate it again. “Completed” means the plan is complete — not that the formulation has passed testing.
      </Notice>
    </div>
  );
}

export function CreateStep({ p, checks }: { p: Project; checks: Check[] }) {
  const generate = usePlanner((x) => x.generatePlan);
  const duplicate = usePlanner((x) => x.duplicate);
  const notify = useWorkspace((x) => x.notify);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const status = planStatus(p, checks);
  const calc = projectCalc(p);
  const sum = planSummary(p, calc);
  const recs = recommendations(p, calc);

  function run() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const res = generate(p.id);
    if (res.ok) notify(`Plan generated for ${p.id}. The report is ready to download.`);
    else setError(res.reason);
    setTimeout(() => { lock.current = false; setBusy(false); }, 300);
  }
  const print = () => { if (!printReport(p)) notify("Your browser blocked the report window. Allow pop-ups, or use “Download report”."); };

  const panel = !p.reference && status !== "Completed" && (
    <section className={c.generate} aria-labelledby="gen">
      <h3 id="gen"><Sparkles size={17} aria-hidden="true" /> {status === "Plan out of date" ? "The plan is out of date" : "Generate the formulation-development plan"}</h3>
      <p>
        {status === "Plan out of date"
          ? `You changed the project after plan v${p.plan?.version} was generated on ${formatDate(p.plan?.generatedAt)}. Calculations and the report must be regenerated to match.`
          : "Helix saves a versioned plan from your inputs and makes the report and workbook available. Nothing leaves this browser."}
      </p>
      {checks.length > 0 && <Reason>{checks.length} item{checks.length === 1 ? "" : "s"} must be fixed first. <Link to={`/projects/${p.id}/review`}>Go to Review</Link></Reason>}
      {error && <p className={s.error} role="alert">{error}</p>}
      <Button variant="primary" disabled={busy || checks.length > 0} aria-busy={busy} onClick={run}>
        {busy ? "Generating…" : status === "Plan out of date" ? `Regenerate plan (v${(p.plan?.version || 0) + 1})` : "Generate plan"}
      </Button>
    </section>
  );
  if (!p.plan) return <div className={s.stack}>{panel}</div>;

  const figures = [
    { label: "Batch size", value: `${fmt(p.batchKg, 2)} kg`, detail: p.parts.length > 1 ? "Total mixed product" : "Single component" },
    { label: "Composition", value: calc.parts.every((x) => x.balanced) ? "100% per component" : "Not balanced", detail: `${p.ingredients.length} ingredients, ${p.parts.length} component${p.parts.length === 1 ? "" : "s"}` },
    { label: p.parts.length > 1 ? "Mixing ratio" : p.water ? "Mixing water" : "Form", value: calc.mixRatioText ? calc.mixRatioText.split(" = ")[1].replace(" by weight", "") : p.water ? `${fmt(p.water.pctOfPowder, 1)}%` : "Ready to use", detail: calc.mixRatioText ? "By weight" : p.water ? `${fmt(calc.waterKg, 2)} kg water per batch` : "No mixing on site" },
    { label: "Tests planned", value: String(p.tests.length), detail: `${p.trials.length} trial batches` },
    { label: "Cost", value: formatINR(calc.costInr), detail: calc.costInr === null ? "No verified ₹ prices" : "User-entered estimate" },
  ];

  return (
    <div className={c.final}>
      {panel}
      <section className={`${c.outcome} ${status === "Completed" ? c.outcomeDone : c.outcomeStale}`} aria-labelledby="outcome">
        <CircleCheck size={26} aria-hidden="true" />
        <div>
          <p className={c.kicker}>Plan v{p.plan.version} · generated {formatDate(p.plan.generatedAt)}</p>
          <h3 id="outcome">{sum.headline}</h3>
          <p>{sum.explanation}</p>
          <StatusTriplet p={p} status={status} />
          <p className={c.disclaimer}>“Completed” means Helix has generated the full development plan. The formulation has not been tested in a laboratory or on site; no test results, certifications or prices are claimed.</p>
          <div className={c.actions}>
            <Button variant="primary" onClick={() => downloadReport(p)}><Download size={14} aria-hidden="true" /> Download report</Button>
            <Button onClick={print}><Printer size={14} aria-hidden="true" /> Print or save as PDF</Button>
            <Button variant="ghost" onClick={() => downloadWorkbook(p)}><FileSpreadsheet size={14} aria-hidden="true" /> Workbook (.xlsx)</Button>
            {p.reference ? (
              <Button variant="ghost" onClick={() => { const idv = duplicate(p.id); if (idv) { notify(`Copy ${idv} created. Changes are saved to the copy; ${p.id} stays unchanged.`); navigate(`/projects/${idv}/type`); } }}>
                <Copy size={14} aria-hidden="true" /> Use as starting point
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate(`/projects/${p.id}/pathways/composition`)}>Revise formulation</Button>
            )}
          </div>
        </div>
      </section>

      <ProjectSummaryGraphic p={p} calc={calc} />

      <section aria-label="Key figures" className={c.cards}>
        {figures.map((f) => (
          <div key={f.label} className={c.card}>
            <span>{f.label}</span>
            <strong>{f.value}</strong>
            <small>{f.detail}</small>
          </div>
        ))}
      </section>

      <section aria-labelledby="approach">
        <h3 id="approach" className={c.sectionHead}>Selected approach: {sum.approach?.name}</h3>
        <p>{p.rationale}</p>
        <ApproachTable p={p} readOnly onSelect={() => undefined} />
      </section>

      <section aria-labelledby="form">
        <h3 id="form" className={c.sectionHead}>Formulation and batch quantities</h3>
        <EvidenceLegend />
        <FormulationTable p={p} calc={calc} readOnly />
        <div className={c.chartGrid}>
          <CompositionChart p={p} calc={calc} />
          <MixingDiagram p={p} calc={calc} />
        </div>
      </section>

      <section aria-labelledby="proc">
        <h3 id="proc" className={c.sectionHead}>Processing plan</h3>
        <ProcessTable p={p} readOnly />
        <ProcessFlow p={p} />
        <Timeline p={p} />
      </section>

      <section aria-labelledby="tests">
        <h3 id="tests" className={c.sectionHead}>Performance testing</h3>
        <TestMatrix p={p} readOnly />
        <TrialsTable p={p} readOnly />
        <PerformanceChart p={p} />
      </section>

      <section aria-labelledby="cost">
        <h3 id="cost" className={c.sectionHead}>Cost</h3>
        <CostTable p={p} calc={calc} readOnly />
      </section>

      <RecommendationList p={p} recs={recs} readOnly />

      <section aria-labelledby="ag">
        <h3 id="ag" className={c.sectionHead}>Assumptions and gaps</h3>
        <div className={s.grid2}>
          <div>
            <h4 className={c.groupHeading}>Assumptions</h4>
            <ul className={c.plainList}>{p.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <div>
            <h4 className={c.groupHeading}>Gaps and missing information</h4>
            <ul className={c.plainList}>
              {p.gaps.map((g) => <li key={g}>{g}</li>)}
              {calc.costInr === null && <li>Cost not estimated: no verified raw-material prices in ₹.</li>}
              <li>Experimental validation: {validationStatus(p).toLowerCase()}.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="lit">
        <h3 id="lit" className={c.sectionHead}>Literature and sources</h3>
        <LiteratureTable p={p} />
        <p className={s.muted} style={{ fontSize: 12 }}>Findings are Helix's own summaries. Finished-product data sheets are cited as benchmarks only; their formulations are not disclosed or inferred.</p>
      </section>
    </div>
  );
}
