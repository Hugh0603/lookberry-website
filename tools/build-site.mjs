import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolsDir, '..');
const config = readJson(path.join(root, 'site.config.json'));
const outputDir = path.join(root, 'docs');
const sourceAssets = path.join(root, 'site-src', 'assets');
const pages = [
  { key: 'home', routeKey: 'home', titleKey: 'home' },
  { key: 'shoppers', routeKey: 'shoppers', titleKey: 'pages.shoppers' },
  { key: 'sellers', routeKey: 'sellers', titleKey: 'pages.sellers' },
  { key: 'partners', routeKey: 'partners', titleKey: 'pages.partners' },
  { key: 'battles', routeKey: 'battles', titleKey: 'pages.battles' },
  { key: 'contact', routeKey: 'contact', titleKey: 'pages.contact' }
];

function readJson(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function assertBaseUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('BASE_URL must use http or https.');
  }
  if (!url.pathname.endsWith('/')) {
    throw new Error('BASE_URL must end with a slash and identify the site root.');
  }
  return url;
}

const baseUrl = assertBaseUrl(config.BASE_URL);

function siteUrl(route = '', localeEntry = config.activeLocales[0]) {
  const prefix = localeEntry.pathPrefix || '';
  return new URL(`${prefix}${route}`, baseUrl).href;
}

function assetUrl(assetPath) {
  return new URL(assetPath.replace(/^\/+/, ''), baseUrl).href;
}

function localContactUrl(localeEntry) {
  const url = new URL(`${localeEntry.pathPrefix || ''}${config.routes.contact}`, baseUrl);
  url.hash = 'demo-form';
  return url.href;
}

function localeCopy(localeEntry) {
  const copy = readJson(path.join(root, localeEntry.copyFile));
  if (copy.locale !== localeEntry.code) {
    throw new Error(`Locale mismatch in ${localeEntry.copyFile}: expected ${localeEntry.code}.`);
  }
  const rate = config.SHOW_COMMISSION_RATE ? config.COMMISSION_RATE : '';
  const commissionCopy = {
    homeSellerQuestion: rate
      ? `I want to list my products. How does the ${rate} commission work, and when am I paid?`
      : 'I want to list my products. How does the commission work, and when am I paid?',
    homeCommission: rate ? `${rate} on each marketplace sale` : 'A commission on each marketplace sale',
    faqCommission: rate
      ? `LookBerry earns a ${rate} commission on marketplace sales. The rate and how it is calculated are set out in the seller terms.`
      : 'LookBerry earns a commission on marketplace sales. The rate and how it is calculated are set out in the seller terms.',
    shopperCommission: rate
      ? `LookBerry earns a ${rate} commission on each marketplace sale.`
      : 'LookBerry earns a commission on marketplace sales.',
    sellerCommissionFact: rate
      ? `LookBerry earns a ${rate} commission on each marketplace sale.`
      : 'A commission applies to each marketplace sale. The rate is set out in the seller terms.',
    sellerCommissionTerm: rate
      ? `A ${rate} commission applies to each sale.`
      : 'A commission applies to each sale. The rate is set out in the seller terms.'
  };
  const expandCommissionTokens = (value) => {
    if (Array.isArray(value)) return value.map(expandCommissionTokens);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, expandCommissionTokens(nested)]));
    }
    if (typeof value !== 'string') return value;
    return value.replace(/\{\{commission:([A-Za-z]+)\}\}/g, (_, key) => commissionCopy[key] ?? '');
  };
  return expandCommissionTokens(copy);
}

function routeFor(pageKey) {
  return config.routes[pageKey];
}

function ariaCurrent(activeKey, targetKey) {
  return activeKey === targetKey ? ' aria-current="page"' : '';
}

function navAnchor(route, anchor, localeEntry) {
  const url = new URL(`${localeEntry.pathPrefix || ''}${route}`, baseUrl);
  url.hash = anchor;
  return url.href;
}

