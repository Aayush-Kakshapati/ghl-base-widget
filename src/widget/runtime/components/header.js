function ghlRwRenderHeader($, place, reviews) {
  var average = Number(place && place.rating) || 0;

  var count =
    place && ghlRwHas(place.rating_count)
      ? Number(place.rating_count)
      : reviews.length;

  var $header = ghlRwEl($, "div", "ghl-rw-header");

  var $place = ghlRwEl($, "div", "ghl-rw-place")
    .attr({
      role: "heading",
      "aria-level": "2",
    })
    .text((place && place.title) || "Reviews");

  var $meta = ghlRwEl($, "div", "ghl-rw-meta");

  var $rating = ghlRwEl($, "span", "ghl-rw-meta-item");

  $rating
    .append(
      ghlRwEl($, "span", "ghl-rw-meta-label").text(
        "Ratings (" + average.toFixed(1) + ")",
      ),
    )
    .append(ghlRwRenderStars($, average));

  var $reviewCount = ghlRwEl($, "span", "ghl-rw-meta-item");

  $reviewCount
    .append(ghlRwEl($, "span", "ghl-rw-meta-label").text("Reviews"))
    .append(ghlRwEl($, "span", "ghl-rw-count").text(String(count)));

  $meta
    .append($rating)
    .append(ghlRwEl($, "span", "ghl-rw-divider"))
    .append($reviewCount);

  return $header.append($place).append($meta);
}
