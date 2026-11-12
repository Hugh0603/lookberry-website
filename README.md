# LookBerry student project site

This repository contains a plain HTML/CSS/JavaScript static site for a Lazarski University project. It is not the official LookBerry website. The supplied LookBerry business strategy is the source for business claims; the official site is used only for navigation and visual reference.

## Build

Requirements: Node.js 20 or newer. There are no package dependencies, build framework, CDN fonts, or remote runtime assets.

```powershell
node tools/build-site.mjs
```

The generator reads `site.config.json`, English copy in `site-src/content/en.json`, the authored stylesheet and the small form script. It writes the deployable site to `docs/`. Set `BASE_URL` in `site.config.json` to the exact published site root, including a trailing slash, before building. For a GitHub Pages project site that value is `https://<user>.github.io/<repo>/`; for a root custom domain it is `https://<domain>/`.

For a local preview that does not touch `docs/`, override the base URL and output folder from the environment, then serve the output folder:

```powershell
$env:BASE_URL = "http://localhost:8123/"; $env:OUT_DIR = "preview"; node tools/build-site.mjs
cd preview; python -m http.server 8123
```

## Content and additional languages

English is the only active locale. To add a language later, create a separate copy file such as `site-src/content/pl.json`, write every customer-facing string natively in that language, then add a locale entry to `activeLocales` with its language code, label, path prefix and copy-file path. Keep the same key structure as `en.json`; the generator emits a separate page tree and adds a language switcher when more than one locale is active. It does not translate copy automatically. Static accessibility labels, page metadata, form messages, FAQ text and image alt text belong in the locale copy file.

## Images and art direction

`site.config.json` owns each photo slot’s source path, aspect ratio, art-directed crop and shot-list note. Keep the layout by adding approved image files under `site-src/assets/images/` and setting the matching slot’s `src` to a path relative to the site root, such as `assets/images/approved-look.webp`. The default empty sources render designed placeholders; no stock or generated photography is used.

## Demo form and student safeguards

The contact form validates in the browser and only demonstrates success/error states. It asks for no personal information and sends or stores nothing. The highlighted mailto address is an `.invalid` placeholder in `site.config.json`. Student project safeguards are controlled by `studentProjectSafeguards`: while enabled, every page carries `noindex, nofollow` and `docs/robots.txt` disallows crawling.

## Measurement and consent

Measurement is off by default. To switch it on, set `analytics.gtmContainerId` in `site.config.json` to a Google Tag Manager container ID (format `GTM-XXXXXXX`) and rebuild. The build then adds a consent banner and a footer “Cookie settings” link, and `assets/js/consent.js` loads Tag Manager only after the visitor accepts. Events (`route_select`, `cta_click`, `outbound_click`, `faq_open`, `demo_form_submit`) are pushed to the data layer only after consent. The privacy page lives at `/privacy/`. See the Block 04 measurement plan in `deliverables/`.

## Search and AI answers

Each page has a title, description, canonical URL, Open Graph tags and JSON-LD (`WebSite` or `BreadcrumbList`, plus `FAQPage` built only from answered questions; open items are left out). Structured data is generated from the copy file, so it cannot drift from the page text. The Block 05 plan in `deliverables/` covers keywords, the page map and the monthly checks. Pages stay `noindex` while `studentProjectSafeguards` is true.

## Output and licensing

All generator and source files stay outside `docs/`; the generated site is what GitHub Pages serves from branch `main`, folder `/docs`. Self-hosted Libre Bodoni and Inter font files are distributed with their OFL license texts in `site-src/assets/fonts/`.
