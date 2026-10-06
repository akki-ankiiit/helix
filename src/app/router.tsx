import { createBrowserRouter, Navigate, useLocation, useNavigate } from "react-router-dom";
import { lazy, useEffect } from "react";
import { Login, ForgotPassword } from "../features/auth/Login";
import { RequireSession } from "./guards/RequireSession";
import { Shell } from "../components/layout/Shell";
import { NotFound } from "./NotFound";
import { useWorkspace } from "../stores/workspace";
import { usePlanner } from "../planner/store";

const ProjectList = lazy(() =>
  import("../features/planner/ProjectList").then((m) => ({ default: m.ProjectList })),
);
const Workspace = lazy(() =>
  import("../features/planner/Workspace").then((m) => ({ default: m.Workspace })),
);
const ProjectEntry = lazy(() =>
  import("../features/planner/Workspace").then((m) => ({ default: m.ProjectEntry })),
);
const Reports = lazy(() =>
  import("../features/reports/Reports").then((m) => ({ default: m.Reports })),
);
const Settings = lazy(() =>
  import("../features/settings/Settings").then((m) => ({ default: m.Settings })),
);

function Home() {
  const user = useWorkspace((s) => s.user);
  return <Navigate replace to={!user ? "/login" : "/projects"} />;
}

/** "New project" creates a real draft so every step has a URL from the start. */
const createdFor = new Map<string, string>();
function NewProject() {
  const location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    // Guarded per navigation so a double-run effect cannot create two projects.
    let id = createdFor.get(location.key);
    if (!id) {
      id = usePlanner.getState().create();
      createdFor.set(location.key, id);
    }
    navigate(`/projects/${id}/type`, { replace: true });
  }, [location.key, navigate]);
  return <p role="status">Creating a new project…</p>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  {
    element: <RequireSession />,
    children: [
      {
        element: <Shell />,
        children: [
          { path: "/onboarding/mode", element: <Navigate replace to="/projects" /> },
          { path: "/projects", element: <ProjectList /> },
          { path: "/projects/new", element: <NewProject /> },
          // Links from the previous version's intake.
          { path: "/projects/new/:legacyStep", element: <Navigate replace to="/projects" /> },
          { path: "/projects/:projectId", element: <ProjectEntry /> },
          { path: "/projects/:projectId/pathways/:sub", element: <Workspace /> },
          { path: "/projects/:projectId/:step", element: <Workspace /> },
          { path: "/reports", element: <Reports /> },
          { path: "/settings", element: <Settings /> },
          // Retired formulation pages from the previous version.
          ...["/benchmarks", "/raw-materials", "/templates", "/tasks"].map((path) => ({
            path,
            element: <Navigate replace to="/projects" />,
          })),
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
