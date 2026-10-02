// Runs the REAL generated widget (html + js) and the REAL builder form in jsdom
// against a local mock of GET /google_review/installation/.
// No HighLevel, browser or real API needed:   npm test
import http from "node:http";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { JSDOM } from "jsdom";
import jqueryFactory from "jquery";

const LOCATION = "loc_123";
const SETTING = "0b1d6c2e-0000-4000-8000-000000000001";

const baseSettings = {
  id: SETTING,
  display_type: "list",
  background_color: "#fafafa",
  text_color: "#111111",
  star_color: "#ff0000",
  border_color: "#cccccc",
  card_padding: 20,
  font_size: 15,
  grid_spacing: 8,
  min_rating: 4,
  show_reviews_with_text: true,
  max_reviews: 2,
  loading_choice: "scroll",
  review_text_display: "scroll",
  review_text_limit: 10,
};
const reviews = [
  { id: "1", rating: 5, name: "Alice", review: "Great!", thumbnail: "https://example.com/a.png", link: "https://g.co/1" },
  { id: "2", rating: 2, name: "Low rating", review: "Nope" },                    // filtered: min_rating
  { id: "3", rating: 5, name: "No text", review: "" },                           // filtered: no text
  { id: "4", rating: 4, name: "Bob", review: "<img src=x onerror=window.__pwned=1>", link: "javascript:alert(1)" },
  { id: "5", rating: 5, name: "Carol", review: "Cut by max_reviews" },           // cut: max_reviews
];
const place = { id: "p1", place_id: "cid1", title: "Acme Dental", rating: "4.7", rating_count: 120, location: LOCATION };

// ---- mock /installation/ (same error codes as InstallationView) ----
let overrides = {};
let requests = [];
let forced = null; // { status, body } to force a response
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  requests.push(Object.fromEntries(url.searchParams));
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  if (forced) {
    res.statusCode = forced.status;
    return res.end(forced.raw ?? JSON.stringify(forced.body));
  }
  res.end(JSON.stringify({
    place,
    widget_settings: { ...baseSettings, ...overrides },
    reviews: overrides.__reviews || reviews,
  }));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const installation_url = `http://127.0.0.1:${port}/google_review/installation/`;

const vite = await createServer({
  server: { middlewareMode: true }, appType: "custom", logLevel: "silent",
  define: {
    "import.meta.env.DEV": "false",
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(`http://127.0.0.1:${port}`),
  },
});
const { generateWidget } = await vite.ssrLoadModule("/src/widget/generateWidget.js");

