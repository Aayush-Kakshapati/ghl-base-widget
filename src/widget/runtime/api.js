function ghlRwLoadReviews($, config) {
  return $.ajax({
    url: config.installation_url,
    type: "GET",
    dataType: "json",
    timeout: 15000,

    data: {
      location_id: config.location_id,
      widget_setting_id: config.widget_setting_id,
    },
  });
}

function ghlRwHandleLoadError($, $root, xhr, textStatus) {
  var body = xhr && xhr.responseJSON ? xhr.responseJSON : {};

  if (window.console) {
    console.error(
      "[reviews-widget] load failed:",
      body.code || textStatus,
      body.error || "",
    );
  }

  ghlRwShowStatus($, $root, "Reviews are currently unavailable.", "error");
}
