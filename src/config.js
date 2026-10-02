const trimSlash = (value) => String(value || "").replace(/\/+$/, "");

// Same base URL your React app uses (VITE_API_BASE_URL).
export const API_BASE_URL = trimSlash(import.meta.env.VITE_API_BASE_URL);

// Same `/google_review/` prefix as src/constants/api_endpoints.js in the React app.
export const ENDPOINTS = {
  getWebWidgetData: `${API_BASE_URL}/google-review/web-widget/data/`,
};

export const GET_WEB_WIDGET_DATA = ENDPOINTS.getWebWidgetData;