function renderHeader(copy, activeKey, localeEntry) {
  const nav = copy.navigation;
  const navLinks = [
    { key: 'home', label: nav.how, href: navAnchor(config.routes.home, 'how-it-works', localeEntry) },
    { key: 'battles', label: nav.battles, href: siteUrl(routeFor('battles'), localeEntry) },
    { key: 'shoppers', label: nav.shoppers, href: siteUrl(routeFor('shoppers'), localeEntry) },
    { key: 'sellers', label: nav.sellers, href: siteUrl(routeFor('sellers'), localeEntry) },
    { key: 'partners', label: nav.partners, href: siteUrl(routeFor('partners'), localeEntry) }
  ];
  const links = navLinks.map((item) => `<a href="${escapeHtml(item.href)}"${ariaCurrent(activeKey, item.key)}>${escapeHtml(item.label)}</a>`).join('\n');
  const language = config.activeLocales.length > 1
    ? `<div class="language-switch" aria-label="${escapeHtml(nav.languageLabel)}">${config.activeLocales.map((item) => {
      const href = siteUrl(routeFor(activeKey), item);
      return `<a href="${escapeHtml(href)}" lang="${escapeHtml(item.code)}"${item.code === localeEntry.code ? ' aria-current="page"' : ''}>${escapeHtml(item.code.toUpperCase())}</a>`;
    }).join('')}</div>`
    : `<span class="language-current" lang="${escapeHtml(localeEntry.code)}" aria-label="${escapeHtml(nav.languageLabel)}: ${escapeHtml(localeEntry.label)}">${escapeHtml(localeEntry.code.toUpperCase())}</span>`;
  const emailHref = `mailto:${config.contact.mailtoAddress}`;
  const emailLabel = config.contact.mailtoIsPlaceholder ? nav.emailPlaceholder : nav.contact;

  return `<a class="skip-link" href="#main">${escapeHtml(copy.skipLink)}</a>
<header class="site-header">
  <div class="header-inner">
    <a class="wordmark" href="${escapeHtml(siteUrl('', localeEntry))}" aria-label="${escapeHtml(nav.homeAriaLabel)}">${escapeHtml(nav.home)}<span class="wordmark-dot" aria-hidden="true">.</span></a>
    <nav class="desktop-nav" aria-label="${escapeHtml(nav.primaryNavLabel)}">${links}</nav>
    <div class="header-tools">
      ${language}
      <a class="header-email" href="${escapeHtml(emailHref)}" title="${escapeHtml(nav.emailTitle)}">${escapeHtml(emailLabel)}</a>
      <details class="mobile-menu">
        <summary aria-label="${escapeHtml(nav.openNavLabel)}">${escapeHtml(nav.mobileNavLabel)}</summary>
        <nav aria-label="${escapeHtml(nav.mobileNavLabel)}">${links}</nav>
      </details>
    </div>
  </div>
</header>`;
}

function imageDimensions(aspectRatio) {
  const parts = String(aspectRatio).split('/').map((part) => Number(part.trim()));
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { width: 800, height: 1000 };
  return { width: Math.round(parts[0] * 200), height: Math.round(parts[1] * 200) };
}

