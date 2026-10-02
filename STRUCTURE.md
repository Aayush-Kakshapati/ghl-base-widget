# Project Structure

This project is a small Vite application that acts as a Google Reviews widget builder for HighLevel. The builder itself is plain browser JavaScript; the widget it creates is plain HTML, CSS, and JavaScript with jQuery at runtime. There is no React application in this repository.

## Project Flow

### 1. Start the builder

`index.html` provides the page shell and an `#app` mount point, then loads `src/main.js`. The entry point imports the builder styles and calls `startBuilder()` from `src/builder.js`.

### 2. Load previously saved IDs, if available

The builder asks `src/ghl.js` for the current HighLevel element store using Postmate. When the builder is embedded in HighLevel, this store may contain the IDs saved from an earlier configuration. When opened directly in a browser tab, the HighLevel bridge is skipped and the user can still use the form.

### 3. Verify the submitted IDs

The user copies a Location ID and Widget ID from the companion app's Installation page. `src/builder.js` trims and checks the values, then calls `verifyInstallation()` in `src/installation.js`. That module builds a request to the installation endpoint configured in `src/config.js` and turns network or API failures into readable errors. The widget is not sent to HighLevel unless verification succeeds.

### 4. Generate and save the widget

After a successful check, `src/builder.js` calls `generateWidget()` from `src/widget/generateWidget.js`. The generator returns three things: an HTML shell, an inline JavaScript program, and an `elementStore` containing the location ID, widget-settings ID, and generated DOM element ID. `src/ghl.js` emits those values to HighLevel as a `code` event. Reviews and settings are not embedded in this saved payload.

### 5. Preview and render

The builder puts a generated copy in an iframe for preview. The preview fetches installation data on load, and the user can refresh it with the Preview button after changing settings. The production widget sent to HighLevel also fetches once on page load; neither uses a polling interval.

The widget code is assembled from `src/widget/createHtml.js`, `src/widget/createCss.js`, and `src/widget/createJs.js`. The JavaScript factory embeds the runtime source and configuration into a self-contained script. That runtime (`src/widget/runtime/script.js`) fetches the installation endpoint, processes settings and reviews, and renders the widget; `src/widget/runtime/widget.css` provides its isolated, prefixed styles.

In short:

```text
index.html -> src/main.js -> src/builder.js
                               |       |
                               |       +-> src/installation.js -> src/config.js -> API
                               +----------> src/widget/generateWidget.js
                                                  |-> HTML + CSS + JS + elementStore
                               src/ghl.js <-------+-> HighLevel code event

Customer page: generated HTML + generated JS -> runtime fetch -> rendered reviews
```

## File Reference

### Root files

- `index.html`: Vite's HTML entry page. Defines the app mount point, page metadata, favicon link, and module script for `src/main.js`.
- `vite.config.js`: Vite configuration. Sets the development server port to `5174` and uses a relative build base so built assets can be served from a nested hosting path.
- `package.json`: Project metadata, dependencies, and commands: `npm run dev`, `npm run build`, `npm run preview`, and `npm test`.
- `package-lock.json`: Exact dependency resolution for repeatable npm installs.
- `.env`: Local environment configuration, including the API base URL used by Vite. It may contain machine- or environment-specific values; keep it private.
- `.env.example`: Safe template showing the required `VITE_API_BASE_URL` setting.
- `.gitignore`: Excludes installed dependencies, build output, logs, local environment files, and editor/OS files from version control.
- `README.md`: User-oriented setup instructions, feature notes, and a shorter overview of the widget's behavior.
- `STRUCTURE.md`: This deeper code and data-flow reference.

### Static assets and checks

- `public/favicon.svg`: Favicon served by Vite and linked from `index.html`.
- `scripts/smoke-test.mjs`: Node-based smoke tests using jsdom and a mock API. Exercises the generated widget and builder flow without requiring a live HighLevel session or browser UI.

### Builder application (`src/`)

- `src/main.js`: Browser entry point. Loads `style.css`, locates `#app`, and starts the builder.
- `src/builder.js`: Builds and controls the ID form, validates user input, calls the installation check, shows status/settings, creates the iframe preview, and sends the verified widget to HighLevel. It also auto-applies saved IDs when reopening an existing HighLevel element.
- `src/installation.js`: Validates Widget ID UUID syntax, calls the installation API, and maps API/network failures to `InstallationError` messages suitable for the builder UI.
- `src/config.js`: Reads `VITE_API_BASE_URL` and constructs the installation endpoint URL.
- `src/ghl.js`: Owns the Postmate connection to HighLevel. Reads previously saved `elementStore` data and emits generated widget code; outside HighLevel, it safely skips the bridge.
- `src/style.css`: Styles the builder interface and its preview controls. These styles are separate from the styles embedded in the published widget.

### Widget assembly (`src/widget/`)

- `src/widget/generateWidget.js`: Coordinates widget creation and returns `{ html, js, elementStore }`. It creates or reuses the widget's DOM ID and constructs the runtime configuration.
- `src/widget/createHtml.js`: Produces the widget's empty root `<div>`; runtime JavaScript fills it with rendered content.
- `src/widget/createCss.js`: Imports `runtime/widget.css` as raw text and returns it for embedding in the generated HTML.
- `src/widget/createJs.js`: Imports `runtime/script.js` as raw text, safely serializes configuration, and wraps the runtime in a self-contained IIFE that starts with `ghlBoot()`.

### Widget runtime (`src/widget/runtime/`)

- `src/widget/runtime/script.js`: Code that runs on the customer's page and inside the preview. It obtains jQuery (using an existing copy when possible), requests installation data, applies widget settings and review filters, and renders the available layout.
- `src/widget/runtime/widget.css`: Styles the rendered widget. Its `ghl-rw-` class names and root scoping help prevent collisions with the host page's CSS.

## Commands

- `npm run dev`: Start the local Vite builder at `http://localhost:5174`.
- `npm run build`: Build the static production bundle into `dist/`.
- `npm run preview`: Serve the production build locally for inspection.
- `npm test`: Run `scripts/smoke-test.mjs`.