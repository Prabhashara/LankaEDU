import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../services/authStorage";
import { getDashboardPath } from "../utils/roleRedirect";

export default function ProtectedRoute({ roles = [], children }) {
  const location = useLocation();
  const token = getAuthToken();
  const role = getStoredRole();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace state={{ expectedRoles: roles, currentRole: role, dashboard: getDashboardPath(role) }} />;
  }

  return children;
}
