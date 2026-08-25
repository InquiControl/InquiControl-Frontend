const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function getToken() {
  return localStorage.getItem("inquicontrol_token") || sessionStorage.getItem("inquicontrol_token");
}

/**
 * Llama a la API de InquiControl.
 * @param {string} path - ej. "/api/properties"
 * @param {{method?: string, body?: object, auth?: boolean}} options
 */
export async function apiFetch(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message = (data && data.message) || `Error ${response.status}`;
    if (response.status === 401 && auth && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("inquicontrol:unauthorized"));
    }
    throw new ApiError(message, response.status, data);
  }

  return data;
}
