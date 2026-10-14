/* Mirrors BadgePreview.jsx: star, average, divider, "N reviews". */
function ghlRwRenderRatingBadge($, reviews, place, settings) {
  var positions = {
    "bottom-left": "bottom-left",
    "bottom-right": "bottom-right",
    "top-left": "top-left",
    "top-right": "top-right",
    left: "left",
    right: "right",
  };
  var position = positions[settings.floating_position] || "bottom-right";
  var average = Number(place && place.rating) || 0;

  var count =
    place && ghlRwHas(place.rating_count)
      ? Number(place.rating_count)
      : reviews.length;

  var $badge = ghlRwEl($, "div", "ghl-rw-badge ghl-rw-badge--" + position);

  $badge
    .append(ghlRwRenderStars($, 5, true))
    .append(ghlRwEl($, "span", "ghl-rw-badge-average").text(average.toFixed(1)))
    .append(ghlRwEl($, "span", "ghl-rw-divider"))
    .append(
      ghlRwEl($, "span", "ghl-rw-badge-count").text(
        count + (count === 1 ? " review" : " reviews"),
      ),
    );

  return ghlRwRenderContent($, $badge, settings);
}
