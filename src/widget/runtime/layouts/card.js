function ghlRwRenderCard($, reviews, place, settings) {
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
  var title = (place && place.title) || "Reviews";

  var $card = ghlRwEl(
    $,
    "div",
    "ghl-rw-card-widget ghl-rw-card-widget--" + position,
  );
  var $heading = ghlRwEl($, "div", "ghl-rw-card-widget-heading");

  $heading
    .append(ghlRwEl($, "strong", "ghl-rw-card-widget-title").text(title))
    .append(
      ghlRwEl($, "span", "ghl-rw-card-widget-count").text(
        count + (count === 1 ? " review" : " reviews"),
      ),
    );

  var $rating = ghlRwEl($, "div", "ghl-rw-card-widget-rating");
  $rating
    .append(ghlRwRenderStars($, average))
    .append(ghlRwEl($, "span", "ghl-rw-card-widget-average").text(average.toFixed(1)));

  $card.append($heading).append($rating);

  return $card;
}
