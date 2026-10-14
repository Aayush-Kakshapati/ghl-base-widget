function ghlRwRenderCarousel($, reviews, place, settings) {
  if (!reviews || !reviews.length) {
    return $();
  }

  var gap = parseInt(settings.card_padding, 10) || 14;

  var perView = Math.max(
    1,
    Math.min(parseInt(settings.items_per_row, 10) || 3, reviews.length),
  );

  /* Mode comes from animation_type ("slide" | "scroll"); display_type is the
   * layout name ("carousel"), so it must not be used here. */
  var displayType = settings.animation_type === "slide" ? "slide" : "scroll";

  var $carousel = $("<div>", {
    class: "ghl-rw-carousel",
    "data-display-type": displayType,
  });

  var $viewport = $("<div>", {
    class: "ghl-rw-carousel-viewport",
  });

  var $track = $("<div>", {
    class: "ghl-rw-carousel-track",
  });

  $viewport.css({
    "--carousel-items-per-view": perView,
    "--carousel-gap": gap + "px",
  });

  $track.css({
    gap: gap + "px",
  });

  reviews.forEach(function (review) {
    var $item = $("<div>", {
      class: "ghl-rw-carousel-item",
    });

    $item.append(ghlRwRenderReviewCard($, review, settings));

    $track.append($item);
  });

  /* No carousel required. */
  if (reviews.length <= perView) {
    $viewport.append($track);
    $carousel.append($viewport);

    return ghlRwRenderContent($, $carousel, settings);
  }

  /* Clone enough cards for infinite looping. */
  var $originalItems = $track.find(".ghl-rw-carousel-item");

  for (var i = 0; i < perView; i++) {
    $track.append($originalItems.eq(i).clone(true));
  }

  $viewport.append($track);
  $carousel.append($viewport);

  /* SCROLL MODE */
  if (displayType === "scroll") {
    requestAnimationFrame(function () {
      var $items = $track.find(".ghl-rw-carousel-item");

      var scrollDistance =
        $items.eq(reviews.length).position().left - $items.eq(0).position().left;

      $track.css("--carousel-scroll-distance", -scrollDistance + "px");
    });

    var scrollDuration = {
      slow: 40,
      normal: 30,
      fast: 20,
    };

    var duration =
      scrollDuration[settings.animation_speed] || scrollDuration.normal;

    $track.css("animation-duration", duration + "s");
  }

  /* SLIDE MODE */
  if (displayType === "slide") {
    var index = 0;
    var timer = null;

    var animationDuration = 800;

    var autoplaySpeed = {
      slow: 6000,
      normal: 4000,
      fast: 2000,
    };

    var interval =
      autoplaySpeed[settings.animation_speed] || autoplaySpeed.normal;

    function getStep() {
      var $firstItem = $track.find(".ghl-rw-carousel-item").first();

      return $firstItem.outerWidth() + gap;
    }

    function goToSlide(newIndex) {
      index = newIndex;

      var step = getStep();

      $track.stop(true).animate(
        {
          left: -(index * step),
        },
        animationDuration,
        "linear",
        function () {
          if (index >= reviews.length) {
            index = 0;

            $track.css("left", 0);
          }
        },
      );
    }

    var hovered = false;

    $carousel.on("mouseenter", function () {
      hovered = true;
    });

    $carousel.on("mouseleave", function () {
      hovered = false;
    });

    timer = window.setInterval(function () {
      if (!hovered) {
        goToSlide(index + 1);
      }
    }, interval);

    $carousel.data("ghl-rw-carousel-destroy", function () {
      window.clearInterval(timer);

      $track.stop(true);
    });
  }

  /* SCROLL cleanup (slide mode registered its own above). */
  if (displayType === "scroll") {
    $carousel.data("ghl-rw-carousel-destroy", function () {
      $track.css("animation-play-state", "paused");
    });
  }

  return ghlRwRenderContent($, $carousel, settings);
}
