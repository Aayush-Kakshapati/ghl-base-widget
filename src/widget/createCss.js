import css from "./runtime/styles/widget.css?raw";

// Plain, prefixed CSS (.ghl-rw-*) so it can't clash with the host page.
export function createCss() {
  return css;
}
