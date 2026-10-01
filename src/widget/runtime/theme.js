function ghlRwApplyTheme($, $root, settings) {
  var vars = {
    "--ghl-rw-bg": settings.background_color,

    "--ghl-rw-text": settings.text_color,

    "--ghl-rw-star": settings.star_color,

    "--ghl-rw-border": settings.border_color,

    "--ghl-rw-padding": ghlRwHas(settings.card_padding)
      ? ghlRwPx(settings.card_padding)
      : null,

    "--ghl-rw-radius": ghlRwHas(settings.card_border_radius)
      ? ghlRwPx(settings.card_border_radius)
      : null,

    "--ghl-rw-gap": ghlRwHas(settings.grid_spacing)
      ? ghlRwPx(settings.grid_spacing)
      : null,

    "--ghl-rw-font-size": ghlRwHas(settings.font_size)
      ? ghlRwPx(settings.font_size)
      : null,

    "--ghl-rw-items-per-row": settings.items_per_row,
  };

  $.each(vars, function (name, value) {
    if (ghlRwHas(value)) {
      $root[0].style.setProperty(name, value);
    }
  });
}
