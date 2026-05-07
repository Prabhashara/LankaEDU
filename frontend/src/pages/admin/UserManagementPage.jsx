import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthToken, getStoredRole, getStoredUserId } from "../../services/authStorage";
import { deleteUser, getUsers, updateUserStatus } from "../../services/userService";

export default function UserManagementPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const role = getStoredRole();
  const currentUserId = getStoredUserId();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionUserId, setActionUserId] = useState("");

  useEffect(() => {
    if (!token || role !== "admin") {
      return;
    }

    let isMounted = true;

    async function loadUsers() {
      try {
        const data = await getUsers();
        if (isMounted) {
          setUsers(data);
          setError("");
        }
      } catch (_error) {
        if (isMounted) {
          setError("Unable to load users.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [role, token]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter(
      (user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    );
  }, [search, users]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  async function handleStatusChange(user, isActive) {
    setActionUserId(user.id);
    setError("");

    try {
      const updatedUser = await updateUserStatus(user.id, isActive);
      setUsers((current) => current.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
    } catch (_error) {
      setError("Unable to update user status.");
    } finally {
      setActionUserId("");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setActionUserId(pendingDelete.id);
    setError("");

    try {
      await deleteUser(pendingDelete.id);
      setUsers((current) => current.filter((user) => user.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete user.");
    } finally {
      setActionUserId("");
    }
  }

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="user-management-title">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 id="user-management-title">User Management</h1>
          <p className="dashboard-copy">Manage account access across students, lecturers, and admins.</p>
        </div>
        <button className="secondary-button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </section>

      <section className="admin-tools" aria-label="User tools">
        <div className="field search-field">
          <label htmlFor="user-search">Search users</label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
          />
        </div>
      </section>

      {error ? <div className="alert alert-error admin-alert">{error}</div> : null}

      <section className="table-wrap" aria-label="All users">
        {isLoading ? (
          <p className="empty-state">Loading users...</p>
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className="role-cell">{user.role}</td>
                    <td>
                      <span className={user.isActive ? "status-pill active" : "status-pill inactive"}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="table-button"
                          type="button"
                          disabled={user.isActive || actionUserId === user.id}
                          onClick={() => handleStatusChange(user, true)}
                        >
                          Activate
                        </button>
                        <button
                          className="table-button"
                          type="button"
                          disabled={!user.isActive || actionUserId === user.id}
                          onClick={() => handleStatusChange(user, false)}
                        >
                          Deactivate
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          disabled={user.id === currentUserId || actionUserId === user.id}
                          onClick={() => setPendingDelete(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {pendingDelete ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            aria-describedby="delete-description"
          >
            <h2 id="delete-title">Delete user?</h2>
            <p id="delete-description">
              This will remove {pendingDelete.name} and prevent this account from logging in.
            </p>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button className="danger-button solid" type="button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
