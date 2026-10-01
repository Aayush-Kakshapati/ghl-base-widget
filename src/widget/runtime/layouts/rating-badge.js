function ghlRwRenderRatingBadge($, reviews, place, settings) {
  var average = Number(place && place.rating) || 0;

  var count =
    place && ghlRwHas(place.rating_count)
      ? Number(place.rating_count)
      : reviews.length;

  var $badge = ghlRwEl($, "div", "ghl-rw-badge");

  var $meta = ghlRwEl($, "div", "ghl-rw-meta");

  var $rating = ghlRwEl($, "span", "ghl-rw-meta-item");

  $rating
    .append(
      ghlRwEl($, "span", "ghl-rw-meta-label").text(
        "Ratings (" + average.toFixed(1) + ")",
      ),
    )
    .append(ghlRwRenderStars($, average));

  var $count = ghlRwEl($, "span", "ghl-rw-meta-item");

  $count
    .append(ghlRwEl($, "span", "ghl-rw-meta-label").text("Reviews"))
    .append(ghlRwEl($, "span", "ghl-rw-count").text(String(count)));

  $meta
    .append($rating)
    .append(ghlRwEl($, "span", "ghl-rw-divider"))
    .append($count);

  $badge.append($meta);

  return ghlRwRenderContent($, $badge, settings);
}
