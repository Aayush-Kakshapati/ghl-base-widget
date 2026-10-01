// The HTML shell that goes onto the customer's page. Content is rendered
// into it at runtime by runtime/script.js.
export function createHtml(elementId) {
  return `<div id="${elementId}" class="ghl-rw-root"></div>`;
}
