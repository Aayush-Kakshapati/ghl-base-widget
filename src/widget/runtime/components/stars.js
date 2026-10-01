function ghlRwRenderStars($, rating) {
  var value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

  var $stars = ghlRwEl($, "span", "ghl-rw-stars").attr({
    role: "img",
    "aria-label": value + " out of 5 stars",
  });

  for (var i = 1; i <= 5; i++) {
    $stars.append(
      ghlRwEl($, "span", i <= value ? "ghl-rw-star is-on" : "ghl-rw-star").text(
        "\u2605",
      ),
    );
  }

  return $stars;
}
