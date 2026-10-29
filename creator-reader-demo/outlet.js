'use strict';
(() => {
  if (new URLSearchParams(location.search).get('from') !== 'itch') return;
  const purchase = document.getElementById('creator-purchase-link');
  const price = document.getElementById('creator-price-note');
  if (!purchase || !price) return;
  const en = document.documentElement.lang === 'en';
  purchase.href = 'https://tiny-deduction-lab.itch.io/bilingual-reader-kit';
  purchase.textContent = en
    ? 'View the same creator kit on itch.io · US$3 minimum'
    : '同じ制作キットをitch.ioで見る · 最低US$3';
  price.textContent = en
    ? 'One purchase supplies the creator kit, not a finished story or artwork. Check the final checkout total. You do not need to buy the same kit from both stores.'
    : '完成した物語や画像ではなく、制作キットを受け取る購入です。最終額は決済画面でご確認ください。同じキットを両方の売場で購入する必要はありません。';
  for (const a of document.querySelectorAll('a[data-creator-language]')) {
    const u = new URL(a.getAttribute('href'), location.href);
    if (u.origin === location.origin && /\/creator-reader-demo\/(?:en\.html)?$/.test(u.pathname)) {
      u.searchParams.set('from', 'itch');
      a.href = u.pathname + u.search + u.hash;
    }
  }
})();
