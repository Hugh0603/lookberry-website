# Locale copy files

The generator reads one complete native copy file per active locale listed in `site.config.json`. English is currently the only active locale. To add one later:

1. Copy the structure of `en.json` to a new file named for the locale, such as `pl.json`.
2. Write every visible string, page title/description, navigation and accessibility label, FAQ answer, form state, footer line and image alt text natively in that language. Do not translate automatically.
3. Preserve keys, page routes, IDs and form value keys; translate only their human-facing labels and messages.
4. Add `{ "code": "pl", "label": "Polski", "pathPrefix": "pl/", "copyFile": "site-src/content/pl.json" }` to `activeLocales` and build again.

`mediaAlt` provides locale-specific alt text, while `site.config.json` remains the source of image paths, ratios, object positions and shot-list notes.
