import { useEffect, useRef, useState } from "react";
import Icon from "./Icons.jsx";

export default function GlobalApiErrorToast() {
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    function handleApiError(event) {
      window.clearTimeout(timeoutRef.current);
      setError(event.detail || { message: "Something went wrong." });
      timeoutRef.current = window.setTimeout(() => setError(null), 7000);
    }

    window.addEventListener("online-exam:api-error", handleApiError);
    return () => {
      window.removeEventListener("online-exam:api-error", handleApiError);
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!error) {
    return null;
  }

  return (
    <div className="global-api-error" role="alert">
      <Icon name="warning" size={18} />
      <div>
        <strong>{error.status ? `Request failed (${error.status})` : "Connection problem"}</strong>
        <span>{error.message}</span>
        {error.requestId ? <small>Request ID: {error.requestId}</small> : null}
      </div>
      <button type="button" aria-label="Dismiss error" onClick={() => setError(null)}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}
