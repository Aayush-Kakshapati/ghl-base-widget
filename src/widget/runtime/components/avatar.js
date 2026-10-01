function ghlRwRenderAvatar($, review) {
  var thumbnail = ghlRwSafeUrl(review && review.thumbnail);

  if (thumbnail) {
    return $(document.createElement("img")).addClass("ghl-rw-avatar").attr({
      src: thumbnail,
      alt: "",
      loading: "lazy",
      referrerpolicy: "no-referrer",
    });
  }

  return ghlRwEl($, "div", "ghl-rw-avatar ghl-rw-avatar-initial").text(
    String((review && review.name) || "?")
      .charAt(0)
      .toUpperCase(),
  );
}
