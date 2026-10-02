function ghlInit($, config) {
  var root = document.getElementById(config.element_id);

  var $root = $(root);

  /* Don't initialize the same widget twice. */
  if (!$root.length || $root.data("ghlRwInit")) {
    return;
  }

  $root.data("ghlRwInit", true);

  function load() {
    ghlRwShowStatus($, $root, "Loading reviews\u2026", "loading");

    ghlRwLoadReviews($, config)
      .done(function (payload) {
        ghlRwRender($, $root, payload || {});
      })
      .fail(function (xhr, textStatus) {
        ghlRwHandleLoadError($, $root, xhr, textStatus);
      });
  }

  /* Initial request. */
  load();
}

/* Public entry point called by createJs.js. */
function ghlBoot(config) {
  ghlRwWithJQuery(function ($) {
    ghlInit($, config);
  });
}
