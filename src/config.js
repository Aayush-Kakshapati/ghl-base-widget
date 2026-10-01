const trimSlash = (value) => String(value || "").replace(/\/+$/, "");

// Same base URL your React app uses (VITE_API_BASE_URL).
export const API_BASE_URL = trimSlash(import.meta.env.VITE_API_BASE_URL);

// Same `/google_review/` prefix as src/constants/api_endpoints.js in the React app.
export const ENDPOINTS = {
  installation: `${API_BASE_URL}/google_review/installation/`,
};

export const INSTALLATION_URL = ENDPOINTS.installation;