const openWindows = [];
function boot(widget, { withJQuery = true, scrollHeight } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>${widget.html}</body></html>`, {
    url: "https://customer-site.example/",
    runScripts: "outside-only",
  });
  const { window } = dom;
  if (scrollHeight !== undefined) {
    Object.defineProperty(window.HTMLElement.prototype, "scrollHeight", { get: () => scrollHeight });
  }
  if (withJQuery) window.jQuery = window.$ = jqueryFactory(window);
  window.eval(widget.js);
  openWindows.push(window);
  return dom;
}
const waitFor = async (fn, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (fn()) return; await new Promise((r) => setTimeout(r, 20)); }
  throw new Error("timed out waiting for condition");
};

let failed = 0;
async function test(name, fn) {
  overrides = {}; requests = []; forced = null;
  try { await fn(); console.log("  ok  ", name); }
  catch (e) { failed++; console.log("  FAIL", name, "\n      ", e.message); }
  // jsdom windows with autoplay timers keep firing after a test ends unless stopped first.
  while (openWindows.length) {
    const window = openWindows.pop();
    try {
      window.document.body.innerHTML = ""; // triggers the widget's own MutationObserver cleanup
      await new Promise((r) => setTimeout(r, 10));
    } finally {
      window.close();
    }
  }
}
const widget = generateWidget({ location_id: LOCATION, widget_setting_id: SETTING, installation_url });
async function render(o = {}, bootOpts) {
  overrides = o;
  const dom = boot(widget, bootOpts);
  const doc = dom.window.document;
  await waitFor(() => doc.querySelector(".ghl-rw-header"));
  return { dom, doc, win: dom.window };
}

console.log("\nwidget");
await test("generateWidget returns html/js/elementStore with ids only", () => {
  assert.deepEqual(Object.keys(widget).sort(), ["elementStore", "html", "js"]);
  assert.deepEqual(Object.keys(widget.elementStore).sort(), ["element_id", "location_id", "widget_setting_id"]);
  assert.ok(widget.html.includes(`id="${widget.elementStore.element_id}"`));
  assert.ok(!widget.js.includes("Alice"), "reviews must not be baked in");
  assert.ok(!/<\/script/i.test(widget.js), "must be safe inside a <script> tag");
});

await test("element_id stays stable when passed back in", () => {
  const again = generateWidget({ location_id: LOCATION, widget_setting_id: SETTING, element_id: widget.elementStore.element_id });
  assert.equal(again.elementStore.element_id, widget.elementStore.element_id);
});

await test("fetches /installation/ with both ids; applies rating / text / max filters", async () => {
  const { doc } = await render();
  assert.deepEqual(requests[0], { location_id: LOCATION, widget_setting_id: SETTING });
  assert.deepEqual([...doc.querySelectorAll(".ghl-rw-name")].map((n) => n.textContent), ["Alice", "Bob"]);
  assert.equal(doc.querySelector(".ghl-rw-root").getAttribute("data-display-type"), "list");
});

await test("header matches PlaceHeading: name, Ratings (avg), stars, Reviews count", async () => {
  const { doc } = await render();
  assert.equal(doc.querySelector(".ghl-rw-place").textContent, "Acme Dental");
  const labels = [...doc.querySelectorAll(".ghl-rw-meta-label")].map((n) => n.textContent);
  assert.deepEqual(labels, ["Ratings (4.7)", "Reviews"]);
  assert.equal(doc.querySelector(".ghl-rw-count").textContent, "120");
  assert.equal(doc.querySelectorAll(".ghl-rw-meta .ghl-rw-star.is-on").length, 5); // round(4.7) = 5
});

await test("settings become CSS variables (numbers -> px)", async () => {
  const { doc } = await render();
  const st = doc.querySelector(".ghl-rw-root").style;
  assert.equal(st.getPropertyValue("--ghl-rw-bg"), "#fafafa");
  assert.equal(st.getPropertyValue("--ghl-rw-star"), "#ff0000");
  assert.equal(st.getPropertyValue("--ghl-rw-padding"), "20px");
  assert.equal(st.getPropertyValue("--ghl-rw-gap"), "8px");
  assert.equal(st.getPropertyValue("--ghl-rw-font-size"), "15px");
});

await test("review text is escaped and unsafe links are dropped (XSS)", async () => {
  const { doc, win } = await render();
  const [alice, bob] = doc.querySelectorAll(".ghl-rw-card");
  assert.equal(bob.querySelector(".ghl-rw-text").textContent, "<img src=x onerror=window.__pwned=1>");
  assert.equal(bob.querySelector(".ghl-rw-text img"), null);
  assert.equal(bob.querySelector(".ghl-rw-link"), null, "javascript: link must not render");
  assert.equal(win.__pwned, undefined);
  assert.equal(alice.querySelector(".ghl-rw-link").getAttribute("rel"), "noopener noreferrer");
});

await test("avatar: thumbnail uses no-referrer; falls back to the initial", async () => {
  const { doc } = await render();
  const [alice, bob] = doc.querySelectorAll(".ghl-rw-card");
  assert.equal(alice.querySelector("img.ghl-rw-avatar").getAttribute("referrerpolicy"), "no-referrer");
  assert.equal(bob.querySelector(".ghl-rw-avatar-initial").textContent, "B");
});

await test("review_text_display=truncate cuts at review_text_limit", async () => {
  const long = { id: "9", rating: 5, name: "Long", review: "abcdefghijklmnopqrstuvwxyz" };
  const { doc } = await render({ review_text_display: "truncate", review_text_limit: 10, __reviews: [long] });
  assert.equal(doc.querySelector(".ghl-rw-text").textContent, "abcdefghij...");
});

await test("review_text_display=read-more toggles Read More / Read Less", async () => {
  const long = { id: "9", rating: 5, name: "Long", review: "abcdefghijklmnopqrstuvwxyz" };
  const { doc } = await render({ review_text_display: "read-more", review_text_limit: 10, __reviews: [long] });
  const p = doc.querySelector(".ghl-rw-text");
  const btn = p.querySelector(".ghl-rw-readmore");
  assert.equal(btn.textContent, "Read More");
  assert.ok(p.textContent.startsWith("abcdefghij..."));
  btn.click();
  assert.equal(btn.textContent, "Read Less");
  assert.ok(p.textContent.includes("abcdefghijklmnopqrstuvwxyz"));
  btn.click();
  assert.equal(btn.textContent, "Read More");
});

await test("review_text_display=scroll (default) adds the scroll class", async () => {
  const { doc } = await render();
  assert.ok(doc.querySelector(".ghl-rw-text").classList.contains("is-scroll"));
});

await test("fixed_item_height sets 160px cards", async () => {
  const { doc } = await render({ fixed_item_height: true });
  assert.equal(doc.querySelector(".ghl-rw-card").style.height, "160px");
});

await test("enable_custom_height: fixed viewport_height and scrolls", async () => {
  const { doc } = await render({ enable_custom_height: true, viewport_height: 220 });
  const box = doc.querySelector(".ghl-rw-content");
  assert.equal(box.style.height, "220px");
  assert.ok(box.classList.contains("is-scroll"));
});

await test("loading_choice=view-more: clips to viewport_height and toggles", async () => {
  const { doc } = await render({ loading_choice: "view-more", viewport_height: 200 }, { scrollHeight: 900 });
  const box = doc.querySelector(".ghl-rw-content");
  const btn = doc.querySelector(".ghl-rw-toggle");
  assert.equal(box.style.height, "200px");
  assert.ok(box.classList.contains("is-clip"));
  assert.equal(btn.getAttribute("aria-label"), "View more reviews");
  btn.click();
  assert.equal(box.style.height, "auto");
  assert.ok(!box.classList.contains("is-clip"));
  assert.equal(btn.getAttribute("aria-label"), "View less reviews");
  btn.click();
  assert.equal(box.style.height, "200px");
});

await test("loading_choice=view-more: no toggle when content already fits", async () => {
  const { doc } = await render({ loading_choice: "view-more", viewport_height: 300 }, { scrollHeight: 100 });
  assert.equal(doc.querySelector(".ghl-rw-toggle"), null);
  assert.equal(doc.querySelector(".ghl-rw-content").style.height, "");
});

await test("unbuilt display_type falls back to list (with a warning)", async () => {
  const { doc } = await render({ display_type: "carousel" });
  assert.equal(doc.querySelector(".ghl-rw-root").getAttribute("data-display-type"), "carousel");
  assert.equal(doc.querySelectorAll(".ghl-rw-card").length, 2);
});

await test("card display renders the place summary", async () => {
  const { doc } = await render({ display_type: "card" });
  const card = doc.querySelector(".ghl-rw-card-widget");
  assert.ok(card);
  assert.equal(card.querySelector(".ghl-rw-card-widget-title").textContent, "Acme Dental");
  assert.equal(card.querySelector(".ghl-rw-card-widget-count").textContent, "120 reviews");
  assert.equal(card.querySelector(".ghl-rw-card-widget-average").textContent, "4.7");
});

await test("floating display renders a working review toggle", async () => {
  const { doc } = await render({ display_type: "floating" });
  const card = doc.querySelector(".ghl-rw-card-widget");
  const panel = doc.querySelector(".ghl-rw-pannel");
  assert.ok(card);
  assert.ok(panel);
  assert.equal(panel.style.display, "none");
  card.click();
  assert.notEqual(panel.style.display, "none");
  card.click();
  assert.equal(panel.style.display, "none");
});

await test("rating badge supports all configured positions", async () => {
  const positions = {
    "bottom-left": { bottom: "12px", left: "12px" },
    "bottom-right": { bottom: "12px", right: "12px" },
    "top-left": { top: "12px", left: "12px" },
    "top-right": { top: "12px", right: "12px" },
    left: { top: "50%", left: "12px", transform: "translateY(-50%)" },
    right: { top: "50%", right: "12px", transform: "translateY(-50%)" },
  };

  for (const [position, expected] of Object.entries(positions)) {
    const { doc, win } = await render({
      display_type: "rating_badge",
      floating_position: position,
    });
    const badge = doc.querySelector(".ghl-rw-badge");
    const style = win.getComputedStyle(badge);

    assert.ok(badge.classList.contains(`ghl-rw-badge--${position}`));
    assert.equal(style.position, "fixed");
    for (const [property, value] of Object.entries(expected)) {
      assert.equal(style[property], value, `${position} ${property}`);
    }
  }
});

await test("no reviews after filtering shows header + empty message", async () => {
  const { doc } = await render({ min_rating: 5, __reviews: [{ id: "1", rating: 1, name: "x", review: "bad" }] });
  assert.equal(doc.querySelector(".ghl-rw-status-empty").textContent, "No reviews to show yet.");
  assert.equal(doc.querySelector(".ghl-rw-count").textContent, "120");
});

await test("API error shows a neutral message (no internals leaked)", async () => {
  forced = { status: 404, body: { error: "No Google place is connected to this location", code: "place_not_connected" } };
  const dom = boot(widget);
  const doc = dom.window.document;
  await waitFor(() => doc.querySelector(".ghl-rw-status-error"));
  assert.equal(doc.querySelector(".ghl-rw-status-error").textContent, "Reviews are currently unavailable.");
});

await test("no jQuery on page: loads its own copy and does NOT take over window.$", async () => {
  overrides = {};
  const dom = boot(widget, { withJQuery: false });
  const { window } = dom;
  const script = window.document.head.querySelector("script[src*='jquery']");
  assert.ok(script, "should inject a jQuery <script>");
  assert.equal(window.jQuery, undefined);
  window.jQuery = window.$ = jqueryFactory(window); // simulate the CDN script arriving
  script.onload();
  assert.equal(window.jQuery, undefined, "page globals restored by noConflict");
  assert.equal(window.$, undefined);
  await waitFor(() => window.document.querySelector(".ghl-rw-card"));
});

await test("two widgets on one page share a single jQuery load and both render", async () => {
  const second = generateWidget({ location_id: LOCATION, widget_setting_id: SETTING, installation_url });
  const dom = new JSDOM(`<!doctype html><html><head></head><body>${widget.html}${second.html}</body></html>`,
    { url: "https://customer-site.example/", runScripts: "outside-only" });
  const { window } = dom;
  window.eval(widget.js);
  window.eval(second.js);
  const scripts = window.document.head.querySelectorAll("script[src*='jquery']");
  assert.equal(scripts.length, 1, "jQuery must be requested once, not per widget");
  window.jQuery = window.$ = jqueryFactory(window);
  scripts[0].onload();
  await waitFor(() => window.document.querySelectorAll(".ghl-rw-root .ghl-rw-card").length === 4);
});


await test("widget loads once and does not include background polling", async () => {
  const dom = boot(widget);
  await waitFor(() => dom.window.document.querySelector(".ghl-rw-card"));
  assert.equal(requests.length, 1);
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(requests.length, 1, "no extra requests happen without an explicit refresh");
  assert.doesNotMatch(widget.js, /poll_ms|ghlRwSetupPolling/);
});

/* ------------------------------------------------------------------ builder form */
console.log("\nbuilder form");
const bdom = new JSDOM(`<!doctype html><body></body>`, { url: "http://localhost:5173/", pretendToBeVisual: true });
globalThis.window = bdom.window;
globalThis.document = bdom.window.document;
Object.defineProperty(globalThis, "navigator", { value: bdom.window.navigator, configurable: true });
const { startBuilder } = await vite.ssrLoadModule("/src/builder.js");

function fakeGhl(saved = null) {
  return { sent: [], getElementStore: async () => saved, sendToGHL(w) { this.sent.push(w); } };
}
async function mount(saved) {
  const app = document.createElement("div");
  document.body.append(app);
  const ghl = fakeGhl(saved);
  await startBuilder(app, { ghl });
  const $ = (sel) => app.querySelector(sel);
  const submit = async (loc, id) => {
    $("#location_id").value = loc;
    $("#widget_setting_id").value = id;
    $("form").requestSubmit();
    await waitFor(() => $(".status").textContent && !$(".status").classList.contains("is-busy"));
  };
  return { app, ghl, $, submit };
}

await test("shows the two fields with the Installation-page labels", async () => {
  const { app, $ } = await mount(null);
  assert.deepEqual([...app.querySelectorAll("label")].map((l) => l.textContent), ["Location ID", "Widget ID"]);
  assert.equal($("#location_id").value, "");
  assert.equal($("iframe"), null);
});

await test("empty fields: error, no request, nothing sent to HighLevel", async () => {
  const { ghl, $, submit } = await mount(null);
  await submit("", "");
  assert.equal($(".status").textContent, "Enter both the Location ID and the Widget ID.");
  assert.equal(requests.length, 0);
  assert.equal(ghl.sent.length, 0);
});

await test("malformed Widget ID is rejected client-side (the API would 500 on it)", async () => {
  const { ghl, $, submit } = await mount(null);
  await submit(LOCATION, "not-a-uuid");
  assert.ok($(".status").classList.contains("is-error"));
  assert.match($(".status").textContent, /Widget ID should look like/);
  assert.equal(requests.length, 0);
  assert.equal(ghl.sent.length, 0);
});

await test("pasted values with stray whitespace are trimmed", async () => {
  const { $, submit } = await mount(null);
  await submit(`  ${LOCATION}\n`, ` ${SETTING} `);
  assert.deepEqual(requests[0], { location_id: LOCATION, widget_setting_id: SETTING });
  assert.ok($(".status").classList.contains("is-ok"));
});

await test("valid values: verified, sent to HighLevel with ids, preview shown", async () => {
  const { ghl, $, submit } = await mount(null);
  await submit(LOCATION, SETTING);
  assert.equal(ghl.sent.length, 1);
  const { elementStore, html, js } = ghl.sent[0];
  assert.equal(elementStore.location_id, LOCATION);
  assert.equal(elementStore.widget_setting_id, SETTING);
  assert.ok(html && js);
  const srcdoc = $("iframe.preview").srcdoc;
  assert.ok(srcdoc.includes(elementStore.element_id) && srcdoc.includes("ghlBoot"));
});

await test("re-applying keeps the same element_id", async () => {
  const { ghl, submit } = await mount(null);
  await submit(LOCATION, SETTING);
  await submit(LOCATION, SETTING);
  assert.equal(ghl.sent.length, 2);
  assert.equal(ghl.sent[1].elementStore.element_id, ghl.sent[0].elementStore.element_id);
});

for (const [code, status, pattern] of [
  ["invalid_location", 404, /Location ID was not found/],
  ["invalid_widget_settings", 404, /does not belong to this Location ID/],
  ["place_not_connected", 404, /No Google place is connected/],
]) {
  await test(`API code ${code} -> friendly message, nothing sent`, async () => {
    const { ghl, $, submit } = await mount(null);
    forced = { status, body: { error: "internal wording", code } };
    await submit(LOCATION, SETTING);
    assert.match($(".status").textContent, pattern);
    assert.doesNotMatch($(".status").textContent, /internal wording/);
    assert.equal(ghl.sent.length, 0);
  });
}

await test("non-JSON 500 (HTML error page) -> generic server message", async () => {
  const { ghl, $, submit } = await mount(null);
  forced = { status: 500, raw: "<html>Server Error (500)</html>" };
  await submit(LOCATION, SETTING);
  assert.equal($(".status").textContent, "The server returned an error. Try again in a moment.");
  assert.equal(ghl.sent.length, 0);
});

await test("a failed re-apply keeps the previous widget and says so", async () => {
  const { ghl, $, submit } = await mount(null);
  await submit(LOCATION, SETTING);
  const before = $("iframe.preview");
  forced = { status: 404, body: { code: "invalid_location" } };
  await submit("someone_else", SETTING);
  assert.match($(".status").textContent, /Your previous widget is unchanged\.$/);
  assert.equal(ghl.sent.length, 1);
  assert.equal($("iframe.preview"), before);
});

await test("published widget and local preview omit automatic polling", async () => {
  const { ghl, $, submit } = await mount(null);
  await submit(LOCATION, SETTING);
  assert.doesNotMatch(ghl.sent[0].js, /poll_ms|ghlRwSetupPolling/);
  const iframe = $("iframe.preview");
  assert.doesNotMatch(iframe.srcdoc, /poll_ms|ghlRwSetupPolling/);
  assert.equal($(".live-note").textContent, "Preview updates when refreshed.");
});

await test("Refresh preview rebuilds the iframe on demand", async () => {
  const { $, submit } = await mount(null);
  await submit(LOCATION, SETTING);
  const before = $("iframe.preview");
  $(".refresh-btn").click();
  assert.notEqual($("iframe.preview"), before, "a fresh iframe should replace the old one");
});

await test("settings summary is populated from the fetched data", async () => {
  const { $, submit } = await mount(null);
  await submit(LOCATION, SETTING);
  const rows = {};
  $(".summary").querySelectorAll(".summary-row").forEach((row) => {
    rows[row.querySelector("dt").textContent] = row.querySelector("dd").textContent;
  });
  assert.equal(rows["Place"], "Acme Dental");
  assert.equal(rows["Rating"], "4.7 ★ (120 reviews)");
  assert.equal(rows["Display type"], "List");
  assert.equal(rows["Minimum rating shown"], "4★ and up");
  assert.equal(rows["Max reviews"], "2");
  assert.equal(rows["Review text"], "Text reviews only");
  assert.equal($(".swatches").children.length, 4);
});

await test("a failed apply does not touch an existing settings summary", async () => {
  const { $, submit } = await mount(null);
  await submit(LOCATION, SETTING);
  const before = $(".summary-box").innerHTML;
  forced = { status: 404, body: { code: "invalid_location" } };
  await submit("someone_else", SETTING);
  assert.equal($(".summary-box").innerHTML, before);
});

await test("reopening a saved element prefills the form and re-applies it", async () => {
  const saved = { location_id: LOCATION, widget_setting_id: SETTING, element_id: "ghl-rw-kept" };
  const { ghl, $ } = await mount(saved);
  assert.equal($("#location_id").value, LOCATION);
  assert.equal($("#widget_setting_id").value, SETTING);
  assert.equal(ghl.sent.length, 1);
  assert.equal(ghl.sent[0].elementStore.element_id, "ghl-rw-kept");
  assert.ok($(".status").classList.contains("is-ok"));
});

await vite.close();
server.close();
console.log(failed ? `\n${failed} test(s) failed` : "\nall tests passed");
process.exit(failed ? 1 : 0);
