import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  CircleCheck,
  CircleDashed,
  Download,
  FileSpreadsheet,
  LockKeyhole,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { Project, RecipeRevision } from "../../domain/models";
import {
  Badge,
  Breakdown,
  Button,
  DataTag,
  Empty,
  Field,
  Figure,
  Modal,
  Reason,
  Status,
  TargetChart,
  s,
} from "../../components/ui";
import { useWorkspace, uid } from "../../stores/workspace";
import {
  approvalChecks,
  costBreakdown,
  evaluate,
  projectOutcome,
  recipeMetrics,
} from "../../domain/calculations";
import { propertyFor } from "../../data/property-library";
import type { StageKey } from "../../data/procedure";
import { stageTitle } from "../../data/procedure";
import {
  conversionNote,
  formatDate,
  formatINR,
  formatMeasured,
  formatNumber,
} from "../../lib/format";
import { reports } from "../../services/demo/reports";
import c from "./Final.module.css";

const shortName = (t?: RecipeRevision) => t?.name.split(" · ")[0] || "—";

export function previousTrial(p: Project, trial?: RecipeRevision) {
  if (!trial) return undefined;
  return (
    p.trials.find((t) => t.id === trial.parentId) ||
    p.trials[p.trials.indexOf(trial) - 1]
  );
}

