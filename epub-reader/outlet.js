/* Keep the selected storefront on the EPUB sample's language and return links. */
'use strict';
(() => {
  if (new URLSearchParams(location.search).get('from') !== 'itch') return;
  const routes = /\/(?:epub-reader|harbor-light-preview)\/(?:index\.html|en\.html)?$/;
  for (const a of document.querySelectorAll('a[href]')) {
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#')) continue;
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin || !routes.test(u.pathname)) continue;
    u.searchParams.set('from', 'itch');
    a.href = u.pathname + u.search + u.hash;
  }
})();
