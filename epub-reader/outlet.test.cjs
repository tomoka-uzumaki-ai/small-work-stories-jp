'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'outlet.js'),'utf8');
function run(html,href) {
 const anchors=[...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)].map(m=>({href:m[1],getAttribute(){return this.href;}}));
 vm.runInNewContext(source,{document:{querySelectorAll(){return anchors;}},location:new URL(href),URL,URLSearchParams});
 return anchors;
}
for(const name of ['index.html','en.html']) {
 const html=fs.readFileSync(path.join(__dirname,name),'utf8');
 assert.match(html,/src="outlet\.js\?v=20261030"/);
 const href='https://tomoka-uzumaki-ai.github.io/small-work-stories-jp/epub-reader/'+(name==='index.html'?'':name);
 const before=[...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)].map(m=>m[1]);
 for(const suffix of ['','?from=other','?from=itch.example'])assert.deepEqual(run(html,href+suffix).map(a=>a.href),before);
 const changed=run(html,href+'?from=itch').map(a=>a.href);
 assert.equal(changed[0],'/small-work-stories-jp/harbor-light-preview/'+(name==='en.html'?'en.html':'')+'?from=itch');
 assert.equal(changed[1],'/small-work-stories-jp/epub-reader/'+(name==='index.html'?'en.html':'')+'?from=itch');
 assert.equal(changed[2],'harbor-lights-first-scene-bilingual.epub','sample download stays unchanged');
}
const extra='<a href="en.html?view=plain#part">language</a><a href="https://example.com/epub-reader/en.html">external</a><a href="../creator-reader-demo/en.html">other workflow</a><a href="#toc">same</a>';
const a=run(extra,'https://tomoka-uzumaki-ai.github.io/small-work-stories-jp/epub-reader/?from=itch');
assert.equal(a[0].href,'/small-work-stories-jp/epub-reader/en.html?view=plain&from=itch#part');
assert.equal(a[1].href,'https://example.com/epub-reader/en.html');assert.equal(a[2].href,'../creator-reader-demo/en.html');assert.equal(a[3].href,'#toc');
const previewSource=fs.readFileSync(path.join(__dirname,'../harbor-light-preview/outlet.js'),'utf8');
assert.match(previewSource,/sample\.href=ep\+'\?from=itch'/,'first preview-to-EPUB hop retains source');
assert.match(previewSource,/get\('from'\) !== 'itch'/,'normal preview storefront remains untouched');
// Exercise the preview's existing footer links, not only its generated offer link.
function runPreview(html,href,lang) {
 const anchors=[...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)].map(m=>({href:m[1],getAttribute(){return this.href;}}));
 const ids={};
 const document={documentElement:{lang},getElementById(id){return ids[id] ||= {hidden:true,classList:{add(){}},replaceChildren(){}};},
  createElement(tag){const e={textContent:'',children:[],append(v){this.children.push(v);},getAttribute(n){return n==='href'?this.href:null;}};if(tag==='a')anchors.push(e);return e;},
  querySelectorAll(){return anchors;}};
 vm.runInNewContext(previewSource,{document,location:new URL(href),URL,URLSearchParams});
 return anchors;
}
for(const [name,lang] of [['index.html','ja'],['en.html','en']]) {
 const html=fs.readFileSync(path.join(__dirname,'../harbor-light-preview/',name),'utf8');
 assert.match(html,/src="outlet\.js\?v=20261030b"/,'preview loads the current fixed outlet asset version');
 const href='https://tomoka-uzumaki-ai.github.io/small-work-stories-jp/harbor-light-preview/'+(lang==='en'?'en.html':'');
 const before=[...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)].map(m=>m[1]);
 for(const suffix of ['','?from=other','?from=itch.example']) assert.deepEqual(runPreview(html,href+suffix,lang).map(a=>a.href),before);
 const after=runPreview(html,href+'?from=itch',lang);
 const epubs=after.filter(a=>a.href && new URL(a.href,href).pathname.includes('/epub-reader/'));
 assert.ok(epubs.length>=2,'both generated offer link and existing footer EPUB link are covered');
 assert.ok(epubs.every(a=>new URL(a.href,href).searchParams.get('from')==='itch'),'every same-origin footer EPUB keeps source');
 const purchases=after.filter(a=>a.href==='https://tiny-deduction-lab.itch.io/harbor-lights');
 assert.equal(purchases.length,1);
 assert.match(purchases[0].textContent,lang==='en'?/regular minimum US\$3/:/通常最低US\$3/);
}
const custom='<a href="../epub-reader/en.html?view=plain#part">EPUB</a><a href="https://example.com/epub-reader/en.html">elsewhere</a><a href="../creator-reader-demo/en.html">creator</a><a href="#story-chapter">chapter</a>';
const routed=runPreview(custom,'https://tomoka-uzumaki-ai.github.io/small-work-stories-jp/harbor-light-preview/en.html?from=itch','en');
assert.equal(routed[0].href,'/small-work-stories-jp/epub-reader/en.html?view=plain&from=itch#part');
assert.equal(routed[1].href,'https://example.com/epub-reader/en.html');assert.equal(routed[2].href,'../creator-reader-demo/en.html');assert.equal(routed[3].href,'#story-chapter');
for(const [name,price] of [['index.html','通常最低US$3'],['en.html','regular minimum US$3']]) {
 const html=fs.readFileSync(path.join(__dirname,'../editions',name),'utf8');
 assert.equal(html.split('itch.io · '+price).length-1,4,'all four itch editions identify the regular price');
 assert.doesNotMatch(html,/通常通常|regular regular/);
}
console.log('PASS: EN/JA EPUB return/language and all preview footer EPUB links preserve exact itch source; ordinary/download/external/other routes unchanged; regular prices explicit without doubling.');