export function Final({
  project: p,
  onGo,
}: {
  project: Project;
  onGo: (stage: StageKey) => void;
}) {
  const state = useWorkspace(),
    [request, setRequest] = useState(false),
    [note, setNote] = useState(""),
    [ack, setAck] = useState(false),
    [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const trial = p.trials.at(-1);
  const prev = previousTrial(p, trial);
  const role = state.user?.role || "";
  const reviewer = ["Reviewer", "Admin"].includes(role);
  const chemist = ["Chemist", "Admin"].includes(role);
  const outcome = projectOutcome(p, state.materials);
  const checks = approvalChecks(p, trial, state.materials);

  if (!trial)
    return (
      <Empty title="No final report yet">
        <p>
          The report needs at least one trial with lab results. Finish Read and
          Design, then record results in Execute.
        </p>
        <Button variant="primary" onClick={() => onGo(p.sources.length ? "Pathways" : "Literature")}>
          Go to {p.sources.length ? "Design" : "Read"}
        </Button>
      </Empty>
    );

  const ceiling =
    !p.brief.constraints.currency || p.brief.constraints.currency === "INR"
      ? Number(p.brief.constraints.cost) || undefined
      : undefined;
  const metrics = recipeMetrics(trial, state.materials, ceiling);
  const prevMetrics = prev ? recipeMetrics(prev, state.materials) : null;
  const lines = costBreakdown(trial, state.materials);
  const approved = outcome.kind === "approved";
  const rows = p.brief.targets.map((t) => {
    const find = (id?: string) =>
      p.results.find((r) => r.trialId === id && r.propertyId === t.propertyId);
    const latest = find(trial.id),
      before = find(prev?.id);
    const bench = p.brief.benchmarkIds
      .map((id) => state.benchmarks.find((b) => b.id === id))
      .find((b) => b?.values[t.propertyId] !== undefined);
    return {
      t,
      name: propertyFor(t.propertyId).name,
      now: evaluate(t, latest),
      nowReadings: latest?.readings || [],
      was: prev ? evaluate(t, before) : null,
      wasReadings: before?.readings || [],
      bench: bench ? { name: bench.name, value: bench.values[t.propertyId] } : null,
      estimate: p.pathways.find((x) => x.id === p.selectedPathway)?.predictions[
        t.propertyId
      ],
    };
  });
  const targetText = (t: (typeof rows)[number]["t"]) =>
    `${t.operator} ${t.value}${t.operator === "Between" ? `–${t.max}` : ""}`;

  function record(action: string, text: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
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
          note: text,
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
    state.notify(`${action}: ${shortName(trial)}.`);
    setTimeout(() => {
      busyRef.current = false;
      setBusy(false);
    }, 400);
  }

  // One primary action, chosen from the outcome and the user's role.
  const firstCheck = checks[0];
  const primary = approved
    ? { label: "Download report (PDF)", run: () => reports.print(p) }
    : outcome.kind === "failing"
      ? { label: "Review the next trial", run: () => onGo("Analysis") }
      : outcome.kind === "incomplete"
        ? { label: "Enter missing results", run: () => onGo("Results") }
        : null;

  const OutcomeIcon =
    approved || outcome.kind === "ready" || outcome.kind === "review"
      ? CircleCheck
      : outcome.kind === "failing"
        ? XCircle
        : CircleDashed;

  return (
    <div className={c.report}>
      {/* 1. Outcome */}
      <section className={`${c.outcome} ${c[outcome.kind]}`} aria-labelledby="outcome-title">
        <OutcomeIcon size={30} aria-hidden="true" className={c.outcomeIcon} />
        <div className={c.outcomeText}>
          <p className={c.kicker}>Recommendation</p>
          <h3 id="outcome-title">{outcome.headline}</h3>
          <p>{outcome.explanation}</p>
          <div className={c.outcomeActions}>
            {primary && (
              <Button variant="primary" onClick={primary.run}>
                {primary.label}
                <ArrowRight size={14} />
              </Button>
            )}
            {!approved && (
              <Button onClick={() => reports.print(p)}>
                <Download size={14} />
                Download report (PDF)
              </Button>
            )}
            <Button variant="ghost" onClick={() => reports.workbook(p)}>
              <FileSpreadsheet size={14} />
              Export workbook (.xlsx)
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Key figures */}
      <section aria-label="Key figures" className={c.cards}>
        <div className={c.card}>
          <span className={c.cardLabel}>Targets met</span>
          <strong>
            {outcome.passCount} <small>of {outcome.total}</small>
          </strong>
          <span className={c.cardNote}>
            {outcome.failCount > 0 && `${outcome.failCount} missed · `}
            {outcome.pendingCount > 0 && `${outcome.pendingCount} awaiting readings · `}
            Latest trial, {shortName(trial)} <DataTag kind="calculated" />
          </span>
        </div>
        <div className={c.card}>
          <span className={c.cardLabel}>Material cost</span>
          <strong>
            {metrics.cost === null ? "Incomplete" : formatINR(metrics.cost)}
            {metrics.cost !== null && <small> /kg</small>}
          </strong>
          <span className={c.cardNote}>
            {metrics.cost === null ? (
              <>
                An ingredient has no ₹ price <DataTag kind="missing" />
              </>
            ) : (
              <>
                {formatINR(metrics.cost * trial.batchKg)} per{" "}
                {formatNumber(trial.batchKg, trial.batchKg % 1 ? 1 : 0)} kg batch
                {ceiling ? ` · limit ${formatINR(ceiling)}/kg` : ""}{" "}
                <DataTag kind="calculated" />
              </>
            )}
          </span>
        </div>
        <div className={c.card}>
          <span className={c.cardLabel}>Recipe</span>
          <strong>{shortName(trial)}</strong>
          <span className={c.cardNote}>
            Revision {trial.version} ·{" "}
            {approved ? (
              <>
                <LockKeyhole size={11} /> approved and locked
              </>
            ) : trial.locked ? (
              "read-only"
            ) : (
              "draft"
            )}
          </span>
        </div>
        <div className={c.card}>
          <span className={c.cardLabel}>Batch</span>
          <strong>
            {formatNumber(trial.batchKg, trial.batchKg % 1 ? 1 : 0)} <small>kg dry</small>
          </strong>
          <span className={c.cardNote}>
            + {formatNumber((trial.batchKg * trial.water) / 100, 2)} kg water (
            {formatNumber(trial.water, trial.water % 1 ? 1 : 0)}% of dry mass){" "}
            <DataTag kind="entered" />
          </span>
        </div>
      </section>

      {/* 3. What it means */}
      <section className={c.meaning} aria-labelledby="meaning-title">
        <h3 id="meaning-title">What the results mean</h3>
        <ul>
          {rows.map((r) => {
            const meets = r.now.status === "Pass";
            const was =
              r.was && r.was.mean !== null
                ? `${formatMeasured(r.was.mean, r.wasReadings)} in ${shortName(prev)}`
                : null;
            return (
              <li key={r.t.propertyId}>
                {meets ? (
                  <CircleCheck size={15} aria-label="Meets target" className={c.ok} />
                ) : r.now.status === "Fail" || r.now.status === "Borderline" ? (
                  <XCircle size={15} aria-label="Misses target" className={c.bad} />
                ) : (
                  <CircleDashed size={15} aria-label="Not yet known" className={c.muted} />
                )}
                <span>
                  <b>{r.name}</b>{" "}
                  {r.now.mean === null
                    ? "has no complete result yet."
                    : `measured ${formatMeasured(r.now.mean, r.nowReadings)} ${r.t.unit}${was ? ` (was ${was})` : ""}. Target ${targetText(r.t)} ${r.t.unit}: ${meets ? "met" : r.now.status === "Not evaluated" ? "cannot be compared" : "not met"}.`}
                </span>
              </li>
            );
          })}
          {prev && metrics.cost !== null && prevMetrics?.cost != null && (
            <li>
              <ShieldCheck size={15} aria-hidden="true" className={c.muted} />
              <span>
                <b>Cost</b> changed by{" "}
                {metrics.cost - prevMetrics.cost >= 0 ? "+" : "−"}
                {formatINR(Math.abs(metrics.cost - prevMetrics.cost))}/kg compared
                with {shortName(prev)} ({formatINR(prevMetrics.cost)}/kg).
                {(() => {
                  const changed = lines.filter(
                    (l) => (prev.percentages[l.id] ?? 0) !== l.percent,
                  );
                  return changed.length
                    ? ` Recipe changes: ${changed
                        .map(
                          (l) =>
                            `${l.name} ${formatNumber(prev.percentages[l.id] ?? 0)}% → ${formatNumber(l.percent)}%`,
                        )
                        .join("; ")}.`
                    : "";
                })()}
              </span>
            </li>
          )}
        </ul>
      </section>

      {/* 4. Comparisons */}
      <div className={c.charts}>
        <Figure
          title="Measured result against target"
          takeaway={
            prev
              ? `How ${shortName(trial)} compares with ${shortName(prev)} and the target for each test. Bars inside the green range meet the target.`
              : `How ${shortName(trial)} compares with the target for each test. Bars inside the green range meet the target.`
          }
          note="Each test has its own scale starting at 0, because units differ."
        >
          <TargetChart
            rows={rows
              .filter((r) => propertyFor(r.t.propertyId).kind !== "text")
              .map((r) => {
                const v = Number(r.t.value),
                  hi = Number(r.t.max);
                return {
                  name: r.name,
                  unit: r.t.unit,
                  targetText: targetText(r.t),
                  min:
                    r.t.operator === "≥" || r.t.operator === "Between" || r.t.operator === "="
                      ? v
                      : undefined,
                  max:
                    r.t.operator === "≤"
                      ? v
                      : r.t.operator === "Between"
                        ? hi
                        : r.t.operator === "="
                          ? v
                          : undefined,
                  series: [
                    ...(prev && r.was
                      ? [
                          {
                            label: shortName(prev),
                            value: r.was.mean,
                            display: formatMeasured(r.was.mean, r.wasReadings),
                            tone: "previous" as const,
                            meets:
                              r.was.status === "Pass"
                                ? true
                                : r.was.status === "Fail"
                                  ? false
                                  : null,
                          },
                        ]
                      : []),
                    {
                      label: shortName(trial),
                      value: r.now.mean,
                      display: formatMeasured(r.now.mean, r.nowReadings),
                      tone: "current" as const,
                      meets:
                        r.now.status === "Pass"
                          ? true
                          : r.now.status === "Fail"
                            ? false
                            : null,
                    },
                    ...(r.bench
                      ? [
                          {
                            label: "Benchmark",
                            value: r.bench.value,
                            display: String(r.bench.value),
                            tone: "reference" as const,
                          },
                        ]
                      : []),
                  ],
                };
              })}
          />
        </Figure>
        <Figure
          title={`Where the cost comes from (${shortName(trial)})`}
          takeaway={(() => {
            const priced = lines.filter((l) => l.perKg !== null);
            if (metrics.cost === null || !priced.length)
              return "Cost cannot be broken down until every ingredient has a ₹ price.";
            const top = [...priced].sort((a, b) => b.perKg! - a.perKg!)[0];
            return `${top.name} is ${formatNumber(top.percent)}% of the weight but ${Math.round((top.perKg! / metrics.cost) * 100)}% of the cost.`;
          })()}
          note={conversionNote}
        >
          {metrics.cost === null ? (
            <p className={s.muted}>Add the missing prices in Raw materials to see this chart.</p>
          ) : (
            <Breakdown
              label="Share of material cost by ingredient"
              items={lines
                .filter((l) => l.perKg !== null)
                .sort((a, b) => b.perKg! - a.perKg!)
                .map((l) => ({
                  name: l.name,
                  share: l.perKg!,
                  display: `${formatINR(l.perKg)}/kg · ${Math.round((l.perKg! / metrics.cost!) * 100)}%`,
                }))}
            />
          )}
        </Figure>
      </div>

      {/* 4b. Detailed tables */}
      <section aria-labelledby="results-table">
        <div className={s.sectionTitle}>
          <h3 id="results-table">Results in detail</h3>
          <p>Means of three specimen readings. “—” means no data.</p>
        </div>
        <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
        <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Results table">
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Test</th>
                <th scope="col">Unit</th>
                <th scope="col" className={s.num}>Target</th>
                <th scope="col" className={s.num}>Benchmark</th>
                <th scope="col" className={s.num}>Estimate</th>
                {prev && <th scope="col" className={s.num}>{shortName(prev)} mean</th>}
                <th scope="col" className={s.num}>{shortName(trial)} mean</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.t.propertyId}>
                  <td>
                    <b>{r.name}</b>
                    <small>
                      {r.t.priority} · {r.t.condition}
                    </small>
                  </td>
                  <td>{r.t.unit}</td>
                  <td className={s.num}>{targetText(r.t)}</td>
                  <td className={s.num}>{r.bench ? r.bench.value : "—"}</td>
                  <td className={s.num}>{r.estimate ?? "—"}</td>
                  {prev && (
                    <td className={s.num}>
                      {r.was ? formatMeasured(r.was.mean, r.wasReadings) : "—"}
                    </td>
                  )}
                  <td className={s.num}>
                    <b>{formatMeasured(r.now.mean, r.nowReadings)}</b>
                  </td>
                  <td>
                    <Status value={r.now.status === "Pending" ? "Pending readings" : r.now.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={c.legend}>
          <DataTag kind="entered" /> Target and benchmark: entered.{" "}
          <DataTag kind="estimate" /> Estimate: from the selected pathway, not
          measured. <DataTag kind="calculated" /> Means: calculated from lab
          readings.
        </p>
      </section>

      <section aria-labelledby="cost-table">
        <div className={s.sectionTitle}>
          <h3 id="cost-table">Recipe and cost ({shortName(trial)})</h3>
          <p>Dry-blend weight %. Water is added separately.</p>
        </div>
        <p className={s.scrollHint}>Scroll sideways to see all columns →</p>
        <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Recipe and cost table">
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Ingredient</th>
                <th scope="col" className={s.num}>Dry weight (%)</th>
                <th scope="col" className={s.num}>Mass per batch (kg)</th>
                <th scope="col" className={s.num}>Price (₹/kg)</th>
                <th scope="col" className={s.num}>Cost share (₹/kg of blend)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td className={s.num}>{formatNumber(l.percent)}</td>
                  <td className={s.num}>{formatNumber(l.massKg, 3)}</td>
                  <td className={s.num}>
                    {l.price === null ? <DataTag kind="missing" /> : formatINR(l.price)}
                  </td>
                  <td className={s.num}>{l.perKg === null ? "—" : formatINR(l.perKg)}</td>
                </tr>
              ))}
              <tr className={s.totalRow}>
                <td>Total dry blend</td>
                <td className={s.num}>{formatNumber(metrics.total)}</td>
                <td className={s.num}>{formatNumber(trial.batchKg, 3)}</td>
                <td className={s.num} />
                <td className={s.num}>
                  {metrics.cost === null ? "Incomplete" : formatINR(metrics.cost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Assumptions */}
      <details className={s.details}>
        <summary>Assumptions, limits and how values are calculated</summary>
        <ul className={c.assumptions}>
          <li>
            <DataTag kind="calculated" /> Mean = average of the specimen
            readings. Shown to the same precision as the readings.
          </li>
          <li>
            <DataTag kind="calculated" /> Material cost per kg = Σ (ingredient
            price × dry weight % ÷ 100). Batch cost = cost per kg × batch kg.
          </li>
          <li>
            <DataTag kind="assumption" /> {conversionNote}
          </li>
          <li>
            <DataTag kind="assumption" /> A target is only judged when the
            result uses the same unit, test method and conditions as the target.
          </li>
          <li>
            <DataTag kind="assumption" /> All chemistry, prices and lab values
            in this demo are illustrative. Standard references are not verified.
            Meeting a target is not a compliance claim.
          </li>
          <li>
            Sources used:{" "}
            {p.sources
              .filter((x) => !x.excluded)
              .map((x) => x.reference)
              .join(", ") || <DataTag kind="missing" />}
          </li>
        </ul>
      </details>

      {/* 6. Next action: review and approval */}
      <section className={c.approval} aria-labelledby="approval-title">
        <div className={s.between}>
          <h3 id="approval-title">
            <ShieldCheck size={18} aria-hidden="true" /> Review and approval
          </h3>
          <Badge tone={approved ? "green" : p.status === "In review" ? "violet" : "amber"}>
            {approved ? "Approved · locked" : p.status}
          </Badge>
        </div>
        {approved ? (
          <p className={s.muted}>
            {shortName(trial)} is locked. To change it, create a new draft
            revision in Design · Trial plan; this approved version stays
            available.
          </p>
        ) : (
          <>
            {checks.length > 0 ? (
              <>
                <p className={c.checksIntro}>
                  <AlertTriangle size={15} aria-hidden="true" />
                  {checks.length === 1
                    ? "1 item must be resolved before approval:"
                    : `${checks.length} items must be resolved before approval:`}
                </p>
                <ol className={c.checks}>
                  {checks.map((x) => (
                    <li key={x.message}>
                      <span>
                        <b>{x.message}.</b> {x.fix}
                      </span>
                      <Button small variant="ghost" onClick={() => onGo(x.stage)}>
                        Go to {stageTitle(x.stage)}
                      </Button>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className={c.checksIntro}>
                <CheckCheck size={15} aria-hidden="true" /> All checks pass.
              </p>
            )}
            <label className={c.ack}>
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
                disabled={!reviewer}
              />
              <span>
                I have reviewed the recipe, required tests, free-text
                constraints, missing sources and unverified standards. I
                understand this is a demo approval, not a certification.
              </span>
            </label>
            <div className={`${s.row} ${s.wrap}`}>
              <Button
                variant={reviewer && !primary && checks.length === 0 ? "primary" : "default"}
                disabled={
                  busy || !reviewer || checks.length > 0 || !ack || p.status !== "In review"
                }
                onClick={() =>
                  record(
                    "Approved",
                    "Required targets reviewed; demo-only internal approval.",
                  )
                }
              >
                <CheckCheck size={15} />
                Approve formulation
              </Button>
              <Button
                variant={chemist && !reviewer && !primary && p.status !== "In review" ? "primary" : "default"}
                disabled={busy || !chemist || p.status === "In review" || metrics.errors.length > 0}
                onClick={() =>
                  record(
                    "Submitted for review",
                    "Recipe and measured evidence submitted for independent review.",
                  )
                }
              >
                <Send size={14} />
                {p.status === "In review" ? "Submitted for review" : "Submit for review"}
              </Button>
              <Button
                variant="ghost"
                disabled={busy || !reviewer}
                onClick={() => setRequest(true)}
              >
                Request changes
              </Button>
            </div>
            <Reason>
              {!reviewer
                ? `You are signed in as ${role}. A Chemist submits the recipe; a Reviewer approves it. Change your demo role in Settings.`
                : p.status !== "In review"
                  ? "Approval is available once the recipe has been submitted for review."
                  : checks.length
                    ? "Approval is available once every item above is resolved."
                    : !ack
                      ? "Tick the confirmation box to enable approval."
                      : "Approving locks the recipe and its prices."}
            </Reason>
          </>
        )}
        <details className={c.history}>
          <summary>Approval history ({p.approvals.length})</summary>
          {p.approvals.length ? (
            <ol>
              {p.approvals
                .slice()
                .reverse()
                .map((a) => (
                  <li key={a.id}>
                    <b>{a.action}</b> · {a.actor} · {formatDate(a.date)} ·{" "}
                    {shortName(p.trials.find((t) => t.id === a.recipeId))}
                    <small>{a.note}</small>
                  </li>
                ))}
            </ol>
          ) : (
            <p className={s.muted}>No review events yet.</p>
          )}
        </details>
      </section>
      {request && (
        <Modal title="Request changes" onClose={() => setRequest(false)}>
          <Field label="What needs to change?" required>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain what evidence or changes are needed."
            />
          </Field>
          <div className={s.modalActions}>
            <Button onClick={() => setRequest(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!note.trim()}
              onClick={() => {
                record("Changes requested", note.trim());
                setRequest(false);
                setNote("");
              }}
            >
              Send request
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

