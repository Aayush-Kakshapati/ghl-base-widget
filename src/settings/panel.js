import { h } from "./dom.js";
import { createAutosaver } from "./autosave.js";
import { CSS_COMPONENTS, DISPLAY_TYPE_LABELS, SECTIONS, TABS } from "./schema.js";

/* ----------------------------- value helpers ----------------------------- */

const display = (settings, def) => settings[def.key] ?? def.default ?? "";

// <input type="color"> only understands #rrggbb.
function toHex6(value, fallback = "#000000") {
  const v = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(v);
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : fallback;
}

let uid = 0;
const nextId = (prefix) => `${prefix}-${++uid}`;

function labelled(def, input) {
  const wrap = h("div", "sp-control");
  const label = h("label", "sp-label", def.label);
  if (input.id) label.htmlFor = input.id;
  wrap.append(label);
  return wrap;
}

/* ------------------------------- controls -------------------------------- */
/* Each builder returns { el, update(settings, force) }. `ctx.set(fields, opts)`
 * records a change: it updates local state immediately and queues the PATCH. */

function buildSegmented(def, ctx) {
  const wrap = h("div", "sp-control");
  wrap.append(h("span", "sp-label", def.label));
  const row = h("div", "sp-segmented");
  row.style.setProperty("--cols", Math.min(def.options.length, 4));

  const buttons = def.options.map((opt) => {
    const b = h("button", "sp-seg", opt.label);
    b.type = "button";
    b.addEventListener("click", () => ctx.set({ [def.key]: opt.value }, { immediate: true }));
    row.append(b);
    return { b, value: opt.value };
  });
  wrap.append(row);

  return {
    el: wrap,
    update(s) {
      const current = display(s, def);
      buttons.forEach(({ b, value }) => {
        const on = current === value;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
    },
  };
}

function buildSelect(def, ctx) {
  const select = h("select", "sp-select");
  select.id = nextId("sp-select");
  def.options.forEach((opt) => {
    const o = h("option", "", opt.label);
    o.value = String(opt.value);
    select.append(o);
  });
  select.addEventListener("change", () => {
    const opt = def.options.find((o) => String(o.value) === select.value);
    if (opt) ctx.set({ [def.key]: opt.value }, { immediate: true });
  });
  const wrap = labelled(def, select);
  wrap.append(select);
  return {
    el: wrap,
    update(s) {
      select.value = String(display(s, def));
    },
  };
}

function buildToggleRow(def, { checked, onToggle }) {
  const row = h("div", "sp-toggle-row");
  const text = h("div");
  text.append(h("p", "sp-toggle-title", def.label), h("p", "sp-help", def.description));
  const sw = h("button", "sp-switch");
  sw.type = "button";
  sw.setAttribute("role", "switch");
  sw.setAttribute("aria-label", def.label);
  sw.addEventListener("click", () => onToggle());
  sw.append(h("span", "sp-switch-knob"));
  row.append(text, sw);
  return {
    el: row,
    sync(on) {
      sw.setAttribute("aria-checked", String(on));
      sw.classList.toggle("is-on", on);
    },
  };
}

function buildToggle(def, ctx) {
  const row = buildToggleRow(def, {
    onToggle: () => ctx.set({ [def.key]: !ctx.settings[def.key] }, { immediate: true }),
  });
  return { el: row.el, update: (s) => row.sync(Boolean(s[def.key])) };
}

function buildRange(def, ctx) {
  const input = h("input", "sp-range");
  Object.assign(input, { type: "range", min: def.min, max: def.max, step: def.step || 1 });
  input.id = nextId("sp-range");

  const wrap = h("div", "sp-control");
  const head = h("div", "sp-range-head");
  const label = h("label", "sp-label", def.label);
  label.htmlFor = input.id;
  const value = h("span", "sp-range-value");
  head.append(label, value);
  const bounds = h("div", "sp-range-bounds");
  const suffix = def.suffix ? ` ${def.suffix}` : "";
  bounds.append(h("span", "", `${def.min}${suffix}`), h("span", "", `${def.max}${suffix}`));
  wrap.append(head, input, bounds);

  input.addEventListener("input", () => {
    const n = Math.min(Math.max(Number(input.value), def.min), def.max);
    if (Number.isNaN(n)) return;
    value.textContent = `${n}${suffix}`;
    ctx.set({ [def.key]: n });
  });

  return {
    el: wrap,
    update(s) {
      const n = Number(display(s, def));
      const shown = Number.isFinite(n) ? Math.min(Math.max(n, def.min), def.max) : def.min;
      input.value = String(shown);
      value.textContent = `${shown}${suffix}`;
    },
  };
}

function buildColor(def, ctx) {
  const wrap = h("div", "sp-control");
  const id = nextId("sp-color");
  const row = h("div", "sp-color-row");
  const picker = h("input", "sp-color-picker");
  picker.type = "color";
  picker.setAttribute("aria-label", `${def.label} color`);
  const text = h("input", "sp-color-text");
  Object.assign(text, { type: "text", id, spellcheck: false, autocomplete: "off", maxLength: 20 });
  row.append(picker, text);

  const label = h("label", "sp-label", def.label);
  label.htmlFor = id;
  wrap.append(label, row);

  let reset = null;
  if (def.resetLabel) {
    reset = h("button", "sp-link", def.resetLabel);
    reset.type = "button";
    reset.addEventListener("click", () => ctx.set({ [def.key]: "" }, { immediate: true }));
    wrap.append(reset);
  }
  const error = h("p", "sp-field-error");
  wrap.append(error);

  picker.addEventListener("input", () => {
    error.textContent = "";
    text.value = picker.value;
    ctx.set({ [def.key]: picker.value });
  });

  // Free text is committed on blur/Enter so half-typed colors are never sent.
  text.addEventListener("change", () => {
    const v = text.value.trim();
    if (!v && !def.allowBlank) {
      error.textContent = "Enter a color.";
      return;
    }
    error.textContent = "";
    picker.value = toHex6(v, picker.value);
    ctx.set({ [def.key]: v }, { immediate: true });
  });

  return {
    el: wrap,
    update(s, force) {
      const saved = s[def.key] ?? def.default ?? "";
      const effective = saved || (def.fallbackKey ? s[def.fallbackKey] : "") || "";
      if (force || document.activeElement !== text) text.value = saved;
      text.placeholder = def.fallbackKey ? String(s[def.fallbackKey] || "") : "";
      picker.value = toHex6(effective);
      if (reset) reset.hidden = !saved;
    },
  };
}

function buildMaxReviews(def, ctx) {
  // Same limits as the admin: up to 25, and no more than the place actually has.
  const available = Number(ctx.place?.rating_count);
  const max = Number.isFinite(available) ? Math.min(Math.max(available, 1), 25) : 25;
  const min = Math.min(6, max);

  const select = h("select", "sp-select");
  select.id = nextId("sp-max");
  for (let n = min; n <= max; n++) {
    const o = h("option", "", String(n));
    o.value = String(n);
    select.append(o);
  }
  select.addEventListener("change", () => ctx.set({ [def.key]: Number(select.value) }, { immediate: true }));

  const wrap = labelled(def, select);
  wrap.append(select, h("p", "sp-help", `${max.toLocaleString()} reviews available`));
  return {
    el: wrap,
    update(s) {
      select.value = String(Math.min(Math.max(s[def.key] ?? 12, min), max));
    },
  };
}

function buildCustomHeight(def, ctx) {
  const wrap = h("div", "sp-stack");
  const toggle = buildToggleRow(def, {
    onToggle: () => {
      const on = !ctx.settings.enable_custom_height;
      ctx.set(
        { enable_custom_height: on, viewport_height: on ? (ctx.settings.viewport_height ?? 300) : null },
        { immediate: true },
      );
    },
  });

  const field = h("div", "sp-control");
  const id = nextId("sp-height");
  const label = h("label", "sp-label", "Set the height");
  label.htmlFor = id;
  const row = h("div", "sp-inline");
  const input = h("input", "sp-number");
  Object.assign(input, { type: "number", min: 200, step: 1, placeholder: "Auto", id });
  row.append(input, h("span", "sp-unit", "px"));
  field.append(label, row, h("p", "sp-help", "Enter a value between 300px and 600px for the best view."));

  input.addEventListener("input", () => {
    const raw = input.value;
    ctx.set({ viewport_height: raw === "" ? null : Number(raw) });
  });

  wrap.append(toggle.el, field);
  return {
    el: wrap,
    update(s, force) {
      const on = Boolean(s.enable_custom_height);
      toggle.sync(on);
      field.hidden = !on;
      if (force || document.activeElement !== input) input.value = s.viewport_height ?? "";
    },
  };
}

function buildCustomCss(def, ctx) {
  const wrap = h("div", "sp-css");
  wrap.append(
    h("label", "sp-label", def.label),
    h("p", "sp-help", "Select a component to add its CSS selector."),
  );

  const chips = h("div", "sp-chips");
  let selected = "";
  const area = h("textarea", "sp-textarea");
  Object.assign(area, { rows: 8, spellcheck: false, placeholder: ".ghl-rw-card {\n  \n}" });
  area.setAttribute("aria-label", def.label);

  CSS_COMPONENTS.forEach(({ label, selector }) => {
    const chip = h("button", "sp-chip", label);
    chip.type = "button";
    chip.addEventListener("click", () => {
      selected = selector;
      chips.querySelectorAll(".sp-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      const current = area.value.trimEnd();
      area.value = `${current}${current ? "\n\n" : ""}.${selector} {\n  \n}`;
      ctx.set({ [def.key]: area.value }, { immediate: true });
    });
    chips.append(chip);
  });

  area.addEventListener("input", () => ctx.set({ [def.key]: area.value }));
  wrap.append(chips, area);
  return {
    el: wrap,
    update(s, force) {
      if (force || document.activeElement !== area) area.value = s[def.key] ?? "";
    },
  };
}

function buildSubhead(def) {
  return { el: h("h3", "sp-subhead", def.title), update() {} };
}

const BUILDERS = {
  segmented: buildSegmented,
  select: buildSelect,
  toggle: buildToggle,
  range: buildRange,
  color: buildColor,
  maxReviews: buildMaxReviews,
  customHeight: buildCustomHeight,
  customCss: buildCustomCss,
  subhead: buildSubhead,
};

/* -------------------------------- the panel ------------------------------- */

const STATUS_TEXT = {
  idle: "All changes saved",
  pending: "Unsaved changes…",
  saving: "Saving changes…",
  saved: "All changes saved",
  error: "Could not save",
};

/*
 * createSettingsPanel({ settings, place, save, onSaved })
 *   settings  widget_settings from the installation response (DB values)
 *   place     the Google place (used for the review-count limit)
 *   save      async (changedFields) => savedSettings   (PATCH to the API)
 *   onSaved   called after a save succeeds and nothing else is queued
 *
 * Returns { el, autosaver }. Nothing is stored in GHL's elementStore: the
 * database stays the source of truth and the widget re-fetches it.
 */
export function createSettingsPanel({ settings, place, save, onSaved = () => {} }) {
  const state = { settings: { ...settings }, confirmed: { ...settings }, tab: TABS[0].id };

  const root = h("section", "sp");

  /* header */
  const head = h("div", "sp-head");
  const title = h("div");
  const layout = DISPLAY_TYPE_LABELS[state.settings.display_type] || state.settings.display_type || "—";
  title.append(
    h("h2", "sp-title", "Widget settings"),
    h("p", "sp-sub", `Layout: ${layout}${place?.title ? ` · ${place.title}` : ""}`),
  );
  const status = h("span", "sp-status");
  status.setAttribute("role", "status");
  head.append(title, status);

  function setStatus(kind, message) {
    status.className = `sp-status is-${kind}`;
    status.textContent = kind === "error" ? message || STATUS_TEXT.error : STATUS_TEXT[kind];
  }
  setStatus("idle");

  /* controls */
  const entries = []; // { def, section, built }
  const sectionEls = [];

  const ctx = {
    place,
    get settings() {
      return state.settings;
    },
    set(fields, opts) {
      Object.assign(state.settings, fields);
      refresh();
      autosaver.queue(fields, opts);
    },
  };

  /* tabs */
  const tabBar = h("div", "sp-tabs");
  tabBar.setAttribute("role", "tablist");
  const tabButtons = TABS.map((t) => {
    const b = h("button", "sp-tab", t.label);
    b.type = "button";
    b.setAttribute("role", "tab");
    b.addEventListener("click", () => {
      state.tab = t.id;
      refresh();
    });
    tabBar.append(b);
    return { b, id: t.id };
  });

  const body = h("div", "sp-body");
  SECTIONS.forEach((section) => {
    const el = h("div", "sp-section");
    el.dataset.tab = section.tab;
    el.append(h("h3", "sp-section-title", section.title), h("p", "sp-help", section.description));
    section.controls.forEach((def) => {
      const built = BUILDERS[def.type](def, ctx);
      entries.push({ def, section, built });
      el.append(built.el);
    });
    sectionEls.push({ section, el });
    body.append(el);
  });

  function refresh(force = false) {
    const s = state.settings;
    tabButtons.forEach(({ b, id }) => {
      b.classList.toggle("is-active", id === state.tab);
      b.setAttribute("aria-selected", String(id === state.tab));
    });
    sectionEls.forEach(({ section, el }) => {
      el.hidden = section.tab !== state.tab || (section.when ? !section.when(s) : false);
    });
    entries.forEach(({ def, built }) => {
      built.el.hidden = def.when ? !def.when(s) : false;
      built.update(s, force);
    });
  }

  /* saving */
  const autosaver = createAutosaver({
    // Remember what the DB confirmed so a failed save can roll back to it.
    save: async (batch) => {
      const saved = await save(batch);
      state.confirmed = { ...state.confirmed, ...saved };
      return saved;
    },
    onStatus: setStatus,
    onSaved() {
      // Adopt what the server stored (it may normalise values), like the admin.
      state.settings = { ...state.confirmed };
      refresh();
      onSaved(state.confirmed);
    },
    onError(_err, batch, stillPending) {
      // Roll back what failed so the panel never shows values the DB doesn't have.
      Object.keys(batch).forEach((key) => {
        if (!stillPending.includes(key)) state.settings[key] = state.confirmed[key];
      });
      refresh(true);
    },
  });

  root.append(head, tabBar, body);
  refresh(true);
  return { el: root, autosaver };
}
