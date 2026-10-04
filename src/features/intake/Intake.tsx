import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  FlaskConical,
  Sparkles,
  Boxes,
  BrickWall,
  Droplets,
  Grid2X2,
  ShieldCheck,
  Info,
  Pencil,
  Save,
  Leaf,
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
import type { Brief, Constraint } from "../../domain/models";
import { TargetEditor } from "./TargetEditor";
import { BenchmarkPicker } from "../benchmarks/BenchmarkPicker";
import c from "./Intake.module.css";
const icons = { Boxes, BrickWall, Droplets, Grid2X2, ShieldCheck, Sparkles };
export function useCaseSummary(brief: Brief) {
  const u = brief.useCase;
  if (brief.subcategoryId === "concrete-3")
    return `We are defining a cement grinding aid for ${u.method?.toLowerCase() || "a dosing method to be confirmed"}${u.climate ? ` in ${u.climate.toLowerCase()} conditions` : ""}. Application range: ${u.temperatureMin || "—"}–${u.temperatureMax || "—"} °C. Performance targets and process compatibility require R&D confirmation.`;
  return `We are defining ${u.environment?.toLowerCase() === "exterior" ? "an exterior" : "an interior"} ${subcategoryFor(brief.subcategoryId)?.name.toLowerCase() || "material"}${u.material ? ` for ${u.material.toLowerCase()}${u.dimensions ? ` (${u.dimensions})` : ""}` : ""}${u.substrate ? ` on ${u.substrate.toLowerCase()}` : ""}${u.surface ? `, for ${u.surface.toLowerCase()} applications` : ""}.${
    brief.objectives.filter(Boolean).length
      ? ` ${brief.objectives
          .filter(Boolean)
          .map((id) => propertyFor(id)?.plain.toLowerCase())
          .join(", ")} are the leading priorities.`
      : ""
  }`;
}
export function Intake() {
  const state = useWorkspace(),
    navigate = useNavigate(),
    location = useLocation();
  const [params, setParams] = useSearchParams();
  const step = location.pathname.split("/").at(-1) || "mode";
  const steps = ["mode", "category", "subcategory", "use-case"];
  const index = steps.indexOf(step);
  const brief = state.draft,
    plain = state.user?.mode === "Non-scientist";
  const [query, setQuery] = useState(""),
    [chem, setChem] = useState("All chemistries"),
    [form, setForm] = useState("All forms"),
    [pendingCategory, setPendingCategory] = useState("");
  const tab = params.get("section") || "benchmarks";
  const tabs = ["benchmarks", "targets", "constraints", "review"];
  const setBrief = state.setDraft;
  useEffect(() => {
    state.setStep(step);
    setQuery("");
  }, [step]);
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
            !["material", "dimensions", "grout", "reopen", "standard"].includes(
              k,
            ),
        ),
      ),
    });
    setPendingCategory("");
  }
  function go(step: string) {
    navigate(step === "mode" ? "/onboarding/mode" : `/projects/new/${step}`);
  }
  function next() {
    if (step === "mode") go("category");
    else if (step === "category") go("subcategory");
    else if (step === "subcategory") go("use-case");
    else if (step === "use-case") go("brief");
    else {
      const i = tabs.indexOf(tab);
      if (i < 3) setParams({ section: tabs[i + 1] });
    }
  }
  const valid =
    step === "mode"
      ? !!state.user?.mode
      : step === "category"
        ? !!brief.categoryId
        : step === "subcategory"
          ? !!brief.subcategoryId
          : step === "use-case"
            ? brief.name.trim().length >= 3 &&
              Number(brief.useCase.temperatureMin || 0) <=
                Number(brief.useCase.temperatureMax || 0)
            : tab === "targets"
              ? brief.targets.length > 0 &&
                brief.targets.every(
                  (t) =>
                    t.value.trim() !== "" &&
                    (t.operator !== "Between" ||
                      (t.max !== "" && Number(t.max) >= Number(t.value))),
                )
              : true;
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            A GOOD FORMULATION STARTS WITH A CLEAR BRIEF
          </div>
          <h1>Let’s define what you’re making.</h1>
          <p>
            A few considered inputs. A shared direction for your next material.
          </p>
        </div>
        <Badge tone="violet">New formulation</Badge>
      </div>
      <div className={c.stepper}>
        {steps.map((st, i) => (
          <div
            className={`${c.step} ${step === st ? c.current : ""} ${index > i || index === -1 ? c.done : ""}`}
            key={st}
          >
            <span className={c.stepNumber}>
              {index > i || index === -1 ? <Check size={12} /> : i + 1}
            </span>
            <span>
              {["Your mode", "Category", "Subcategory", "Exact use case"][i]}
            </span>
          </div>
        ))}
      </div>
      <div className={c.layout}>
        <div className={s.panel}>
          <div className={c.sectionTitle}>
            <h2>
              {step === "mode"
                ? "How do you approach materials?"
                : step === "category"
                  ? "What are you working on?"
                  : step === "subcategory"
                    ? "Let’s get a little more specific."
                    : step === "use-case"
                      ? "Tell us about the application."
                      : "Build your formulation brief."}
            </h2>
            <p>
              {step === "mode"
                ? "Choose the perspective that feels right. You can switch at any time."
                : step === "category"
                  ? "Choose a product category to shape your formulation brief."
                  : step === "subcategory"
                    ? `${category?.name || "Select a category first"} · choose the relevant product family.`
                    : step === "use-case"
                      ? "The details here help connect your product need to a useful experiment."
                      : "Bring your benchmarks, targets, and boundaries into focus."}
            </p>
          </div>
          {step === "mode" && (
            <div
              className={c.cardGrid}
              role="radiogroup"
              aria-label="Your mode"
            >
              {(["Scientist", "Non-scientist"] as const).map((mode, i) => (
                <button
                  key={mode}
                  role="radio"
                  aria-checked={state.user?.mode === mode}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                      e.preventDefault();
                      state.setMode(
                        mode === "Scientist" ? "Non-scientist" : "Scientist",
                      );
                      (
                        e.currentTarget.parentElement?.children[
                          i ? 0 : 1
                        ] as HTMLElement
                      )?.focus();
                    }
                  }}
                  className={`${c.category} ${c.modeCard} ${state.user?.mode === mode ? c.selected : ""}`}
                  onClick={() => state.setMode(mode)}
                >
                  <span className={c.radio}>
                    {state.user?.mode === mode && <Check size={10} />}
                  </span>
                  <span className={c.icon}>
                    {i === 0 ? <FlaskConical size={23} /> : <Leaf size={23} />}
                  </span>
                  <h3>{mode}</h3>
                  <p>
                    {i === 0
                      ? "I work with formulations, standards, and lab data."
                      : "I know the product or site outcome I need."}
                  </p>
                  <ul>
                    {(i === 0
                      ? [
                          "Define technical targets",
                          "Compare benchmarks",
                          "Plan and analyze trials",
                        ]
                      : [
                          "Answer guided questions",
                          "Describe application needs",
                          "Create a clear brief for R&D",
                        ]
                    ).map((t) => (
                      <li key={t}>
                        <Check size={12} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          )}
          {step === "category" && (
            <>
              <SearchBox
                value={query}
                onChange={setQuery}
                placeholder="Search categories…"
              />
              <div
                className={c.cardGrid}
                role="radiogroup"
                aria-label="Category"
              >
                {taxonomy
                  .filter((cat) =>
                    `${cat.name} ${cat.description}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((cat) => {
                    const Icon = icons[cat.icon as keyof typeof icons];
                    const selected = brief.categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        role="radio"
                        aria-checked={selected}
                        className={`${c.category} ${selected ? c.selected : ""}`}
                        onClick={() => {
                          if (selected) return;
                          if (brief.subcategoryId) setPendingCategory(cat.id);
                          else changeCategory(cat.id);
                        }}
                      >
                        <span className={c.radio}>
                          {selected && <Check size={10} />}
                        </span>
                        <span className={c.icon}>
                          <Icon size={20} strokeWidth={1.5} />
                        </span>
                        <h3>{cat.name}</h3>
                        <p>{cat.description}</p>
                        <small>
                          {cat.subcategories.length} product families{" "}
                          <span style={{ marginLeft: 6 }}>↗</span>
                        </small>
                      </button>
                    );
                  })}
              </div>
              {!taxonomy.some((cat) =>
                `${cat.name} ${cat.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && <Empty title="No matching categories" />}
              <p className={s.check} style={{ marginTop: 21, fontSize: 10 }}>
                <Info size={12} />
                Draft taxonomy · 6 categories, 33 product families
              </p>
            </>
          )}
          {step === "subcategory" && (
            <>
              <SearchBox
                value={query}
                onChange={setQuery}
                placeholder="Search product families…"
              />
              <div className={c.filterRow}>
                <select
                  aria-label="Chemistry filter"
                  value={chem}
                  onChange={(e) => setChem(e.target.value)}
                >
                  {[
                    "All chemistries",
                    ...new Set(category?.subcategories.map((s) => s.chemistry)),
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
                    ...new Set(category?.subcategories.map((s) => s.form)),
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <Badge tone="amber">
                Chemistry & physical form · draft metadata
              </Badge>
              <div
                className={c.subList}
                role="radiogroup"
                aria-label="Subcategory"
              >
                {category?.subcategories
                  .filter(
                    (sub) =>
                      sub.name.toLowerCase().includes(query.toLowerCase()) &&
                      (chem === "All chemistries" || sub.chemistry === chem) &&
                      (form === "All forms" || sub.form === form),
                  )
                  .map((sub) => (
                    <button
                      key={sub.id}
                      role="radio"
                      aria-checked={brief.subcategoryId === sub.id}
                      className={`${c.category} ${c.subCard} ${brief.subcategoryId === sub.id ? c.selected : ""}`}
                      onClick={() =>
                        brief.subcategoryId !== sub.id &&
                        setBrief({
                          subcategoryId: sub.id,
                          targets: defaultTargets(sub.id),
                          objectives: [],
                          useCase: { ...brief.useCase },
                        })
                      }
                    >
                      <span className={c.radio}>
                        {brief.subcategoryId === sub.id && <Check size={10} />}
                      </span>
                      <h3>{sub.name}</h3>
                      <p>
                        {sub.chemistry} · {sub.form}
                      </p>
                      {examples[sub.id] && <p>{examples[sub.id]}</p>}
                    </button>
                  ))}
              </div>
              {category &&
                !category.subcategories.some(
                  (sub) =>
                    sub.name.toLowerCase().includes(query.toLowerCase()) &&
                    (chem === "All chemistries" || sub.chemistry === chem) &&
                    (form === "All forms" || sub.form === form),
                ) && <Empty title="No product families match these filters" />}
              {brief.subcategoryId && (
                <div style={{ marginTop: 20 }}>
                  <Notice warning>
                    Editable draft property template loaded. R&D confirmation
                    required.{" "}
                    {templateFor(brief.subcategoryId).standard?.identifier ||
                      "No standard configured"}{" "}
                    · unverified.
                  </Notice>
                </div>
              )}
            </>
          )}
          {step === "use-case" && (
            <UseCase brief={brief} onChange={setBrief} plain={plain} />
          )}{" "}
          {step === "brief" && (
            <>
              <div className={c.briefTabs}>
                {tabs.map((t, i) => (
                  <button
                    className={tab === t ? c.tabActive : ""}
                    key={t}
                    onClick={() => setParams({ section: t })}
                  >
                    {i + 1}. {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              {tab === "benchmarks" && (
                <>
                  <h3 style={{ marginBottom: 18 }}>
                    {plain
                      ? "Which product do you use or want to match?"
                      : "Benchmark products"}
                  </h3>
                  <BenchmarkPicker
                    selected={brief.benchmarkIds}
                    onChange={(benchmarkIds) => setBrief({ benchmarkIds })}
                  />
                  <p
                    className={s.muted}
                    style={{ fontSize: 11, marginTop: 18 }}
                  >
                    Optional · advertised claims are distinct from measured
                    laboratory evidence.
                  </p>
                </>
              )}
              {tab === "targets" && (
                <TargetEditor brief={brief} onChange={setBrief} />
              )}{" "}
              {tab === "constraints" && (
                <Constraints brief={brief} onChange={setBrief} plain={plain} />
              )}{" "}
              {tab === "review" && (
                <ReviewBrief
                  brief={brief}
                  edit={(section) =>
                    ["category", "subcategory", "use-case"].includes(section)
                      ? go(section)
                      : setParams({ section })
                  }
                />
              )}
            </>
          )}
          {!valid && step === "use-case" && (
            <p className={s.error} style={{ marginTop: 15 }}>
              Enter a project name (at least 3 characters) and a valid
              application temperature range.
            </p>
          )}
          <div className={c.actions}>
            <Button
              variant="ghost"
              onClick={() => {
                if (step === "mode") navigate("/projects");
                else if (step === "brief" && tab !== "benchmarks")
                  setParams({ section: tabs[tabs.indexOf(tab) - 1] });
                else go(step === "brief" ? "use-case" : steps[index - 1]);
              }}
            >
              <ArrowLeft size={14} />
              Back
            </Button>
            <div className={s.row}>
              <Button
                onClick={() =>
                  state.notify(
                    "Draft saved in this browser. Return from Projects to continue.",
                  )
                }
              >
                <Save size={13} />
                Save draft
              </Button>
              {step === "brief" && tab === "review" ? (
                <Button
                  variant="primary"
                  disabled={
                    !brief.name ||
                    !brief.subcategoryId ||
                    !brief.targets.length ||
                    brief.targets.some(
                      (t) =>
                        !t.value.trim() ||
                        (t.operator === "Between" &&
                          (!t.max || Number(t.max) < Number(t.value))),
                    )
                  }
                  onClick={() => {
                    const id = state.createProject();
                    navigate(`/projects/${id}?stage=Literature`);
                  }}
                >
                  Start formulation
                  <ArrowRight size={14} />
                </Button>
              ) : (
                <Button variant="primary" disabled={!valid} onClick={next}>
                  Continue
                  <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>
        <aside className={c.preview}>
          <header className={c.previewHeader}>
            <FileText size={17} />
            <h3>Formulation brief</h3>
            <Badge>Draft</Badge>
          </header>
          <div className={c.previewBody}>
            {[
              { label: "Your perspective", value: state.user?.mode },
              { label: "Category", value: category?.name },
              {
                label: "Product family",
                value: subcategoryFor(brief.subcategoryId)?.name,
              },
              { label: "Intended use", value: brief.name || undefined },
              {
                label: "Benchmarks",
                value: brief.benchmarkIds.length
                  ? `${brief.benchmarkIds.length} reference product${brief.benchmarkIds.length > 1 ? "s" : ""}`
                  : undefined,
              },
              {
                label: "Leading priorities",
                value:
                  brief.objectives
                    .filter(Boolean)
                    .map((id) => propertyFor(id)?.plain)
                    .join(" → ") || undefined,
              },
              {
                label: "Constraints",
                value: brief.constraints.cost
                  ? `${brief.constraints.currency} ${brief.constraints.cost}/kg ceiling`
                  : brief.constraints.notes || undefined,
              },
            ].map((item) => (
              <div className={c.previewItem} key={item.label}>
                <small>{item.label}</small>
                <p className={!item.value ? c.placeholder : ""}>
                  {item.value || "Not defined yet"}
                </p>
              </div>
            ))}
          </div>
          <div className={c.previewFooter}>
            <Info size={13} />
            <span>
              Your brief grows as you go. Every input can be refined before
              formulation begins.
            </span>
          </div>
          <div style={{ padding: "14px 22px" }}>
            <Saved />
          </div>
        </aside>
      </div>
      {pendingCategory && (
        <Modal
          title="Change product category?"
          onClose={() => setPendingCategory("")}
        >
          <p className={s.muted}>
            Changing the category resets the product family, its property
            targets, ranked objectives, and product-specific application fields.
            Your project identity, benchmarks, shared site details, and
            constraints are preserved.
          </p>
          <div className={s.modalActions}>
            <Button onClick={() => setPendingCategory("")}>
              Keep category
            </Button>
            <Button
              variant="primary"
              onClick={() => changeCategory(pendingCategory)}
            >
              Change & reset dependent fields
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function UseCase({
  brief,
  onChange,
  plain,
}: {
  brief: Brief;
  onChange: (p: Partial<Brief>) => void;
  plain: boolean;
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
    <Field key={key} label={label}>
      <select value={u[key] || ""} onChange={(e) => set(key, e.target.value)}>
        <option value="">Choose an option</option>
        {options.map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </Field>
  );
  return (
    <>
      <div className={s.formGrid}>
        <Field label="Project name" className={s.full}>
          <input
            value={brief.name}
            placeholder="e.g. Exterior large-format tile adhesive"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="Short description" className={s.full}>
          <textarea
            value={brief.description}
            placeholder="What should this product make possible?"
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
        {!industrial &&
          select(
            "environment",
            plain
              ? "Where will this product be used?"
              : "Application environment",
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
            plain ? "What are you applying it to?" : "Substrate",
            [
              "Concrete",
              "Cement render",
              "Masonry",
              "Gypsum",
              "Existing tile",
              "Steel",
            ],
          )}
        {select(
          "climate",
          plain ? "What will it be exposed to?" : "Climate & exposure",
          [
            "Temperate",
            "Hot and dry",
            "Hot and humid",
            "Freeze-thaw exposure",
            "Continuous water exposure",
            "Industrial indoor",
          ],
        )}
        {tile && (
          <>
            {select("material", "Tile or material type", [
              "Porcelain",
              "Ceramic",
              "Natural stone",
              "Concrete",
            ])}
            <Field
              label="Tile / material dimensions"
              hint="For example: 600 × 1200 mm"
            >
              <input
                value={u.dimensions || ""}
                onChange={(e) => set("dimensions", e.target.value)}
              />
            </Field>
          </>
        )}
        <Field label="Application temperature · min (°C)">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="range"
              min="-20"
              max="100"
              value={u.temperatureMin || "0"}
              onChange={(e) => set("temperatureMin", e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={u.temperatureMin || ""}
              onChange={(e) => set("temperatureMin", e.target.value)}
              style={{ width: "90px" }}
            />
          </div>
        </Field>
        <Field label="Application temperature · max (°C)">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="range"
              min="-20"
              max="100"
              value={u.temperatureMax || "0"}
              onChange={(e) => set("temperatureMax", e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={u.temperatureMax || ""}
              onChange={(e) => set("temperatureMax", e.target.value)}
              style={{ width: "90px" }}
            />
          </div>
        </Field>
        {!industrial &&
          select("traffic", "Load & traffic", [
            "Light pedestrian",
            "Heavy pedestrian",
            "Vehicular",
            "Static load",
            "Not applicable",
          ])}
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
          plain ? "How quickly does it need to work?" : "Required speed",
          ["Standard set", "Rapid set", "Extended working time"],
        )}
        {tile && (
          <>
            {select("grout", "Time to grout", ["4 h", "12 h", "24 h", "48 h"])}
            {select(
              "reopen",
              plain ? "How soon should the area reopen?" : "Time to traffic",
              ["12 h", "24 h", "48 h", "72 h"],
            )}
          </>
        )}
        {!plain && templateFor(brief.subcategoryId).standard && (
          <Field
            label="Standard / classification reference"
            hint="Unverified. No compliance is inferred."
          >
            <select
              value={u.standard || ""}
              onChange={(e) => set("standard", e.target.value)}
            >
              <option value="">R&D confirmation required</option>
              <option>EN 12004-1 · class not verified</option>
            </select>
          </Field>
        )}
        <Field label="Additional site notes" className={s.full}>
          <textarea
            value={u.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything the R&D team should know?"
          />
        </Field>
      </div>
      <div className={c.summary}>
        <span className={s.eyebrow}>YOUR APPLICATION, IN A SENTENCE</span>
        <p>{useCaseSummary(brief)}</p>
      </div>
    </>
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
  return (
    <div className={s.stack}>
      <Notice>
        Hard constraints must be satisfied. Preferences guide optimization. A
        budget band is not converted into an exact cost ceiling.
      </Notice>
      <div className={s.formGrid}>
        {plain ? (
          <Field label="Preferred budget band">
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
          <>
            <Field label="Hard cost ceiling / kg">
              <input
                type="number"
                min="0"
                step="0.01"
                value={x.cost}
                onChange={(e) => set("cost", e.target.value)}
                placeholder="Not specified"
              />
            </Field>
            <Field label="Currency">
              <select
                value={x.currency}
                onChange={(e) => set("currency", e.target.value)}
              >
                {["USD", "EUR", "GBP", "INR"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          </>
        )}
        {(
          [
            {
              key: "required",
              label: plain
                ? "Must-have outcomes"
                : "Required materials · hard constraint",
            },
            {
              key: "excluded",
              label: plain
                ? "Materials or conditions to avoid"
                : "Excluded materials · hard constraint",
            },
            {
              key: "equipment",
              label: plain
                ? "Site / equipment limitations"
                : "Equipment limitations",
            },
            { key: "site", label: "Site conditions" },
            { key: "preference", label: "Preferences · soft constraints" },
            { key: "notes", label: "Additional constraint remarks" },
            ...(!plain
              ? [
                  {
                    key: "supplier",
                    label: "Supplier / availability restrictions",
                  },
                  {
                    key: "compliance",
                    label:
                      "Compliance requirements · R&D verification required",
                  },
                ]
              : []),
          ] as { key: keyof Constraint; label: string }[]
        ).map((f) => (
          <Field key={f.key} label={f.label}>
            <textarea
              value={x[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              style={{ minHeight: 76 }}
            />
          </Field>
        ))}
      </div>
      {x.required &&
        x.excluded &&
        x.required.toLowerCase() === x.excluded.toLowerCase() && (
          <p className={s.error}>
            Conflict: the same material or outcome is both required and
            excluded.
          </p>
        )}
      {!plain && (
        <details className={s.details}>
          <summary>Raw-material limits</summary>
          <p>
            Material-specific minimum / maximum percentages are editable in Raw
            materials and validated in the formulation matrix. Every trial must
            sum to 100% on its declared basis. Unstructured restrictions require
            explicit reviewer confirmation before approval.
          </p>
        </details>
      )}
    </div>
  );
}
export function ReviewBrief({
  brief,
  edit,
}: {
  brief: Brief;
  edit: (section: string) => void;
}) {
  const state = useWorkspace();
  const sections = [
    {
      title: "Project identity & application",
      section: "use-case",
      body: `${brief.name || "Project name missing"} · ${state.user?.name}\n${useCaseSummary(brief)}`,
    },
    {
      title: "Category & product family",
      section: "category",
      body: `${categoryFor(brief.categoryId)?.name || "Missing category"} / ${subcategoryFor(brief.subcategoryId)?.name || "Missing product family"}`,
    },
    {
      title: "Benchmarks & provenance",
      section: "benchmarks",
      body:
        brief.benchmarkIds
          .map((id) => {
            const b = state.benchmarks.find((b) => b.id === id);
            return `${b?.name} (${b?.provenance} · illustrative)`;
          })
          .join("; ") || "No benchmarks selected · optional",
    },
    {
      title: "Property targets",
      section: "targets",
      body:
        brief.targets
          .map(
            (t) =>
              `${propertyFor(t.propertyId).name}: ${t.operator} ${t.value}${t.operator === "Between" ? `–${t.max}` : ""} ${t.unit} · ${t.priority}`,
          )
          .join("\n") || "No targets defined",
    },
    {
      title: "Ranked optimization objectives",
      section: "targets",
      body:
        brief.objectives
          .filter(Boolean)
          .map((id, i) => `${i + 1}. ${propertyFor(id).plain}`)
          .join(" → ") || "No ranked objectives · assumption to resolve",
    },
    {
      title: "Constraints",
      section: "constraints",
      body: Object.entries(brief.constraints)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · "),
    },
    {
      title: "Standards & assumptions",
      section: "targets",
      body: `${templateFor(brief.subcategoryId).standard?.identifier || "No standard configured"} · Unverified. R&D confirmation required. No official limits or certified classifications are claimed. Draft targets and methods require review.`,
    },
  ];
  return (
    <div>
      {sections.map((x) => (
        <section className={c.reviewSection} key={x.title}>
          <div className={s.between}>
            <h3>{x.title}</h3>
            <button className={s.textLink} onClick={() => edit(x.section)}>
              <Pencil size={11} /> Edit
            </button>
          </div>
          <p style={{ whiteSpace: "pre-line" }}>{x.body}</p>
        </section>
      ))}
      <div style={{ marginTop: 20 }}>
        <Notice warning>
          Starting creates brief v1. Missing site details and unverified
          references remain recorded assumptions. Later changes create a
          revision and mark downstream work for review.
        </Notice>
      </div>
    </div>
  );
}
