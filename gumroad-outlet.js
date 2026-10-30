/* Keep a deliberately selected Gumroad edition through its existing free workflow. */
'use strict';
(() => {
  if (new URLSearchParams(location.search).get('from') !== 'gumroad') return;
  const en = document.documentElement.lang === 'en';
  const products = {
    'text-session': {
      href: 'https://jikkenlog.gumroad.com/l/three-harbor-signs-text-session',
      label: en ? 'English & Japanese print/text edition on Gumroad · listed JPY 500' : 'Gumroadの日英印刷・文章版を見る · 表示500円JPY'
    },
    creator: {
      href: 'https://jikkenlog.gumroad.com/l/bilingual-reader-source-kit',
      label: en ? 'View the same creator kit on Gumroad · listed JPY 500' : '同じ制作キットをGumroadで確認 · 表示500円JPY'
    }
  };
  for (const a of document.querySelectorAll('a[data-gumroad-product]')) {
    const product = products[a.getAttribute('data-gumroad-product')];
    if (!product) continue;
    a.href = product.href;
    a.textContent = product.label;
  }
  const sessionNote = en
    ? 'The Gumroad edition includes English and Japanese text on the purchase page: the same three cases in either language. The attached PDFs have 13 pages per language, with separate player, hint and answer pages; print single-sided. You can also separate the on-page text into your own views. Automatic answer checking, a game ZIP and photographs are not included. Check the final checkout total and personal-use conditions. No purchase is needed to finish this free browser case.'
    : 'Gumroadで受け取るのは、購入後ページで読む日本語・英語の文章版です。両言語は同じ3ケースです。各言語13ページの印刷PDFを添付し、A/Bの手がかり・ヒント・解答を別ページにしています。片面印刷で使えます。本文を自分用の表示に分けることもできます。自動判定・ゲームZIP・写真ファイルは付属しません。税・通貨換算等を含む最終額と個人利用の条件は、購入前に確認してください。この無料一問を終えるための購入は不要です。';
  for (const p of document.querySelectorAll('[data-gumroad-session-format]')) p.textContent = sessionNote;
  for (const p of document.querySelectorAll('[data-gumroad-duplicate]')) p.hidden = true;
  // Keep the choice only across this free game/author workflow. Downloads and explicit other-store choices stay intact.
  const workflow = /\/(?:two-roads|harbor-first-case|harbor-first-case-en|creator-reader-demo|story-composer|creator-input-check|make-a-bilingual-story)\/(?:index\.html|en\.html)?$/;
  const probe = /\/creator-input-check\/readiness-probe\/(?:index\.html|en\.html)?$/;
  for (const a of document.querySelectorAll('a[href]')) {
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || a.hasAttribute('download')) continue;
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin || !(workflow.test(u.pathname) || probe.test(u.pathname))) continue;
    u.searchParams.set('from', 'gumroad');
    a.href = u.pathname + u.search + u.hash;
  }
})();
