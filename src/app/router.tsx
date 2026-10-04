import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { Login, ForgotPassword } from "../features/auth/Login";
import { RequireSession } from "./guards/RequireSession";
import { Shell } from "../components/layout/Shell";
import { NotFound } from "./NotFound";
const Intake = lazy(() =>
  import("../features/intake/Intake").then((m) => ({ default: m.Intake })),
);
const Projects = lazy(() =>
  import("../features/projects/Projects").then((m) => ({
    default: m.Projects,
  })),
);
const ProjectPage = lazy(() =>
  import("../features/projects/ProjectPage").then((m) => ({
    default: m.ProjectPage,
  })),
);
const Benchmarks = lazy(() =>
  import("../features/benchmarks/Benchmarks").then((m) => ({
    default: m.Benchmarks,
  })),
);
const RawMaterials = lazy(() =>
  import("../features/raw-materials/RawMaterials").then((m) => ({
    default: m.RawMaterials,
  })),
);
const Templates = lazy(() =>
  import("../features/templates/Templates").then((m) => ({
    default: m.Templates,
  })),
);
const Reports = lazy(() =>
  import("../features/reports/Reports").then((m) => ({ default: m.Reports })),
);
const TaskQueue = lazy(() =>
  import("../features/task-queue/TaskQueue").then((m) => ({
    default: m.TaskQueue,
  })),
);
const Settings = lazy(() =>
  import("../features/settings/Settings").then((m) => ({
    default: m.Settings,
  })),
);
import { useWorkspace } from "../stores/workspace";
function Home() {
  const state = useWorkspace();
  return (
    <Navigate
      replace
      to={
        !state.user
          ? "/login"
          : !state.user.mode
            ? "/onboarding/mode"
            : state.draft.categoryId
              ? `/projects/new/${state.draftStep === "mode" ? "category" : state.draftStep}`
              : "/projects"
      }
    />
  );
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
          { path: "/onboarding/mode", element: <Intake /> },
          { path: "/projects/new/:step", element: <Intake /> },
          { path: "/projects", element: <Projects /> },
          { path: "/projects/:projectId", element: <ProjectPage /> },
          { path: "/benchmarks", element: <Benchmarks /> },
          { path: "/raw-materials", element: <RawMaterials /> },
          { path: "/templates", element: <Templates /> },
          { path: "/reports", element: <Reports /> },
          { path: "/tasks", element: <TaskQueue /> },
          { path: "/settings", element: <Settings /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
