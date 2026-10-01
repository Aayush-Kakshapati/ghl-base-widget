function ghlRwRenderReviewCollection($, className, reviews, settings) {
  var $container = ghlRwEl($, "div", className);

  $.each(reviews, function (_, review) {
    $container.append(ghlRwRenderReviewCard($, review, settings));
  });

  return $container;
}
