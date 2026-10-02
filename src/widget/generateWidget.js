import { createHtml } from "./createHtml.js";
import { createCss } from "./createCss.js";
import { createJs } from "./createJs.js";
import { ENDPOINTS } from "../config.js";

function createElementId() {
  return `ghl-rw-${Math.random().toString(36).slice(2, 10)}`;
}

// Returns the same { html, js, elementStore } payload your previous widget
// sent to HighLevel.
//
// elementStore is what HighLevel saves and hands back on reload, so it only
// holds identifiers: location_id and widget_setting_id (the two values the user
// pastes from the Installation page) plus element_id (just the DOM id).
// Reviews and settings are NEVER baked in: script.js fetches them fresh from
// /installation/ on every page view.
export function generateWidget({
  location_id,
  widget_setting_id,
  element_id,
  get_web_widget_data_url = ENDPOINTS.getWebWidgetData,
}) {
  const elementId = element_id || createElementId();
  const elementStore = {
    location_id,
    widget_setting_id,
    element_id: elementId,
  };

  const config = {
    element_id: elementId,
    location_id,
    widget_setting_id,
    get_web_widget_data_url,
  };

  return {
    html: `<style>\n${createCss()}\n</style>\n${createHtml(elementId)}`,
    js: createJs(config),
    elementStore,
  };
}
