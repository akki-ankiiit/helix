import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Sparkles,
  Boxes,
  BrickWall,
  Droplets,
  Grid2X2,
  ShieldCheck,
  Pencil,
  AlertCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Empty,
  Field,
  Modal,
  Notice,
  Saved,
  SearchBox,
  Stepper,
  s,
} from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import {
  categoryFor,
  examples,
  subcategoryFor,
  taxonomy,
} from "../../data/taxonomy";
import {
  defaultTargets,
  propertyFor,
  templateFor,
} from "../../data/property-library";
import {
  intakeSteps,
  normaliseIntakeStep,
  type IntakeStep,
} from "../../data/intake-steps";
import { formatINR } from "../../lib/format";
import type { Brief, Constraint } from "../../domain/models";
import { TargetEditor, targetErrors } from "./TargetEditor";
import { BenchmarkPicker } from "../benchmarks/BenchmarkPicker";
import c from "./Intake.module.css";

const icons = { Boxes, BrickWall, Droplets, Grid2X2, ShieldCheck, Sparkles };

const list = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** A one-sentence, plain description of the application. */
export function useCaseSummary(brief: Brief) {
  const u = brief.useCase;
  const family = subcategoryFor(brief.subcategoryId)?.name;
  if (!family) return "Choose a product to see a summary.";
  const priorities = brief.objectives
    .filter(Boolean)
    .map((id) => propertyFor(id)?.plain.toLowerCase())
    .filter(Boolean) as string[];
  const tail = priorities.length
    ? ` Top priorities: ${list(priorities)}.`
    : "";
  if (brief.subcategoryId === "concrete-3")
    return `${family}, dosed by ${u.method?.toLowerCase() || "a method to be confirmed"}${u.climate ? ` in ${u.climate.toLowerCase()} conditions` : ""}, for use between ${u.temperatureMin || "—"} °C and ${u.temperatureMax || "—"} °C.${tail}`;
  const where = [
    u.environment?.toLowerCase(),
    u.surface ? `${u.surface.toLowerCase()}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${family}${where ? ` for ${where} use` : ""}${u.substrate ? ` on ${u.substrate.toLowerCase()}` : ""}${u.material ? `, with ${u.material.toLowerCase()} tiles${u.dimensions ? ` (${u.dimensions})` : ""}` : ""}.${tail}`;
}

function stepErrors(step: IntakeStep, brief: Brief): string[] {
  switch (step) {
    case "product":
      return [
        ...(!brief.categoryId ? ["Choose a product category."] : []),
        ...(brief.categoryId && !brief.subcategoryId
          ? ["Choose a product family."]
          : []),
      ];
    case "application": {
      const e: string[] = [];
      if (brief.name.trim().length < 3)
        e.push("Enter a project name of at least 3 characters.");
      const min = brief.useCase.temperatureMin,
        max = brief.useCase.temperatureMax;
      if (min && max && Number(min) > Number(max))
        e.push("The minimum temperature must not be higher than the maximum.");
      return e;
    }
    case "targets":
      return targetErrors(brief);
    case "constraints":
      return brief.constraints.required.trim() &&
        brief.constraints.required.trim().toLowerCase() ===
          brief.constraints.excluded.trim().toLowerCase()
        ? ["The same item is both required and excluded. Remove it from one list."]
        : [];
    default:
      return [];
  }
}

export function Intake() {
  const state = useWorkspace(),
    navigate = useNavigate(),
    location = useLocation(),
    [params] = useSearchParams(),
    { step: rawStep } = useParams();
  const brief = state.draft,
    plain = state.user?.mode === "Non-scientist";
  const step = normaliseIntakeStep(
    rawStep === "brief" ? params.get("section") || "benchmarks" : rawStep,
  );
  const index = intakeSteps.findIndex((x) => x.id === step);
  const [attempted, setAttempted] = useState<Record<string, boolean>>({});
  const [starting, setStarting] = useState(false);
  const startedRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const setBrief = state.setDraft;

  useEffect(() => {
    state.setStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Old links (/projects/new/category, /brief?section=targets…) keep working.
  if (rawStep !== step)
    return <Navigate replace to={`/projects/new/${step}`} state={location.state} />;

  const errors = Object.fromEntries(
    intakeSteps.map((x) => [x.id, stepErrors(x.id, brief)]),
  ) as Record<IntakeStep, string[]>;
  const firstBlocked = intakeSteps.findIndex(
    (x, i) => i < index && errors[x.id].length > 0,
  );
  const blockedBy = firstBlocked >= 0 ? intakeSteps[firstBlocked] : null;
  const current = intakeSteps[index];
  const next = intakeSteps[index + 1];
  const prev = intakeSteps[index - 1];
  const showErrors = attempted[step] && errors[step].length > 0;

  function go(id: string) {
    navigate(`/projects/new/${id}`);
  }
  function continueOn() {
    if (errors[step].length) {
      setAttempted({ ...attempted, [step]: true });
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (next) go(next.id);
  }
  function start() {
    if (startedRef.current) return;
    const missing = intakeSteps.filter((x) => errors[x.id].length);
    if (missing.length) return;
    startedRef.current = true;
    setStarting(true);
    const id = state.createProject();
    navigate(`/projects/${id}?stage=Literature`, { replace: true });
  }

  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={c.phase}>Step 1 of the procedure · Ask</div>
          <h1>New project</h1>
          <p>Describe what the material must do. Your answers save as you go.</p>
        </div>
        <Saved />
      </div>
      <Stepper
        label="New project steps"
        onSelect={go}
        steps={intakeSteps.map((x, i) => {
          const blocker = intakeSteps.find(
            (y, j) => j < i && !y.optional && errors[y.id].length > 0,
          );
          return {
            id: x.id,
            number: i + 1,
            name: x.name,
            detail: x.optional ? "Optional" : undefined,
            current: x.id === step,
            state:
              x.id === step
                ? "current"
                : blocker
                  ? "locked"
                  : i < index && errors[x.id].length === 0
                    ? "complete"
                    : attempted[x.id] && errors[x.id].length
                      ? "attention"
                      : "upcoming",
            disabledReason: blocker ? `Complete ${blocker.name} first.` : undefined,
          };
        })}
      />
      <div className={c.layout}>
        <section className={s.panel} aria-labelledby="step-title">
          <div className={c.sectionTitle}>
            <h2 id="step-title">
              {index + 1}. {current.name}
              {current.optional && (
                <span className={c.optionalTag}>Optional</span>
              )}
            </h2>
            <p>{current.purpose}</p>
          </div>
          {blockedBy && step !== "product" ? (
            <div className={c.gate}>
              <AlertCircle size={22} aria-hidden="true" />
              <h3>Finish “{blockedBy.name}” first</h3>
              <p>{errors[blockedBy.id][0]}</p>
              <Button variant="primary" onClick={() => go(blockedBy.id)}>
                Go to {blockedBy.name}
              </Button>
            </div>
          ) : (
            <>
              {showErrors && (
                <div
                  className={c.errorSummary}
                  role="alert"
                  tabIndex={-1}
                  ref={errorRef}
                >
                  <b>Fix the following to continue:</b>
                  <ul>
                    {errors[step].map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {step === "product" && <ProductStep />}
              {step === "application" && (
                <UseCase
                  brief={brief}
                  onChange={setBrief}
                  plain={plain}
                  showErrors={!!attempted.application}
                />
              )}
              {step === "benchmarks" && (
                <>
                  <p className={c.helper}>
                    {plain
                      ? "Which product do you use now, or want to match? Its published values appear next to your targets."
                      : "Benchmark values appear next to each target so you can compare. Published claims are not the same as lab-measured results."}
                  </p>
                  <BenchmarkPicker
                    selected={brief.benchmarkIds}
                    onChange={(benchmarkIds) => setBrief({ benchmarkIds })}
                  />
                </>
              )}
              {step === "targets" && (
                <TargetEditor
                  brief={brief}
                  onChange={setBrief}
                  showErrors={!!attempted.targets}
                />
              )}
              {step === "constraints" && (
                <Constraints brief={brief} onChange={setBrief} plain={plain} />
              )}
              {step === "review" && (
                <ReviewBrief brief={brief} errors={errors} edit={go} />
              )}
            </>
          )}
          <div className={s.stepFooter}>
            <Button
              variant="ghost"
              onClick={() => (prev ? go(prev.id) : navigate("/projects"))}
            >
              <ArrowLeft size={14} />
              {prev ? `Back to ${prev.name}` : "Back to projects"}
            </Button>
            {step === "review" ? (
              <Button
                variant="primary"
                disabled={
                  starting || intakeSteps.some((x) => errors[x.id].length)
                }
                aria-busy={starting}
                onClick={start}
              >
                {starting ? "Starting…" : "Start project"}
                <ArrowRight size={14} />
              </Button>
            ) : (
              !(blockedBy && step !== "product") && (
                <Button variant="primary" onClick={continueOn}>
                  Continue to {next?.name}
                  <ArrowRight size={14} />
                </Button>
              )
            )}
          </div>
        </section>
        <BriefPreview brief={brief} />
      </div>
    </>
  );
}

function ProductStep() {
  const state = useWorkspace();
  const brief = state.draft;
  const setBrief = state.setDraft;
  const [query, setQuery] = useState(""),
    [chem, setChem] = useState("All chemistries"),
    [form, setForm] = useState("All forms"),
    [pendingCategory, setPendingCategory] = useState("");
  const category = categoryFor(brief.categoryId);
  function changeCategory(id: string) {
    setChem("All chemistries");
    setForm("All forms");
    setBrief({
      categoryId: id,
      subcategoryId: "",
      targets: [],
      objectives: [],
      useCase: Object.fromEntries(
        Object.entries(brief.useCase).filter(
          ([k]) =>
            !["material", "dimensions", "grout", "reopen", "standard"].includes(k),
        ),
      ),
    });
    setPendingCategory("");
  }
  const families =
    category?.subcategories.filter(
      (sub) =>
        sub.name.toLowerCase().includes(query.toLowerCase()) &&
        (chem === "All chemistries" || sub.chemistry === chem) &&
        (form === "All forms" || sub.form === form),
    ) || [];
  return (
    <div className={s.stack}>
      <fieldset className={c.fieldset}>
        <legend>
          Category <span className={s.required}>Required</span>
        </legend>
        <div className={c.categoryGrid} role="radiogroup" aria-label="Category">
          {taxonomy.map((cat) => {
            const Icon = icons[cat.icon as keyof typeof icons];
            const selected = brief.categoryId === cat.id;
            return (
              <button
                key={cat.id}
                role="radio"
                aria-checked={selected}
                className={`${c.categoryCard} ${selected ? c.selected : ""}`}
                onClick={() => {
                  if (selected) return;
                  if (brief.subcategoryId) setPendingCategory(cat.id);
                  else changeCategory(cat.id);
                }}
              >
                <span className={c.icon}>
                  <Icon size={18} strokeWidth={1.6} />
                </span>
                <span>
                  <b>{cat.name}</b>
                  <small>{cat.description}</small>
                </span>
                {selected && <Check size={14} className={c.tick} />}
              </button>
            );
          })}
        </div>
      </fieldset>
      {category ? (
        <fieldset className={c.fieldset}>
          <legend>
            Product family in {category.name}{" "}
            <span className={s.required}>Required</span>
          </legend>
          <div className={c.filterRow}>
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Search product families"
            />
            <select
              aria-label="Chemistry filter"
              value={chem}
              onChange={(e) => setChem(e.target.value)}
            >
              {[
                "All chemistries",
                ...new Set(category.subcategories.map((x) => x.chemistry)),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              aria-label="Physical form filter"
              value={form}
              onChange={(e) => setForm(e.target.value)}
            >
              {[
                "All forms",
                ...new Set(category.subcategories.map((x) => x.form)),
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className={c.subList} role="radiogroup" aria-label="Subcategory">
            {families.map((sub) => (
              <button
                key={sub.id}
                role="radio"
                aria-checked={brief.subcategoryId === sub.id}
                className={`${c.subCard} ${brief.subcategoryId === sub.id ? c.selected : ""}`}
                onClick={() =>
                  brief.subcategoryId !== sub.id &&
                  setBrief({
                    subcategoryId: sub.id,
                    targets: defaultTargets(sub.id),
                    objectives: [],
                  })
                }
              >
                <span className={c.radio}>
                  {brief.subcategoryId === sub.id && <Check size={10} />}
                </span>
                <b>{sub.name}</b>
                <small>
                  {sub.chemistry} · {sub.form}
                </small>
                {examples[sub.id] && <small>{examples[sub.id]}</small>}
              </button>
            ))}
          </div>
          {!families.length && (
            <Empty title="No product families match these filters">
              <Button
                small
                onClick={() => {
                  setQuery("");
                  setChem("All chemistries");
                  setForm("All forms");
                }}
              >
                Clear filters
              </Button>
            </Empty>
          )}
          {brief.subcategoryId && (
            <Notice>
              Helix loaded {templateFor(brief.subcategoryId).propertyIds.length}{" "}
              suggested targets for this family. You can change them in step 4.
              They are a draft and need R&amp;D confirmation.
            </Notice>
          )}
        </fieldset>
      ) : (
        <p className={c.helper}>Choose a category to see its product families.</p>
      )}
      {pendingCategory && (
        <Modal
          title="Change product category?"
          onClose={() => setPendingCategory("")}
        >
          <p className={s.muted}>
            This clears the product family, its targets and ranked priorities,
            and product-specific application details. Your project name,
            benchmarks and constraints are kept.
          </p>
          <div className={s.modalActions}>
            <Button onClick={() => setPendingCategory("")}>Keep category</Button>
            <Button
              variant="primary"
              onClick={() => changeCategory(pendingCategory)}
            >
              Change category
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function UseCase({
  brief,
  onChange,
  plain,
  showErrors = false,
}: {
  brief: Brief;
  onChange: (p: Partial<Brief>) => void;
  plain: boolean;
  showErrors?: boolean;
}) {
  const u = brief.useCase;
  const tile = ["tile-0", "tile-1", "tile-2", "tile-3"].includes(
      brief.subcategoryId,
    ),
    industrial = brief.subcategoryId === "concrete-3",
    fresh = brief.categoryId === "concrete";
  const set = (key: string, value: string) =>
    onChange({ useCase: { ...u, [key]: value } });
  const select = (key: string, label: string, options: string[]) => (
    <Field key={key} label={label} optional>
      <select value={u[key] || ""} onChange={(e) => set(key, e.target.value)}>
        <option value="">Not specified</option>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </Field>
  );
  const tempError =
    showErrors &&
    u.temperatureMin &&
    u.temperatureMax &&
    Number(u.temperatureMin) > Number(u.temperatureMax)
      ? "Must not be higher than the maximum."
      : undefined;
  return (
    <div className={s.stack}>
      <fieldset className={c.fieldset}>
        <legend>Project</legend>
        <div className={s.formGrid}>
          <Field
            label="Project name"
            className={s.full}
            required
            hint="At least 3 characters. Shown on reports."
            error={
              showErrors && brief.name.trim().length < 3
                ? "Enter a project name of at least 3 characters."
                : undefined
            }
          >
            <input
              value={brief.name}
              placeholder="e.g. Exterior large-format tile adhesive"
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </Field>
          <Field label="Short description" className={s.full} optional>
            <textarea
              value={brief.description}
              placeholder="What should this product make possible?"
              onChange={(e) => onChange({ description: e.target.value })}
              rows={2}
            />
          </Field>
        </div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend>Where it is used</legend>
        <div className={s.formGrid}>
          {!industrial &&
            select(
              "environment",
              plain ? "Indoors or outdoors?" : "Application environment",
              ["Interior", "Exterior"],
            )}
          {!industrial &&
            !fresh &&
            select(
              "surface",
              plain ? "What kind of surface?" : "Application surface",
              ["Wall", "Floor", "Facade", "Wet area", "Submerged"],
            )}
          {!industrial &&
            select(
              "substrate",
              plain ? "What is it applied to?" : "Substrate (the base surface)",
              ["Concrete", "Cement render", "Masonry", "Gypsum", "Existing tile", "Steel"],
            )}
          {select(
            "climate",
            plain ? "What will it be exposed to?" : "Climate and exposure",
            [
              "Temperate",
              "Hot and dry",
              "Hot and humid",
              "Freeze-thaw exposure",
              "Continuous water exposure",
              "Industrial indoor",
            ],
          )}
          <Field
            label="Lowest application temperature"
            unit="°C"
            optional
            error={tempError}
          >
            <input
              type="number"
              inputMode="decimal"
              value={u.temperatureMin || ""}
              onChange={(e) => set("temperatureMin", e.target.value)}
            />
          </Field>
          <Field label="Highest application temperature" unit="°C" optional>
            <input
              type="number"
              inputMode="decimal"
              value={u.temperatureMax || ""}
              onChange={(e) => set("temperatureMax", e.target.value)}
            />
          </Field>
          {tile && (
            <>
              {select("material", "Tile or stone type", [
                "Porcelain",
                "Ceramic",
                "Natural stone",
                "Concrete",
              ])}
              <Field label="Tile size" optional hint="For example: 600 × 1200 mm">
                <input
                  value={u.dimensions || ""}
                  onChange={(e) => set("dimensions", e.target.value)}
                />
              </Field>
            </>
          )}
          {!industrial &&
            select("traffic", plain ? "How much foot or vehicle traffic?" : "Load and traffic", [
              "Light pedestrian",
              "Heavy pedestrian",
              "Vehicular",
              "Static load",
              "Not applicable",
            ])}
        </div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend>How and how fast it is applied</legend>
        <div className={s.formGrid}>
          {select(
            "method",
            "Application method",
            industrial
              ? ["Metered dosing", "Mill feed injection"]
              : fresh
                ? ["Batch dosing", "Site addition", "Spray"]
                : ["Trowel", "Roller", "Brush", "Spray", "Pour", "Injection"],
          )}
          {select(
            "speed",
            plain ? "How quickly must it work?" : "Setting speed",
            ["Standard set", "Rapid set", "Extended working time"],
          )}
          {tile && (
            <>
              {select("grout", "Time before grouting", ["4 h", "12 h", "24 h", "48 h"])}
              {select(
                "reopen",
                plain ? "When can people walk on it?" : "Time before traffic",
                ["12 h", "24 h", "48 h", "72 h"],
              )}
            </>
          )}
          {!plain && templateFor(brief.subcategoryId).standard && (
            <Field
              label="Standard or classification"
              optional
              hint="For reference only. Helix does not check compliance."
            >
              <select
                value={u.standard || ""}
                onChange={(e) => set("standard", e.target.value)}
              >
                <option value="">To be confirmed by R&amp;D</option>
                <option>EN 12004-1 · class not verified</option>
              </select>
            </Field>
          )}
          <Field label="Notes for the R&D team" className={s.full} optional>
            <textarea
              value={u.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything else they should know?"
              rows={2}
            />
          </Field>
        </div>
      </fieldset>
      <div className={c.summary}>
        <span>Your application in one sentence</span>
        <p>{useCaseSummary(brief)}</p>
      </div>
    </div>
  );
}

export function Constraints({
  brief,
  onChange,
  plain,
}: {
  brief: Brief;
  onChange: (p: Partial<Brief>) => void;
  plain: boolean;
}) {
  const x = brief.constraints;
  const set = (key: keyof Constraint, value: string) =>
    onChange({ constraints: { ...x, [key]: value } });
  const area = (key: keyof Constraint, label: string, hint?: string) => (
    <Field key={key} label={label} optional hint={hint}>
      <textarea
        value={x[key]}
        onChange={(e) => set(key, e.target.value)}
        rows={2}
      />
    </Field>
  );
  const conflict =
    x.required.trim() &&
    x.required.trim().toLowerCase() === x.excluded.trim().toLowerCase();
  return (
    <div className={s.stack}>
      <p className={c.helper}>
        <b>Hard limits</b> must be met; Helix checks them automatically on every
        trial. <b>Preferences</b> guide choices but do not block approval.
      </p>
      <fieldset className={c.fieldset}>
        <legend>Hard limits</legend>
        <div className={s.formGrid}>
          {plain ? (
            <Field
              label="Budget band"
              optional
              hint="A band is not converted into an exact ₹ limit."
            >
              <select
                value={x.budget}
                onChange={(e) => set("budget", e.target.value)}
              >
                {["Economy", "Mid", "Premium"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field
              label="Maximum material cost"
              unit="₹/kg"
              optional
              hint="Raw-material cost per kg of dry blend, excluding GST and delivery. Trials above this are flagged."
              error={
                x.cost && x.currency && x.currency !== "INR"
                  ? `This value was entered in ${x.currency}. Re-enter it in ₹.`
                  : undefined
              }
            >
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={x.cost}
                onChange={(e) =>
                  onChange({
                    constraints: { ...x, cost: e.target.value, currency: "INR" },
                  })
                }
                placeholder="No limit"
              />
            </Field>
          )}
          {area(
            "required",
            plain ? "Must-have outcomes" : "Required materials",
          )}
          {area(
            "excluded",
            plain ? "Materials or conditions to avoid" : "Excluded materials",
            "Separate with commas. Trials using these are flagged.",
          )}
        </div>
        {conflict && (
          <p className={s.error} role="alert">
            The same item is both required and excluded. Remove it from one
            list.
          </p>
        )}
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend>Practical limits</legend>
        <div className={s.formGrid}>
          {area("equipment", plain ? "Site or equipment limits" : "Equipment limits")}
          {area("site", "Site conditions")}
          {!plain && area("supplier", "Supplier or availability limits")}
          {!plain &&
            area(
              "compliance",
              "Compliance requirements",
              "R&D must confirm these. Helix does not check compliance.",
            )}
        </div>
      </fieldset>
      <fieldset className={c.fieldset}>
        <legend>Preferences</legend>
        <div className={s.formGrid}>
          {area("preference", "Preferences (nice to have)")}
          {area("notes", "Other notes")}
        </div>
      </fieldset>
    </div>
  );
}

export function ReviewBrief({
  brief,
  errors,
  edit,
}: {
  brief: Brief;
  errors: Record<IntakeStep, string[]>;
  edit: (step: IntakeStep) => void;
}) {
  const state = useWorkspace();
  const k = brief.constraints;
  const sections: { title: string; step: IntakeStep; body: string; empty?: boolean }[] = [
    {
      title: "Product",
      step: "product",
      body: `${categoryFor(brief.categoryId)?.name || "No category"} › ${subcategoryFor(brief.subcategoryId)?.name || "No product family"}`,
    },
    {
      title: "Application",
      step: "application",
      body: `${brief.name || "No project name"}\n${useCaseSummary(brief)}`,
    },
    {
      title: "Benchmarks",
      step: "benchmarks",
      body:
        brief.benchmarkIds
          .map((id) => state.benchmarks.find((b) => b.id === id)?.name)
          .filter(Boolean)
          .join("\n") || "None selected (optional)",
      empty: !brief.benchmarkIds.length,
    },
    {
      title: "Targets",
      step: "targets",
      body:
        brief.targets
          .map(
            (t) =>
              `${propertyFor(t.propertyId).name}: ${t.operator} ${t.value || "—"}${t.operator === "Between" ? `–${t.max || "—"}` : ""} ${t.unit} · ${t.priority}`,
          )
          .join("\n") || "No targets",
    },
    {
      title: "Constraints",
      step: "constraints",
      body:
        [
          k.cost && `Maximum material cost: ${formatINR(Number(k.cost))}/kg`,
          state.user?.mode === "Non-scientist" && k.budget && `Budget band: ${k.budget}`,
          k.required && `Required: ${k.required}`,
          k.excluded && `Excluded: ${k.excluded}`,
          k.equipment && `Equipment: ${k.equipment}`,
          k.site && `Site: ${k.site}`,
          k.supplier && `Supplier: ${k.supplier}`,
          k.compliance && `Compliance: ${k.compliance}`,
          k.preference && `Preference: ${k.preference}`,
          k.notes && `Notes: ${k.notes}`,
        ]
          .filter(Boolean)
          .join("\n") || "None (optional)",
      empty: !k.cost && !k.required && !k.excluded,
    },
  ];
  return (
    <div className={s.stack}>
      <div className={c.review}>
        {sections.map((x) => {
          const problems = errors[x.step];
          return (
            <section
              className={`${c.reviewSection} ${problems.length ? c.reviewProblem : ""}`}
              key={x.title}
            >
              <div className={s.between}>
                <h3>
                  {problems.length ? (
                    <AlertCircle size={15} aria-label="Needs attention" />
                  ) : (
                    <Check size={15} aria-label="Complete" />
                  )}
                  {x.title}
                </h3>
                <button className={s.textLink} onClick={() => edit(x.step)}>
                  <Pencil size={11} /> Edit {x.title.toLowerCase()}
                </button>
              </div>
              <p className={x.empty ? s.muted : ""}>{x.body}</p>
              {problems.map((p) => (
                <p key={p} className={s.error}>
                  {p}
                </p>
              ))}
            </section>
          );
        })}
      </div>
      <Notice>
        <b>What happens next:</b> “Start project” saves this as brief version 1
        and opens step 2, <b>Read</b>, where you collect sources. You can revise
        the brief later; earlier versions are kept.
      </Notice>
    </div>
  );
}

function BriefPreview({ brief }: { brief: Brief }) {
  const state = useWorkspace();
  const items = [
    { label: "Product", value: subcategoryFor(brief.subcategoryId)?.name },
    { label: "Project name", value: brief.name || undefined },
    {
      label: "Benchmarks",
      value: brief.benchmarkIds.length
        ? `${brief.benchmarkIds.length} selected`
        : undefined,
    },
    {
      label: "Targets",
      value: brief.targets.length ? `${brief.targets.length} set` : undefined,
    },
    {
      label: "Top priorities",
      value:
        brief.objectives
          .filter(Boolean)
          .map((id) => propertyFor(id)?.plain)
          .join(" → ") || undefined,
    },
    {
      label: "Cost limit",
      value: brief.constraints.cost
        ? `${formatINR(Number(brief.constraints.cost))}/kg`
        : state.user?.mode === "Non-scientist"
          ? `${brief.constraints.budget} budget`
          : undefined,
    },
  ];
  return (
    <aside className={c.preview} aria-label="Brief summary">
      <header className={c.previewHeader}>
        <FileText size={16} aria-hidden="true" />
        <h3>Your brief so far</h3>
        <Badge>Draft</Badge>
      </header>
      <dl className={c.previewBody}>
        {items.map((item) => (
          <div className={c.previewItem} key={item.label}>
            <dt>{item.label}</dt>
            <dd className={!item.value ? c.placeholder : ""}>
              {item.value || "Not set yet"}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
