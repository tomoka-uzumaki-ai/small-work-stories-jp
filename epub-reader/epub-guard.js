(function(root){'use strict';const MAX=25*1024*1024;
function inspect(buffer){const b=new Uint8Array(buffer),v=new DataView(b.buffer,b.byteOffset,b.byteLength),fail=()=>{throw Error('Unsupported or invalid EPUB ZIP')};const u16=p=>v.getUint16(p,true),u32=p=>v.getUint32(p,true);if(b.length<58||b.length>MAX||u32(0)!==0x04034b50)fail();
 let end=-1;for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--)if(u32(p)===0x06054b50&&p+22+u16(p+20)===b.length){end=p;break}if(end<0||u16(end+4)||u16(end+6)||u16(end+8)!==u16(end+10))fail();
 const count=u16(end+10),start=u32(end+16),size=u32(end+12);if(!count||count>300||start+size!==end)fail();const entries=[],seen=new Set,decoder=new TextDecoder('utf-8',{fatal:true});let p=start,total=0;
 for(let i=0;i<count;i++){if(p+46>end||u32(p)!==0x02014b50)fail();const flags=u16(p+8),method=u16(p+10),compressed=u32(p+20),expanded=u32(p+24),nl=u16(p+28),extra=u16(p+30),comment=u16(p+32),local=u32(p+42);if(p+46+nl+extra+comment>end||flags&1||![0,8].includes(method)||expanded>20*1024*1024||local+30>start)fail();const name=decoder.decode(b.slice(p+46,p+46+nl));if(!name||name.startsWith('/')||name.includes('\\')||name.includes('\0')||name.split('/').includes('..')||name.split('/').includes('.')||/^[a-z]+:/i.test(name)||seen.has(name))fail();seen.add(name);total+=expanded;if(total>100*1024*1024)fail();if(u32(local)!==0x04034b50||u16(local+8)!==method||u16(local+6)&1||local+30+u16(local+26)+u16(local+28)+compressed>start)fail();const localName=decoder.decode(b.slice(local+30,local+30+u16(local+26)));if(localName!==name)fail();entries.push({name,expanded,compressed,method,local});p+=46+nl+extra+comment;}
 if(p!==end||!seen.has('mimetype')||!seen.has('META-INF/container.xml'))fail();const mime=entries.find(e=>e.name==='mimetype');if(mime.local!==0||mime.method!==0||mime.expanded!==20||mime.compressed!==20||u16(28)!==0||decoder.decode(b.slice(30+u16(26),50+u16(26)))!=='application/epub+zip')fail();return {entries,total,bytes:b.length};
}
async function verifyEntries(buffer,info,isCurrent=()=>true){
 const bytes=new Uint8Array(buffer);let total=0;
 function failure(message,received=0){const error=Error(message);error.expandedBytes=received;return error}
 for(const entry of info.entries){
  if(!isCurrent())throw failure('EPUB read superseded');
  if(entry.name.endsWith('/')&&entry.expanded===0)continue;
  const begin=entry.local+30+new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(entry.local+26,true)+new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(entry.local+28,true);
  const end=begin+entry.compressed;
  if(entry.method===0){if(entry.compressed!==entry.expanded)throw failure('EPUB expanded size mismatch');total+=entry.expanded;continue}
  let inflater;try{inflater=new DecompressionStream('deflate-raw')}catch{const e=failure('Safe EPUB streaming is unsupported');e.code='EPUB_STREAM_UNSUPPORTED';throw e}
  // Small compressed input chunks prevent a forged size from being inflated in one large operation.
  let position=begin;const compressed=new ReadableStream({pull(controller){
   if(position===end){controller.close();return}
   const next=Math.min(position+1024,end);controller.enqueue(bytes.subarray(position,next));position=next;
  }});
  const reader=compressed.pipeThrough(inflater).getReader();let received=0;
  try{while(true){
   if(!isCurrent())throw failure('EPUB read superseded',received);
   const part=await reader.read();if(part.done)break;received+=part.value.length;
   if(received>entry.expanded||received>20*1024*1024||total+received>100*1024*1024)throw failure('EPUB expanded size limit exceeded',received);
  }}finally{await reader.cancel().catch(()=>{})}
  if(received!==entry.expanded)throw failure('EPUB expanded size mismatch',received);total+=received;
 }
 return {entries:info.entries.length,total};
}
function localResource(href,base){if(typeof href!=='string'||!href||/^[a-z][a-z\d+.-]*:/i.test(href)||href.startsWith('//')||href.includes('\\'))throw Error('External resources are unsupported');const url=new URL(href,'https://epub.invalid/'+base);if(url.origin!=='https://epub.invalid')throw Error('External resources are unsupported');return decodeURIComponent(url.pathname.slice(1))}
function externalURL(href){try{if(typeof href!=='string')return null;href=href.trim();if(!/^(https?:|\/\/)/i.test(href))return null;const url=new URL(href,'https://epub.invalid/');return ['https:','http:'].includes(url.protocol)?url.href:null}catch{return null}}
const api={MAX,inspect,verifyEntries,localResource,externalURL};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.EpubGuard=api;
})(typeof window!=='undefined'?window:globalThis);
