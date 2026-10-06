import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { Login, ForgotPassword } from "../features/auth/Login";
import { RequireSession } from "./guards/RequireSession";
import { Shell } from "../components/layout/Shell";
import { NotFound } from "./NotFound";
import { useWorkspace } from "../stores/workspace";

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
const Onboarding = lazy(() =>
  import("../features/intake/Onboarding").then((m) => ({ default: m.Onboarding })),
);
const Benchmarks = lazy(() =>
  import("../features/benchmarks/Benchmarks").then((m) => ({ default: m.Benchmarks })),
);
const RawMaterials = lazy(() =>
  import("../features/raw-materials/RawMaterials").then((m) => ({ default: m.RawMaterials })),
);
const Templates = lazy(() =>
  import("../features/templates/Templates").then((m) => ({ default: m.Templates })),
);
const TaskQueue = lazy(() =>
  import("../features/task-queue/TaskQueue").then((m) => ({ default: m.TaskQueue })),
);

function Home() {
  const user = useWorkspace((s) => s.user);
  return <Navigate replace to={!user ? "/login" : "/projects"} />;
}

/** "New project" creates a real draft so every step has a URL from the start. */
const RolePage = lazy(() =>
  import("../features/planner/NewProject").then((m) => ({ default: m.RolePage })),
);
const CategoryPage = lazy(() =>
  import("../features/planner/NewProject").then((m) => ({ default: m.CategoryPage })),
);
const FamilyPage = lazy(() =>
  import("../features/planner/NewProject").then((m) => ({ default: m.FamilyPage })),
);

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
          { path: "/onboarding/mode", element: <Onboarding /> },
          { path: "/projects", element: <ProjectList /> },
          { path: "/projects/new", element: <RolePage /> },
          { path: "/projects/new/category", element: <CategoryPage /> },
          { path: "/projects/new/category/:categoryId", element: <FamilyPage /> },
          { path: "/projects/:projectId", element: <ProjectEntry /> },
          { path: "/projects/:projectId/pathways/:sub", element: <Workspace /> },
          { path: "/projects/:projectId/:step", element: <Workspace /> },
          { path: "/reports", element: <Reports /> },
          { path: "/settings", element: <Settings /> },
          { path: "/benchmarks", element: <Benchmarks /> },
          { path: "/raw-materials", element: <RawMaterials /> },
          { path: "/templates", element: <Templates /> },
          { path: "/task-queue", element: <TaskQueue /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
