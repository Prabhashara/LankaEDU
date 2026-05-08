export function getDashboardPath(role) {
  const paths = {
    student: "/student-dashboard",
    lecturer: "/lecturer-dashboard",
    admin: "/admin-dashboard"
  };

  return paths[role] || "/login";
}
