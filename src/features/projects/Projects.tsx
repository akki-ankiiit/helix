import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Plus,
  LayoutGrid,
  List,
  FlaskConical,
  Activity,
  Clock3,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import {
  Button,
  Badge,
  Empty,
  SearchBox,
  Status,
  s,
} from "../../components/ui";
import { useWorkspace } from "../../stores/workspace";
import { categoryFor, subcategoryFor } from "../../data/taxonomy";
import c from "./Projects.module.css";
import { currentStep, procedure } from "../../data/procedure";
import { intakePath } from "../../data/intake-steps";
import { projectOutcome } from "../../domain/calculations";
import { formatDate } from "../../lib/format";
import { projectCode } from "./ProjectPage";
export function Projects() {
  const state = useWorkspace(),
    navigate = useNavigate();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All projects"),
    [grid, setGrid] = useState(true);
  const projects = state.projects.filter(
    (p) =>
      `${p.brief.name} ${categoryFor(p.brief.categoryId)?.name} ${p.owner}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All projects" || p.status === filter),
  );
  const due = state.projects.reduce(
    (n, p) =>
      n +
      (p.trials.length ? p.testPlan : []).filter(
        (t) =>
          !p.results.some(
            (r) =>
              r.propertyId === t.propertyId &&
              r.trialId === p.trials.at(-1)?.id &&
              r.readings.every((x) => x !== null),
          ),
      ).length,
    0,
  );
  const readyForReview = state.projects.filter((p) => {
    const k = projectOutcome(p, state.materials).kind;
    return k === "review" || k === "ready";
  }).length;
  function newProject() {
    if (
      state.draft.categoryId &&
      !window.confirm(
        "You have an unfinished brief. Start a new one and discard it? Choose Cancel to keep it.",
      )
    )
      return;
    state.newDraft();
    navigate(state.user?.mode ? "/projects/new/product" : "/onboarding/mode");
  }
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <h1>Projects</h1>
          <p>
            Each project goes from a brief to a tested, approved recipe in five
            steps: {procedure.map((x) => x.name).join(" → ")}.
          </p>
        </div>
        <Button variant="primary" onClick={newProject}>
          <Plus size={16} />
          New project
        </Button>
      </div>
      <div className={s.grid3} style={{ marginBottom: 32 }}>
        {[
          {
            label: "Active projects",
            value: state.projects.filter((p) => p.status !== "Approved").length,
            icon: FlaskConical,
            note: "Not yet approved",
          },
          {
            label: "Tests awaiting results",
            value: due,
            icon: Clock3,
            note: "Readings still to enter for the latest trials",
          },
          {
            label: "Ready for review",
            value: readyForReview,
            icon: Activity,
            note: "Latest trial meets every target",
          },
        ].map((m) => (
          <div className={`${s.panel} ${c.stat}`} key={m.label}>
            <div className={s.between}>
              <span>{m.label}</span>
              <m.icon size={17} />
            </div>
            <div className={s.metric}>
              {m.value}
            </div>
            <small>{m.note}</small>
          </div>
        ))}
      </div>
      {state.draft.categoryId && (
        <div className={c.draft}>
          <div className={s.row}>
            <div className={c.projectIcon}>
              <FolderOpen size={19} />
            </div>
            <div>
              <h3>Unfinished brief</h3>
              <p>
                {state.draft.name || "Untitled project"} · saved in this browser
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate(intakePath(state.draftStep))}
          >
            Continue brief
            <ArrowUpRight size={14} />
          </Button>
        </div>
      )}
      <div className={s.between} style={{ marginBottom: 20 }}>
        <div className={s.row}>
          <h2>All projects</h2>
          <Badge>{state.projects.length}</Badge>
        </div>
        <div className={s.row}>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search by name, category or owner"
          />
          <select
            aria-label="Project status filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ fontSize: 12 }}
          >
            {["All projects", "In progress", "In review", "Approved"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
          <div className={s.tabs}>
            <button
              className={grid ? s.active : ""}
              aria-label="Grid view"
              onClick={() => setGrid(true)}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={!grid ? s.active : ""}
              aria-label="List view"
              onClick={() => setGrid(false)}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className={s.panel}>
          <Empty
            title={
              query
                ? "No projects match your search"
                : "No projects yet"
            }
          >
            <p>
              {query || filter !== "All projects"
                ? "Try a different word or status."
                : "Create a brief to start your first project."}
            </p>
            {query || filter !== "All projects" ? (
              <Button onClick={() => { setQuery(""); setFilter("All projects"); }}>
                Clear search
              </Button>
            ) : (
              <Button variant="primary" onClick={newProject}>
                <Plus size={14} />
                New project
              </Button>
            )}
          </Empty>
        </div>
      ) : grid ? (
        <div className={s.grid3}>
          {projects.map((p) => (
            <Link to={`/projects/${p.id}`} key={p.id} className={c.project}>
              <div className={s.between}>
                <div className={c.projectIcon}>
                  <FlaskConical size={19} />
                </div>
                <Status value={p.status} />
              </div>
              <span className={c.projectCode}>{projectCode(p)}</span>
              <h2>{p.brief.name}</h2>
              <p>{subcategoryFor(p.brief.subcategoryId)?.name}</p>
              <div className={c.stage}>
                <span>
                  Step {currentStep(p).number}: {currentStep(p).name}
                </span>
                <span>of {procedure.length}</span>
              </div>
              <div className={s.progress} aria-hidden="true">
                <span
                  style={{
                    width: `${(currentStep(p).number / procedure.length) * 100}%`,
                  }}
                />
              </div>
              {p.trials.length > 0 && (
                <p className={c.outcome}>{projectOutcome(p, state.materials).headline}</p>
              )}
              <footer>
                <span>
                  <span className={c.avatar}>AM</span>
                  {p.owner}
                </span>
                <ArrowUpRight size={15} />
              </footer>
            </Link>
          ))}
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Category</th>
                <th scope="col">Owner</th>
                <th scope="col">Status</th>
                <th scope="col">Current step</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/projects/${p.id}`}>{p.brief.name}</Link>
                  </td>
                  <td>{categoryFor(p.brief.categoryId)?.name}</td>
                  <td>{p.owner}</td>
                  <td>
                    <Status value={p.status} />
                  </td>
                  <td>
                    {currentStep(p).number}. {currentStep(p).name}
                  </td>
                  <td>{formatDate(p.updated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={s.panel} style={{ marginTop: 30 }}>
        <div className={s.panelHeader}>
          <h2>Recent activity</h2>
          <Badge>Saved in this browser</Badge>
        </div>
        {!state.projects.some((p) => p.activity.length) && (
          <p className={s.muted}>No activity yet. Changes to your projects will appear here.</p>
        )}
        {state.projects
          .flatMap((p) => p.activity.map((a) => ({ ...a, project: p })))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 4)
          .map((a) => (
            <Link
              key={a.id}
              to={`/projects/${a.project.id}`}
              className={c.activity}
            >
              <div className={c.activityDot}>
                <GitActivity />
              </div>
              <div>
                <strong>{a.text}</strong>
                <small>{a.project.brief.name}</small>
              </div>
              <time>
                {formatDate(a.date)}
              </time>
              <ChevronRight size={14} />
            </Link>
          ))}
      </div>
    </>
  );
}
function GitActivity() {
  return <Activity size={15} />;
}
