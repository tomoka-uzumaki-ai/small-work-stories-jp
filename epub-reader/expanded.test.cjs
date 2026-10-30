'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const guard=require('./epub-guard.js'),JSZip=require('./vendor/jszip.min.js');
async function fixture(){const z=new JSZip();z.file('mimetype','application/epub+zip',{compression:'STORE'});z.file('META-INF/container.xml','<container/>',{createFolders:false});z.file('EPUB/payload.xhtml','Z'.repeat(2*1024*1024),{createFolders:false});return z.generateAsync({type:'nodebuffer',compression:'DEFLATE'});}
(async()=>{
 const sample=fs.readFileSync(path.join(__dirname,'harbor-lights-first-scene-bilingual.epub')),info=guard.inspect(sample);assert.equal((await guard.verifyEntries(sample,info)).total,info.total);
 const valid=await fixture(),validInfo=guard.inspect(valid);assert.equal((await guard.verifyEntries(valid,validInfo)).total,validInfo.total);
 const bad=Buffer.from(valid),e=validInfo.entries.find(e=>e.name==='EPUB/payload.xhtml');bad.writeUInt32LE(1024,e.local+22);
 for(let p=0;p<bad.length-46;p++){if(bad.readUInt32LE(p)!==0x02014b50)continue;const n=bad.readUInt16LE(p+28);if(bad.subarray(p+46,p+46+n).toString()==='EPUB/payload.xhtml'){bad.writeUInt32LE(1024,p+24);break;}}
 const badInfo=guard.inspect(bad);let stopped;
 await assert.rejects(guard.verifyEntries(bad,badInfo),error=>{stopped=error.expandedBytes;return /expanded size limit/.test(error.message)});assert.ok(stopped>1024&&stopped<2*1024*1024,'Abort before expanding and accumulating the complete forged 2 MiB entry');
 await assert.rejects(guard.verifyEntries(sample,info,()=>false),/superseded/);
 let calls=0;await assert.rejects(guard.verifyEntries(valid,validInfo,()=>++calls<8),/superseded/);
 const native=globalThis.DecompressionStream;try{globalThis.DecompressionStream=undefined;await assert.rejects(guard.verifyEntries(valid,validInfo),error=>error.code==='EPUB_STREAM_UNSUPPORTED');}finally{globalThis.DecompressionStream=native}
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');assert.match(app,/await EpubGuard\.verifyEntries\(buffer,info,\(\)=>token===epoch\)/);assert.match(app,/en\?'en-0\.xhtml':'ja-0\.xhtml'/);
 for(const n of ['index.html','en.html']){const h=fs.readFileSync(path.join(__dirname,n),'utf8');assert.match(h,/app\.js\?v=20261030audit1/);assert.match(h,/epub-guard\.js\?v=20261030audit1/);}
 console.log('PASS: actual sample/valid expansion, forged size rejected at '+stopped+' bytes instead of complete 2097152, cancellation before/during, unsupported stream fails closed, language/cache pins.');
})().catch(e=>{console.error(e);process.exitCode=1;});
