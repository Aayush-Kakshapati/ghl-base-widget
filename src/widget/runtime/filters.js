function ghlRwSelectReviews($, reviews, settings) {
  var minRating = Number(settings.min_rating) || 0;

  var list = $.grep(reviews || [], function (review) {
    var rating = Number(review && review.rating) || 0;

    var hasText =
      String((review && review.review) || "").replace(/^\s+|\s+$/g, "").length >
      0;

    return rating >= minRating && (!settings.show_reviews_with_text || hasText);
  });

  return settings.max_reviews > 0 ? list.slice(0, settings.max_reviews) : list;
}
