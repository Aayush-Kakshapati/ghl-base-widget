function ghlRwRenderList($, reviews, place, settings) {
  var $list = ghlRwRenderReviewCollection($, "ghl-rw-list", reviews, settings);

  return ghlRwRenderContent($, $list, settings);
}
