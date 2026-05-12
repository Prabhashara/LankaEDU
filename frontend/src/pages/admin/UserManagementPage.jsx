import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole, getStoredUserId } from "../../services/authStorage";
import { createStaffUser, deleteUser, getUsers, updateUserStatus } from "../../services/userService";

const initialCreateForm = {
  fullName: "",
  email: "",
  role: "lecturer",
  password: "",
  confirmPassword: ""
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreateForm(form) {
  const errors = {};
  const role = form.role.trim().toLowerCase();

  if (!form.fullName.trim()) errors.fullName = "Full name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (!role) errors.role = "Role is required";
  else if (!["lecturer", "admin"].includes(role)) errors.role = "Only lecturer or admin can be created here";
  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errors.password = "Password must include at least one letter and one number";
  if (!form.confirmPassword) errors.confirmPassword = "Confirm the password";
  else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";

  return errors;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getStoredRole();
  const currentUserId = getStoredUserId();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionUserId, setActionUserId] = useState("");
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createErrors, setCreateErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!token || role !== "admin") return;
    let isMounted = true;
    async function loadUsers() {
      try {
        const data = await getUsers();
        if (isMounted) { setUsers(data); setError(""); }
      } catch { if (isMounted) setError("Unable to load users."); }
      finally { if (isMounted) setIsLoading(false); }
    }
    loadUsers();
    return () => { isMounted = false; };
  }, [role, token]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  }, [search, users]);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to={`/${role || "student"}-dashboard`} replace />;

  function updateCreateField(event) {
    const { name, value } = event.target;
    setCreateForm(current => ({ ...current, [name]: value }));
    setCreateErrors(current => ({ ...current, [name]: "" }));
    setError("");
    setSuccessMessage("");
  }

  async function handleCreateStaff(event) {
    event.preventDefault();
    const validationErrors = validateCreateForm(createForm);
    setCreateErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsCreating(true);
    setError("");
    setSuccessMessage("");
    try {
      const newUser = await createStaffUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        role: createForm.role.trim().toLowerCase(),
        password: createForm.password,
        confirmPassword: createForm.confirmPassword
      });
      setUsers(current => [newUser, ...current]);
      setCreateForm(initialCreateForm);
      setCreateErrors({});
      setSuccessMessage(`${newUser.role === "admin" ? "Admin" : "Lecturer"} account created for ${newUser.email}.`);
    } catch (err) {
      const responseErrors = err.response?.data?.errors;
      if (responseErrors) setCreateErrors(responseErrors);
      setError(err.response?.data?.message || "Unable to create staff user.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(user, isActive) {
    setActionUserId(user.id); setError(""); setSuccessMessage("");
    try {
      const updated = await updateUserStatus(user.id, isActive);
      setUsers(cur => cur.map(u => u.id === updated.id ? updated : u));
    } catch (err) { setError(err.response?.data?.message || "Unable to update user status."); }
    finally { setActionUserId(""); }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionUserId(pendingDelete.id); setError(""); setSuccessMessage("");
    try {
      await deleteUser(pendingDelete.id);
      setUsers(cur => cur.filter(u => u.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) { setError(err.response?.data?.message || "Unable to delete user."); }
    finally { setActionUserId(""); }
  }

  const totalActive = users.filter(u => u.isActive).length;
  const byRole = {
    student: users.filter(u => u.role === "student").length,
    lecturer: users.filter(u => u.role === "lecturer").length,
    admin: users.filter(u => u.role === "admin").length
  };

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="user-management-title">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h1 id="user-management-title">User Management</h1>
          <p className="dashboard-copy">Create staff accounts, protect admin access, and control who can use the platform.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => { clearAuthSession(); navigate("/login", { replace: true }); }} style={{ minHeight: 40, padding: "8px 16px" }}>
            Sign out
          </button>
        </div>
      </section>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card teal">
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value">{users.length}</div>
          <div className="stat-card-sub">all accounts</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-label">Active</div>
          <div className="stat-card-value">{totalActive}</div>
          <div className="stat-card-sub">can log in</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Students</div>
          <div className="stat-card-value">{byRole.student}</div>
          <div className="stat-card-sub">self registered</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-label">Staff</div>
          <div className="stat-card-value">{byRole.lecturer + byRole.admin}</div>
          <div className="stat-card-sub">lecturers + admins</div>
        </div>
      </div>

      <section className="detail-panel wide" style={{ marginBottom: 24 }} aria-labelledby="create-staff-title">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Access Control</p>
            <h2 id="create-staff-title">Create Lecturer or Admin</h2>
            <p className="muted-text">Students can only self-register. Lecturer and admin accounts must be created by an admin.</p>
          </div>
        </div>

        <form onSubmit={handleCreateStaff} noValidate>
          <div className="form-grid">
            <Field label="Full Name" name="fullName" value={createForm.fullName} error={createErrors.fullName} onChange={updateCreateField} placeholder="e.g. Dr. Jane Smith" />
            <Field label="Email" name="email" type="email" value={createForm.email} error={createErrors.email} onChange={updateCreateField} placeholder="staff@university.edu" />
            <div className="field">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" value={createForm.role} onChange={updateCreateField} aria-invalid={Boolean(createErrors.role)}>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Admin</option>
              </select>
              {createErrors.role && <p className="field-error">{createErrors.role}</p>}
            </div>
            <Field label="Temporary Password" name="password" type="password" value={createForm.password} error={createErrors.password} onChange={updateCreateField} placeholder="Minimum 8 chars + number" />
            <Field label="Confirm Password" name="confirmPassword" type="password" value={createForm.confirmPassword} error={createErrors.confirmPassword} onChange={updateCreateField} placeholder="Repeat password" />
          </div>
          <div className="form-actions" style={{ marginTop: 18 }}>
            <button className="primary-button" type="submit" disabled={isCreating} style={{ minHeight: 42, padding: "9px 18px" }}>
              {isCreating ? "Creating…" : "Create staff account"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-tools" aria-label="User tools">
        <div className="field search-field">
          <label htmlFor="user-search">Search users</label>
          <input id="user-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or role…" />
        </div>
      </section>

      {successMessage && <div className="alert alert-success admin-alert">✓ {successMessage}</div>}
      {error && <div className="alert alert-error admin-alert">⚠ {error}</div>}

      <section className="table-wrap" aria-label="All users">
        {isLoading ? (
          <p className="empty-state">Loading users…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 700 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: user.role === "admin" ? "#fef3c7" : user.role === "lecturer" ? "#e0f7fb" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, color: user.role === "admin" ? "#92400e" : user.role === "lecturer" ? "#006880" : "#475569", flexShrink: 0 }}>
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "0.9rem" }}>{user.email}</td>
                  <td><span style={{ textTransform: "capitalize", fontWeight: 700 }}>{user.role}</span></td>
                  <td>
                    <span className={user.isActive ? "status-pill active" : "status-pill inactive"}>
                      {user.isActive ? "● Active" : "○ Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="table-button" type="button" disabled={user.isActive || actionUserId === user.id} onClick={() => handleStatusChange(user, true)}>
                        Activate
                      </button>
                      <button className="table-button" type="button" disabled={!user.isActive || user.id === currentUserId || actionUserId === user.id} onClick={() => handleStatusChange(user, false)} title={user.id === currentUserId ? "You cannot deactivate your own account" : undefined}>
                        Deactivate
                      </button>
                      <button className="danger-button" type="button" disabled={user.id === currentUserId || actionUserId === user.id} onClick={() => setPendingDelete(user)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="empty-cell">No users found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚠️</div>
            <h2 id="delete-title">Delete this user?</h2>
            <p id="delete-description" style={{ marginTop: 8 }}>
              This will permanently remove <strong>{pendingDelete.name}</strong> and revoke their access to the platform.
            </p>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setPendingDelete(null)} style={{ minHeight: 40 }}>Cancel</button>
              <button className="danger-button solid" type="button" onClick={confirmDelete} style={{ minHeight: 40 }}>Delete permanently</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, name, type = "text", value, error, onChange, placeholder }) {
  const errorId = `${name}-error`;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && <p className="field-error" id={errorId}>{error}</p>}
    </div>
  );
}
