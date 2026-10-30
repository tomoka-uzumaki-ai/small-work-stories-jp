/* Keep a deliberately selected Gumroad edition through its existing free workflow. */
'use strict';
(() => {
  if (new URLSearchParams(location.search).get('from') !== 'gumroad') return;
  const en = document.documentElement.lang === 'en';
  const products = {
    'text-session': {
      href: 'https://jikkenlog.gumroad.com/l/three-harbor-signs-text-session',
      label: en ? 'Japanese text-session edition on Gumroad · listed JPY 500' : 'Gumroadの日本語文章セッション版を見る · 表示500円JPY'
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
    ? 'The Gumroad edition is Japanese text on the purchase page. Separate the shared problem, clue A, clue B and solution into your own sheets or views. It does not include automatic answer checking, a game ZIP, photographs or an English PDF. Check the final checkout total and personal-use conditions. No purchase is needed to finish this free browser case.'
    : 'Gumroadで受け取るのは、購入後ページで読む日本語の文章版です。共通の問題・Aの手がかり・Bの手がかり・解答を、自分用の別紙や表示へ分けて遊びます。自動判定・ゲームZIP・写真ファイル・英語PDFは付属しません。税・通貨換算等を含む最終額と個人利用の条件は、購入前に確認してください。この無料一問を終えるための購入は不要です。';
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
