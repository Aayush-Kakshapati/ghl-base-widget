function ghlRwRenderContent($, $inner, settings) {
  var isViewMore = settings.loading_choice === "view-more";

  var viewport = ghlRwHas(settings.viewport_height)
    ? Number(settings.viewport_height)
    : 300;

  var $wrap = ghlRwEl($, "div", "ghl-rw-content-wrap");

  var $box = ghlRwEl($, "div", "ghl-rw-content").append($inner);

  $wrap.append($box);

  /*
   * View More mode.
   *
   * We can't calculate scrollHeight until the
   * element is actually attached to the DOM.
   */
  if (isViewMore) {
    $wrap.data("ghlRwAfterAttach", function () {
      if ($box[0].scrollHeight <= viewport + 1) {
        return;
      }

      var expanded = false;

      $box.addClass("is-clip").css("height", viewport + "px");

      var $button = ghlRwEl($, "button", "ghl-rw-toggle")
        .attr({
          type: "button",
          "aria-label": "View more reviews",
          "aria-expanded": "false",
        })
        .text("\u25BE");

      $button.on("click", function () {
        expanded = !expanded;

        $box
          .toggleClass("is-clip", !expanded)
          .css("height", expanded ? "auto" : viewport + "px");

        $button.text(expanded ? "\u25B4" : "\u25BE").attr({
          "aria-label": expanded ? "View less reviews" : "View more reviews",

          "aria-expanded": String(expanded),
        });
      });

      $wrap.addClass("has-toggle").append($button);
    });
  } else if (settings.enable_custom_height) {

  /*
   * Custom fixed height mode.
   */
    $box.addClass("is-scroll").css("height", viewport + "px");
  }

  return $wrap;
}
