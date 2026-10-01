import Postmate from "postmate";

// Only handshake when we're actually inside a HighLevel iframe; otherwise the
// promise would never resolve when you open the builder directly in a tab.
export const isInsideGHL = window.parent !== window;
const handshake = isInsideGHL ? new Postmate.Model({}) : null;

// Resolves with the elementStore HighLevel saved earlier, or null
// (first time, not in HighLevel, or handshake too slow).
export function getElementStore(timeoutMs = 3000) {
  if (!handshake) return Promise.resolve(null);

  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
  const store = handshake.then((parent) => parent?.model?.elementStore ?? null);
  return Promise.race([store, timeout]);
}

// Same "code" event your previous widget used.
export function sendToGHL(widget) {
  if (!handshake) {
    console.info("[ghl] not inside HighLevel, skipping emit (html: %d chars, js: %d chars)", widget.html.length, widget.js.length);
    return;
  }
  handshake.then((parent) => {
    parent?.emit("code", {
      html: widget.html,
      js: widget.js,
      elementStore: widget.elementStore,
    });
  });
}
