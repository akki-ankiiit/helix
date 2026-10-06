import * as XLSX from "xlsx";
import type { Project } from "../../domain/models";
import type { ReportService } from "../contracts";
import { propertyFor } from "../../data/property-library";
import {
  costBreakdown,
  evaluate,
  projectOutcome,
  recipeMetrics,
  approvalChecks,
} from "../../domain/calculations";
import { useWorkspace } from "../../stores/workspace";
import {
  USD_TO_INR,
  conversionNote,
  formatDate,
  formatINR,
  formatMeasured,
  formatNumber,
  toPaise,
} from "../../lib/format";

const escape = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

const short = (name?: string) => name?.split(" · ")[0] || "—";

/** Shared report content so the PDF, the workbook and the screen agree. */
function reportData(project: Project) {
  const materials = useWorkspace.getState().materials;
  const trial = project.trials.at(-1);
  const prev = trial
    ? project.trials.find((t) => t.id === trial.parentId) ||
      project.trials[project.trials.indexOf(trial) - 1]
    : undefined;
  const outcome = projectOutcome(project, materials);
  const metrics = trial ? recipeMetrics(trial, materials) : null;
  const lines = trial ? costBreakdown(trial, materials) : [];
  const checks = approvalChecks(project, trial, materials);
  const rows = project.brief.targets.map((t) => {
    const find = (id?: string) =>
      project.results.find(
        (r) => r.trialId === id && r.propertyId === t.propertyId,
      );
    const latest = find(trial?.id),
      before = find(prev?.id);
    const now = evaluate(t, latest),
      was = prev ? evaluate(t, before) : null;
    return {
      name: propertyFor(t.propertyId).name,
      unit: t.unit,
      method: t.method,
      condition: t.condition,
      priority: t.priority,
      target: `${t.operator} ${t.value}${t.operator === "Between" ? `–${t.max}` : ""}`,
      estimate:
        project.pathways.find((p) => p.id === project.selectedPathway)
          ?.predictions[t.propertyId] ?? null,
      previous: was ? formatMeasured(was.mean, before?.readings) : null,
      latest: formatMeasured(now.mean, latest?.readings),
      status: now.status,
    };
  });
  return { trial, prev, outcome, metrics, lines, checks, rows };
}

