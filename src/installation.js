import { GET_WEB_WIDGET_DATA } from "./config.js";

// The Installation page in the React app shows `location_id` and
// `widget_settings.id`; the user pastes both into the builder form.
// widget_settings.id is a UUID and the API 500s on malformed ones, so check it here first.
export const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Error `code`s come from InstallationView in the Django API.
const MESSAGES = {
  missing_identifiers: "Enter both the Location ID and the Widget ID.",
  invalid_location:
    "That Location ID was not found. Copy it again from the Installation page in the app.",
  invalid_widget_settings:
    "That Widget ID does not belong to this Location ID. Copy both values again from the Installation page.",
  place_not_connected:
    "No Google place is connected to this location yet. Connect one in the app, then try again.",
  network: "Could not reach the server. Check your connection and try again.",
  server: "The server returned an error. Try again in a moment.",
  fallback: "Could not load the widget data.",
};

export class InstallationError extends Error {
  constructor(code) {
    super(MESSAGES[code] || MESSAGES.fallback);
    this.code = code;
  }
}

// GET /installation/ -> { place, widget_settings, reviews }. Throws InstallationError.
export async function verifyInstallation(location_id, widget_setting_id) {
  const query = new URLSearchParams({ location_id, widget_setting_id });

  let res;
  try {
    res = await fetch(`${GET_WEB_WIDGET_DATA}?${query}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new InstallationError("network");
  }

  const data = await res.json().catch(() => null); // a 500 page is HTML, not JSON
  if (res.ok && data) return data;

  if (data?.code && MESSAGES[data.code]) throw new InstallationError(data.code);
  throw new InstallationError(res.status >= 500 ? "server" : "fallback");
}
