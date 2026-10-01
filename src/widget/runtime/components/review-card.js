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

  $who
    .append(
      ghlRwEl($, "strong", "ghl-rw-name").text(review.name || "Anonymous"),
    )
    .append(ghlRwRenderStars($, review.rating));

  $top.append(ghlRwRenderAvatar($, review)).append($who);

  $card.append($top);

  /*
   * Review body.
   */
  var text = String(review.review || "");

  if (text) {
    $card.append(ghlRwRenderReviewText($, text, settings));
  }

  return $card;
}
