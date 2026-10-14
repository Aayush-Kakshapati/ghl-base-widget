/*
 * Autosave queue for the settings panel.
 *
 * - Changed fields are merged and sent as ONE PATCH after a short pause
 *   (sliders fire many events; discrete controls pass { immediate: true }).
 * - Only one request is in flight at a time, so responses can't arrive out of
 *   order and overwrite newer edits.
 * - onSaved runs once everything queued has been saved (use it to refresh the
 *   preview); onError tells the panel which fields to roll back.
 */
export function createAutosaver({ save, onStatus, onSaved, onError, delay = 400 }) {
  let pending = {};
  let timer = null;
  let inFlight = false;

  async function flush() {
    clearTimeout(timer);
    timer = null;
    if (inFlight || !Object.keys(pending).length) return;

    const batch = pending;
    pending = {};
    inFlight = true;
    onStatus("saving");

    let result;
    let failure = null;
    try {
      result = await save(batch);
    } catch (err) {
      failure = err;
    }
    inFlight = false;

    const idle = !Object.keys(pending).length;

    if (failure) {
      // Keep newer edits to the same field; roll back the rest.
      onError(failure, batch, Object.keys(pending));
      onStatus("error", failure.message);
    } else if (idle) {
      onStatus("saved");
      onSaved(result);
    }

    if (!idle) flush();
  }

  return {
    queue(fields, { immediate = false } = {}) {
      Object.assign(pending, fields);
      onStatus("pending");
      clearTimeout(timer);
      if (immediate) flush();
      else timer = setTimeout(flush, delay);
    },
    // Resolves when the queue has drained (used by tests and before unload).
    flush,
    get busy() {
      return inFlight || Object.keys(pending).length > 0;
    },
  };
}
