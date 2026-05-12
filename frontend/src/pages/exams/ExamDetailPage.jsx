import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { getAuthToken, getStoredRole } from "../../services/authStorage";
import { archiveExam, getExam, publishExam, updateExam } from "../../services/examService";

function toFormValues(exam) {
  return {
    title: exam?.title || "",
    subject: exam?.subject || "",
    durationMinutes: exam?.durationMinutes?.toString() || "",
    passMark: exam?.passMark?.toString() || "",
    description: exam?.description || ""
  };
}

function toScheduleValues(exam) {
  return {
    startAt: toDateTimeLocal(exam?.startAt),
    endAt: toDateTimeLocal(exam?.endAt)
  };
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value) {
  return value ? new Date(value).toISOString() : "";
}

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function validate(values) {
  const errors = {};
  const duration = Number(values.durationMinutes);
  const passMark = Number(values.passMark);

  if (!values.title.trim()) errors.title = "Title is required";
  if (!values.subject.trim()) errors.subject = "Subject is required";
  if (!values.durationMinutes) {
    errors.durationMinutes = "Duration is required";
  } else if (!Number.isFinite(duration) || duration <= 0) {
    errors.durationMinutes = "Duration must be a positive number in minutes";
  }
  if (!values.passMark) {
    errors.passMark = "Pass mark is required";
  } else if (!Number.isFinite(passMark) || passMark < 1 || passMark > 100) {
    errors.passMark = "Pass mark must be between 1 and 100";
  }

  return errors;
}

function validateSchedule(values) {
  const errors = {};
  const start = values.startAt ? new Date(values.startAt) : null;
  const end = values.endAt ? new Date(values.endAt) : null;
  const now = new Date();

  if (!values.startAt) {
    errors.startAt = "Start datetime is required";
  } else if (start <= now) {
    errors.startAt = "Start datetime must be in the future";
  }

  if (!values.endAt) {
    errors.endAt = "End datetime is required";
  } else if (start && end <= start) {
    errors.endAt = "End datetime must be after start datetime";
  }

  return errors;
}

