import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getAuthToken, getStoredRole, getStoredUser, saveAuthSession } from "../../services/authStorage";
import { changePassword, updateProfile } from "../../services/userService";

function capitalize(value) {
  if (!value) return "User";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getInitials(name, fallback = "User") {
  const source = String(name || fallback).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getPasswordChecks(password, confirmPassword) {
  return [
    { id: "length", label: "Minimum 8 characters", passed: password.length >= 8 },
    { id: "letter", label: "At least one letter", passed: /[A-Za-z]/.test(password) },
    { id: "number", label: "At least one number", passed: /\d/.test(password) },
    { id: "match", label: "Confirmation matches", passed: Boolean(password) && password === confirmPassword }
  ];
}

function getPasswordStrength(checks) {
  const passed = checks.filter((item) => item.passed).length;
  if (passed <= 1) return { label: "Weak", className: "weak", percent: 25 };
  if (passed === 2) return { label: "Fair", className: "fair", percent: 50 };
  if (passed === 3) return { label: "Good", className: "good", percent: 75 };
  return { label: "Excellent", className: "excellent", percent: 100 };
}

export default function ProfileManagementPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const storedRole = getStoredRole();
  const storedUser = getStoredUser();
  const role = storedRole || storedUser?.role || "user";

  const [displayUser, setDisplayUser] = useState(storedUser || {});
  const [activeTab, setActiveTab] = useState("profile");

  const [profileForm, setProfileForm] = useState({
    name: storedUser?.name || "",
    email: storedUser?.email || ""
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const passwordChecks = useMemo(
    () => getPasswordChecks(passwordForm.newPassword, passwordForm.confirmPassword),
    [passwordForm.newPassword, passwordForm.confirmPassword]
  );
  const passwordStrength = useMemo(() => getPasswordStrength(passwordChecks), [passwordChecks]);

  if (!token) return <Navigate to="/login" replace />;

  const roleLabel = capitalize(role);
  const profileInitials = getInitials(displayUser?.name, roleLabel);
  const accountId = displayUser?.studentId || displayUser?.id || "Secure profile";
  const hasProfileChanges =
    profileForm.name.trim() !== (displayUser?.name || "") ||
    profileForm.email.trim() !== (displayUser?.email || "");

  function handleBackToDashboard() {
    navigate(role && role !== "user" ? `/${role}-dashboard` : "/");
  }

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileErrors((prev) => ({ ...prev, [name]: "" }));
    setProfileMessage("");
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    const errors = {};
    const nextName = profileForm.name.trim();
    const nextEmail = profileForm.email.trim();

    if (!nextName) errors.name = "Name is required";
    if (!nextEmail) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) errors.email = "Enter a valid email address";

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileLoading(true);
    setProfileMessage("");
    try {
      const response = await updateProfile(nextName, nextEmail);
      const responseUser = response?.user || {};
      const updatedUser = {
        ...displayUser,
        ...responseUser,
        id: responseUser.id || displayUser?.id,
        name: responseUser.name || nextName,
        email: responseUser.email || nextEmail,
        role: responseUser.role || role,
        studentId: responseUser.studentId ?? displayUser?.studentId
      };

      saveAuthSession({
        token,
        role: updatedUser.role,
        userId: updatedUser.id,
        user: updatedUser
      });

      setDisplayUser(updatedUser);
      setProfileForm({ name: updatedUser.name || "", email: updatedUser.email || "" });
      setProfileErrors({});
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      if (error.response?.data?.errors) {
        setProfileErrors(error.response.data.errors);
        setProfileMessage("");
      } else {
        setProfileMessage(error.response?.data?.message || "Failed to update profile.");
      }
    } finally {
      setProfileLoading(false);
    }
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    setPasswordMessage("");
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (!passwordForm.currentPassword) errors.currentPassword = "Current password is required";
    if (!passwordForm.newPassword) {
      errors.newPassword = "Password is required";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      errors.newPassword = "Password must include at least one letter and one number";
    }
    if (!passwordForm.confirmPassword) errors.confirmPassword = "Confirm your password";
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage("");
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setPasswordMessage("Password changed successfully.");
      setPasswordErrors({});
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
        setPasswordMessage("");
      } else {
        setPasswordMessage(error.response?.data?.message || "Failed to change password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <main className="page-shell profile-shell profile-management-page">
      <div className="profile-topbar">
        <div className="profile-brand-lockup">
          <button
            type="button"
            className="profile-back-button"
            onClick={handleBackToDashboard}
            aria-label="Back to dashboard"
          >
            ←
          </button>
          <span className="profile-brand-mark">PM</span>
          <span>
            <strong>Profile Management</strong>
            <small>Identity, access and account security</small>
          </span>
        </div>
        <div className="profile-topbar-actions">
          <span className="profile-status-chip">{roleLabel} account</span>
          <span className="profile-status-chip muted">Protected session</span>
        </div>
      </div>

      <section className="profile-hero" aria-labelledby="profile-heading">
        <div className="profile-hero-main">
          <div className="profile-avatar profile-avatar-large" aria-hidden="true">
            {profileInitials}
          </div>
          <div className="profile-hero-copy">
            <span className="eyebrow">Account Control Center</span>
            <h1 id="profile-heading">{displayUser?.name || "Your Profile"}</h1>
            <p className="muted-text">
              Maintain a clean, verified account identity and strengthen your access protection from one professional workspace.
            </p>
            <div className="profile-chip-row" aria-label="Account details">
              <span className="profile-status-chip">● Active</span>
              <span className="profile-status-chip muted">{displayUser?.email || "No email available"}</span>
              {displayUser?.studentId && <span className="profile-status-chip muted">Student ID: {displayUser.studentId}</span>}
            </div>
          </div>
        </div>

        <div className="profile-hero-summary" aria-label="Profile summary">
          <div>
            <span>Role</span>
            <strong>{roleLabel}</strong>
          </div>
          <div>
            <span>Account ID</span>
            <strong>{accountId}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong className="profile-positive">Verified</strong>
          </div>
          <div>
            <span>Security</span>
            <strong>Standard</strong>
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-section" aria-labelledby="profile-settings-heading">
          <div className="profile-section-head">
            <div>
              <span className="eyebrow">Settings</span>
              <h2 id="profile-settings-heading">Account workspace</h2>
              <p className="muted-text">Update your visible information or rotate your password with guided validation.</p>
            </div>
            <span className="profile-section-badge" aria-hidden="true">✦</span>
          </div>

          <div className="profile-segmented profile-tabbar" role="tablist" aria-label="Profile management tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "profile"}
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => setActiveTab("profile")}
            >
              Profile details
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "password"}
              className={activeTab === "password" ? "active" : ""}
              onClick={() => setActiveTab("password")}
            >
              Password security
            </button>
          </div>

          {activeTab === "profile" && (
            <form className="profile-control-card" onSubmit={handleProfileSubmit} noValidate>
              <div className="profile-form-title-row">
                <div>
                  <h3>Personal information</h3>
                  <p>Keep this information accurate for communication and exam records.</p>
                </div>
                <span className={hasProfileChanges ? "profile-dirty-badge" : "profile-clean-badge"}>
                  {hasProfileChanges ? "Unsaved changes" : "Up to date"}
                </span>
              </div>

              {profileMessage && (
                <div className={profileMessage.includes("successfully") ? "alert alert-success" : "alert alert-error"}>
                  <strong>{profileMessage.includes("successfully") ? "Success" : "Notice"}</strong>
                  <span>{profileMessage}</span>
                </div>
              )}

              <div className="profile-form-grid">
                <div className="field">
                  <label htmlFor="profile-name">Full name</label>
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    aria-invalid={Boolean(profileErrors.name)}
                    placeholder="Enter your full name"
                  />
                  {profileErrors.name && <p className="field-error">{profileErrors.name}</p>}
                </div>

                <div className="field">
                  <label htmlFor="profile-email">Email address</label>
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    aria-invalid={Boolean(profileErrors.email)}
                    placeholder="name@example.com"
                  />
                  {profileErrors.email && <p className="field-error">{profileErrors.email}</p>}
                </div>

                {displayUser?.studentId && (
                  <div className="field profile-locked-field">
                    <label htmlFor="profile-student-id">Student ID</label>
                    <input id="profile-student-id" type="text" value={displayUser.studentId} readOnly />
                    <p className="profile-field-note">This identifier is locked by the system.</p>
                  </div>
                )}
              </div>

              <div className="profile-action-row">
                <p className="profile-action-copy">Changes are saved to your secure browser session immediately after a successful update.</p>
                <button type="submit" className="primary-button" disabled={profileLoading || !hasProfileChanges}>
                  {profileLoading ? "Saving profile…" : "Save profile changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form className="profile-control-card" onSubmit={handlePasswordSubmit} noValidate>
              <div className="profile-form-title-row">
                <div>
                  <h3>Password security</h3>
                  <p>Use a password that is memorable, unique and difficult to guess.</p>
                </div>
                <span className={`profile-strength-badge ${passwordStrength.className}`}>{passwordStrength.label}</span>
              </div>

              {passwordMessage && (
                <div className={passwordMessage.includes("successfully") ? "alert alert-success" : "alert alert-error"}>
                  <strong>{passwordMessage.includes("successfully") ? "Success" : "Notice"}</strong>
                  <span>{passwordMessage}</span>
                </div>
              )}

              <div className="profile-form-grid single">
                <div className="field">
                  <label htmlFor="current-password">Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    aria-invalid={Boolean(passwordErrors.currentPassword)}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && <p className="field-error">{passwordErrors.currentPassword}</p>}
                </div>

                <div className="field">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    aria-invalid={Boolean(passwordErrors.newPassword)}
                    placeholder="Create a stronger password"
                  />
                  {passwordErrors.newPassword && <p className="field-error">{passwordErrors.newPassword}</p>}
                </div>

                <div className="field">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    aria-invalid={Boolean(passwordErrors.confirmPassword)}
                    placeholder="Re-enter new password"
                  />
                  {passwordErrors.confirmPassword && <p className="field-error">{passwordErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="profile-password-panel">
                <div className="profile-strength-meter" aria-label={`Password strength: ${passwordStrength.label}`}>
                  <span style={{ width: `${passwordStrength.percent}%` }} className={passwordStrength.className} />
                </div>
                <div className="profile-check-grid">
                  {passwordChecks.map((check) => (
                    <div key={check.id} className={check.passed ? "profile-check passed" : "profile-check"}>
                      <span aria-hidden="true">{check.passed ? "✓" : "○"}</span>
                      <small>{check.label}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-action-row">
                <p className="profile-action-copy">After changing your password, use the new password the next time you sign in.</p>
                <button type="submit" className="primary-button" disabled={passwordLoading}>
                  {passwordLoading ? "Updating password…" : "Change password"}
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="profile-settings-panel" aria-labelledby="profile-overview-heading">
          <div className="profile-settings-head">
            <div className="profile-avatar profile-settings-avatar" aria-hidden="true">{profileInitials}</div>
            <div>
              <span className="eyebrow">Overview</span>
              <h2 id="profile-overview-heading">Security snapshot</h2>
            </div>
          </div>

          <div className="profile-setting-block profile-mini-card">
            <span className="profile-mini-icon">✓</span>
            <div>
              <h3>Active account</h3>
              <p>Your profile is enabled and ready for platform access.</p>
            </div>
          </div>

          <div className="profile-setting-block profile-mini-card">
            <span className="profile-mini-icon">ID</span>
            <div>
              <h3>Verified identity</h3>
              <p>{displayUser?.email || "Email information is not available."}</p>
            </div>
          </div>

          <div className="profile-setting-block profile-mini-card warning">
            <span className="profile-mini-icon">!</span>
            <div>
              <h3>Security reminder</h3>
              <p>Use a unique password and update it when you suspect unusual activity.</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="profile-shortcuts" aria-labelledby="profile-standards-heading">
        <div className="profile-section-head compact">
          <div>
            <span className="eyebrow">Standards</span>
            <h2 id="profile-standards-heading">Professional account controls</h2>
          </div>
        </div>
        <div className="profile-shortcut-grid">
          <article className="profile-shortcut-card">
            <strong>Data accuracy</strong>
            <small>Name and email stay aligned with your authenticated profile.</small>
          </article>
          <article className="profile-shortcut-card">
            <strong>Access hygiene</strong>
            <small>Password requirements reduce weak credential risk.</small>
          </article>
          <article className="profile-shortcut-card">
            <strong>Audit ready</strong>
            <small>Profile changes are prepared for secure administrative tracking.</small>
          </article>
        </div>
      </section>
    </main>
  );
}
