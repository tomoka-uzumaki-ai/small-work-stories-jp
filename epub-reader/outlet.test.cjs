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
