function ghlRwRenderFloating($, reviews, place, settings) {
  var $floating = $("<div>", {
    class: "ghl-rw-floating",
  });

  var isOpen = false;

  var position = settings.floating_position || "bottom-right";

  if (
    ["bottom-right", "bottom-left", "top-right", "top-left"].indexOf(
      position,
    ) === -1
  ) {
    position = "bottom-right";
  }

  var avgRating = place && place.rating != null ? place.rating : 0;

  var reviewCount =
    place && place.rating_count != null ? place.rating_count : reviews.length;

  var title = place && place.title ? place.title : "Reviews";

  /* Create the reviews panel */
  var $panel = $("<div>", {
    class: "ghl-rw-floating-panel",
  });

  reviews.forEach(function (review) {
    var $item = $("<div>", {
      class: "ghl-rw-floating-item",
    });

    $item.append(ghlRwRenderReviewCard($, review, settings));

    $panel.append($item);
  });

  /* Create the floating trigger */
  var $trigger = $("<button>", {
    type: "button",
    class: "ghl-rw-floating-trigger",
    "aria-label": "Open reviews",
  });

  var $icon = $("<span>", {
    class: "ghl-rw-floating-icon",
  });

  var $content = $("<span>", {
    class: "ghl-rw-floating-content",
  });

  var $title = $("<span>", {
    class: "ghl-rw-floating-title",
    text: title,
  });

  var $summary = $("<span>", {
    class: "ghl-rw-floating-summary",
  });

  $summary.text(
    avgRating.toFixed(1) +
      " · " +
      reviewCount +
      " " +
      (reviewCount === 1 ? "review" : "reviews"),
  );

  $content.append($title).append($summary);

  /* Use a star as the initial icon */
  $icon.html("★");

  $trigger.append($icon).append($content);

  /* Apply the floating position */
  $floating.addClass("ghl-rw-floating--" + position);

  /* Hide the reviews panel initially */
  $panel.hide();

  /* Toggle the reviews panel */
  $trigger.on("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    isOpen = !isOpen;

    if (isOpen) {
      $panel.stop(true, true).fadeIn(150);

      $trigger.attr("aria-label", "Close reviews");

      $icon.html("×");
      $icon.addClass("is-close");
    } else {
      $panel.stop(true, true).fadeOut(150);

      $trigger.attr("aria-label", "Open reviews");

      $icon.html("★");
      $icon.removeClass("is-close");
    }
  });

  /* Add the panel and trigger */
  $floating.append($panel);
  $floating.append($trigger);

  return ghlRwRenderContent($, $floating, settings);
}