function renderImage(slotKey, copy, options = {}) {
  const slot = config.imageSlots[slotKey];
  if (!slot) throw new Error(`Missing image slot in CONFIG: ${slotKey}`);
  const style = `--frame-ratio:${escapeHtml(slot.aspectRatio)};--object-position:${escapeHtml(slot.objectPosition)}`;
  const shotNote = escapeHtml(slot.shotListNote);
  const label = escapeHtml(copy.imagePlaceholder.eyebrow);
  const placeholderLine = escapeHtml(copy.imagePlaceholder.line);
  const dimensions = imageDimensions(slot.aspectRatio);
  const imageAlt = copy.mediaAlt?.[slotKey] || slot.alt;
  const image = slot.src
    ? `<img src="${escapeHtml(assetUrl(slot.src))}" alt="${escapeHtml(imageAlt)}" width="${dimensions.width}" height="${dimensions.height}" style="object-position:${escapeHtml(slot.objectPosition)}" ${options.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
    : `<div class="placeholder-art" role="img" aria-label="${escapeHtml(imageAlt)}" data-shot-note="${shotNote}">
        <span class="placeholder-index" aria-hidden="true">${escapeHtml(options.index || '01')}</span>
        <span class="placeholder-rule" aria-hidden="true"></span>
        <span class="placeholder-meta"><span class="placeholder-caption">${label}</span><span class="placeholder-status">${placeholderLine}</span></span>
      </div>`;
  const caption = options.caption ? `<figcaption>${escapeHtml(options.caption)}</figcaption>` : '';
  return `<figure class="media-frame ${escapeHtml(options.className || '')}" style="${style}">${image}${caption}</figure>`;
}

function sectionHeading(eyebrow, title, intro = '', id = '') {
  return `<div class="section-heading" data-reveal><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2 id="${escapeHtml(id)}">${escapeHtml(title)}</h2>${intro ? `<p class="section-intro">${escapeHtml(intro)}</p>` : ''}</div>`;
}

function renderFaq(items) {
  return `<div class="faq-list">${items.map((item) => {
    const answer = item.answerPlaceholder
      ? `<p><span class="term-placeholder">${escapeHtml(item.answerPlaceholder)}</span></p>`
      : `<p>${escapeHtml(item.answer)}</p>`;
    return `<details class="faq-item"><summary>${escapeHtml(item.question)}</summary><div class="faq-answer">${answer}</div></details>`;
  }).join('')}</div>`;
}

function renderHeaderLink(copy, href, label, className = 'button') {
  return `<a class="${escapeHtml(className)}" href="${escapeHtml(href)}">${escapeHtml(label)}<span aria-hidden="true">↗</span></a>`;
}

function renderHome(copy, localeEntry) {
  const home = copy.home;
  const pathCards = home.paths.map((item) => `<article class="path-panel path-panel-${escapeHtml(item.number)}" data-reveal>
    <p class="path-number">${escapeHtml(item.number)}</p>
    <p class="eyebrow">${escapeHtml(item.persona)}</p>
    <h3>${escapeHtml(item.question)}</h3>
    <a class="text-link" href="${escapeHtml(siteUrl(routeFor(item.route), localeEntry))}">${escapeHtml(item.linkLabel)}<span aria-hidden="true">↗</span></a>
  </article>`).join('');
  const steps = home.steps.map((step) => `<article class="step-row">
    <span class="step-number">${escapeHtml(step.number)}</span>
    <h3>${escapeHtml(step.title)}</h3>
    <p>${escapeHtml(step.text)}</p>
  </article>`).join('');
  const proof = home.proofItems.map((item) => `<div class="proof-item" data-reveal><p class="eyebrow">${escapeHtml(item.label)}</p><p>${escapeHtml(item.value)}</p></div>`).join('');
  const contactHref = siteUrl(routeFor('contact'), localeEntry);

  return `<main id="main" class="page-main home-page">
<section class="hero hero-home" aria-labelledby="home-title">
  <div class="hero-copy">
    <p class="eyebrow">${escapeHtml(home.heroEyebrow)}</p>
    <h1 id="home-title" aria-label="${escapeHtml(home.heroTitle)}">${home.heroLines.map((line) => `<span class="hero-title-line">${escapeHtml(line)}</span>`).join('')}</h1>
    <p class="hero-deck">${escapeHtml(home.heroText)}</p>
    ${renderHeaderLink(copy, navAnchor(routeFor('home'), 'choose-path', localeEntry), home.heroCta)}
    <p class="hero-note">${escapeHtml(home.heroNote)}</p>
  </div>
  ${renderImage('homeCampaign', copy, { className: 'hero-media', eager: true, caption: home.heroCaption })}
  <nav class="hero-route-index" aria-label="${escapeHtml(home.routeIndexLabel)}">
    ${home.routeIndex.map((item) => `<a class="hero-route" href="${escapeHtml(siteUrl(routeFor(item.route), localeEntry))}"><span class="hero-route-number">${escapeHtml(item.number)}</span><span class="hero-route-copy"><span class="hero-route-label">${escapeHtml(item.label)}</span><span class="hero-route-question">${escapeHtml(item.question)}</span></span><span class="hero-route-arrow" aria-hidden="true">↗</span></a>`).join('')}
  </nav>
  <p class="hero-folio" aria-hidden="true">LOOKBERRY / FASHION IN CONTEXT</p>
</section>
<section id="choose-path" class="section section-paths" aria-labelledby="paths-title">
  ${sectionHeading(home.pathsEyebrow, home.pathsTitle, '', 'paths-title')}
  <div class="path-grid">${pathCards}</div>
</section>
<section id="how-it-works" class="section section-how" aria-labelledby="how-title">
  ${sectionHeading(home.howEyebrow, home.howTitle, home.howText, 'how-title')}
  <div class="step-list">${steps}</div>
</section>
<section class="section section-battles" aria-labelledby="battle-title">
  <div class="battle-copy">
    <p class="eyebrow">${escapeHtml(home.battleEyebrow)}</p>
    <h2 id="battle-title">${escapeHtml(home.battleTitle)}</h2>
    <p class="section-intro">${escapeHtml(home.battleText)}</p>
    <p class="status-line">${escapeHtml(home.battleStatus)}</p>
    ${renderHeaderLink(copy, config.externalLinks.youtube, home.battleCta, 'text-link text-link-strong')}
  </div>
  ${renderImage('battleEpisode', copy, { index: 'B', className: 'battle-image', caption: home.battleCaption })}
</section>
<section id="proof" class="section section-proof" aria-labelledby="proof-title">
  ${sectionHeading(home.proofEyebrow, home.proofTitle, '', 'proof-title')}
  <div class="proof-grid">${proof}</div>
</section>
<section id="faq" class="section section-faq" aria-labelledby="faq-title">
  ${sectionHeading(home.faqEyebrow, home.faqTitle, '', 'faq-title')}
  ${renderFaq(home.faq)}
</section>
<section class="section section-contact-teaser" aria-labelledby="contact-teaser-title">
  <div>
    <p class="eyebrow">${escapeHtml(home.contactEyebrow)}</p>
    <h2 id="contact-teaser-title">${escapeHtml(home.contactTitle)}</h2>
    <p class="section-intro">${escapeHtml(home.contactText)}</p>
  </div>
  ${renderHeaderLink(copy, contactHref, home.contactCta)}
</section>
</main>`;
}

function renderTerms(terms) {
  return `<dl class="terms-list">${terms.map((term) => `<div class="terms-row">
    <dt>${escapeHtml(term.label)}</dt>
    <dd>${term.placeholder ? `<span class="term-placeholder">${escapeHtml(term.value)}</span>` : escapeHtml(term.value)}</dd>
  </div>`).join('')}</dl>`;
}

function renderPersonaPage(copy, localeEntry, pageKey) {
  const page = copy.pages[pageKey];
  const ctaHref = page.ctaKind === 'shop'
    ? config.externalLinks.shop
    : page.ctaKind === 'youtube'
      ? config.externalLinks.youtube
      : localContactUrl(localeEntry);
  const facts = page.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('');
  const faq = page.faq ? `<section class="section section-faq" aria-labelledby="persona-faq-title">
    ${sectionHeading(page.faqEyebrow, page.faqTitle, '', 'persona-faq-title')}
    ${renderFaq(page.faq)}
  </section>` : '';
  const note = page.note ? `<p class="callout-note">${escapeHtml(page.note)}</p>` : '';

  return `<main id="main" class="page-main interior-page page-${escapeHtml(pageKey)}">
<section class="interior-hero" aria-labelledby="page-title">
  <div class="interior-copy">
    <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
    <h1 id="page-title">${escapeHtml(page.heading)}</h1>
    <p class="hero-deck">${escapeHtml(page.intro)}</p>
    ${renderHeaderLink(copy, ctaHref, page.cta)}
  </div>
  ${renderImage(page.imageSlot, copy, { index: pageKey === 'battles' ? 'B' : '01', className: 'interior-image', caption: page.imageCaption })}
</section>
${pageKey === 'sellers' ? `<section class="section section-terms" aria-labelledby="terms-heading">
  ${sectionHeading(page.termsEyebrow, page.termsHeading, '', 'terms-heading')}
  ${renderTerms(page.terms)}
  ${note}
</section>` : ''}
${pageKey === 'battles' ? `<section class="section section-mechanics" aria-labelledby="mechanics-heading">
  ${sectionHeading(page.mechanicTitle, page.mechanicsHeading, '', 'mechanics-heading')}
  <ul class="fact-list">${page.mechanics.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>
  ${note}
</section>` : ''}
${pageKey === 'partners' ? `<section class="section section-facts" aria-labelledby="facts-title">
  ${sectionHeading(page.factsTitle, page.factsHeading, '', 'facts-title')}
  <ul class="fact-list">${facts}</ul>
  ${note}
</section>` : ''}
${pageKey === 'shoppers' ? `<section class="section section-facts" aria-labelledby="facts-title">
  ${sectionHeading(page.factsTitle, page.factsHeading, '', 'facts-title')}
  <ul class="fact-list">${facts}</ul>
  ${faq}
</section>` : ''}
${pageKey === 'battles' ? `<section class="section section-facts" aria-labelledby="status-heading">
  ${sectionHeading(page.statusEyebrow, page.statusHeading, '', 'status-heading')}
  <ul class="fact-list">${facts}</ul>
  ${renderHeaderLink(copy, config.externalLinks.youtube, page.cta, 'text-link text-link-strong')}
</section>` : ''}
</main>`;
}

function renderContactPage(copy, localeEntry) {
  const page = copy.pages.contact;
  const emailAddress = config.contact.mailtoAddress;
  const emailHref = `mailto:${emailAddress}`;
  const emailState = config.contact.mailtoIsPlaceholder ? 'is-placeholder' : '';
  return `<main id="main" class="page-main interior-page contact-page">
<section class="contact-hero" aria-labelledby="page-title">
  <div class="contact-copy">
    <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
    <h1 id="page-title">${escapeHtml(page.heading)}</h1>
    <p class="hero-deck">${escapeHtml(page.intro)}</p>
    <p class="demo-notice">${escapeHtml(page.demoNotice)}</p>
  </div>
  <form id="demo-form" class="demo-form" data-demo-form data-success="${escapeHtml(page.success)}" data-validation-error="${escapeHtml(page.errorValidation)}" data-error="${escapeHtml(page.errorGeneric)}" novalidate>
    <fieldset>
      <legend>${escapeHtml(page.formLegend)}</legend>
      <label for="inquiry-intent">${escapeHtml(page.intentLabel)}</label>
      <select id="inquiry-intent" name="intent" required disabled aria-describedby="intent-error">
        <option value="">${escapeHtml(page.intentPrompt)}</option>
        <option value="seller">${escapeHtml(page.intentSeller)}</option>
        <option value="partner">${escapeHtml(page.intentPartner)}</option>
      </select>
      <p id="intent-error" class="field-error" data-error-for="intent" hidden>${escapeHtml(page.errorIntent)}</p>
      <div class="acknowledge-row">
        <input id="demo-ack" name="demoAck" type="checkbox" required disabled aria-describedby="ack-error">
        <label for="demo-ack">${escapeHtml(page.ackLabel)}</label>
      </div>
      <p id="ack-error" class="field-error" data-error-for="ack" hidden>${escapeHtml(page.errorAck)}</p>
    </fieldset>
    <button class="button button-primary form-submit" type="submit" disabled>${escapeHtml(page.submitLabel)}</button>
    <p class="form-status" data-form-status role="status" aria-live="polite" aria-atomic="true"></p>
    <noscript><p class="form-noscript">${escapeHtml(page.formNoscript)}</p></noscript>
  </form>
</section>
<section class="section section-contact-email" aria-labelledby="email-title">
  ${sectionHeading(page.mailtoIntro, page.mailtoHeading, '', 'email-title')}
  <p class="mailto-note">${escapeHtml(page.mailtoNote)}</p>
  <a class="mailto-placeholder ${emailState}" href="${escapeHtml(emailHref)}" title="${escapeHtml(page.mailtoTitle)}">${escapeHtml(emailAddress)}</a>
</section>
</main>`;
}

function renderFooter(copy, localeEntry) {
  const footer = copy.footer;
  const pagesFooter = [
    ['home', copy.navigation.how], ['battles', copy.navigation.battles], ['shoppers', copy.navigation.shoppers],
    ['sellers', copy.navigation.sellers], ['partners', copy.navigation.partners]
  ];
  const links = pagesFooter.map(([key, label]) => {
    const href = key === 'home' ? navAnchor(routeFor('home'), 'how-it-works', localeEntry) : siteUrl(routeFor(key), localeEntry);
    return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  }).join('');
  return `<footer class="site-footer">
  <div class="footer-main">
    <a class="footer-wordmark" href="${escapeHtml(siteUrl('', localeEntry))}">${escapeHtml(copy.brand)}<span aria-hidden="true">.</span></a>
    <p>${escapeHtml(footer.sitePurpose)}</p>
    <nav aria-label="${escapeHtml(footer.navLabel)}">${links}</nav>
  </div>
  <div class="footer-meta">
    <p class="student-disclaimer">${escapeHtml(footer.studentLine)}</p>
    <p class="legal-placeholders"><span>${escapeHtml(footer.privacyPlaceholder)}</span><span>${escapeHtml(footer.termsPlaceholder)}</span></p>
    <a class="back-to-top" href="#top">${escapeHtml(footer.backToTop)}<span aria-hidden="true">↑</span></a>
  </div>
</footer>`;
}

function shell(copy, pageKey, pageData, localeEntry, bodyContent) {
  const route = routeFor(pageKey);
  const canonical = siteUrl(route, localeEntry);
  const robots = config.studentProjectSafeguards ? '<meta name="robots" content="noindex, nofollow">' : '';
  const title = pageData.title;
  const description = pageData.description;
  const cssHref = assetUrl('assets/css/site.css');
  const faviconHref = assetUrl('assets/favicon.svg');
  const scriptTag = `<script src="${escapeHtml(assetUrl('assets/js/motion.js'))}" defer></script>${pageKey === 'contact' ? `\n  <script src="${escapeHtml(assetUrl('assets/js/form.js'))}" defer></script>` : ''}`;
  const direction = copy.direction || 'ltr';
  return `<!doctype html>
<html lang="${escapeHtml(localeEntry.code)}" dir="${escapeHtml(direction)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${robots}
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" type="image/svg+xml" href="${escapeHtml(faviconHref)}">
  <link rel="stylesheet" href="${escapeHtml(cssHref)}">
</head>
<body id="top" class="page-${escapeHtml(pageKey)}">
${renderHeader(copy, pageKey, localeEntry)}
${bodyContent}
${renderFooter(copy, localeEntry)}
${scriptTag}
</body>
</html>`;
}

function pageBody(pageKey, copy, localeEntry) {
  if (pageKey === 'home') return renderHome(copy, localeEntry);
  if (pageKey === 'contact') return renderContactPage(copy, localeEntry);
  return renderPersonaPage(copy, localeEntry, pageKey);
}

function outputPath(localeEntry, route) {
  const publicPath = `${localeEntry.pathPrefix || ''}${route}`;
  const segments = publicPath.split('/').filter(Boolean);
  return path.join(outputDir, ...segments, 'index.html');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyAssetDirectory(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) copyAssetDirectory(sourcePath, destinationPath);
    else fs.copyFileSync(sourcePath, destinationPath);
  }
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
}

function main() {
  if (!Array.isArray(config.activeLocales) || !config.activeLocales.length) {
    throw new Error('Add at least one active locale in site.config.json.');
  }
  const sitemapUrls = [];
  for (const localeEntry of config.activeLocales) {
    const copy = localeCopy(localeEntry);
    for (const page of pages) {
      const pageData = page.key === 'home' ? copy.home : copy.pages[page.key];
      if (!pageData) throw new Error(`Missing ${page.key} copy in ${localeEntry.copyFile}.`);
      const destination = outputPath(localeEntry, config.routes[page.routeKey]);
      ensureDir(destination);
      fs.writeFileSync(destination, shell(copy, page.key, pageData, localeEntry, pageBody(page.key, copy, localeEntry)), 'utf8');
      sitemapUrls.push(siteUrl(config.routes[page.routeKey], localeEntry));
    }
  }

  copyAssetDirectory(sourceAssets, path.join(outputDir, 'assets'));
  fs.mkdirSync(path.join(outputDir, 'assets', 'css'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'assets', 'js'), { recursive: true });
  fs.copyFileSync(path.join(root, 'site-src', 'styles', 'site.css'), path.join(outputDir, 'assets', 'css', 'site.css'));
  fs.copyFileSync(path.join(root, 'site-src', 'scripts', 'form.js'), path.join(outputDir, 'assets', 'js', 'form.js'));
  fs.copyFileSync(path.join(root, 'site-src', 'scripts', 'motion.js'), path.join(outputDir, 'assets', 'js', 'motion.js'));
  fs.writeFileSync(path.join(outputDir, '.nojekyll'), '', 'utf8');

  const robotsBody = config.studentProjectSafeguards
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\n';
  fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsBody, 'utf8');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`Built ${sitemapUrls.length} pages into docs/ using BASE_URL ${baseUrl.href}`);
}

main();
