import runtime from "./runtime/script.js?raw";

// Safe to embed inside a <script> tag.
function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// runtime/script.js is a real file (easy to edit and lint). It is inlined here
// and started with the config. No imports exist on the published page.
export function createJs(config) {
  return `(function () {
${runtime}
ghlBoot(${safeJson(config)});
})();`;
}
