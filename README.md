# ghl-base-repo-widget

Base setup for the Google Reviews widget as a HighLevel extension.
**No React.** The published widget is plain HTML + CSS + jQuery and gets all its data
from your API's `GET /google_review/installation/` endpoint.

## How a customer uses it

1. In the React app, open **Installation**. It shows the **Location ID** and **Widget ID**
   (`widget_settings.id`).
2. In HighLevel, add the widget. The builder shows a form; paste both values and press **Apply**.
3. The builder checks them against `/installation/`. If valid, it sends the widget to HighLevel and
   shows a preview. The widget then renders with the settings saved in the app.

Values are only sent to HighLevel after they check out, so a typo never replaces a working widget.
When the element is reopened later, HighLevel hands the saved ids back and the form re-applies them.

## Structure

```
src/
  main.js, builder.js, style.css   Builder form shown inside HighLevel (plain DOM, no framework)
  installation.js                  GET /installation/ check + friendly error messages
  ghl.js                           Postmate handshake: getElementStore() / sendToGHL()
  config.js                        API base URL + endpoint
  widget/
    generateWidget.js              -> { html, js, elementStore }  (what HighLevel receives)
    createHtml.js                  HTML shell:  <div id="ghl-rw-xxxx" class="ghl-rw-root">
    createCss.js                   returns runtime/widget.css
    createJs.js                    inlines runtime/script.js + config
    runtime/
      script.js                    <- the widget itself (jQuery). Most of your work happens here
      widget.css                   <- widget styles (.ghl-rw-* prefixed)
scripts/smoke-test.mjs             runs the real widget + builder form in jsdom against a mock API
```

## Run it

```bash
cp .env.example .env      # set VITE_API_BASE_URL (same one your React app uses)
npm install
npm run dev               # open the builder form; paste a Location ID + Widget ID
npm test                  # 31 checks, no HighLevel or browser needed
```

Outside HighLevel the builder works the same, except nothing is emitted (it logs instead).

## Data flow

```
builder (in HighLevel)                            customer's page
  form: location_id + widget_setting_id
  GET /installation/  (validate)
  generateWidget(...)
     └─ emits "code" { html, js, elementStore }  ─►  html + js run on the page
                                                     script.js:
                                                     GET /installation/?location_id&widget_setting_id
                                                     -> { place, widget_settings, reviews } -> render
```

`elementStore` only holds `location_id`, `widget_setting_id` and `element_id` (the DOM id).
Reviews and settings are **never** baked into the generated code, so changes made in the app
show up on the next page load.

## Live preview while editing settings in React

After Apply, the preview iframe fetches `/installation/` once. Use "Refresh preview" to
fetch the latest saved settings after making changes in the React settings app.

The preview and published widget both fetch once on load; neither makes background polling
requests.

## What `list` already does (mirrors the React preview)

Place header (`Ratings (4.7) ★★★★★ | Reviews 120`), review filtering (`min_rating`,
`show_reviews_with_text`, `max_reviews`), theming (`background_color`, `text_color`, `star_color`,
`border_color`, `card_padding`, `card_border_radius`, `grid_spacing`, `font_size`), avatar / initial
fallback, `review_text_display` (scroll, truncate, read-more) with `review_text_limit`,
`fixed_item_height`, and `loading_choice` "view-more" / `enable_custom_height` / `viewport_height`.

## Adding a layout (grid, carousel, floating, card, rating_badge)

1. In `runtime/script.js`, write `renderGrid(reviews, place, settings)` returning a jQuery element
   (wrap it with `renderContent(...)` if it should get the height / view-more behaviour)
2. Register it: `var LAYOUTS = { list: renderList, grid: renderGrid }`
3. Style it in `runtime/widget.css` with `.ghl-rw-root[data-display-type="grid"] ...`

Until a layout exists, its `display_type` falls back to `list` (with a console warning).

## Notes

- **jQuery**: uses the page's jQuery if present; otherwise loads 3.7.1 from cdnjs with
  `noConflict(true)` so the customer's `window.$` is never touched.
- **Always use `.text()` / `.attr()` for API data**, never `.html()`. Reviews are third-party text.
- **Tailwind**: not used. The widget CSS ships as a string inside the page, so Tailwind would
  have to be compiled at build time (prefixed, preflight off). Do not use the Play CDN on customer pages.
- **CORS**: the widget calls `/installation/` from customers' domains, so the Django API must allow that.
- **Backend**: `InstallationView` should also catch Django's `ValidationError`. A malformed
  `widget_setting_id` raises it (it is not a `ValueError`), which currently becomes a 500 instead of
  `invalid_widget_settings`. The builder validates the UUID first, but a customer's published widget
  with a mistyped id would still hit it.
