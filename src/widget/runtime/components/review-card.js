function ghlRwRenderReviewCard($, review, settings) {
  var $card = ghlRwEl($, "article", "ghl-rw-card");

  if (settings.fixed_item_height) {
    $card.css("height", "160px");
  }

  /*
   * Card header.
   */
  var $top = ghlRwEl($, "div", "ghl-rw-card-top");

  var $who = ghlRwEl($, "div", "ghl-rw-who");

  $who.append(
    ghlRwEl($, "strong", "ghl-rw-name").text(review.name || "Anonymous"),
  );

  /* Relative date ("2 weeks ago"), shown under the name like the admin preview. */
  if (ghlRwHas(review.date)) {
    $who.append(ghlRwEl($, "span", "ghl-rw-date").text(String(review.date)));
  }

  $top.append(ghlRwRenderAvatar($, review)).append($who);

  $card.append($top);

  /* Stars sit on their own row under the header, as in the admin preview. */
  $card.append(
    ghlRwEl($, "div", "ghl-rw-card-rating").append(
      ghlRwRenderStars($, review.rating),
    ),
  );

  /*
   * Review body.
   */
  var text = String(review.review || "");

  if (text) {
    $card.append(ghlRwRenderReviewText($, text, settings));
  }

  return $card;
}
