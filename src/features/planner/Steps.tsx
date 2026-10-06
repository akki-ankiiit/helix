import { useState } from "react";
import {
  BookOpen,
  Boxes,
  ClipboardList,
  Combine,
  Droplets,
  ExternalLink,
  FileText,
  FlaskConical,
  Grid2X2,
  Grid3X3,
  Layers,
  Plus,
  Scale,
  ShieldAlert,
  SprayCan,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button, Empty, Field, Notice, s } from "../../components/ui";
import type { Category, Evidence, Project, SourceKind, SourceRef } from "../../planner/model";
import { tasks } from "../../planner/model";
import { categoryFor, formulationTypesFor, subcategoryFor, taxonomy } from "../../planner/families";
import { sourceKinds } from "../../planner/sources";
import { evidenceLabel, type Check } from "../../planner/calc";
import { Editable, LiteratureTable, nid, useEditor } from "./ui";
import c from "./planner.module.css";

interface StepProps {
  p: Project;
  readOnly: boolean;
  checks: Check[];
}

export const categoryIcons: Record<Category, LucideIcon> = {
  "Tile cleaner": SprayCan,
  "Tile adhesive": Layers,
  "Cementitious grout": Grid2X2,
  "Epoxy grout": Grid3X3,
  "Epoxy adhesive": Combine,
  "Waterproofing coating": Droplets,
  "General formulation": Boxes,
};
export const categoryHelp: Record<Category, string> = {
  "Tile cleaner": "Substrate compatibility, cleaning performance, residue, pH",
  "Tile adhesive": "Binder and additives, water demand, workability, adhesion",
  "Cementitious grout": "Workability, colour consistency, cleanability, durability",
  "Epoxy grout": "Resin/hardener ratio, fillers, pot life, cleanability, cure",
  "Epoxy adhesive": "Bond strength, substrate preparation, pot life, cure",
  "Waterproofing coating": "Polymer/cement system, coats, curing, water resistance",
  "General formulation": "No template: define components and tests yourself",
};
export const sourceIcons: Record<SourceKind, LucideIcon> = {
  "Technical data sheet": FileText,
  "Supplier formulation": FlaskConical,
  "Raw-material data sheet": FileText,
  "Safety data sheet": ShieldAlert,
  Standard: Scale,
  "Technical publication": BookOpen,
  "Test data": ClipboardList,
};

const errorFor = (checks: Check[], match: RegExp) => checks.find((x) => match.test(x.message))?.message;

