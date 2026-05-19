const statusMessages = {
  400: "Please check the request and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource could not be found.",
  409: "This action conflicts with the current data.",
  415: "The request format is not supported.",
  429: "Too many attempts. Please wait and try again.",
  500: "The server ran into a problem. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly."
};

export function normalizeApiError(error, fallback = "Something went wrong. Please try again.") {
  const status = error?.response?.status || 0;
  const data = error?.response?.data || {};
  const isTimeout = error?.code === "ECONNABORTED";
  const isNetworkError = !error?.response && Boolean(error?.request);
  const message =
    data.message ||
    (isTimeout ? "The request timed out. Please try again." : "") ||
    (isNetworkError ? "Unable to reach the server. Check your connection and try again." : "") ||
    statusMessages[status] ||
    fallback;

  error.status = status;
  error.userMessage = message;
  error.fieldErrors = data.errors || {};
  error.requestId = data.requestId || "";
  error.isTimeout = isTimeout;
  error.isNetworkError = isNetworkError;

  return error;
}

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return error?.userMessage || error?.response?.data?.message || fallback;
}

export function getApiFieldErrors(error) {
  return error?.fieldErrors || error?.response?.data?.errors || {};
}

export function shouldShowGlobalApiError(error) {
  return error?.isNetworkError || error?.isTimeout || Number(error?.status || 0) >= 500;
}
