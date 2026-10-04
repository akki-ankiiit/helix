import * as XLSX from "xlsx";
import type { Project } from "../../domain/models";
import type { ReportService } from "../contracts";
import { propertyFor } from "../../data/property-library";
import { evaluate, recipeMetrics } from "../../domain/calculations";
import { useWorkspace } from "../../stores/workspace";
const escape = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const reports: ReportService = {
  workbook(project) {
    const book = XLSX.utils.book_new();
    const rows = [
      ["HELIX · ILLUSTRATIVE DEMO · R&D REVIEW REQUIRED"],
      ["Project", project.brief.name],
      ["Brief revision", project.revisions.length],
      ["Composition basis", "Dry blend; application water separate"],
      ["Cost currency", project.brief.constraints.currency],
      [],
      [
        "Property",
        "Unit",
        "Method",
        "Condition",
        "Operator",
        "Target",
        "Upper",
        "Priority",
      ],
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
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Brief");
    const materials = useWorkspace.getState().materials;
    for (const trial of project.trials) {
      const metrics = recipeMetrics(trial, materials);
      const sheet = [
        ["Trial", trial.name],
        ["Revision", trial.version],
        ["Basis", trial.basis],
        ["Batch kg", trial.batchKg],
        ["Application water % of dry blend", trial.water],
        ["Estimated cost per kg", metrics.cost ?? "Incomplete"],
        [],
        ["Material", "Dry wt %", "Mass kg", "Price USD/kg", "Price date"],
        ...Object.entries(trial.percentages).map(([id, pct]) => {
          const m = (trial.materialsSnapshot || materials).find(
            (m) => m.id === id,
          );
          return [
            m?.name || id,
            pct,
            metrics.masses[id],
            m?.price ?? "Missing",
            m?.priceDate,
          ];
        }),
      ];
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet(sheet),
        `Trial ${trial.version}-${trial.id.slice(-4)}`.slice(0, 31),
      );
    }
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        project.results.map((r) => ({
          Trial: r.trialId,
          Property: propertyFor(r.propertyId).name,
          Unit: r.unit,
          Method: r.method,
          Condition: r.condition,
          Specimen1: r.readings[0] ?? "",
          Specimen2: r.readings[1] ?? "",
          Specimen3: r.readings[2] ?? "",
          Date: r.date,
          Operator: r.operator,
          Reviewed: r.reviewed,
          Provenance: "Illustrative demo result",
        })),
      ),
      "Results",
    );
    const latest = project.trials.at(-1);
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        project.brief.targets.map((target) => {
          const assessment = evaluate(
            target,
            project.results.find(
              (result) =>
                result.trialId === latest?.id &&
                result.propertyId === target.propertyId,
            ),
          );
          return {
            Project: project.brief.name,
            BriefRevision: project.revisions.length,
            Trial: latest?.name || "None",
            Property: propertyFor(target.propertyId).name,
            Unit: target.unit,
            Method: target.method,
            Condition: target.condition,
            Operator: target.operator,
            Target: target.value,
            Upper: target.max,
            PredictedEstimate:
              project.pathways.find(
                (pathway) => pathway.id === project.selectedPathway,
              )?.predictions[target.propertyId] ?? "Insufficient data",
            MeasuredMean: assessment.mean ?? "Pending",
            Difference: assessment.difference ?? "",
            Evaluation: assessment.status,
            Label: "Illustrative demo · not scientific validation",
          };
        }),
      ),
      "Analysis",
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
          EvidenceQuality: source.quality,
          Excluded: source.excluded,
        })),
      ),
      "Sources",
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        project.approvals.map((approval) => ({
          Action: approval.action,
          Actor: approval.actor,
          Date: approval.date,
          RecipeRevision: approval.recipeId,
          BriefVersion: approval.briefVersion || 1,
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
        .notify("Allow pop-ups to open the print-to-PDF report.");
      return;
    }
    const trial = project.trials.at(-1);
    win.document.write(
      `<html><head><title>Helix dossier — ${escape(project.brief.name)}</title><style>body{font:14px system-ui;max-width:1000px;margin:48px;color:#17191f}h1{font-size:28px}table{border-collapse:collapse;width:100%;margin:24px 0}td,th{text-align:left;border:1px solid #ddd;padding:10px}small{color:#666}@media print{button{display:none}}</style></head><body><small>HELIX / MATERIALS R&D</small><h1>${escape(project.brief.name)}</h1><p>Illustrative demo dossier · not scientific validation · R&D review required</p><p>Brief v${project.revisions.length} · Owner: ${escape(project.owner)} · Exported ${new Date().toLocaleDateString()}</p><p>${escape(project.brief.description)}</p><h2>Targets and latest trial results</h2><table><tr><th>Property</th><th>Target</th><th>Measured fixture</th><th>Status</th></tr>${project.brief.targets
        .map((t) => {
          const e = evaluate(
            t,
            project.results.find(
              (r) => r.trialId === trial?.id && r.propertyId === t.propertyId,
            ),
          );
          return `<tr><td>${escape(propertyFor(t.propertyId).name)}<br><small>${escape(t.method)} / ${escape(t.condition)}</small></td><td>${escape(t.operator)} ${escape(t.value)} ${escape(t.unit)}</td><td>${e.mean === null ? "Pending" : e.mean.toFixed(2)}</td><td>${e.status}</td></tr>`;
        })
        .join(
          "",
        )}</table><h2>Recipe revision ${trial?.version || "—"}</h2><p>Dry-blend basis; batch ${trial?.batchKg || "—"} kg; application water ${trial?.water || "—"}% of dry mass, separate.</p><table>${
        trial
          ? Object.entries(trial.percentages)
              .map(
                ([id, pct]) =>
                  `<tr><td>${escape(useWorkspace.getState().materials.find((m) => m.id === id)?.name || id)}</td><td>${pct.toFixed(2)} wt %</td><td>${((trial.batchKg * pct) / 100).toFixed(3)} kg</td></tr>`,
              )
              .join("")
          : ""
      }</table><h2>Limitations and approval history</h2><p>All chemistry, estimates, and laboratory values are illustrative. Standard references are unverified; no compliance is claimed. Prices are fixture estimates dated September 2026.</p>${project.approvals.map((a) => `<p>${escape(a.action)} · ${escape(a.actor)} · ${escape(a.date)}<br>${escape(a.note)}</p>`).join("")}<h2>Sources</h2>${project.sources.map((s) => `<p>${escape(s.reference)} — ${escape(s.title)}<br>${escape(s.quality)}</p>`).join("")}<button onclick="window.print()">Print / Save as PDF</button></body></html>`,
    );
    win.document.close();
  },
};
