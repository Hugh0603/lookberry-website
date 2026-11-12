// Consent and measurement.
// Nothing here runs unless the build was given a Google Tag Manager container ID.
// Google Tag Manager is loaded only after the visitor chooses "accept"; events are only
// pushed to the data layer after that choice, so nothing is queued before consent.
(() => {
  const gtmId = document.body.dataset.gtm;
  if (!gtmId) return;

  const KEY = 'lb-consent';
  const banner = document.querySelector('[data-consent-banner]');
  let loaded = false;

  function read() {
    try { return window.localStorage.getItem(KEY); } catch { return null; }
  }
  function write(value) {
    try { window.localStorage.setItem(KEY, value); } catch { /* storage unavailable: the choice lasts for this page only */ }
  }

  function loadTagManager() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    document.head.appendChild(script);
  }

  function track(name, params = {}) {
    if (!loaded) return;
    window.dataLayer.push({ event: name, page_type: document.body.className.replace('page-', ''), ...params });
  }

  function apply(choice) {
    if (choice === 'granted') {
      loadTagManager();
      track('consent_granted');
    }
  }

  function decide(choice) {
    write(choice);
    if (banner) banner.hidden = true;
    apply(choice);
  }

  // Banner buttons and the footer "Cookie settings" link.
  document.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-consent]');
    if (choice) { decide(choice.dataset.consent); return; }
    if (event.target.closest('[data-consent-open]') && banner) {
      banner.hidden = false;
      const first = banner.querySelector('button');
      if (first) first.focus();
    }
  });

  // Measurement events. All of them are no-ops until consent has been granted.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    const text = (link.textContent || '').replace(/[↗↑]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (url.origin !== location.origin) {
      const host = url.hostname.replace(/^www\./, '');
      const kind = host.includes('youtube') ? 'youtube' : host.includes('lookberry') ? 'marketplace' : 'other';
      track('outbound_click', { destination: kind, link_text: text });
    } else if (link.closest('.hero-route-index, .path-grid')) {
      track('route_select', { route: url.pathname, link_text: text });
    } else if (link.matches('.button')) {
      track('cta_click', { destination: url.pathname + url.hash, link_text: text });
    }
  });

  document.addEventListener('toggle', (event) => {
    const item = event.target;
    if (item.matches && item.matches('.faq-item') && item.open) {
      const summary = item.querySelector('summary');
      track('faq_open', { question: summary ? summary.textContent.trim().slice(0, 100) : '' });
    }
  }, true);

  document.addEventListener('lb:demo-form-success', (event) => {
    track('demo_form_submit', { intent: event.detail && event.detail.intent });
  });

  // Initial state: a stored choice is applied silently, otherwise the banner is shown.
  const stored = read();
  if (stored === 'granted' || stored === 'denied') apply(stored);
  else if (banner) banner.hidden = false;
})();
