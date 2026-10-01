function ghlRwSetupPolling($, $root, config, load) {
  /*
   * Published widgets do not normally have
   * poll_ms configured.
   */
  if (!(config.poll_ms > 0)) {
    return;
  }

  var timer = setInterval(function () {
    load(true);
  }, config.poll_ms);

  /*
   * Stop polling when HighLevel removes
   * the widget root from the document.
   */
  if (typeof MutationObserver === "undefined") {
    return;
  }

  var observer = new MutationObserver(function () {
    if (!document.body || !document.body.contains($root[0])) {
      clearInterval(timer);
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
