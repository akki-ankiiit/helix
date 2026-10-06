import * as XLSX from "xlsx";
import type { Project } from "./model";
import {
  evidenceLabel,
  fmt,
  formatINR,
  planStatus,
  planSummary,
  projectCalc,
  recommendations,
  validationStatus,
} from "./calc";
import { formatDate } from "../lib/format";

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

function verdict(p: Project, testId: string) {
  const t = p.tests.find((x) => x.id === testId)!;
  const entries = p.trials.map((tr) => ({ trial: tr.name.split(" · ")[0], v: tr.results[testId] ?? null })).filter((x) => x.v !== null);
  if (!entries.length) return { result: "Not tested", status: "Not performed" };
  const result = entries.map((x) => `${x.trial}: ${fmt(x.v, 2)}`).join("; ");
  if (t.targetValue === undefined || !t.targetOp) return { result, status: "Result entered" };
  const pass = entries.filter((x) => (t.targetOp === "≥" ? x.v! >= t.targetValue! : x.v! <= t.targetValue!)).map((x) => x.trial);
  return { result, status: pass.length ? `Meets target: ${pass.join(", ")}` : "Below target" };
}

export function reportHtml(p: Project) {
  const calc = projectCalc(p);
  const sum = planSummary(p, calc);
  const status = planStatus(p);
  const recs = recommendations(p, calc);
  const src = (id?: string) => p.sources.find((x) => x.id === id);
  const srcName = (id?: string) => (src(id) ? `${src(id)!.publisher}` : "");
  const groups = (partId: string) => {
    const m = new Map<string, number>();
    p.ingredients.filter((i) => i.partId === partId && i.wtPct !== null).forEach((i) => m.set(i.function, (m.get(i.function) || 0) + i.wtPct!));
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const palette = ["#6d4aff", "#2f8f83", "#c27a1a", "#3f6fb5", "#b4477a", "#7a7f8f", "#5e8f2f", "#a05a2c"];
  const table = (headers: string[], rows: (string | number)[][], numeric: number[] = []) =>
    `<table><thead><tr>${headers.map((h, i) => `<th${numeric.includes(i) ? ' class="num"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td${numeric.includes(i) ? ' class="num"' : ""}>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.id)} · ${esc(p.title)} — Helix formulation report</title>
<style>
body{font:14px/1.55 system-ui,-apple-system,sans-serif;max-width:1000px;margin:32px auto;padding:0 20px;color:#20212b}
h1{font-size:26px;margin:6px 0}h2{font-size:18px;margin:30px 0 10px;border-bottom:1px solid #e5e6ee;padding-bottom:6px}h3{font-size:15px;margin:16px 0 6px}
.muted{color:#5f6270}.box{border:1px solid #e5e6ee;border-radius:8px;padding:14px 16px;margin:12px 0}
.status{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.status div{border:1px solid #e5e6ee;border-radius:8px;padding:8px 10px}.status b{display:block}
table{border-collapse:collapse;width:100%;margin:6px 0 14px;font-size:12.5px}td,th{text-align:left;border-bottom:1px solid #e5e6ee;padding:6px 8px;vertical-align:top}th{color:#5f6270;font-weight:600}
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}tr.total td{font-weight:700;background:#f6f7f9}
.flow{display:flex;flex-wrap:wrap;gap:6px;align-items:stretch}.flow div{flex:1;min-width:150px;border:1px solid #c9c0f5;border-radius:8px;padding:8px}.arrow{align-self:center;color:#6d4aff}
.stack{display:flex;height:18px;border-radius:4px;overflow:hidden;margin:6px 0}.legend span{display:inline-block;margin-right:12px;font-size:12px}
.sw{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:middle}
ul{padding-left:18px}@media print{.noprint{display:none}body{margin:0}}
</style></head><body>
<p class="muted">HELIX · FORMULATION-DEVELOPMENT PLAN · ${esc(p.id)}</p>
<h1>${esc(p.title)}</h1>
<p class="muted">${esc(p.category)} · ${esc(p.task)} · Plan ${p.plan ? `v${p.plan.version} generated ${formatDate(p.plan.generatedAt)}` : "not generated"}</p>
<div class="status"><div><span class="muted">Plan status</span><b>${esc(status)}</b></div><div><span class="muted">Project type</span><b>${p.reference ? "Reference sample" : "User project"}</b></div><div><span class="muted">Experimental validation</span><b>${esc(validationStatus(p))}</b></div></div>
<p class="muted">“Completed” means the development plan is complete. The formulation has not been tested in a laboratory or on site unless results are listed below. No certification, standards compliance or price is claimed.</p>
<div class="box"><strong>${esc(sum.headline)}</strong><p>${esc(sum.explanation)}</p><p><b>Deliverable:</b> ${esc(p.deliverable)}</p></div>
<h2>Project summary</h2>
<div class="flow"><div><b>Objective</b><br>${esc(p.objective)}</div><span class="arrow">→</span><div><b>Selected approach</b><br>${esc(sum.approach?.name)}</div><span class="arrow">→</span><div><b>Formulation</b><br>${p.ingredients.length} ingredients · ${p.parts.length} component(s)${calc.mixRatioText ? ` · ${esc(calc.mixRatioText)}` : ""}</div><span class="arrow">→</span><div><b>Required validation</b><br>${p.tests.length} tests · ${p.trials.length} trials · ${esc(validationStatus(p))}</div></div>
<h2>Application and constraints</h2><p>${esc(p.application)}</p><p><b>Substrates:</b> ${esc(p.substrates.join("; "))}</p><ul>${p.constraints.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Pathway comparison</h2>${table(["Approach", "Intended application", "Advantages", "Constraints", "Evidence", "Recommendation", "Selected"], p.approaches.map((a) => [a.name, a.application, a.advantages, a.constraints, a.sourceIds.map(srcName).join("; "), a.recommendation, a.id === p.selectedApproachId ? "Yes" : ""]))}
<p><b>Rationale:</b> ${esc(p.rationale)}</p>
<h2>Formulation (batch ${fmt(p.batchKg, 2)} kg)</h2>
${calc.mixRatioText ? `<p><b>Mixing ratio:</b> ${esc(calc.mixRatioText)} — ${esc(evidenceLabel[p.mixRatio!.evidence])}. ${esc(p.mixRatio!.note)}</p>` : ""}
${calc.waterKg !== null ? `<p><b>Mixing water:</b> ${fmt(p.water!.pctOfPowder, 1)}% of powder = ${fmt(calc.waterKg, 2)} kg — ${esc(p.water!.note)}</p>` : ""}
${calc.parts.map((part) => `<h3>${esc(part.name)}${p.parts.length > 1 ? ` — ${fmt(part.massKg, 2)} kg (${fmt(part.sharePct, 1)}% of mix)` : ""}</h3>
<table><thead><tr><th>Ingredient</th><th>Function</th><th>Grade or specification</th><th class="num">Composition, wt.%</th><th class="num">Batch quantity</th><th>Unit</th><th>Source or basis</th><th>Review status</th></tr></thead><tbody>
${calc.lines.filter((l) => l.ingredient.partId === part.partId).map((l) => `<tr><td>${esc(l.ingredient.name)}${l.ingredient.activePct != null ? `<br><span class="muted">active ${fmt(l.ingredient.activePct, 1)}% = ${fmt(l.activeKg, 3)} kg</span>` : ""}</td><td>${esc(l.ingredient.function)}</td><td>${esc(l.ingredient.grade)}</td><td class="num">${l.ingredient.wtPct === null ? "Missing" : fmt(l.ingredient.wtPct, 2)}</td><td class="num">${l.qtyKg === null ? "—" : fmt(l.qtyKg, 3)}</td><td>kg</td><td>${esc(l.ingredient.basis)}${l.ingredient.sourceId ? ` (${esc(srcName(l.ingredient.sourceId))})` : ""}</td><td>${esc(l.ingredient.review)}</td></tr>`).join("")}
<tr class="total"><td colspan="3">Total ${esc(part.name)} ${part.balanced ? "(balanced)" : "(NOT balanced)"}</td><td class="num">${fmt(part.total, 2)}</td><td class="num">${fmt((part.massKg * part.total) / 100, 3)}</td><td>kg</td><td colspan="2"></td></tr></tbody></table>
<div class="stack">${groups(part.partId).map(([, v], i) => `<span style="width:${v}%;background:${palette[i % palette.length]}"></span>`).join("")}</div>
<div class="legend">${groups(part.partId).map(([k, v], i) => `<span><i class="sw" style="background:${palette[i % palette.length]}"></i>${esc(k)} ${fmt(v, 2)}%</span>`).join("")}</div>`).join("")}
${calc.epoxy ? `<h3>Resin/hardener calculation</h3><p>EEW ${p.epoxy!.eew[0]}–${p.epoxy!.eew[1]} g/eq (mid ${fmt(calc.epoxy.eewMid, 1)}); AHEW ${p.epoxy!.ahew} g/eq. Stoichiometric phr = ${p.epoxy!.ahew} × 100 ÷ ${fmt(calc.epoxy.eewMid, 1)} = ${fmt(calc.epoxy.stoichPhr, 1)} phr. Supplier use level ${calc.epoxy.supplierPhr} phr (used). Part B per kg Part A required ${fmt(calc.epoxy.requiredBperA, 3)} kg; set ${fmt(calc.epoxy.setBperA, 3)} kg${calc.epoxy.deviationPct !== null ? ` (${fmt(calc.epoxy.deviationPct, 1)}% deviation)` : ""}.</p>` : ""}
${calc.ratios.length ? `<h3>Component ratios</h3>${table(["Ratio", "Value", "Criterion", "Result"], calc.ratios.map((r) => { const d = p.ratioChecks.find((x) => x.id === r.id)!; return [r.label, fmt(r.value, 2), `${d.op} ${d.target}`, r.pass === null ? "—" : r.pass ? "Meets guide" : "Outside guide"]; }), [1])}` : ""}
<h2>Processing conditions</h2>${table(["Stage", "Equipment", "Addition order", "Processing requirement", "Duration, if supported", "Checkpoint", "Source"], p.process.map((x, i) => [`${i + 1}. ${x.stage}`, x.equipment, x.order, x.requirement, x.duration, x.checkpoint, `${evidenceLabel[x.evidence]}${x.sourceId ? ` · ${srcName(x.sourceId)}` : ""}`]))}
<div class="flow">${p.process.map((x, i) => `${i ? '<span class="arrow">→</span>' : ""}<div><b>${i + 1}. ${esc(x.stage)}</b><br><span class="muted">Check: ${esc(x.checkpoint)}</span></div>`).join("")}</div>
${p.timeline.length ? `<h3>${p.category === "Tile cleaner" ? "Use sequence" : "Application and curing timeline"}</h3>${table(["Time", "Step", "Evidence", "Note"], p.timeline.map((t) => [t.time, t.label, `${evidenceLabel[t.evidence]}${t.sourceId ? ` · ${srcName(t.sourceId)}` : ""}`, t.note || ""]))}` : ""}
<h2>Performance-testing matrix</h2>${table(["Property", "Test method or reference", "Target or acceptance criterion", "Test conditions", "Result", "Validation status"], p.tests.map((t) => { const v = verdict(p, t.id); return [t.property, t.method, `${t.target} (${evidenceLabel[t.targetEvidence]}${t.sourceId ? `, ${srcName(t.sourceId)}` : ""})`, t.conditions, v.result, v.status]; }))}
<p class="muted">No standards compliance is claimed; compliance requires testing by an appropriate laboratory.</p>
<h3>Trial batches</h3>${table(["Trial", "Change from plan", "Purpose", ...p.tests.map((t) => t.property)], p.trials.map((tr) => [tr.name, tr.change, tr.purpose, ...p.tests.map((t) => (tr.results[t.id] == null ? "Not tested" : fmt(tr.results[t.id], 2)))]))}
<h2>Cost</h2>${table(["Material", "Quantity (kg)", "Unit rate, ₹/kg", "Estimated cost, ₹", "Price source and date"], [...calc.lines.map((l) => { const pr = p.prices[l.ingredient.id]; return [l.ingredient.name, l.qtyKg === null ? "—" : fmt(l.qtyKg, 3), pr ? formatINR(pr.rate) : "Not estimated", pr && l.qtyKg !== null ? formatINR(pr.rate * l.qtyKg) : "Not estimated", pr ? `${pr.source} · ${pr.date}` : "No pricing evidence"]; }), ["Total", fmt(calc.lines.reduce((a, l) => a + (l.qtyKg ?? 0), 0), 3), "", formatINR(calc.costInr), calc.costInr === null ? "No verified ₹ prices" : "User-entered estimate"]], [1, 2, 3])}
<h2>Recommendations</h2><ol>${recs.map((r) => `<li><b>${esc(r.text)}</b><br>Why: ${esc(r.reason)}<br>Evidence: ${esc(r.sourceId ? src(r.sourceId)?.title : "Calculated from project data")}<br>Uncertainty: ${esc(r.uncertainty)}<br>Next action: ${esc(r.action.label)}</li>`).join("")}</ol>
<h2>Assumptions</h2><ul>${p.assumptions.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<h2>Gaps and missing information</h2><ul>${p.gaps.map((x) => `<li>${esc(x)}</li>`).join("")}${calc.costInr === null ? "<li>Cost not estimated: no verified raw-material prices in ₹.</li>" : ""}<li>Experimental validation: ${esc(validationStatus(p).toLowerCase())}.</li></ul>
<h2>Literature</h2>${table(["Source", "Document type", "Relevant finding", "Applicable product or stage", "Limitations", "Link"], p.literature.filter((l) => l.used).map((l) => [`${src(l.sourceId)?.title} (${src(l.sourceId)?.version})`, src(l.sourceId)?.kind ?? "", l.finding, l.applies, l.limitations, src(l.sourceId)?.url ?? ""]))}
<h2>Sources</h2><ol>${p.sources.filter((x) => x.selected).map((x) => `<li><a href="${esc(x.url)}">${esc(x.title)}</a> — ${esc(x.publisher)}; ${esc(x.kind)}; ${esc(x.version)}; accessed ${esc(x.accessed)}. <span class="muted">Used for: ${esc(x.usedFor)}${x.note ? ` · ${esc(x.note)}` : ""}</span></li>`).join("")}</ol>
<p class="muted">Findings are Helix's own summaries. Finished-product data sheets are benchmarks; their formulations are neither disclosed nor inferred.</p>
<p class="noprint"><button onclick="window.print()">Print or save as PDF</button></p>
</body></html>`;
}

export function downloadReport(p: Project) {
  const blob = new Blob([reportHtml(p)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${p.id}-${p.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-report.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function printReport(p: Project) {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(reportHtml(p));
  win.document.close();
  return true;
}

export function downloadWorkbook(p: Project) {
  const calc = projectCalc(p);
  const sum = planSummary(p, calc);
  const book = XLSX.utils.book_new();
  const add = (name: string, rows: unknown[][]) => XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), name);
  const srcName = (id?: string) => p.sources.find((x) => x.id === id)?.publisher ?? "";
  add("Summary", [
    ["Helix formulation-development plan", p.id],
    ["Title", p.title],
    ["Category", p.category],
    ["Plan status", planStatus(p)],
    ["Project type", p.reference ? "Reference sample" : "User project"],
    ["Experimental validation", validationStatus(p)],
    ["Outcome", sum.headline],
    ["Explanation", sum.explanation],
    ["Batch size (kg)", p.batchKg],
    ["Mixing ratio", calc.mixRatioText ?? "Single component"],
    ["Mixing water (% of powder)", p.water?.pctOfPowder ?? ""],
    ["Cost (INR)", calc.costInr ?? "Not estimated"],
  ]);
  add("Formulation", [
    ["Component", "Ingredient", "Function", "Grade or specification", "Composition wt.%", "Batch quantity (kg)", "Active/solids %", "Source or basis", "Review status", "Evidence"],
    ...calc.lines.map((l) => [p.parts.find((x) => x.id === l.ingredient.partId)?.name, l.ingredient.name, l.ingredient.function, l.ingredient.grade, l.ingredient.wtPct ?? "Missing", l.qtyKg ?? "", l.ingredient.activePct ?? "", `${l.ingredient.basis}${l.ingredient.sourceId ? ` (${srcName(l.ingredient.sourceId)})` : ""}`, l.ingredient.review, evidenceLabel[l.ingredient.evidence]]),
    ...calc.parts.map((x) => [x.name, "TOTAL", "", "", Number(x.total.toFixed(4)), Number(((x.massKg * x.total) / 100).toFixed(4)), "", x.balanced ? "Balanced" : "Not balanced", "", ""]),
  ]);
  add("Approaches", [["Approach", "Intended application", "Advantages", "Constraints", "Evidence", "Recommendation", "Selected"], ...p.approaches.map((a) => [a.name, a.application, a.advantages, a.constraints, a.sourceIds.map(srcName).join("; "), a.recommendation, a.id === p.selectedApproachId ? "Yes" : ""])]);
  add("Process", [["Stage", "Equipment", "Addition order", "Processing requirement", "Duration", "Checkpoint", "Evidence", "Source"], ...p.process.map((x) => [x.stage, x.equipment, x.order, x.requirement, x.duration, x.checkpoint, evidenceLabel[x.evidence], srcName(x.sourceId)])]);
  add("Tests", [["Property", "Method", "Target", "Conditions", "Unit", "Target evidence", "Source", ...p.trials.map((t) => t.name)], ...p.tests.map((t) => [t.property, t.method, t.target, t.conditions, t.unit, evidenceLabel[t.targetEvidence], srcName(t.sourceId), ...p.trials.map((tr) => tr.results[t.id] ?? "Not tested")])]);
  add("Cost", [["Material", "Quantity (kg)", "Unit rate (INR/kg)", "Estimated cost (INR)", "Price source and date"], ...calc.lines.map((l) => { const pr = p.prices[l.ingredient.id]; return [l.ingredient.name, l.qtyKg ?? "", pr?.rate ?? "Not estimated", pr && l.qtyKg !== null ? pr.rate * l.qtyKg : "Not estimated", pr ? `${pr.source} ${pr.date}` : "No pricing evidence"]; })]);
  add("Literature", [["Source", "Document type", "Version", "Finding", "Applies to", "Limitations", "Link"], ...p.literature.filter((l) => l.used).map((l) => { const s = p.sources.find((x) => x.id === l.sourceId); return [s?.title, s?.kind, s?.version, l.finding, l.applies, l.limitations, s?.url]; })]);
  XLSX.writeFile(book, `${p.id}-formulation-plan.xlsx`);
}
