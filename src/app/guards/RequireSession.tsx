import { Navigate, Outlet } from "react-router-dom";
import { useWorkspace } from "../../stores/workspace";
export function RequireSession() {
  const user = useWorkspace((s) => s.user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
