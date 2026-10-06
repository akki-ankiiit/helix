import { Suspense, useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  matchPath,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  FolderOpen,
  FileChartColumn,
  Settings,
  CircleHelp,
  Search,
  LogOut,
  Sparkles,
  Menu,
  X,
  BookOpen,
  Package,
  Layers,
  ListTodo,
  Sun,
  Moon,
  Monitor,
  Bell,
  ChevronDown
} from "lucide-react";
import { Brand } from "../ui/Brand";
import { Badge, Breadcrumbs, Button, Modal, SearchBox, s } from "../ui";
import { useWorkspace } from "../../stores/workspace";
import { AskHelix } from "../../features/ask-helix/AskHelix";
import { useAllProjects } from "../../planner/store";
import { pathwaySubsteps, workflow } from "../../planner/model";
import c from "./Shell.module.css";

const groups = [
  {
    label: "WORKSPACE",
    items: [
      ["/projects", "Projects", FolderOpen],
      ["/benchmarks", "Benchmarks", BookOpen],
      ["/raw-materials", "Raw materials", Package],
      ["/templates", "Templates", Layers],
      ["/reports", "Reports", FileChartColumn],
      ["/task-queue", "Task queue", ListTodo],
    ],
  },
] as const;

const sectionTitles: Record<string, string> = {
  "/projects": "Projects",
  "/reports": "Reports",
  "/settings": "Settings",
  "/onboarding/mode": "Choose your view",
};

