var GHL_RW_LAYOUTS = {
  list: ghlRwRenderList,
  grid: ghlRwRenderGrid,
  carousel: ghlRwRenderCarousel,
  floating: ghlRwRenderFloating,
  rating_badge: ghlRwRenderRatingBadge,
  card: ghlRwRenderCard,
};

function ghlRwRender($, $root, payload) {
  var settings = payload.widget_settings || {};

  var type = settings.display_type || "carousel";

  var layout = GHL_RW_LAYOUTS[type];

  /*
   * Unknown layout -> list fallback.
   */
  if (!layout) {
    if (window.console) {
      console.warn(
        "[reviews-widget] display_type '" +
          type +
          "' is not available, showing carousel.",
      );
    }

    layout = GHL_RW_LAYOUTS.list;
  }

  var reviews = ghlRwSelectReviews($, payload.reviews, settings);

  ghlRwApplyTheme($, $root, settings);

  $root.attr("data-display-type", type).empty();

  /* Header. */
  if (layout == GHL_RW_LAYOUTS.list || layout == GHL_RW_LAYOUTS.grid || layout == GHL_RW_LAYOUTS.carousel) {
    $root.append(ghlRwRenderHeader($, payload.place, reviews));
  }
  /* Empty state. */
  if (!reviews.length) {
    $root.append(ghlRwCreateStatus($, "No reviews to show yet.", "empty"));

    return;
  }

  /* Layout. */
  $root.append(layout($, reviews, payload.place, settings));

  /*
   * Some content calculations require
   * the elements to already be attached.
   */
  $root.find(".ghl-rw-content-wrap").each(function () {
    var afterAttach = $(this).data("ghlRwAfterAttach");

    if (afterAttach) {
      afterAttach();
    }
  });
}