export function TypeStep({ p, readOnly, checks }: StepProps) {
  const edit = useEditor(p);
  const mine = checks.filter((x) => x.step === "type");
  const category = categoryFor(p.categoryId);
  const types = p.subcategoryId ? formulationTypesFor(p.subcategoryId) : [];
  return (
    <Editable readOnly={readOnly}>
      <div className={s.stack}>
        <div className={s.formGrid}>
          <Field label="Product category" required error={errorFor(mine, /category and product family/)}>
            <select value={p.categoryId} onChange={(e) => edit((d) => { d.categoryId = e.target.value; d.subcategoryId = ""; })}>
              <option value="">Choose a category</option>
              {taxonomy.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Field>
          <Field label="Product family" required hint={category ? undefined : "Choose a category first."}>
            <select
              value={p.subcategoryId}
              disabled={!category}
              onChange={(e) => edit((d) => {
                d.subcategoryId = e.target.value;
                const allowed = formulationTypesFor(e.target.value);
                if (!d.category || !allowed.includes(d.category)) d.category = allowed[0];
              })}
            >
              <option value="">Choose a product family</option>
              {category?.subcategories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Field>
        </div>
        {types.length > 0 && (
          <fieldset className={c.typeChoice}>
            <legend>
              Formulation type <span className={s.required}>Required</span>
            </legend>
            <p className={c.helper}>
              Sets the component structure, the checks Helix runs and the suggested tests. Only types that apply to {subcategoryFor(p.subcategoryId)?.name.toLowerCase()} are shown.
            </p>
            <div className={c.typeGrid}>
              {types.map((t) => {
                const Icon = categoryIcons[t];
                const on = p.category === t;
                return (
                  <label key={t} className={`${c.categoryCard} ${on ? c.choiceOn : ""}`}>
                    <input type="radio" name="category" checked={on} onChange={() => edit((d) => { d.category = t; })} />
                    <Icon size={20} aria-hidden="true" className={c.categoryIcon} />
                    <span>
                      <b>{t}</b>
                      <small>{categoryHelp[t]}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            {errorFor(mine, /formulation type/) && <small className={s.error} role="alert">{errorFor(mine, /formulation type/)}</small>}
            {p.ingredients.length > 0 && !readOnly && <small className={s.muted}>Changing the type does not delete existing ingredients; review them in Pathways.</small>}
          </fieldset>
        )}
        <div className={s.formGrid}>
          <Field label="Formulation task" required error={errorFor(mine, /task/)}>
            <select value={p.task} onChange={(e) => edit((d) => { d.task = e.target.value as Project["task"]; })}>
              <option value="">Choose a task</option>
              {tasks.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Project title" required error={errorFor(mine, /title/)} hint="Shown on the project list and the report.">
            <input value={p.title} placeholder="e.g. C2TE adhesive for vitrified tiles" onChange={(e) => edit((d) => { d.title = e.target.value; })} />
          </Field>
          <Field label="Development focus" optional className={s.full} hint="What matters most, e.g. water demand, slip and adhesion.">
            <input value={p.focus} onChange={(e) => edit((d) => { d.focus = e.target.value; })} />
          </Field>
        </div>
      </div>
    </Editable>
  );
}

export function SourcesStep({ p, readOnly, checks }: StepProps) {
  const edit = useEditor(p);
  const [form, setForm] = useState({ title: "", url: "", publisher: "", version: "", kind: "Technical data sheet" as SourceKind, usedFor: "" });
  const [error, setError] = useState("");
  const mine = checks.filter((x) => x.step === "sources");
  function add() {
    if (form.title.trim().length < 3) return setError("Enter the document title.");
    if (!/^https:\/\/[^\s]+\.[^\s]+/.test(form.url.trim())) return setError("Enter a full link starting with https://");
    const src: SourceRef = {
      id: nid("src"),
      kind: form.kind,
      title: form.title.trim(),
      url: form.url.trim(),
      publisher: form.publisher.trim() || new URL(form.url.trim()).hostname,
      version: form.version.trim() || "Not stated",
      accessed: new Date().toISOString().slice(0, 10),
      usedFor: form.usedFor.trim() || "To be described",
      note: form.kind === "Technical data sheet" ? "Finished-product data sheet: describes a commercial product, not its formulation." : undefined,
      selected: true,
    };
    edit((d) => { d.sources.push(src); });
    setForm({ ...form, title: "", url: "", publisher: "", version: "", usedFor: "" });
    setError("");
  }
  const grouped = sourceKinds.map((k) => ({ kind: k, items: p.sources.filter((x) => x.kind === k) })).filter((g) => g.items.length);
  return (
    <div className={s.stack}>
      <p className={c.helper}>
        Select the documents the plan relies on. A <b>technical data sheet</b> describes a finished product and is used only as a benchmark — Helix never infers a manufacturer's recipe from it. <b>Supplier formulations</b> and <b>raw-material data sheets</b> can support composition; <b>standards</b> support test methods and acceptance criteria.
      </p>
      {mine.map((x) => <p key={x.message} className={s.error} role="alert">{x.message}</p>)}
      {!p.sources.length && <Empty title="No data sources yet"><p>Add the technical documents you will use below.</p></Empty>}
      {grouped.map((g) => {
        const Icon = sourceIcons[g.kind];
        return (
          <section key={g.kind}>
            <h4 className={c.groupHeading}><Icon size={15} aria-hidden="true" /> {g.kind} ({g.items.length})</h4>
            <ul className={c.sourceCards}>
              {g.items.map((src) => (
                <li key={src.id} className={src.selected ? c.sourceOn : ""}>
                  <label className={c.sourceCheck}>
                    <input type="checkbox" checked={src.selected} disabled={readOnly} onChange={(e) => edit((d) => { d.sources.find((x) => x.id === src.id)!.selected = e.target.checked; })} />
                    <span className={s.srOnly}>Use {src.title}</span>
                  </label>
                  <div>
                    <a href={src.url} target="_blank" rel="noreferrer" className={c.sourceTitle}>
                      {src.title} <ExternalLink size={12} aria-label="(opens in a new tab)" />
                    </a>
                    <small>{src.publisher} · {src.version} · accessed {src.accessed}</small>
                    <small>Used for: {src.usedFor}</small>
                    {src.note && <small className={c.sourceNote}>{src.note}</small>}
                  </div>
                  {!readOnly && (
                    <Button small variant="ghost" aria-label={`Remove ${src.title}`} title="Remove source" onClick={() => edit((d) => {
                      d.sources = d.sources.filter((x) => x.id !== src.id);
                      d.literature = d.literature.filter((l) => l.sourceId !== src.id);
                    })}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {!readOnly && (
        <fieldset className={c.addBox}>
          <legend>Add a data source</legend>
          <div className={s.formGrid}>
            <Field label="Document type" required>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as SourceKind })}>
                {sourceKinds.map((k) => <option key={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Title" required>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Redispersible powder TDS" />
            </Field>
            <Field label="Link" required hint="Must start with https://">
              <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
            </Field>
            <Field label="Version or date" optional>
              <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="e.g. Rev 03, 2025" />
            </Field>
            <Field label="Publisher" optional>
              <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
            </Field>
            <Field label="What it supports" optional>
              <input value={form.usedFor} onChange={(e) => setForm({ ...form, usedFor: e.target.value })} placeholder="e.g. dosage range and solids content" />
            </Field>
          </div>
          {error && <p className={s.error} role="alert">{error}</p>}
          <Button style={{ marginTop: 12 }} onClick={add}>
            <Plus size={14} aria-hidden="true" /> Add source
          </Button>
        </fieldset>
      )}
    </div>
  );
}

function ListEditor({ label, items, onChange, readOnly, noun, required = false, error }: { label: string; items: string[]; onChange: (v: string[]) => void; readOnly: boolean; noun: string; required?: boolean; error?: string }) {
  return (
    <fieldset className={c.listEditor}>
      <legend>
        {label} {required ? <span className={s.required}>Required</span> : <span className={s.optional}>Optional</span>}
      </legend>
      {items.length === 0 && <p className={s.muted}>None yet.</p>}
      {items.map((item, i) => (
        <div key={i} className={c.listRow}>
          {readOnly ? <p>{item}</p> : (
            <>
              <input aria-label={`${label} ${i + 1}`} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
              <Button small variant="ghost" aria-label={`Remove ${noun} ${i + 1}`} title={`Remove ${noun}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      ))}
      {error && <small className={s.error} role="alert">{error}</small>}
      {!readOnly && (
        <Button small onClick={() => onChange([...items, ""])}>
          <Plus size={13} aria-hidden="true" /> Add {noun}
        </Button>
      )}
    </fieldset>
  );
}

export function DescribeStep({ p, readOnly, checks }: StepProps) {
  const edit = useEditor(p);
  const mine = checks.filter((x) => x.step === "describe");
  return (
    <div className={s.stack}>
      <Editable readOnly={readOnly}>
        <div className={s.formGrid}>
          <Field label="Objective" required className={s.full} error={errorFor(mine, /objective/)} hint="What should the formulation achieve? Include the performance class or target if known.">
            <textarea rows={3} value={p.objective} onChange={(e) => edit((d) => { d.objective = e.target.value; })} />
          </Field>
          <Field label="Application" required className={s.full} error={errorFor(mine, /applied/)} hint="Where and how the product is used.">
            <textarea rows={2} value={p.application} onChange={(e) => edit((d) => { d.application = e.target.value; })} />
          </Field>
          <Field
            label="Batch size"
            unit="kg"
            required
            error={errorFor(mine, /batch/)}
            hint={p.parts.length > 1 ? "Total mixed product. Each component's share follows the mixing ratio." : "Batch quantities recalculate when you change this."}
          >
            <input type="number" min="0.1" step="any" inputMode="decimal" value={p.batchKg || ""} onChange={(e) => edit((d) => { d.batchKg = Number(e.target.value); })} />
          </Field>
        </div>
      </Editable>
      <ListEditor label="Substrates and surfaces" noun="substrate" required items={p.substrates} readOnly={readOnly} error={errorFor(mine, /substrate/)} onChange={(v) => edit((d) => { d.substrates = v; })} />
      <ListEditor label="Constraints" noun="constraint" items={p.constraints} readOnly={readOnly} onChange={(v) => edit((d) => { d.constraints = v; })} />
      <p className={c.helper}>Performance targets are defined as acceptance criteria in Pathways › Structuring experiment, so each target is tied to a test method.</p>
    </div>
  );
}

const evidenceOptions: Evidence[] = ["source", "calculated", "illustrative", "not-reported"];

export function LiteratureStep({ p, readOnly, checks }: StepProps) {
  const edit = useEditor(p);
  const selected = p.sources.filter((x) => x.selected);
  const mine = checks.filter((x) => x.step === "literature");
  return (
    <div className={s.stack}>
      <p className={c.helper}>
        Record what each source says, which product or stage it applies to, and its limitations. Only records marked “Used in plan” appear in the report.
      </p>
      {mine.map((x) => <p key={x.message} className={s.error} role="alert">{x.message}</p>)}
      <LiteratureTable p={p} />
      {!readOnly && (
        <section className={s.stack}>
          <h4 className={c.groupHeading}>Edit records</h4>
          {p.literature.map((rec, i) => {
            const set = (fn: (r: Project["literature"][number]) => void) => edit((d) => fn(d.literature.find((x) => x.id === rec.id)!));
            return (
              <article key={rec.id} className={c.litCard}>
                <div className={s.formGrid}>
                  <Field label={`Record ${i + 1}: source`}>
                    <select value={rec.sourceId} onChange={(e) => set((r) => { r.sourceId = e.target.value; })}>
                      {selected.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                      {!selected.some((x) => x.id === rec.sourceId) && <option value={rec.sourceId}>Source not selected</option>}
                    </select>
                  </Field>
                  <Field label="Evidence type">
                    <select value={rec.evidence} onChange={(e) => set((r) => { r.evidence = e.target.value as Evidence; })}>
                      {evidenceOptions.map((o) => <option key={o} value={o}>{evidenceLabel[o]}</option>)}
                    </select>
                  </Field>
                  <Field label="Relevant finding" className={s.full}>
                    <textarea rows={2} value={rec.finding} onChange={(e) => set((r) => { r.finding = e.target.value; })} />
                  </Field>
                  <Field label="Applicable product or stage">
                    <input value={rec.applies} onChange={(e) => set((r) => { r.applies = e.target.value; })} />
                  </Field>
                  <Field label="Limitations">
                    <input value={rec.limitations} onChange={(e) => set((r) => { r.limitations = e.target.value; })} />
                  </Field>
                </div>
                <div className={s.row}>
                  <label className={s.check}>
                    <input type="checkbox" checked={rec.used} onChange={(e) => set((r) => { r.used = e.target.checked; })} /> Used in plan
                  </label>
                  <Button small variant="ghost" onClick={() => edit((d) => { d.literature = d.literature.filter((x) => x.id !== rec.id); })}>
                    <Trash2 size={13} aria-hidden="true" /> Remove record
                  </Button>
                </div>
              </article>
            );
          })}
          <div>
            <Button disabled={!selected.length} onClick={() => edit((d) => {
              d.literature.push({ id: nid("lit"), sourceId: selected[0].id, finding: "", applies: "", limitations: "", evidence: "source", used: true });
            })}>
              <Plus size={14} aria-hidden="true" /> Add literature record
            </Button>
            {!selected.length && <Notice warning>Select at least one source in Data Sources before adding records.</Notice>}
          </div>
        </section>
      )}
    </div>
  );
}
