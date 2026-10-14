(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const updateHeader = () => root.classList.toggle('has-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
  if (reduce) return;
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  const rules = [...document.querySelectorAll('.section')];
  rules.forEach((el) => el.setAttribute('data-rule', ''));
  reveals.forEach((el, i) => {
    const sibling = el.previousElementSibling;
    const sameGroup = sibling && sibling.hasAttribute('data-reveal');
    el.style.setProperty('--reveal-delay', sameGroup ? `${Math.min((i % 3) * 60, 120)}ms` : '0ms');
  });
  root.classList.add('motion-ready');
  const reveal = (el) => { el.classList.add('is-revealed'); observer?.unobserve(el); };
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => observer.observe(el));
    rules.forEach((el) => observer.observe(el));
    window.setTimeout(() => reveals.forEach(reveal), 1800);
  } else reveals.forEach(reveal);
})();