export function Shell() {
  const state = useWorkspace();
  const [ask, setAsk] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [mobile, setMobile] = useState(false),
    [help, setHelp] = useState(false);
  const location = useLocation(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const allProjects = useAllProjects();
  const projectMatch =
    matchPath("/projects/:projectId/pathways/:sub", location.pathname) ||
    matchPath("/projects/:projectId/:step", location.pathname) ||
    matchPath("/projects/:projectId", location.pathname);
  const projectId = projectMatch?.params.projectId;
  const project =
    projectId && projectId !== "new" ? allProjects.find((p) => p.id === projectId) : undefined;
  const params0 = projectMatch?.params as { step?: string; sub?: string } | undefined;

  // Breadcrumbs only where a real parent page exists.
  const crumbs =
    projectId && projectId !== "new"
      ? [
          { label: "Projects", to: "/projects" },
          { label: project ? `${project.id} · ${project.title || "Untitled project"}` : "Project not found" },
        ]
      : null;

  useEffect(() => {
    const step = workflow.find((w) => w.id === (params0?.sub ? "pathways" : params0?.step));
    const sub = pathwaySubsteps.find((x) => x.id === params0?.sub);
    const title = project
      ? `${step ? `${step.name}${sub ? ` · ${sub.short}` : ""} · ` : ""}${project.title || "Untitled project"}`
      : projectId && projectId !== "new"
        ? "Project not found"
        : sectionTitles[location.pathname] || "Helix";
    document.title = `${title} · Helix`;
  }, [location.pathname, project, projectId, params0?.step, params0?.sub]);
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
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const q = query.toLowerCase();
  const results = allProjects
    .map((p) => ({
      name: `${p.id} · ${p.title || "Untitled project"}`,
      detail: p.category,
      to: `/projects/${p.id}`,
      type: p.reference ? "Reference project" : "My project",
    }))
    .filter((x) => `${x.name} ${x.detail}`.toLowerCase().includes(q));

  return (
    <div className={c.shell}>
      <a href="#main" className={c.skip}>
        Skip to content
      </a>
      {mobile && (
        <div
          className={c.scrim}
          aria-hidden="true"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="sidebar"
        className={`${c.sidebar} ${mobile ? c.open : ""}`}
        aria-label="Main navigation"
      >
        <div className={c.brand}>
          <Link to="/projects" aria-label="Helix home">
            <Brand />
          </Link>
          <Button
            variant="ghost"
            className={c.closeMenu}
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </Button>
        </div>
        <nav className={c.nav}>
          {groups.map((group) => (
            <div key={group.label}>
              <div className={c.label}>{group.label}</div>
              {group.items.map(([path, label, Icon]) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    isActive ||
                    (path === "/projects" &&
                      location.pathname.startsWith("/onboarding"))
                      ? c.active
                      : ""
                  }
                >
                  <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                  {label}
                  {path === "/projects" && (
                    <span className={c.count} aria-label={`${allProjects.length} projects`}>
                      {allProjects.length}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className={c.bottom}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${c.bottomLink} ${isActive ? c.active : ""}`
            }
          >
            <Settings size={17} aria-hidden="true" />
            Settings
          </NavLink>
          <button className={c.bottomLink} onClick={() => setHelp(true)}>
            <CircleHelp size={17} aria-hidden="true" />
            How Helix works
          </button>
          <p className={c.demoNote}>
            <b>Demo workspace.</b> All research, lab data and prices are
            illustrative.
          </p>
          <div className={c.user}>
            <div className={c.avatar} aria-hidden="true">
              {(state.user?.name || "D U")
                .split(" ")
                .map((x) => x[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              {state.user?.name}
              <small>
                Demo user · data saved in this browser
              </small>
            </div>
            <Button
              variant="ghost"
              small
              aria-label="Sign out"
              title="Sign out"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                state.logout();
                navigate("/login");
              }}
            >
              <LogOut size={15} />
            </Button>
          </div>
        </div>
      </aside>
      <header className={c.topbar}>
        <Button
          variant="ghost"
          className={c.mobileMenu}
          aria-label="Open navigation"
          aria-expanded={mobile}
          aria-controls="sidebar"
          onClick={() => setMobile(true)}
        >
          <Menu size={18} />
        </Button>
        {!crumbs && (
          <Link to="/projects" className={c.mobileBrand} aria-label="Helix home">
            <Brand />
          </Link>
        )}
        <div className={c.crumbs}>{crumbs && <Breadcrumbs items={crumbs} />}</div>
        <div className={c.topActions}>
          <button
            className={c.searchButton}
            onClick={() => setSearch(true)}
            aria-label="Search projects"
          >
            <Search size={15} aria-hidden="true" />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
          <Button
            small
            className={c.askButton}
            aria-label="Ask Helix"
            aria-pressed={ask}
            onClick={() => setAsk(!ask)}
          >
            <Sparkles size={15} aria-hidden="true" />
            <span>Ask Helix</span>
          </Button>

          <button className={c.roleSelect}>
            <span>{state.user?.mode || "Scientist"}</span>
            <ChevronDown size={15} />
          </button>

          <div className={c.themeToggle}>
            <button aria-pressed="true" aria-label="Light mode"><Sun size={15} /></button>
            <button aria-pressed="false" aria-label="Dark mode"><Moon size={15} /></button>
            <button aria-pressed="false" aria-label="System theme"><Monitor size={15} /></button>
          </div>

          <button className={c.bellButton} aria-label="Notifications">
            <Bell size={18} />
          </button>

          <div className={c.userPill}>
            {(state.user?.name || "A M")
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)}
          </div>
        </div>
      </header>
      <main className={c.main} id="main" tabIndex={-1}>
        <Suspense
          fallback={
            <div className={s.stack} role="status" aria-live="polite">
              <span className={s.srOnly}>Loading page…</span>
              <div className={s.skeleton} />
              <div className={s.skeleton} />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      {ask && <AskHelix onClose={() => setAsk(false)} />}
      {state.notification && (
        <div role="status" aria-live="polite" className={s.toast}>
          <span>{state.notification}</span>
          {state.notificationLink && (
            <Link
              to={state.notificationLink.to}
              onClick={() => state.notify("")}
              className={s.textLink}
              style={{ whiteSpace: "nowrap", fontSize: 13 }}
            >
              {state.notificationLink.label}
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
        <Modal title="Search Helix" onClose={() => setSearch(false)}>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search by project or category"
          />
          <div style={{ marginTop: 16 }}>
            {results.map((x) => (
              <Link
                key={x.to}
                className={c.searchResult}
                to={x.to}
                onClick={() => setSearch(false)}
              >
                <span>{x.name}{x.detail && <small style={{ display: "block", color: "var(--muted)" }}>{x.detail}</small>}</span>
                <Badge>{x.type}</Badge>
              </Link>
            ))}
          </div>
          {!results.length && (
            <p className={s.empty}>
              Nothing matches “{query}”. Try a shorter word.
            </p>
          )}
        </Modal>
      )}
      {help && (
        <Modal title="How Helix works" onClose={() => setHelp(false)}>
          <div className={s.stack}>
            <p>Every project follows seven steps:</p>
            <ol className={c.helpList}>
              {workflow.map((step) => (
                <li key={step.id}>
                  <b>{step.name}</b> — {step.purpose}
                </li>
              ))}
            </ol>
            <p className={s.muted}>
              Pathways has five parts: analysing formulation pathways,
              identifying formulation components, composition and ratios,
              process conditions, and the experiment structure.
            </p>
            <p className={s.muted}>
              Helix supports construction-chemical formulation: tile cleaners,
              tile adhesives, epoxy grouts and adhesives, and waterproofing
              coatings. Open a <b>reference sample</b> to see a completed
              development plan, then use it as a starting point for your own
              copy. Your work is saved in this browser. Press ⌘ K (Ctrl K on
              Windows) to search.
            </p>
            <Badge tone="amber">Plans only: Helix does not test formulations</Badge>
          </div>
        </Modal>
      )}
    </div>
  );
}
