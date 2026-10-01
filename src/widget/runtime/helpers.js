function ghlRwEl($, tag, className) {
  return $(document.createElement(tag)).addClass(className || "");
}

function ghlRwHas(value) {
  return value !== undefined && value !== null && value !== "";
}

/**
 * Numeric settings are treated as pixels.
 *
 * Examples:
 *   20     -> "20px"
 *   "20"   -> "20px"
 *   "1rem" -> "1rem"
 */
function ghlRwPx(value) {
  return /^\d+(\.\d+)?$/.test(String(value)) ? value + "px" : value;
}

/**
 * Only allow http(s) URLs.
 *
 * Review thumbnails and external links are third-party data,
 * so javascript:, data:, etc. are rejected.
 */
function ghlRwSafeUrl(url) {
  return /^https?:\/\//i.test(url || "") ? url : "";
}

function ghlRwCreateStatus($, text, kind) {
  return ghlRwEl($, "div", "ghl-rw-status ghl-rw-status-" + kind).text(text);
}

function ghlRwShowStatus($, $root, text, kind) {
  $root.empty().append(ghlRwCreateStatus($, text, kind));
}