export const reports: ReportService = {
  workbook(project) {
    const book = XLSX.utils.book_new();
    const { trial, prev, outcome, metrics, lines, checks, rows } =
      reportData(project);
    const summary = [
      ["HELIX · ILLUSTRATIVE DEMO · R&D REVIEW REQUIRED"],
      ["Project", project.brief.name],
      ["Brief version", project.revisions.length],
      ["Exported", formatDate(Date.now())],
      [],
      ["Recommendation", outcome.headline],
      ["What it means", outcome.explanation],
      ["Targets met", `${outcome.passCount} of ${outcome.total}`],
      [
        "Material cost (INR per kg dry blend)",
        metrics?.cost == null ? "Incomplete" : toPaise(metrics.cost),
      ],
      [
        "Batch cost (INR, one batch)",
        metrics?.cost == null || !trial
          ? "Incomplete"
          : toPaise(metrics.cost * trial.batchKg),
      ],
      ["Recipe", trial?.name || "None"],
      ["Open checks before approval", checks.length],
      ...checks.map((c) => ["", `${c.message}. ${c.fix}`]),
      [],
      ["Currency", "INR (₹). GST and delivery not included."],
      [
        "Exchange rate",
        `₹${USD_TO_INR.rate} = US$1 · ${USD_TO_INR.source}`,
      ],
    ];
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet(summary),
      "Summary",
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        [
          "Test",
          "Unit",
          "Method",
          "Condition",
          "Priority",
          "Target",
          "Estimate",
          `${short(prev?.name)} mean`,
          `${short(trial?.name)} mean`,
          "Result",
        ],
        ...rows.map((r) => [
          r.name,
          r.unit,
          r.method,
          r.condition,
          r.priority,
          r.target,
          r.estimate ?? "—",
          r.previous ?? "—",
          r.latest,
          r.status,
        ]),
      ]),
      "Analysis",
    );
    const brief = [
      ["Project", project.brief.name],
      ["Composition basis", "Dry blend; application water separate"],
      [
        "Cost ceiling (INR/kg)",
        project.brief.constraints.cost
          ? project.brief.constraints.currency &&
            project.brief.constraints.currency !== "INR"
            ? `${project.brief.constraints.currency} ${project.brief.constraints.cost} (needs re-entry in INR)`
            : Number(project.brief.constraints.cost)
          : "None",
      ],
      [],
      ["Test", "Unit", "Method", "Condition", "Rule", "Target", "Upper", "Priority"],
      ...project.brief.targets.map((t) => [
        propertyFor(t.propertyId).name,
        t.unit,
        t.method,
        t.condition,
        t.operator,
        t.value,
        t.max,
        t.priority,
      ]),
    ];
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(brief), "Brief");
    const materials = useWorkspace.getState().materials;
    for (const t of project.trials) {
      const m = recipeMetrics(t, materials);
      const tl = t.id === trial?.id ? lines : costBreakdown(t, materials);
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet([
          ["Trial", t.name],
          ["Revision", t.version],
          ["Basis", t.basis],
          ["Batch (kg, dry)", t.batchKg],
          ["Application water (% of dry mass)", t.water],
          [
            "Material cost (INR per kg)",
            m.cost === null ? "Incomplete" : toPaise(m.cost),
          ],
          [],
          [
            "Ingredient",
            "Dry weight %",
            "Mass per batch (kg)",
            "Price (INR/kg)",
            "Cost share (INR per kg of blend)",
          ],
          ...tl.map((l) => [
            l.name,
            l.percent,
            Number(l.massKg.toFixed(3)),
            l.price ?? "Missing",
            l.perKg === null ? "Missing" : toPaise(l.perKg),
          ]),
          [
            "Total",
            Number(m.total.toFixed(2)),
            t.batchKg,
            "",
            m.cost === null ? "Incomplete" : toPaise(m.cost),
          ],
        ]),
        `Trial ${t.version}-${t.id.slice(-4)}`.slice(0, 31),
      );
    }
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        project.results.map((r) => ({
          Trial: short(project.trials.find((t) => t.id === r.trialId)?.name),
          Test: propertyFor(r.propertyId).name,
          Unit: r.unit,
          Method: r.method,
          Condition: r.condition,
          "Specimen 1": r.readings[0] ?? "",
          "Specimen 2": r.readings[1] ?? "",
          "Specimen 3": r.readings[2] ?? "",
          Date: r.date,
          Operator: r.operator,
          Reviewed: r.reviewed ? "Yes" : "No",
          Provenance: "Illustrative demo result",
        })),
      ),
      "Results",
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        project.sources.map((source) => ({
          Reference: source.reference,
          Title: source.title,
          Type: source.type,
          Owner: source.owner,
          Date: source.date,
          Excerpt: source.excerpt,
          "Evidence quality": source.quality,
          Excluded: source.excluded ? "Yes" : "No",
        })),
      ),
      "Sources",
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        project.approvals.map((approval) => ({
          Action: approval.action,
          By: approval.actor,
          Date: approval.date,
          Recipe: short(project.trials.find((t) => t.id === approval.recipeId)?.name),
          "Brief version": approval.briefVersion || 1,
          Notes: approval.note,
          Label: "Local demo approval only",
        })),
      ),
      "Approvals",
    );
    XLSX.writeFile(
      book,
      `Helix-${project.id}-v${project.revisions.length}.xlsx`,
    );
  },
  print(project: Project) {
    const win = window.open("", "_blank");
    if (!win) {
      useWorkspace
        .getState()
        .notify(
          "Your browser blocked the report window. Allow pop-ups for this site, then select “Download report” again.",
        );
      return;
    }
    const { trial, prev, outcome, metrics, lines, checks, rows } =
      reportData(project);
    const tone =
      outcome.kind === "failing"
        ? "#bf4557"
        : outcome.kind === "incomplete" || outcome.kind === "no-trial"
          ? "#906315"
          : "#26765c";
    const bar = (label: string, share: number, value: string) =>
      `<div class="bar"><span>${escape(label)}</span><i style="width:${Math.max(1, share * 100).toFixed(1)}%"></i><b>${escape(value)}</b></div>`;
    const costMax = Math.max(...lines.map((l) => l.perKg ?? 0), 0) || 1;
    win.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Helix report — ${escape(project.brief.name)}</title>
<style>
body{font:14px/1.55 system-ui,sans-serif;max-width:960px;margin:40px auto;padding:0 24px;color:#17191f}
h1{font-size:26px;margin:4px 0}h2{font-size:17px;margin:32px 0 10px}small,.muted{color:#5f6270}
.outcome{border-left:6px solid ${tone};background:#f6f7f9;padding:18px 20px;border-radius:8px;margin:20px 0}
.outcome h2{margin:0 0 6px;font-size:20px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.card{border:1px solid #ddd;border-radius:8px;padding:12px}.card b{display:block;font-size:20px}
table{border-collapse:collapse;width:100%;margin:8px 0}td,th{text-align:left;border-bottom:1px solid #ddd;padding:8px}th{color:#5f6270;font-weight:600}
.num{text-align:right;font-variant-numeric:tabular-nums}.total td{font-weight:700;border-top:2px solid #999}
.bar{display:grid;grid-template-columns:180px 1fr 150px;gap:10px;align-items:center;margin:6px 0}.bar i{display:block;height:12px;background:#6d4aff;border-radius:3px}.bar b{text-align:right;font-weight:500}
ul{padding-left:18px}button{margin-top:24px;padding:10px 16px;font:inherit}
@media print{button{display:none}body{margin:0}}
</style></head><body>
<small>HELIX · ILLUSTRATIVE DEMO · R&amp;D REVIEW REQUIRED</small>
<h1>${escape(project.brief.name)}</h1>
<p class="muted">Brief v${project.revisions.length} · Owner: ${escape(project.owner)} · Exported ${formatDate(Date.now())}</p>
<div class="outcome"><small>Recommendation</small><h2>${escape(outcome.headline)}</h2><p>${escape(outcome.explanation)}</p></div>
<div class="cards">
<div class="card"><small>Targets met</small><b>${outcome.passCount} of ${outcome.total}</b></div>
<div class="card"><small>Material cost</small><b>${metrics?.cost == null ? "Incomplete" : `${formatINR(metrics.cost)}/kg`}</b></div>
<div class="card"><small>Recipe</small><b>${escape(short(trial?.name))}</b><small>Revision ${trial?.version ?? "—"}</small></div>
<div class="card"><small>Batch</small><b>${trial ? `${formatNumber(trial.batchKg, trial.batchKg % 1 ? 1 : 0)} kg` : "—"}</b><small>${trial ? `+ ${formatNumber((trial.batchKg * trial.water) / 100)} kg water` : ""}</small></div>
</div>
<h2>Results against targets</h2>
<table><thead><tr><th>Test</th><th>Unit</th><th class="num">Target</th><th class="num">Estimate</th>${prev ? `<th class="num">${escape(short(prev.name))} mean</th>` : ""}<th class="num">${escape(short(trial?.name))} mean</th><th>Result</th></tr></thead><tbody>
${rows.map((r) => `<tr><td>${escape(r.name)}<br><small>${escape(r.priority)} · ${escape(r.condition)}</small></td><td>${escape(r.unit)}</td><td class="num">${escape(r.target)}</td><td class="num">${r.estimate ?? "—"}</td>${prev ? `<td class="num">${escape(r.previous ?? "—")}</td>` : ""}<td class="num"><b>${escape(r.latest)}</b></td><td>${escape(r.status)}</td></tr>`).join("")}
</tbody></table>
<p class="muted">Means of three specimen readings, shown to the precision of the readings. “—” means no data.</p>
${
  trial
    ? `<h2>Where the cost comes from</h2>${metrics?.cost == null ? "<p>Incomplete: an ingredient has no ₹ price.</p>" : lines
        .filter((l) => l.perKg !== null)
        .sort((a, b) => b.perKg! - a.perKg!)
        .map((l) => bar(l.name, l.perKg! / costMax, `${formatINR(l.perKg)}/kg`))
        .join("")}
<h2>Recipe and cost (${escape(short(trial.name))})</h2>
<table><thead><tr><th>Ingredient</th><th class="num">Dry weight (%)</th><th class="num">Mass per batch (kg)</th><th class="num">Price (₹/kg)</th><th class="num">Cost share (₹/kg)</th></tr></thead><tbody>
${lines.map((l) => `<tr><td>${escape(l.name)}</td><td class="num">${formatNumber(l.percent)}</td><td class="num">${formatNumber(l.massKg, 3)}</td><td class="num">${l.price === null ? "Missing" : formatINR(l.price)}</td><td class="num">${l.perKg === null ? "—" : formatINR(l.perKg)}</td></tr>`).join("")}
<tr class="total"><td>Total dry blend</td><td class="num">${formatNumber(metrics?.total)}</td><td class="num">${formatNumber(trial.batchKg, 3)}</td><td></td><td class="num">${metrics?.cost == null ? "Incomplete" : formatINR(metrics.cost)}</td></tr>
</tbody></table>`
    : ""
}
<h2>Open checks before approval</h2>
${checks.length ? `<ul>${checks.map((c) => `<li><b>${escape(c.message)}.</b> ${escape(c.fix)}</li>`).join("")}</ul>` : "<p>None. All checks pass.</p>"}
<h2>Assumptions and limits</h2>
<ul><li>${escape(conversionNote)}</li><li>Material cost per kg = Σ (price × dry weight % ÷ 100). Batch cost = cost per kg × batch kg.</li><li>A target is judged only when the unit, method and conditions match.</li><li>All chemistry, estimates and lab values are illustrative. Standard references are not verified; no compliance is claimed.</li></ul>
<h2>Approval history</h2>
${project.approvals.map((a) => `<p>${escape(a.action)} · ${escape(a.actor)} · ${formatDate(a.date)}<br><small>${escape(a.note)}</small></p>`).join("") || "<p>No review events yet.</p>"}
<h2>Sources</h2>
${project.sources.map((s) => `<p>${escape(s.reference)} — ${escape(s.title)}<br><small>${escape(s.quality)}${s.excluded ? " · excluded" : ""}</small></p>`).join("") || "<p>No sources.</p>"}
<button onclick="window.print()">Print or save as PDF</button>
</body></html>`);
    win.document.close();
  },
};
