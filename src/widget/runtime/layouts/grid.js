function ghlRwRenderGrid($, reviews, place, settings) {
  var $grid = ghlRwRenderReviewCollection($, "ghl-rw-grid", reviews, settings);

  return ghlRwRenderContent($, $grid, settings);
}
