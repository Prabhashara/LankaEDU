import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import UserManagementPage from "./pages/admin/UserManagementPage.jsx";
import { clearAuthSession } from "./services/authStorage.js";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student-dashboard" element={<DashboardPage role="student" />} />
      <Route path="/lecturer-dashboard" element={<DashboardPage role="lecturer" />} />
      <Route path="/admin-dashboard" element={<DashboardPage role="admin" />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/logout" element={<LogoutRedirect />} />
    </Routes>
  );
}

function LogoutRedirect() {
  clearAuthSession();
  return <Navigate to="/login" replace />;
}
