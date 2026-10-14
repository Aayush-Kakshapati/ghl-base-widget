import { API_BASE_URL } from "../config.js";

/*
 * Same endpoint the admin app's apiService.updateWidgetSettings(location_id, fields)
 * uses: PATCH with the location id and changed fields, answered with the saved settings.
 * Override with VITE_WIDGET_SETTINGS_URL if your API is mounted at a different URL.
 */
const WIDGET_SETTINGS_URL =
  import.meta.env.VITE_WIDGET_SETTINGS_URL ||
  `${API_BASE_URL}/google-review/widget-settings/`;

export const widgetSettingsUrl = () => WIDGET_SETTINGS_URL;

export class SettingsSaveError extends Error {}

// DRF validation errors look like { field: ["message"] } (or { detail: "..." }).
function describe(status, data) {
  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    const [field, messages] = Object.entries(data)[0] || [];
    if (field) {
      const text = Array.isArray(messages) ? messages[0] : messages;
      return `${field.replace(/_/g, " ")}: ${text}`;
    }
  }
  return status >= 500
    ? "The server returned an error. Your change was not saved."
    : "Could not save this change.";
}

// PATCH changed fields -> the full saved widget settings. Throws SettingsSaveError.
export async function updateWidgetSettings(location_id, fields) {
  let res;
  try {
    res = await fetch(widgetSettingsUrl(), {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, location_id }),
    });
  } catch {
    throw new SettingsSaveError("Could not reach the server. Your change was not saved.");
  }

  const data = await res.json().catch(() => null); // a 500 page is HTML, not JSON
  if (res.ok && data) return data.widget_settings || data;
  throw new SettingsSaveError(describe(res.status, data));
}
