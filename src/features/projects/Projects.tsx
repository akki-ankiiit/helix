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
      p.testPlan.filter(
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
  function newProject() {
    if (
      state.draft.categoryId &&
      !window.confirm(
        "Start a new formulation and replace the unfinished intake? Choose Cancel to continue the saved brief instead.",
      )
    )
      return;
    state.newDraft();
    navigate(state.user?.mode ? "/projects/new/category" : "/onboarding/mode");
  }
  return (
    <>
      <div className={s.pageHeader}>
        <div>
          <div className={s.eyebrow} style={{ marginBottom: 10 }}>
            YOUR MATERIALS WORKSPACE
          </div>
          <h1>Good things start with a question.</h1>
          <p>Turn your next material requirement into a measured result.</p>
        </div>
        <Button variant="primary" onClick={newProject}>
          <Plus size={16} />
          New formulation
        </Button>
      </div>
      <div className={s.grid3} style={{ marginBottom: 32 }}>
        {[
          {
            label: "Active projects",
            value: state.projects.filter((p) => p.status !== "Approved").length,
            icon: FlaskConical,
            note: "Ideas moving toward validation",
          },
          {
            label: "Running simulations",
            value: state.jobs.filter((j) => j.status === "Running").length,
            icon: Activity,
            note: "Continue working while jobs run",
          },
          {
            label: "Tests awaiting results",
            value: due,
            icon: Clock3,
            note: "Keep your next decision on track",
          },
        ].map((m) => (
          <div className={`${s.panel} ${c.stat}`} key={m.label}>
            <div className={s.between}>
              <span>{m.label}</span>
              <m.icon size={17} />
            </div>
            <div className={s.metric}>
              {m.value.toString().padStart(2, "0")}
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
              <h3>Pick up where you left off</h3>
              <p>
                {state.draft.name || "Untitled formulation"} · draft brief saved
                locally
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/projects/new/${state.draftStep === "mode" ? "category" : state.draftStep}`,
              )
            }
          >
            Continue brief
            <ArrowUpRight size={14} />
          </Button>
        </div>
      )}
      <div className={s.between} style={{ marginBottom: 20 }}>
        <div className={s.row}>
          <h2>Your projects</h2>
          <Badge>{state.projects.length}</Badge>
        </div>
        <div className={s.row}>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search projects…"
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
                : "Your next material starts here"
            }
          >
            <p>Create a formulation brief to start your research.</p>
            <Button onClick={newProject}>
              <Plus size={14} />
              New formulation
            </Button>
          </Empty>
        </div>
      ) : grid ? (
        <div className={s.grid3}>
          {projects.map((p, i) => (
            <Link to={`/projects/${p.id}`} key={p.id} className={c.project}>
              <div className={s.between}>
                <div className={c.projectIcon}>
                  <FlaskConical size={19} />
                </div>
                <Status value={p.status} />
              </div>
              <span className={c.projectCode}>
                HLX — {String(i + 1).padStart(3, "0")}
              </span>
              <h2>{p.brief.name}</h2>
              <p>{subcategoryFor(p.brief.subcategoryId)?.name}</p>
              <div className={c.stage}>
                <span>{p.stage}</span>
                <span>
                  {[
                    "Literature",
                    "Pathways",
                    "Trials",
                    "Results",
                    "Analysis",
                    "Final",
                  ].indexOf(p.stage) + 1}{" "}
                  of 6
                </span>
              </div>
              <div className={s.progress}>
                <span
                  style={{
                    width: `${((["Literature", "Pathways", "Trials", "Results", "Analysis", "Final"].indexOf(p.stage) + 1) / 6) * 100}%`,
                  }}
                />
              </div>
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
                <th>Project</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Current stage</th>
                <th>Updated</th>
                <th />
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
                  <td>{p.stage}</td>
                  <td>{new Date(p.updated).toLocaleDateString()}</td>
                  <td>
                    <Link
                      to={`/projects/${p.id}`}
                      aria-label={`Open ${p.brief.name}`}
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={s.panel} style={{ marginTop: 30 }}>
        <div className={s.panelHeader}>
          <h2>Recent activity</h2>
          <Badge>Local demo history</Badge>
        </div>
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
                {new Date(a.date).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}
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
