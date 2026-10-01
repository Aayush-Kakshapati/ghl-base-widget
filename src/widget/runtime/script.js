/* eslint-disable */
/*
 * Reviews widget runtime: plain ES5 + jQuery.
 *
 * This runs on the CUSTOMER'S page, so there are no imports and no build step.
 * createJs.js inlines this file inside an IIFE and then calls ghlBoot(config).
 *
 * Flow:  ghlBoot -> make sure jQuery exists -> ghlInit
 *        ghlInit -> GET /installation/?location_id&widget_setting_id
 *                -> { place, widget_settings, reviews } -> render
 */

var GHL_RW_JQUERY_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js";

/* ---------------------------------------------------------------- jQuery */

// Use the page's jQuery if it has one. Otherwise load our own copy, and call
// noConflict(true) so we never take over the page's window.$ / window.jQuery.
function ghlWithJQuery(callback) {
  if (window.jQuery && window.jQuery.fn && window.jQuery.fn.jquery) {
    callback(window.jQuery);
    return;
  }
  if (window.__ghlRwJq) {
    callback(window.__ghlRwJq);
    return;
  }
  // Another widget instance is already loading it: queue up behind it.
  if (window.__ghlRwJqQueue) {
    window.__ghlRwJqQueue.push(callback);
    return;
  }

  window.__ghlRwJqQueue = [callback];

  var script = document.createElement("script");
  script.src = GHL_RW_JQUERY_URL;
  script.async = true;
  script.onload = function () {
    window.__ghlRwJq = window.jQuery.noConflict(true);
    var queue = window.__ghlRwJqQueue || [];
    window.__ghlRwJqQueue = null;
    for (var i = 0; i < queue.length; i++) queue[i](window.__ghlRwJq);
  };
  script.onerror = function () {
    window.__ghlRwJqQueue = null;
    if (window.console) {
      console.error("[reviews-widget] Could not load jQuery from " + GHL_RW_JQUERY_URL);
    }
  };
  document.head.appendChild(script);
}

function ghlBoot(config) {
  ghlWithJQuery(function ($) {
    ghlInit($, config);
  });
}

/* ------------------------------------------------------------------ main */

