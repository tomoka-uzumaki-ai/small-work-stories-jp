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
console.log('PASS: EN/JA EPUB return+language preserve exact itch source; default/download/external/other-workflow links unchanged; preview first hop carries query.');
