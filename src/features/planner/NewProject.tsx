import { useRef, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  BrickWall,
  Check,
  ChevronRight,
  Droplets,
  Grid2X2,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import { useWorkspace } from "../../stores/workspace";
import {
  Badge,
  Button,
  Empty,
  Reason,
  SearchBox,
  s,
} from "../../components/ui";
import { categoryFor, examples, taxonomy } from "../../data/taxonomy";
import { formulationTypesFor } from "../../planner/families";
import type { Category } from "../../planner/model";
import { usePlanner } from "../../planner/store";
import { categoryHelp, categoryIcons } from "./Steps";
import c from "./planner.module.css";

const taxonomyIcons: Record<string, LucideIcon> = {
  Boxes,
  BrickWall,
  Droplets,
  Grid2X2,
  ShieldCheck,
  Sparkles,
};

function Header({ stage }: { stage: 1 | 2 | 3 }) {
  return (
    <div className={c.newHeader}>
      <p className={c.stepEyebrow}>New project · before you start</p>
      <h1>
        {stage === 1
          ? "How should Helix explain things?"
          : stage === 2
          ? "What are you formulating?"
          : "Choose the product family"}
      </h1>
      <p className={s.lead}>
        {stage === 1
          ? "Choose your view. This changes wording only. Everyone sees the same project data."
          : stage === 2
          ? "Pick the product category. Next you choose the product family; then the project opens at step 1 of 7 (Type)."
          : "The family decides which formulation types, component templates and tests Helix offers."}
      </p>
      <ol className={c.preSteps} aria-label="Before you start">
        <li
          className={stage === 1 ? c.preCurrent : c.preDone}
          aria-current={stage === 1 ? "step" : undefined}
        >
          <span aria-hidden="true">
            {stage === 1 ? "1" : <Check size={12} />}
          </span>{" "}
          Your view
        </li>
        <li aria-hidden="true" className={c.preSep}>
          <ChevronRight size={14} />
        </li>
        <li
          className={stage === 2 ? c.preCurrent : (stage > 2 ? c.preDone : "")}
          aria-current={stage === 2 ? "step" : undefined}
        >
          <span aria-hidden="true">
            {stage > 2 ? <Check size={12} /> : "2"}
          </span>{" "}
          Category
        </li>
        <li aria-hidden="true" className={c.preSep}>
          <ChevronRight size={14} />
        </li>
        <li
          className={stage === 3 ? c.preCurrent : ""}
          aria-current={stage === 3 ? "step" : undefined}
        >
          <span aria-hidden="true">3</span> Product family
        </li>
      </ol>
    </div>
  );
}

export function RolePage() {
  const navigate = useNavigate();
  const state = useWorkspace();
  const mode = state.user?.mode;
  
  const options = [
    {
      mode: "Scientist" as const,
      icon: FlaskConical,
      summary: "I work with formulations, standards and lab data.",
      points: [
        "Technical property names",
        "Exact cost ceilings in ₹/kg",
        "Full recipe and test detail",
      ],
    },
    {
      mode: "Non-scientist" as const,
      icon: Leaf,
      summary: "I know the product or site outcome I need.",
      points: [
        "Everyday wording",
        "Budget bands instead of exact costs",
        "A clear brief to hand to R&D",
      ],
    },
  ];

  return (
    <>
      <Header stage={1} />
      <section className={s.panel}>
        <div className={c.catGrid} role="radiogroup" aria-label="Your view">
          {options.map((o) => (
            <button
              key={o.mode}
              role="radio"
              aria-checked={mode === o.mode}
              className={`${c.catCard} ${mode === o.mode ? c.catSelected : ""}`}
              onClick={() => {
                state.setMode(o.mode);
                navigate("/projects/new/category");
              }}
              style={{ textAlign: "left" }}
            >
              <span className={c.catIcon} aria-hidden="true">
                <o.icon size={20} strokeWidth={1.6} />
              </span>
              <span className={c.catText}>
                <b>{o.mode}</b>
                <small>{o.summary}</small>
                {o.points.map((p) => (
                  <small key={p} style={{ marginTop: 2 }}>• {p}</small>
                ))}
              </span>
              <ChevronRight
                size={16}
                aria-hidden="true"
                className={c.catChevron}
              />
            </button>
          ))}
        </div>
        <div className={c.newFooter}>
          <Button
            variant="ghost"
            className={c.ghostBack}
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to projects
          </Button>
        </div>
      </section>
    </>
  );
}

export function CategoryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const list = taxonomy.filter((cat) =>
    `${cat.name} ${cat.description} ${cat.subcategories.map((x) => x.name).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <Header stage={2} />
      <section className={s.panel}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search categories and product families"
        />
        <ul className={c.catGrid} aria-label="Product categories">
          {list.map((cat) => {
            const Icon = taxonomyIcons[cat.icon] || Boxes;
            return (
              <li key={cat.id}>
                <Link to={`/projects/new/category/${cat.id}`} className={c.catCard}>
                  <span className={c.catIcon} aria-hidden="true">
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <span className={c.catText}>
                    <b>{cat.name}</b>
                    <small>{cat.description}</small>
                    <small className={c.catCount}>
                      {cat.subcategories.length} product families
                    </small>
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className={c.catChevron}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        {!list.length && (
          <Empty title="No matching categories">
            <p>Try a product name, e.g. “grout” or “waterproofing”.</p>
          </Empty>
        )}
        <div className={c.newFooter}>
          <Button
            variant="ghost"
            className={c.ghostBack}
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to projects
          </Button>
        </div>
      </section>
    </>
  );
}

export function FamilyPage() {
  const { categoryId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const create = usePlanner((x) => x.create);
  const [query, setQuery] = useState(""),
    [chem, setChem] = useState("All chemistries"),
    [form, setForm] = useState("All forms");
  const lock = useRef(false);
  const category = categoryFor(categoryId || "");
  if (!category) return <Navigate replace to="/projects/new/category" />;
  const family = params.get("family") || "";
  const types = family ? formulationTypesFor(family) : [];
  const type = (params.get("type") as Category | null) || types[0] || "";
  const families = category.subcategories.filter(
    (x) =>
      x.name.toLowerCase().includes(query.toLowerCase()) &&
      (chem === "All chemistries" || x.chemistry === chem) &&
      (form === "All forms" || x.form === form),
  );
  function start() {
    if (lock.current || !family || !type) return;
    lock.current = true;
    const id = create({
      categoryId: category!.id,
      subcategoryId: family,
      category: type,
    });
    navigate(`/projects/${id}/type`, { replace: true });
  }
  return (
    <>
      <Header stage={3} />
      <section className={s.panel}>
        <p className={c.chosen}>
          Category: <b>{category.name}</b>{" "}
          <Link to="/projects/new/category" className={s.textLink}>
            Change
          </Link>
        </p>
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
        <div
          className={c.famGrid}
          role="radiogroup"
          aria-label="Product family"
        >
          {families.map((x) => {
            const on = family === x.id;
            const supported = formulationTypesFor(x.id).length > 1;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={`${c.famCard} ${on ? c.choiceOn : ""}`}
                onClick={() => setParams({ family: x.id }, { replace: true })}
              >
                <span className={c.radioDot} aria-hidden="true">
                  {on && <Check size={10} />}
                </span>
                <b>{x.name}</b>
                <small>
                  {x.chemistry} · {x.form}
                </small>
                {examples[x.id] && <small>{examples[x.id]}</small>}
                {supported && <Badge tone="violet">Template available</Badge>}
              </button>
            );
          })}
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
        {family && (
          <div className={c.typeSection}>
            <fieldset className={c.typeChoice}>
              <legend>Formulation type</legend>
              <p className={c.helper}>
                Sets the component template, checks and suggested tests. You can
                change it later in step 1 (Type).
              </p>
              <div className={c.typeGrid}>
                {types.map((t) => {
                  const Icon = categoryIcons[t];
                  return (
                    <label
                      key={t}
                      className={`${c.categoryCard} ${type === t ? c.choiceOn : ""}`}
                    >
                      <input
                        type="radio"
                        name="ftype"
                        checked={type === t}
                        onChange={() =>
                          setParams({ family, type: t }, { replace: true })
                        }
                      />
                      <Icon
                        size={20}
                        aria-hidden="true"
                        className={c.categoryIcon}
                      />
                      <span>
                        <b>{t}</b>
                        <small>{categoryHelp[t]}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}
        <div className={c.newFooter}>
          <Button
            variant="ghost"
            className={c.ghostBack}
            onClick={() => navigate("/projects/new/category")}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back to categories
          </Button>
          <div className={c.newStart}>
            {!family && <Reason>Choose a product family to start.</Reason>}
            <Button
              variant="primary"
              disabled={!family || !type}
              onClick={start}
            >
              Start project <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
