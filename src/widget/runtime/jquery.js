var GHL_RW_JQUERY_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js";

/**
 * Use the page's jQuery if available.
 *
 * Otherwise load our own copy and release window.$ / window.jQuery
 * using noConflict(true).
 *
 * Multiple widget instances share the same loading queue.
 */
function ghlRwWithJQuery(callback) {
  if (window.jQuery && window.jQuery.fn && window.jQuery.fn.jquery) {
    callback(window.jQuery);
    return;
  }

  if (window.__ghlRwJq) {
    callback(window.__ghlRwJq);
    return;
  }

  if (window.__ghlRwJqQueue) {
    window.__ghlRwJqQueue.push(callback);
    return;
  }

  window.__ghlRwJqQueue = [callback];

  var script = document.createElement("script");

  script.src = GHL_RW_JQUERY_URL;
  script.async = true;

  script.onload = function () {
    window.__ghlRwJq = window.jQuery.noConflict(true);

    var queue = window.__ghlRwJqQueue || [];

    window.__ghlRwJqQueue = null;

    for (var i = 0; i < queue.length; i++) {
      queue[i](window.__ghlRwJq);
    }
  };

  script.onerror = function () {
    window.__ghlRwJqQueue = null;

    if (window.console) {
      console.error(
        "[reviews-widget] Could not load jQuery from " + GHL_RW_JQUERY_URL,
      );
    }
  };

  document.head.appendChild(script);
}