export default function ExamDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const token = getAuthToken();
  const role = getStoredRole();
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(location.state?.toast || "");
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState(toFormValues(null));
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [scheduleValues, setScheduleValues] = useState(toScheduleValues(null));
  const [scheduleErrors, setScheduleErrors] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (!token || role !== "lecturer") {
      return;
    }

    let isMounted = true;

    async function loadExam() {
      try {
        const data = await getExam(id);
        if (isMounted) {
          setExam(data);
          setFormValues(toFormValues(data));
          setScheduleValues(toScheduleValues(data));
          setError("");
        }
      } catch (_error) {
        if (isMounted) {
          setError("Unable to load exam.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadExam();

    return () => {
      isMounted = false;
    };
  }, [id, role, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "lecturer") {
    return <Navigate to={`/${role || "student"}-dashboard`} replace />;
  }

  const isDraft = exam?.status === "Draft";
  const isActive = exam?.status === "Active";
  const canArchive = isActive && exam?.endAt && new Date(exam.endAt) <= new Date();

  function handleEdit() {
    if (!exam || !isDraft) {
      return;
    }

    setFormValues(toFormValues(exam));
    setFormErrors({});
    setError("");
    setToast("");
    setActiveTab("settings");
    setIsEditing(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleCancel() {
    setFormValues(toFormValues(exam));
    setFormErrors({});
    setError("");
    setIsEditing(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    const validationErrors = validate(formValues);
    setFormErrors(validationErrors);
    setError("");
    setToast("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const updatedExam = await updateExam(id, {
        title: formValues.title.trim(),
        subject: formValues.subject.trim(),
        durationMinutes: Number(formValues.durationMinutes),
        passMark: Number(formValues.passMark),
        description: formValues.description.trim()
      });

      setExam(updatedExam);
      setFormValues(toFormValues(updatedExam));
      setIsEditing(false);
      setToast("Exam settings updated successfully.");
    } catch (requestError) {
      const responseErrors = requestError.response?.data?.errors;
      if (responseErrors) {
        setFormErrors(responseErrors);
      }
      setError(requestError.response?.data?.message || "Unable to update exam.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleScheduleChange(event) {
    const { name, value } = event.target;
    setScheduleValues((current) => ({ ...current, [name]: value }));
    setScheduleErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handlePublish(event) {
    event.preventDefault();
    const validationErrors = validateSchedule(scheduleValues);
    setScheduleErrors(validationErrors);
    setError("");
    setToast("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsPublishing(true);

    try {
      const updatedExam = await publishExam(id, {
        startAt: fromDateTimeLocal(scheduleValues.startAt),
        endAt: fromDateTimeLocal(scheduleValues.endAt)
      });

      setExam(updatedExam);
      setScheduleValues(toScheduleValues(updatedExam));
      setToast("Exam published successfully.");
    } catch (requestError) {
      const responseErrors = requestError.response?.data?.errors;
      if (responseErrors) {
        setScheduleErrors(responseErrors);
      }
      setError(requestError.response?.data?.message || "Unable to publish exam.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleArchive() {
    setError("");
    setToast("");
    setIsArchiving(true);

    try {
      const updatedExam = await archiveExam(id);
      setExam(updatedExam);
      setToast("Exam archived successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to archive exam.");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-header" aria-labelledby="exam-detail-title">
        <div>
          <p className="eyebrow">Exam Detail</p>
          <h1 id="exam-detail-title">{exam?.title || "Exam"}</h1>
          <p className="dashboard-copy">Review and correct exam settings before publishing.</p>
        </div>
        <div className="header-actions">
          {exam && !isEditing ? (
            isDraft ? (
              <button className="secondary-button" type="button" onClick={handleEdit}>
                Edit
              </button>
            ) : (
              <span
                className="icon-button locked"
                title="Published exams cannot be edited"
                aria-label="Published exams cannot be edited"
                role="img"
                tabIndex="0"
              >
                🔒
              </span>
            )
          ) : null}
          <Link className="secondary-button" to="/lecturer-dashboard">
            Back to exams
          </Link>
        </div>
      </section>

      {toast ? <div className="toast" role="status">{toast}</div> : null}
      {exam && isActive ? (
        <div className="alert alert-warning admin-alert" role="status">
          This exam is Active and its settings are locked.
        </div>
      ) : null}
      {error ? <div className="alert alert-error admin-alert">{error}</div> : null}

      <section className="detail-panel" aria-label="Exam details">
        {isLoading ? (
          <p className="empty-state">Loading exam...</p>
        ) : exam ? (
          <>
            <div className="tabs" role="tablist" aria-label="Exam detail tabs">
              <button
                className={activeTab === "settings" ? "tab active" : "tab"}
                type="button"
                role="tab"
                aria-selected={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
              <button
                className={activeTab === "schedule" ? "tab active" : "tab"}
                type="button"
                role="tab"
                aria-selected={activeTab === "schedule"}
                onClick={() => {
                  setIsEditing(false);
                  setActiveTab("schedule");
                }}
              >
                Schedule
              </button>
            </div>

            {activeTab === "settings" && isEditing ? (
              <form className="auth-form" onSubmit={handleSave} noValidate>
                <div className="field">
                  <label htmlFor="title">Title</label>
                  <input
                    id="title"
                    name="title"
                    value={formValues.title}
                    onChange={handleChange}
                    aria-invalid={formErrors.title ? "true" : "false"}
                    aria-describedby={formErrors.title ? "title-error" : undefined}
                  />
                  {formErrors.title ? (
                    <p className="field-error" id="title-error">
                      {formErrors.title}
                    </p>
                  ) : null}
                </div>

                <div className="field">
                  <label htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    name="subject"
                    value={formValues.subject}
                    onChange={handleChange}
                    aria-invalid={formErrors.subject ? "true" : "false"}
                    aria-describedby={formErrors.subject ? "subject-error" : undefined}
                  />
                  {formErrors.subject ? (
                    <p className="field-error" id="subject-error">
                      {formErrors.subject}
                    </p>
                  ) : null}
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="durationMinutes">Duration (minutes)</label>
                    <input
                      id="durationMinutes"
                      name="durationMinutes"
                      type="number"
                      min="1"
                      step="1"
                      value={formValues.durationMinutes}
                      onChange={handleChange}
                      aria-invalid={formErrors.durationMinutes ? "true" : "false"}
                      aria-describedby={formErrors.durationMinutes ? "duration-error" : undefined}
                    />
                    {formErrors.durationMinutes ? (
                      <p className="field-error" id="duration-error">
                        {formErrors.durationMinutes}
                      </p>
                    ) : null}
                  </div>

                  <div className="field">
                    <label htmlFor="passMark">Pass Mark (%)</label>
                    <input
                      id="passMark"
                      name="passMark"
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={formValues.passMark}
                      onChange={handleChange}
                      aria-invalid={formErrors.passMark ? "true" : "false"}
                      aria-describedby={formErrors.passMark ? "pass-mark-error" : undefined}
                    />
                    {formErrors.passMark ? (
                      <p className="field-error" id="pass-mark-error">
                        {formErrors.passMark}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="description">Description (optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    rows="5"
                    value={formValues.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-actions">
                  <button className="primary-button" type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                  <button className="secondary-button" type="button" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {activeTab === "settings" && !isEditing ? (
              <>
                <div className="detail-row">
                  <span>Title</span>
                  <strong>{exam.title}</strong>
                </div>
                <div className="detail-row">
                  <span>Status</span>
                  <strong className={`status-pill ${exam.status.toLowerCase()}`}>{exam.status}</strong>
                </div>
                <div className="detail-row">
                  <span>Subject</span>
                  <strong>{exam.subject}</strong>
                </div>
                <div className="detail-row">
                  <span>Duration</span>
                  <strong>{exam.durationMinutes} minutes</strong>
                </div>
                <div className="detail-row">
                  <span>Pass Mark</span>
                  <strong>{exam.passMark}%</strong>
                </div>
                <div className="detail-row">
                  <span>Start At</span>
                  <strong>{formatDateTime(exam.startAt)}</strong>
                </div>
                <div className="detail-row">
                  <span>End At</span>
                  <strong>{formatDateTime(exam.endAt)}</strong>
                </div>
                <div className="detail-block">
                  <span>Description</span>
                  <p>{exam.description || "No description added."}</p>
                </div>
              </>
            ) : null}

            {activeTab === "schedule" ? (
              <form className="auth-form" onSubmit={handlePublish} noValidate>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="startAt">Start At</label>
                    <input
                      id="startAt"
                      name="startAt"
                      type="datetime-local"
                      value={scheduleValues.startAt}
                      onChange={handleScheduleChange}
                      disabled={!isDraft}
                      aria-invalid={scheduleErrors.startAt ? "true" : "false"}
                      aria-describedby={scheduleErrors.startAt ? "start-at-error" : undefined}
                    />
                    {scheduleErrors.startAt ? (
                      <p className="field-error" id="start-at-error">
                        {scheduleErrors.startAt}
                      </p>
                    ) : null}
                  </div>

                  <div className="field">
                    <label htmlFor="endAt">End At</label>
                    <input
                      id="endAt"
                      name="endAt"
                      type="datetime-local"
                      value={scheduleValues.endAt}
                      onChange={handleScheduleChange}
                      disabled={!isDraft}
                      aria-invalid={scheduleErrors.endAt ? "true" : "false"}
                      aria-describedby={scheduleErrors.endAt ? "end-at-error" : undefined}
                    />
                    {scheduleErrors.endAt ? (
                      <p className="field-error" id="end-at-error">
                        {scheduleErrors.endAt}
                      </p>
                    ) : null}
                  </div>
                </div>

                {!isDraft ? (
                  <div className="schedule-summary" aria-label="Published schedule">
                    <div className="detail-row">
                      <span>Start At</span>
                      <strong>{formatDateTime(exam.startAt)}</strong>
                    </div>
                    <div className="detail-row">
                      <span>End At</span>
                      <strong>{formatDateTime(exam.endAt)}</strong>
                    </div>
                  </div>
                ) : null}

                <div className="form-actions">
                  {isDraft ? (
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={isPublishing || !scheduleValues.startAt || !scheduleValues.endAt}
                    >
                      {isPublishing ? "Publishing..." : "Publish exam"}
                    </button>
                  ) : null}
                  {isActive ? (
                    <button className="secondary-button" type="button" onClick={handleArchive} disabled={!canArchive || isArchiving}>
                      {isArchiving ? "Archiving..." : "Archive exam"}
                    </button>
                  ) : null}
                </div>
              </form>
            ) : null}
          </>
        ) : (
          <p className="empty-state">Exam not found.</p>
        )}
      </section>
    </main>
  );
}