// Exact Gumroad source stays with the selected text-session or creator edition through the real free workflow.
const gumSource=fs.readFileSync(path.join(__dirname,'../gumroad-outlet.js'),'utf8');
const gumPages=['two-roads/index.html','two-roads/en.html','harbor-first-case/index.html','harbor-first-case-en/index.html','creator-reader-demo/index.html','creator-reader-demo/en.html','story-composer/index.html','story-composer/en.html','creator-input-check/index.html','creator-input-check/en.html','creator-input-check/readiness-probe/index.html','creator-input-check/readiness-probe/en.html','make-a-bilingual-story/index.html','make-a-bilingual-story/en.html'];
function gumDOM(html) {
 const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],m[2]??'']));
 const nodes=(re)=>[...html.matchAll(re)].map(m=>{
  const at=attrs(m[1]);return {at,href:at.href,textContent:m[2],hidden:Object.hasOwn(at,'hidden'),getAttribute(k){return k==='href'?this.href:(Object.hasOwn(at,k)?at[k]:null);},hasAttribute(k){return Object.hasOwn(at,k);}};
 });
 const anchors=nodes(/<a\b([^>]*)>([\s\S]*?)<\/a>/g),paras=nodes(/<p\b([^>]*)>([\s\S]*?)<\/p>/g);
 const all=[...anchors,...paras];
 const document={documentElement:{lang:/<html[^>]*lang="([^"]+)"/.exec(html)?.[1]||'ja'},getElementById(id){return all.find(n=>n.at.id===id);},querySelectorAll(selector){
  if(selector==='a[href]')return anchors.filter(n=>n.hasAttribute('href'));
  if(selector==='a[data-gumroad-product]')return anchors.filter(n=>n.hasAttribute('data-gumroad-product'));
  if(selector==='a[data-creator-language]')return anchors.filter(n=>n.hasAttribute('data-creator-language'));
  if(selector==='[data-gumroad-session-format]')return paras.filter(n=>n.hasAttribute('data-gumroad-session-format'));
  if(selector==='[data-gumroad-duplicate]')return paras.filter(n=>n.hasAttribute('data-gumroad-duplicate'));
  throw Error('unexpected selector: '+selector);
 }};
 return {document,anchors,paras};
}
const gumSnapshot=dom=>[...dom.anchors,...dom.paras].map(n=>[n.href,n.textContent,n.hidden]);
function applyGum(dom,href){vm.runInNewContext(gumSource,{document:dom.document,location:new URL(href),URL,URLSearchParams});return dom;}
const workflowPath=/\/(?:two-roads|harbor-first-case|harbor-first-case-en|creator-reader-demo|story-composer|creator-input-check|make-a-bilingual-story)\/(?:index\.html|en\.html)?$|\/creator-input-check\/readiness-probe\/(?:index\.html|en\.html)?$/;
let checkedInternal=0,checkedPurchases=0;
for(const file of gumPages){
 const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
 const script=/src="([^"]*gumroad-outlet\.js\?v=20261030-gumroad1)"/.exec(html);
 assert.ok(script,file+' loads the fixed shared source');
 assert.equal(path.resolve(path.dirname(path.join(__dirname,'..',file)),script[1].split('?')[0]),path.resolve(__dirname,'../gumroad-outlet.js'));
 const href='https://tomoka-uzumaki-ai.github.io/small-work-stories-jp/'+file;
 for(const suffix of ['','?from=itch','?from=other','?from=gumroad.example']){
  const dom=gumDOM(html),before=gumSnapshot(dom);applyGum(dom,href+suffix);assert.deepEqual(gumSnapshot(dom),before,file+suffix+' is unchanged');
 }
 const dom=gumDOM(html),before=dom.anchors.map(a=>a.href),oldBuy=dom.document.getElementById('buy');
 applyGum(dom,href+'?from=gumroad');
 for(const [i,anchor] of dom.anchors.entries()){
  const product=anchor.getAttribute('data-gumroad-product');
  if(product){
   assert.equal(anchor.href,'https://jikkenlog.gumroad.com/l/'+(product==='creator'?'bilingual-reader-source-kit':'three-harbor-signs-text-session'));
   assert.match(anchor.textContent,/500/);assert.doesNotMatch(anchor.textContent,/US\$|ZIP/);checkedPurchases++;continue;
  }
  const original=new URL(before[i],href);
  if(!before[i].startsWith('#')&&!anchor.hasAttribute('download')&&original.origin===new URL(href).origin&&workflowPath.test(original.pathname)){
   const routed=new URL(anchor.href,href);assert.equal(routed.searchParams.get('from'),'gumroad',file+' keeps source on '+before[i]);assert.equal(routed.hash,original.hash);checkedInternal++;
  }else assert.equal(anchor.href,before[i],file+' leaves download/external/alternative choice unchanged');
 }
 for(const p of dom.document.querySelectorAll('[data-gumroad-session-format]')){
  assert.match(p.textContent,/日本語の文章版|Japanese text/);assert.match(p.textContent,/自動判定・ゲームZIP・写真ファイル・英語PDFは付属しません|does not include automatic answer checking, a game ZIP, photographs or an English PDF/);
 }
 for(const p of dom.document.querySelectorAll('[data-gumroad-duplicate]'))assert.equal(p.hidden,true,'same-store duplicate is hidden only for Gumroad');
 if(oldBuy)assert.equal(oldBuy.hidden,true,'input checker still requires its existing material/order confirmation before purchase CTA is shown');
}
assert.ok(checkedInternal>=20);assert.equal(checkedPurchases,10);
const customGum=gumDOM('<html lang="ja"><a href="../story-composer/en.html?draft=own#scene">language</a><a href="../creator-input-check/" download>download</a><a href="https://elsewhere.example/creator-input-check/">external</a><a href="../editions/#create">choose store</a><a href="#local">same page</a></html>');
applyGum(customGum,'https://tomoka-uzumaki-ai.github.io/small-work-stories-jp/creator-reader-demo/?from=gumroad');
assert.equal(customGum.anchors[0].href,'/small-work-stories-jp/story-composer/en.html?draft=own&from=gumroad#scene');
assert.deepEqual(customGum.anchors.slice(1).map(a=>a.href),['../creator-input-check/','https://elsewhere.example/creator-input-check/','../editions/#create','#local']);
// Exercise the prior itch outlet followed by the new deferred helper, as loaded by the actual demo HTML.
const oldCreatorSource=fs.readFileSync(path.join(__dirname,'../creator-reader-demo/outlet.js'),'utf8');
for(const name of ['index.html','en.html']){
 const dom=gumDOM(fs.readFileSync(path.join(__dirname,'../creator-reader-demo/',name),'utf8'));
 const context={document:dom.document,location:new URL('https://tomoka-uzumaki-ai.github.io/small-work-stories-jp/creator-reader-demo/'+name+'?from=itch'),URL,URLSearchParams};
 vm.runInNewContext(oldCreatorSource,context);const afterOld=gumSnapshot(dom);vm.runInNewContext(gumSource,context);assert.deepEqual(gumSnapshot(dom),afterOld);
 assert.equal(dom.document.getElementById('creator-purchase-link').href,'https://tiny-deduction-lab.itch.io/bilingual-reader-kit');
 assert.ok(dom.document.querySelectorAll('a[data-creator-language]').every(a=>new URL(a.href,context.location).searchParams.get('from')==='itch'));
}
console.log('PASS: 14 real Gumroad workflow pages, '+checkedInternal+' internal steps and '+checkedPurchases+' product exits; format/price, hidden purchase gate, ordinary/itch/download/external/comparison routes preserved.');
