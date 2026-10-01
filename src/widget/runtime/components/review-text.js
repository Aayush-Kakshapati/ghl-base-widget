function ghlRwRenderReviewText($, text, settings) {
  var mode = settings.review_text_display || "scroll";

  var limit = Math.max(1, Number(settings.review_text_limit) || 150);

  var hasMore = text.length > limit;

  var shortText = text.slice(0, limit) + "...";

  var $paragraph = ghlRwEl(
    $,
    "p",
    "ghl-rw-text" + (mode === "scroll" ? " is-scroll" : ""),
  );

  /*
   * Truncate mode.
   */
  if (mode === "truncate" && hasMore) {
    return $paragraph.text(shortText);
  }

  /*
   * Normal text or text that doesn't exceed
   * the configured limit.
   */
  if (mode !== "read-more" || !hasMore) {
    return $paragraph.text(text);
  }

  /*
   * Read More mode.
   */
  var expanded = false;

  var $body = ghlRwEl($, "span").text(shortText + " ");

  var $button = ghlRwEl($, "button", "ghl-rw-readmore")
    .attr("type", "button")
    .text("Read More");

  $button.on("click", function () {
    expanded = !expanded;

    $body.text((expanded ? text : shortText) + " ");

    $button.text(expanded ? "Read Less" : "Read More");
  });

  return $paragraph.append($body).append($button);
}
