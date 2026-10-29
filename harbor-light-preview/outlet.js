'use strict';
(() => {
  if (new URLSearchParams(location.search).get('from') !== 'itch') return;
  const en = document.documentElement.lang === 'en';
  const offer = document.getElementById('reading-offer');
  if (!offer) return;
  const shop = 'https://tiny-deduction-lab.itch.io/harbor-lights';
  const ep = en ? '../epub-reader/en.html' : '../epub-reader/';
  offer.hidden = false;
  offer.classList.add('edition');
  const title = document.createElement('h2');
  title.textContent = en ? 'What will Saki choose at the end of the night?' : 'この夜の終わりに、紗季が選ぶものは。';
  const description = document.createElement('p');
  description.textContent = en ? 'Follow Saki and Ritsu from the station to the rain-washed café and the evening window. The complete work includes three illustrated scenes and both finished endings, in Japanese and English.' : '海辺の駅から、雨上がりの喫茶店、夕暮れの窓辺へ。全三場面と、どちらも完結する二つの結末を、日本語・英語で収録しています。';
  const size = document.createElement('p');
  size.textContent = en ? 'This is a very short story: approximately 1,600–1,700 Japanese characters along one ending path. The first scene you have just read is included in the full work.' : '一つの結末まで読む場合、日本語で約1,600〜1,700字の短い作品です。ここで読んだ第一場面も全文版に含まれます。';
  const formats = document.createElement('p');
  formats.textContent = en ? 'One itch.io purchase includes the complete bilingual HTML reader ZIP and EPUB, with the same story and three illustrations. The HTML reader has language and ending controls; the EPUB uses chapter links in a compatible reading app.' : 'itch.ioの同じ購入に、日英の読書HTML ZIPとEPUBを含みます。物語とイラスト三点は同じ内容です。HTMLでは言語・結末を切り替え、EPUBは対応する読書アプリで章内リンクを使って読みます。';
  const linkP = document.createElement('p');
  const a = document.createElement('a');a.href=shop;a.className='paid-link';
  a.textContent = en ? 'Read the complete story on itch.io · US$3 minimum' : 'itch.ioで全三場面・両結末を読む · 最低US$3';
  linkP.append(a);
  const terms = document.createElement('p');terms.className='note';
  terms.textContent = en ? 'For personal viewing and noncommercial personal printing. Extract the full ZIP before opening index.html in a compatible browser. Phone file-viewer support and EPUB app rendering vary. Check the final checkout total. The first scene stays free.' : '個人鑑賞・個人の非商用印刷向けです。ZIPはすべて展開し、対応ブラウザーでindex.htmlを開きます。スマホのファイル表示やEPUBの表示はアプリにより異なります。最終額は決済画面でご確認ください。第一場面は引き続き無料です。';
  const sampleP=document.createElement('p');const sample=document.createElement('a');sample.href=ep;
  sample.textContent=en?'Check the free first-scene EPUB in your reading app':'無料の第一場面EPUBで、読書アプリの表示を確かめる';sampleP.append(sample);
  offer.replaceChildren(title,description,size,formats,linkP,terms,sampleP);
  if(!en){
    const status=document.getElementById('reading-outlet-status');if(status)status.textContent='第一場面を、駅のイラストとともに無料で読めます。全文版は、この場面のあとに案内しています。';
    for(const id of ['original-purchase-link','original-price-note','original-image-note']){const e=document.getElementById(id);if(e)e.hidden=true;}
  }
  for(const a of document.querySelectorAll('a')){
    const u=new URL(a.getAttribute('href') || '',location.href);
    if(u.origin===location.origin && /\/harbor-light-preview\/(?:en\.html)?$/.test(u.pathname)){
      u.searchParams.set('from','itch');a.href=u.pathname+u.search+u.hash;
    }
  }
})();
