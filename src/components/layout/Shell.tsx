import { Suspense, useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Boxes,
  FolderOpen,
  BookOpen,
  Layers3,
  FileChartColumn,
  ListTodo,
  Settings,
  CircleHelp,
  Search,
  ChevronRight,
  ChevronsUpDown,
  Bell,
  LogOut,
  Sparkles,
  Menu,
  X,
  FlaskConical,
} from "lucide-react";
import { Brand } from "../ui/Brand";
import { Badge, Button, Modal, SearchBox, ThemeControl, s } from "../ui";
import { useWorkspace } from "../../stores/workspace";
import { AskHelix } from "../../features/ask-helix/AskHelix";
import c from "./Shell.module.css";
const navigation = [
  ["/projects", "Projects", FolderOpen],
  ["/benchmarks", "Benchmarks", BookOpen],
  ["/raw-materials", "Raw materials", Boxes],
  ["/templates", "Templates", Layers3],
  ["/reports", "Reports", FileChartColumn],
  ["/tasks", "Task queue", ListTodo],
] as const;
export function Shell() {
  const state = useWorkspace();
  const [ask, setAsk] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [mobile, setMobile] = useState(false),
    [help, setHelp] = useState(false);
  const location = useLocation(),
    navigate = useNavigate();
  const isIntake =
    location.pathname.includes("/new/") ||
    location.pathname.includes("/onboarding/");
  const title = isIntake
    ? "New formulation"
    : navigation.find(([p]) => location.pathname.startsWith(p))?.[1] ||
      "Settings";
  useEffect(() => {
    const interval = setInterval(() => useWorkspace.getState().tick(), 350);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
      if (e.key === "Escape") {
        setAsk(false);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    setMobile(false);
  }, [location.pathname]);
  const running = state.jobs.filter((j) => j.status === "Running").length;
  return (
    <div className={c.shell}>
      <aside className={`${c.sidebar} ${mobile ? c.open : ""}`}>
        <div className={c.brand}>
          <Link to="/projects">
            <Brand />
          </Link>
        </div>
        <div className={c.workspace}>
          <span className={c.workspaceIcon}>
            <FlaskConical size={15} />
          </span>
          <div>
            <strong>Materials Lab</strong>
            <small>Organization workspace</small>
          </div>
          <ChevronsUpDown
            size={12}
            style={{ marginLeft: "auto", color: "var(--muted)" }}
          />
        </div>
        <div className={c.label}>WORKSPACE</div>
        <nav className={c.nav}>
          {navigation.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => (isActive ? c.active : "")}
            >
              <Icon size={17} strokeWidth={1.6} />
              {label}
              {label === "Projects" && (
                <span className={c.count}>{state.projects.length}</span>
              )}
              {label === "Task queue" && running > 0 && (
                <span className={c.count}>{running}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className={c.bottom}>
          <Link to="/settings" className={c.bottomLink}>
            <Settings size={17} />
            Settings
          </Link>
          <button className={c.bottomLink} onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            Help & resources
          </button>
          <div className={c.demoCard}>
            <strong>
              <FlaskConical size={13} />
              Demo workspace
            </strong>
            <p>
              A space to explore. All research and laboratory data is
              illustrative.
            </p>
          </div>
          <div className={c.user}>
            <div className={c.avatar}>AM</div>
            <div>
              {state.user?.name}
              <small>{state.user?.role} · local session</small>
            </div>
            <button
              className={s.plainButton}
              style={{ marginLeft: "auto", color: "var(--muted)" }}
              aria-label="Sign out"
              onClick={() => {
                state.logout();
                navigate("/login");
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      <header className={c.topbar}>
        <Button
          variant="ghost"
          className={c.mobileMenu}
          aria-label="Toggle navigation"
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? <X size={18} /> : <Menu size={18} />}
        </Button>
        <div className={c.breadcrumbs}>
          <span>Workspace</span>
          <ChevronRight size={12} />
          <b>{title}</b>
          {location.pathname.match(/^\/projects\/[^/]+$/) && !isIntake && (
            <>
              <ChevronRight size={12} />
              <span>Formulation</span>
            </>
          )}
        </div>
        <div className={c.topActions}>
          <button className={c.searchButton} onClick={() => setSearch(true)}>
            <Search size={15} />
            <span>Search workspace</span>
            <kbd>⌘ K</kbd>
          </button>
          <select
            className={c.modeSelect}
            aria-label="Presentation mode"
            value={state.user?.mode || "Scientist"}
            onChange={(e) =>
              state.setMode(e.target.value as "Scientist" | "Non-scientist")
            }
          >
            <option>Scientist</option>
            <option>Non-scientist</option>
          </select>
          <ThemeControl />
          <Link
            to="/tasks"
            aria-label={`${running} running jobs`}
            style={{ position: "relative", display: "flex" }}
          >
            <Bell size={17} />
            {running > 0 && (
              <span
                style={{
                  position: "absolute",
                  width: 6,
                  height: 6,
                  background: "var(--accent)",
                  borderRadius: "50%",
                  right: 0,
                  top: -2,
                }}
              />
            )}
          </Link>
          <Link to="/settings" className={c.avatar} aria-label="User profile">
            AM
          </Link>
        </div>
      </header>
      <main className={c.main}>
        <Suspense
          fallback={
            <div
              className={s.stack}
              role="status"
              aria-label="Loading workspace"
            >
              <div className={s.skeleton} />
              <div className={s.skeleton} />
              <div className={s.skeleton} />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <button className={c.askButton} onClick={() => setAsk(!ask)}>
        <Sparkles size={16} />
        Ask Helix
      </button>
      {ask && <AskHelix onClose={() => setAsk(false)} />}{" "}
      {state.notification && (
        <div role="status" className={s.toast} style={{ bottom: 85 }}>
          <span>{state.notification}</span>
          {/simulation/.test(state.notification) && (
            <Link
              to="/tasks"
              onClick={() => state.notify("")}
              style={{ color: "var(--accent)", whiteSpace: "nowrap" }}
            >
              Review results
            </Link>
          )}
          <Button
            variant="ghost"
            small
            aria-label="Dismiss notification"
            onClick={() => state.notify("")}
          >
            <X size={14} />
          </Button>
        </div>
      )}
      {search && (
        <Modal title="Search your workspace" onClose={() => setSearch(false)}>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search projects, benchmarks, and materials"
          />
          <div style={{ marginTop: 16 }}>
            {[
              ...state.projects.map((p) => ({
                name: p.brief.name,
                to: `/projects/${p.id}`,
                type: "Project",
              })),
              ...state.benchmarks.map((b) => ({
                name: b.name,
                to: "/benchmarks",
                type: "Benchmark",
              })),
              ...state.materials.map((m) => ({
                name: m.name,
                to: "/raw-materials",
                type: "Raw material",
              })),
            ]
              .filter((x) => x.name.toLowerCase().includes(query.toLowerCase()))
              .map((x) => (
                <Link
                  key={x.name}
                  className={c.searchResult}
                  to={x.to}
                  onClick={() => setSearch(false)}
                >
                  <span>{x.name}</span>
                  <Badge>{x.type}</Badge>
                </Link>
              ))}
          </div>
          {query &&
            !state.projects.some((p) =>
              p.brief.name.toLowerCase().includes(query.toLowerCase()),
            ) &&
            !state.benchmarks.some((b) =>
              b.name.toLowerCase().includes(query.toLowerCase()),
            ) &&
            !state.materials.some((m) =>
              m.name.toLowerCase().includes(query.toLowerCase()),
            ) && (
              <p className={s.empty}>
                No matching records. Try another search.
              </p>
            )}
        </Modal>
      )}
      {help && (
        <Modal
          title="A workspace for considered decisions"
          onClose={() => setHelp(false)}
        >
          <div className={s.stack}>
            <p>
              Start with <b>New formulation</b>, define a brief, then move
              through literature, pathways, trials, measured results, and
              review.
            </p>
            <p className={s.muted}>
              Use ⌘ / Ctrl K to search. Switch presentation mode at any time
              without losing project data. Every demo change is saved in this
              browser.
            </p>
            <Badge tone="amber">No live AI or backend services</Badge>
            <p className={s.muted}>
              Standards, fixture recipes, and test methods need qualified R&D
              confirmation. Role controls demonstrate the workflow; production
              authorization belongs on the server.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
