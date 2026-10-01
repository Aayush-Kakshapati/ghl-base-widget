import * as realGhl from "./ghl.js";
import { generateWidget } from "./widget/generateWidget.js";
import { InstallationError, isUuid, verifyInstallation } from "./installation.js";
import { API_BASE_URL } from "./config.js";

const PREVIEW_POLL_MS = 5000;

/* ---------- tiny DOM helpers (builder UI only; the widget itself uses jQuery) ---------- */

function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function field(id, label, placeholder) {
  const wrap = h("div", "field");
  const labelEl = h("label", "", label);
  labelEl.htmlFor = id;
  const input = h("input");
  Object.assign(input, {
    id,
    name: id,
    type: "text",
    placeholder,
    autocomplete: "off",
    spellcheck: false,
  });
  wrap.append(labelEl, input);
  return { wrap, input };
}

function summaryRow(label, value) {
  const row = h("div", "summary-row");
  row.append(h("dt", "", label), h("dd", "", value));
  return row;
}

const DISPLAY_TYPE_LABELS = {
  list: "List",
  grid: "Grid",
  carousel: "Carousel",
  floating: "Floating",
  card: "Card",
  rating_badge: "Rating badge",
};

// Renders what GET /installation/ returned: place + the saved widget_settings.
function renderSummary(box, { place, widget_settings: s }) {
  const rows = [
    summaryRow("Place", place?.title || "—"),
    summaryRow(
      "Rating",
      place?.rating ? `${Number(place.rating).toFixed(1)} ★ (${place.rating_count ?? 0} reviews)` : "—",
    ),
    summaryRow("Display type", DISPLAY_TYPE_LABELS[s.display_type] || s.display_type || "—"),
    summaryRow("Minimum rating shown", s.min_rating ? `${s.min_rating}★ and up` : "Any"),
    summaryRow("Max reviews", s.max_reviews > 0 ? s.max_reviews : "Unlimited"),
    summaryRow("Review text", s.show_reviews_with_text ? "Text reviews only" : "All reviews"),
  ];

  const swatches = h("div", "swatches");
  [
    ["Background", s.background_color],
    ["Text", s.text_color],
    ["Star", s.star_color],
    ["Border", s.border_color],
  ].forEach(([label, color]) => {
    if (!color) return;
    const chip = h("span", "swatch");
    chip.style.setProperty("--swatch-color", color);
    chip.title = `${label}: ${color}`;
    swatches.append(chip);
  });

  const dl = h("dl", "summary");
  dl.append(...rows);
  box.replaceChildren(h("h2", "", "Widget settings"), dl, swatches);
}

/*
 * The builder is a small form. The user opens "Installation" in the React app,
 * copies the Location ID and the Widget ID, and pastes them here. We check them
 * against GET /installation/ and only then send the widget to HighLevel, so a
 * typo never replaces a working widget.
 *
 * `ghl` is injectable so tests can run without HighLevel.
 */
export async function startBuilder(app, { ghl = realGhl } = {}) {
  if (!API_BASE_URL) {
    app.replaceChildren(
      h("p", "status is-error", "VITE_API_BASE_URL is not set. Copy .env.example to .env and set it."),
    );
    return;
  }

  const saved = await ghl.getElementStore(); // ids saved by HighLevel from an earlier session
  let elementId = saved?.element_id;
  let applied = false;

  const location = field("location_id", "Location ID", "Paste from the Installation page");
  const setting = field("widget_setting_id", "Widget ID", "Paste from the Installation page");
  location.input.value = saved?.location_id || "";
  setting.input.value = saved?.widget_setting_id || "";

  const button = h("button", "", "Apply");
  button.type = "submit";
  const status = h("p", "status");
  status.setAttribute("role", "status");
  const summaryBox = h("div", "summary-box");
  const previewBox = h("div", "preview-box");

  const form = h("form", "form");
  form.noValidate = true;
  form.append(location.wrap, setting.wrap, button);

  app.replaceChildren(
    h("h1", "", "Google Reviews Widget"),
    h(
      "p",
      "hint",
      'In the app, open "Installation" and copy your Location ID and Widget ID into the fields below.',
    ),
    form,
    status,
    summaryBox,
    previewBox,
  );

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = `status ${kind || ""}`.trim();
  }

  // Built once per element and left running: its own script.js polls
  // /installation/ on an interval, so saving settings in the React app shows
  // up here without re-pressing Apply. poll_ms is local-preview only — the
  // widget object sent to HighLevel via sendToGHL never gets it.
  function showPreview(location_id, widget_setting_id, elementId) {
    const previewWidget = generateWidget({
      location_id,
      widget_setting_id,
      element_id: elementId,
      poll_ms: PREVIEW_POLL_MS,
    });

    const iframe = h("iframe", "preview");
    iframe.title = "Widget preview";
    iframe.srcdoc =
      `<!DOCTYPE html><html><head><meta charset="UTF-8">` +
      `<style>body{margin:0;padding:12px;font-family:sans-serif}</style></head>` +
      `<body>${previewWidget.html}<script>${previewWidget.js}<\/script></body></html>`;

    const liveNote = h("p", "live-note", `Live preview — refreshes every ${PREVIEW_POLL_MS / 1000}s`);
    const refreshBtn = h("button", "refresh-btn", "Refresh now");
    refreshBtn.type = "button";
    refreshBtn.addEventListener("click", () => showPreview(location_id, widget_setting_id, elementId));

    previewBox.replaceChildren(h("h2", "", "Preview"), liveNote, refreshBtn, iframe);
  }

  async function apply() {
    const location_id = location.input.value.trim();
    const widget_setting_id = setting.input.value.trim();

    if (!location_id || !widget_setting_id) {
      return setStatus(new InstallationError("missing_identifiers").message, "is-error");
    }
    if (!isUuid(widget_setting_id)) {
      return setStatus(
        "The Widget ID should look like 0b1d6c2e-0000-4000-8000-000000000001. Copy it again from the Installation page.",
        "is-error",
      );
    }

    button.disabled = true;
    setStatus("Checking…", "is-busy");
    try {
      const data = await verifyInstallation(location_id, widget_setting_id);
      const widget = generateWidget({ location_id, widget_setting_id, element_id: elementId });
      elementId = widget.elementStore.element_id;

      ghl.sendToGHL(widget);
      applied = true;
      renderSummary(summaryBox, data);
      showPreview(location_id, widget_setting_id, elementId);
      setStatus("Connected. The preview below is what will appear on your page.", "is-ok");
    } catch (err) {
      console.error(err);
      const message = err instanceof InstallationError ? err.message : "Something went wrong.";
      setStatus(applied ? `${message} Your previous widget is unchanged.` : message, "is-error");
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    apply();
  });

  // Reopened an already-configured element: re-check and show it.
  if (saved?.location_id && saved?.widget_setting_id) await apply();
}