function ghlInit($, config) {
  var $root = $(document.getElementById(config.element_id));
  if (!$root.length || $root.data("ghlRwInit")) return;
  $root.data("ghlRwInit", true);

  /* ---- small helpers ---- */

  function el(tag, className) {
    return $(document.createElement(tag)).addClass(className || "");
  }

  function has(value) {
    return value !== undefined && value !== null && value !== "";
  }

  // Numbers from settings are treated as px; strings like "1rem" pass through.
  function px(value) {
    return /^\d+(\.\d+)?$/.test(String(value)) ? value + "px" : value;
  }

  // Only allow http(s) URLs (thumbnails and review links come from Google data).
  function safeUrl(url) {
    return /^https?:\/\//i.test(url || "") ? url : "";
  }

  function showStatus(text, kind) {
    $root.empty().append(el("div", "ghl-rw-status ghl-rw-status-" + kind).text(text));
  }

  /* ---- data ---- */

  // Same rules as pages/widget-layouts/components/WidgetPreview.jsx
  function selectReviews(reviews, s) {
    var min = Number(s.min_rating) || 0;
    var list = $.grep(reviews || [], function (r) {
      var rating = Number(r && r.rating) || 0;
      var hasText = String((r && r.review) || "").replace(/^\s+|\s+$/g, "").length > 0;
      return rating >= min && (!s.show_reviews_with_text || hasText);
    });
    return s.max_reviews > 0 ? list.slice(0, s.max_reviews) : list;
  }

  /* ---- theme: widget_settings -> CSS variables (see widget.css) ---- */

  function applyTheme(s) {
    var vars = {
      "--ghl-rw-bg": s.background_color,
      "--ghl-rw-text": s.text_color,
      "--ghl-rw-star": s.star_color,
      "--ghl-rw-border": s.border_color,
      "--ghl-rw-padding": has(s.card_padding) ? px(s.card_padding) : null,
      "--ghl-rw-radius": has(s.card_border_radius) ? px(s.card_border_radius) : null,
      "--ghl-rw-gap": has(s.grid_spacing) ? px(s.grid_spacing) : null,
      "--ghl-rw-font-size": has(s.font_size) ? px(s.font_size) : null,
      "--ghl-rw-items-per-row": s.items_per_row
    };
    $.each(vars, function (name, value) {
      if (has(value)) $root[0].style.setProperty(name, value);
    });
  }

  /* ---- building blocks. ALWAYS use .text()/.attr() for API data, never
          .html(): reviews are third-party text. ---- */

  function renderStars(rating) {
    var value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    var $stars = el("span", "ghl-rw-stars").attr({
      role: "img",
      "aria-label": value + " out of 5 stars"
    });
    for (var i = 1; i <= 5; i++) {
      $stars.append(el("span", i <= value ? "ghl-rw-star is-on" : "ghl-rw-star").text("\u2605"));
    }
    return $stars;
  }

  // Same content as PlaceHeading.jsx: name, "Ratings (4.7) *****" | "Reviews 120"
  function renderHeader(place, reviews) {
    var avg = Number(place && place.rating) || 0;
    var count = place && has(place.rating_count) ? Number(place.rating_count) : reviews.length;

    return el("div", "ghl-rw-header")
      .append(
        el("div", "ghl-rw-place")
          .attr({ role: "heading", "aria-level": "2" })
          .text((place && place.title) || "Reviews")
      )
      .append(
        el("div", "ghl-rw-meta")
          .append(
            el("span", "ghl-rw-meta-item")
              .append(el("span", "ghl-rw-meta-label").text("Ratings (" + avg.toFixed(1) + ")"))
              .append(renderStars(avg))
          )
          .append(el("span", "ghl-rw-divider"))
          .append(
            el("span", "ghl-rw-meta-item")
              .append(el("span", "ghl-rw-meta-label").text("Reviews"))
              .append(el("span", "ghl-rw-count").text(String(count)))
          )
      );
  }

  function renderAvatar(review) {
    var thumb = safeUrl(review.thumbnail);
    if (thumb) {
      return $(document.createElement("img"))
        .addClass("ghl-rw-avatar")
        .attr({ src: thumb, alt: "", loading: "lazy", referrerpolicy: "no-referrer" });
    }
    return el("div", "ghl-rw-avatar ghl-rw-avatar-initial").text(
      String(review.name || "?").charAt(0).toUpperCase()
    );
  }

  // Text handling from ReviewCard.jsx: review_text_display = scroll | truncate | read-more
  function renderReviewText(text, s) {
    var mode = s.review_text_display || "scroll";
    var limit = Math.max(1, Number(s.review_text_limit) || 150);
    var hasMore = text.length > limit;
    var short = text.slice(0, limit) + "...";

    var $p = el("p", "ghl-rw-text" + (mode === "scroll" ? " is-scroll" : ""));

    if (mode === "truncate" && hasMore) return $p.text(short);
    if (mode !== "read-more" || !hasMore) return $p.text(text);

    var expanded = false;
    var $body = el("span").text(short + " ");
    var $btn = el("button", "ghl-rw-readmore").attr("type", "button").text("Read More");
    $btn.on("click", function () {
      expanded = !expanded;
      $body.text((expanded ? text : short) + " ");
      $btn.text(expanded ? "Read Less" : "Read More");
    });
    return $p.append($body).append($btn);
  }

  function renderCard(review, s) {
    var $card = el("article", "ghl-rw-card");
    if (s.fixed_item_height) $card.css("height", "160px");

    $card.append(
      el("div", "ghl-rw-card-top")
        .append(renderAvatar(review))
        .append(
          el("div", "ghl-rw-who")
            .append(el("strong", "ghl-rw-name").text(review.name || "Anonymous"))
            .append(renderStars(review.rating))
        )
    );

    var text = String(review.review || "");
    if (text) $card.append(renderReviewText(text, s));

    var link = safeUrl(review.link);
    if (link) {
      $card.append(
        $(document.createElement("a"))
          .addClass("ghl-rw-link")
          .attr({ href: link, target: "_blank", rel: "noopener noreferrer" })
          .text("View on Google")
      );
    }
    return $card;
  }

  // Height handling from ContentPreview.jsx, shared by every layout:
  //   loading_choice "view-more"  -> clipped to viewport_height + a toggle (if content is taller)
  //   enable_custom_height        -> fixed viewport_height, scrolls
  //   otherwise                   -> auto height
  function renderContent($inner, s) {
    var isViewMore = s.loading_choice === "view-more";
    var viewport = has(s.viewport_height) ? Number(s.viewport_height) : 300;
    var $wrap = el("div", "ghl-rw-content-wrap");
    var $box = el("div", "ghl-rw-content").append($inner);
    $wrap.append($box);

    if (isViewMore) {
      // Needs real layout, so it runs after $wrap is in the page (see render()).
      $wrap.data("ghlRwAfterAttach", function () {
        if ($box[0].scrollHeight <= viewport + 1) return;

        var expanded = false;
        $box.addClass("is-clip").css("height", viewport + "px");
        var $btn = el("button", "ghl-rw-toggle")
          .attr({ type: "button", "aria-label": "View more reviews", "aria-expanded": "false" })
          .text("\u25BE");
        $btn.on("click", function () {
          expanded = !expanded;
          $box.toggleClass("is-clip", !expanded).css("height", expanded ? "auto" : viewport + "px");
          $btn
            .text(expanded ? "\u25B4" : "\u25BE")
            .attr({
              "aria-label": expanded ? "View less reviews" : "View more reviews",
              "aria-expanded": String(expanded)
            });
        });
        $wrap.addClass("has-toggle").append($btn);
      });
    } else if (s.enable_custom_height) {
      $box.addClass("is-scroll").css("height", viewport + "px");
    }
    return $wrap;
  }

  /* ---- layouts: one function per widget_settings.display_type ----
     Each gets (reviews, place, settings) and returns a jQuery element.
     Built so far: "list".
     TODO: "grid", "carousel", "floating", "card", "rating_badge"
     (the values used by pages/widget-layouts in the React app). */

  function renderList(reviews, place, s) {
    var $list = el("div", "ghl-rw-list");
    $.each(reviews, function (_, review) {
      $list.append(renderCard(review, s));
    });
    return renderContent($list, s);
  }

  var LAYOUTS = {
    list: renderList
  };

  /* ---- render ---- */

  function render(payload) {
    var s = payload.widget_settings || {};
    var type = s.display_type || "list";
    var layout = LAYOUTS[type];

    if (!layout) {
      if (window.console) {
        console.warn("[reviews-widget] display_type '" + type + "' is not built yet, showing list.");
      }
      layout = LAYOUTS.list;
    }

    var reviews = selectReviews(payload.reviews, s);

    applyTheme(s);
    $root.attr("data-display-type", type).empty();
    $root.append(renderHeader(payload.place, reviews));

    if (!reviews.length) {
      $root.append(el("div", "ghl-rw-status ghl-rw-status-empty").text("No reviews to show yet."));
      return;
    }
    $root.append(layout(reviews, payload.place, s));

    $root.find(".ghl-rw-content-wrap").each(function () {
      var afterAttach = $(this).data("ghlRwAfterAttach");
      if (afterAttach) afterAttach();
    });
  }

  /* ---- fetch ---- */

  function load(isPoll) {
    if (!isPoll) showStatus("Loading reviews\u2026", "loading");

    return $.ajax({
      url: config.installation_url,
      type: "GET",
      dataType: "json",
      timeout: 15000,
      data: {
        location_id: config.location_id,
        widget_setting_id: config.widget_setting_id
      }
    })
      .done(function (payload) {
        render(payload || {});
      })
      .fail(function (xhr, textStatus) {
        // /installation/ returns { error, code } where code is one of
        // missing_identifiers | invalid_location | invalid_widget_settings | place_not_connected
        var body = xhr && xhr.responseJSON ? xhr.responseJSON : {};
        if (window.console) {
          console.error("[reviews-widget] load failed:", body.code || textStatus, body.error || "");
        }
        // On a poll, keep showing the last good render rather than replacing it with an error.
        if (!isPoll) showStatus("Reviews are currently unavailable.", "error");
      });
  }

  load(false);

  // Builder-only: config.poll_ms is never set on the published widget, so
  // production visitors never poll. Used for the "live preview" in builder.js.
  if (config.poll_ms > 0) {
    var timer = setInterval(function () {
      load(true);
    }, config.poll_ms);
    // MutationObserver notices when HighLevel removes the preview iframe/root
    // (e.g. a fresh Apply rebuilds it) so the old timer doesn't keep running.
    var observer = new MutationObserver(function () {
      if (!document.body || !document.body.contains($root[0])) {
        clearInterval(timer);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
