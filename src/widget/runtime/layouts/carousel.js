function ghlRwRenderCarousel($, reviews, place, settings) {
  var $carousel = ghlRwRenderReviewCollection(
    $,
    "ghl-rw-carousel",
    reviews,
    settings,
  );

  return ghlRwRenderContent($, $carousel, settings);
}
