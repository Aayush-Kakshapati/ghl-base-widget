function ghlRwRenderFloating($, reviews, place, settings) {
  var $floating = ghlRwRenderReviewCollection(
    $,
    "ghl-rw-floating",
    reviews,
    settings,
  );

  return ghlRwRenderContent($, $floating, settings);
}
