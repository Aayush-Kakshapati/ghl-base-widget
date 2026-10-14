/* Lookup tables mirror widget-layouts/components/styleUtils.js in the admin
 * app, so the published widget renders exactly like the live preview.
 * Unknown values are ignored (fallback to the CSS defaults).
 */
var GHL_RW_FONT_FAMILIES = {
  inherit: "inherit",
  sans:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
  mono:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  rounded:
    "ui-rounded, 'SF Pro Rounded', 'Nunito', 'Quicksand', system-ui, sans-serif",
};

var GHL_RW_SHADOWS = {
  none: "none",
  sm: "0 1px 2px rgba(15, 23, 42, 0.08)",
  md: "0 4px 12px rgba(15, 23, 42, 0.12)",
  lg: "0 12px 28px rgba(15, 23, 42, 0.18)",
};

var GHL_RW_AVATAR_RADIUS = {
  circle: "9999px",
  rounded: "8px",
  square: "0px",
};

var GHL_RW_ALIGNMENTS = { left: 1, center: 1, right: 1 };

/* Only accept real CSS font weights (100-900); the admin can also hold
 * legacy strings such as "Normal", which must not reach the CSS. */
function ghlRwWeight(value) {
  var n = Number(value);

  return isFinite(n) && n >= 100 && n <= 900 ? String(Math.round(n)) : null;
}

function ghlRwNumber(value) {
  return ghlRwHas(value) && isFinite(Number(value)) ? Number(value) : null;
}

function ghlRwApplyTheme($, $root, settings) {
  var starSize = ghlRwNumber(settings.star_size);
  var starGap = ghlRwNumber(settings.star_spacing);
  var avatarSize = ghlRwNumber(settings.avatar_size);
  var headingSize = ghlRwNumber(settings.heading_font_size);
  var borderWidth = ghlRwNumber(settings.card_border_width);
  var shadow = GHL_RW_SHADOWS[settings.card_shadow];

  var vars = {
    /* Colours */
    "--ghl-rw-bg": settings.background_color,

    "--ghl-rw-text": settings.text_color,

    "--ghl-rw-star": settings.star_color,

    "--ghl-rw-star-empty": settings.star_empty_color,

    "--ghl-rw-border": settings.border_color,

    "--ghl-rw-link": settings.link_color,

    /* Heading colour falls back to the text colour (as in the admin). */
    "--ghl-rw-heading-color": settings.heading_color || settings.text_color,

    /* Spacing / shape */
    "--ghl-rw-padding": ghlRwHas(settings.card_padding)
      ? ghlRwPx(settings.card_padding)
      : null,

    "--ghl-rw-radius": ghlRwHas(settings.card_border_radius)
      ? ghlRwPx(settings.card_border_radius)
      : null,

    "--ghl-rw-border-width": borderWidth !== null ? borderWidth + "px" : null,

    "--ghl-rw-gap": ghlRwHas(settings.grid_spacing)
      ? ghlRwPx(settings.grid_spacing)
      : null,

    "--ghl-rw-items-per-row": settings.items_per_row,

    /* Shadow: "none" on review cards, but overlays keep their own
     * default shadow unless a real one was picked. */
    "--ghl-rw-shadow": shadow || null,

    "--ghl-rw-shadow-overlay": shadow && shadow !== "none" ? shadow : null,

    /* Typography */
    "--ghl-rw-font-size": ghlRwHas(settings.font_size)
      ? ghlRwPx(settings.font_size)
      : null,

    "--ghl-rw-font-family": GHL_RW_FONT_FAMILIES[settings.font_family] || null,

    "--ghl-rw-font-weight": ghlRwWeight(settings.font_weight),

    "--ghl-rw-name-weight": ghlRwWeight(settings.reviewer_name_weight),

    "--ghl-rw-heading-size": headingSize !== null ? headingSize + "px" : null,

    "--ghl-rw-heading-weight": ghlRwWeight(settings.heading_font_weight),

    /* Stars */
    "--ghl-rw-star-size": starSize !== null ? starSize + "px" : null,

    "--ghl-rw-star-gap": starGap !== null ? starGap + "px" : null,

    /* Avatar */
    "--ghl-rw-avatar-size": avatarSize !== null ? avatarSize + "px" : null,

    "--ghl-rw-avatar-radius": GHL_RW_AVATAR_RADIUS[settings.avatar_shape] || null,
  };

  $.each(vars, function (name, value) {
    if (ghlRwHas(value)) {
      $root[0].style.setProperty(name, value);
    } else {
      /* Clear stale values if a setting was removed. */
      $root[0].style.removeProperty(name);
    }
  });

  /* Header alignment is structural, so it's a data attribute. */
  $root.attr(
    "data-heading-align",
    GHL_RW_ALIGNMENTS[settings.heading_alignment]
      ? settings.heading_alignment
      : "center",
  );
}
