/* `single` renders one filled star (used by the floating trigger and the
 * rating badge, same as StarRating's `single` prop in the admin). */
function ghlRwRenderStars($, rating, single) {
  var value = single
    ? 1
    : Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

  var $stars = ghlRwEl($, "span", "ghl-rw-stars" + (single ? " is-single" : "")).attr({
    role: "img",
    "aria-label": single ? "Star rating" : value + " out of 5 stars",
  });

  for (var i = 1; i <= (single ? 1 : 5); i++) {
    $stars.append(
      ghlRwEl($, "span", i <= value ? "ghl-rw-star is-on" : "ghl-rw-star").text(
        "★",
      ),
    );
  }

  return $stars;
}
