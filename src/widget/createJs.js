const runtimeSources = import.meta.glob("./runtime/**/*.js", {
  eager: true,
  query: "?raw",
  import: "default",
});

/* Runtime files MUST be loaded in dependency order. */
const runtimeFiles = [
  /* jQuery */
  "jquery.js",

  /* Core utilities */
  "helpers.js",
  "api.js",
  "filters.js",
  "theme.js",

  /* Components */
  "components/stars.js",
  "components/avatar.js",
  "components/review-text.js",
  "components/review-card.js",
  "components/header.js",
  "components/content.js",

  /* Layouts */
  "layouts/collection.js",
  "layouts/list.js",
  "layouts/grid.js",
  "layouts/carousel.js",
  "layouts/floating.js",
  "layouts/rating-badge.js",
  "layouts/base-card.js",

  /* Rendering */
  "renderer.js",

  /* Lifecycle */
  "polling.js",

  /* Entry point MUST be last. */
  "bootstrap.js",
];

function readRuntimeFile(file) {
  const source = runtimeSources[`./runtime/${file}`];

  if (source === undefined) {
    throw new Error(`[reviews-widget] Runtime file not found: ${file}`);
  }

  return source;
}

function indentRuntime(source) {
  return source
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function buildRuntime() {
  return runtimeFiles
    .map((file) => {
      const source = readRuntimeFile(file);

      return `
/* ===================================================== */
/* RUNTIME: ${file} */
/* ===================================================== */

${source}
`;
    })
    .join("\n");
}

export function createJs(config = {}) {
  const runtime = buildRuntime();
  const configJson = JSON.stringify(config);

  return `/*
 * AUTO-GENERATED REVIEWS WIDGET
 * Do not edit this generated output directly.
 */

(function () {
  "use strict";

${indentRuntime(runtime)}

  ghlBoot(${configJson});
})();
`;
}
