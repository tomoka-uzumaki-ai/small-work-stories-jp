(function(){'use strict';
const $=id=>document.getElementById(id),en=document.documentElement.lang==='en',say=(ja,english)=>en?english:ja;
let generation=0,jsonLoadEpoch=0,jsonLoading=false,report='',checked=null,previewURL=null,previewLanguage=en?'en':'ja';
function save(name,data,type){const u=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function clear(){checked=null;$('result').hidden=true;$('buy').hidden=true;$('pack').disabled=true;$('preview').hidden=true;$('preview-image').removeAttribute('src');if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;}
function changed(){generation++;clear()}
function renderPreview(){if(!checked)return;const scene=checked.story.scenes[0];$('preview-title').textContent=previewLanguage==='en'?(scene.title_en||'Scene 1'):scene.title;$('preview-body').textContent=scene[previewLanguage];$('preview-body').lang=previewLanguage;$('preview-ja').setAttribute('aria-pressed',String(previewLanguage==='ja'));$('preview-en').setAttribute('aria-pressed',String(previewLanguage==='en'))}
async function pngCheck(file,name){if(!file)return name+say('が未選択',' is not selected');if(file.name!==name)return name+say('という名前が必要',' is the required filename');if(!file.size||file.size>15*1024*1024)return name+say('は1バイト〜15MiBが必要',' must be 1 byte–15 MiB');const b=new Uint8Array(await file.slice(0,24).arrayBuffer());if(b.length!==24||![137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x)||String.fromCharCode(...b.slice(12,16))!=='IHDR')return name+say('はPNGヘッダーが不正',' has an invalid PNG header');const v=new DataView(b.buffer,b.byteOffset,b.byteLength);if(v.getUint32(16)!==1024||v.getUint32(20)!==1536)return name+say('は1024×1536が必要',' must be 1024×1536');return ''}
async function decodeStation(file){const u=URL.createObjectURL(file);try{const image=new Image();image.src=u;await image.decode();if(image.naturalWidth!==1024||image.naturalHeight!==1536)throw Error();return u}catch{URL.revokeObjectURL(u);throw Error(say('station.pngを画像として表示できません。PNGを確認してください。','station.png could not be decoded for display. Check the PNG.'))}}
$('form').addEventListener('input',changed);$('form').addEventListener('change',changed);
$('example').onclick=()=>{if(jsonLoading)return;$('json').value=JSON.stringify(window.ReaderExample,null,2);changed()};
$('form').onsubmit=async e=>{e.preventDefault();if(jsonLoading)return;const token=++generation;clear();const files=['station','rain','harbor'].map(k=>$(k).files[0]);let story,errs=[],url=null;
 try{const text=$('json').value;if(text.length>150000)throw Error();story=JSON.parse(text);errs=ReaderInput.validate(story,en?'en':'ja')}catch{errs=[say('作品JSONを読み取れません。オブジェクト形式・文字数を確認してください。','Cannot read the story JSON. Check the object format and length.')]} 
 try{errs.push(...(await Promise.all(files.map((f,i)=>pngCheck(f,['station.png','rain.png','harbor.png'][i])))).filter(Boolean));if(!errs.length)url=await decodeStation(files[0]);}catch(err){errs.push(err.message||say('ファイルを読み取れません。','Cannot read the files.'))}
 if(token!==generation){if(url)URL.revokeObjectURL(url);return}
 if(!$('python').checked)errs.push(say('Python 3実行環境が未確認','Python 3 environment is unconfirmed'));if(!$('rights').checked)errs.push(say('素材の利用権が未確認','Asset permission is unconfirmed'));
 report=errs.length?say('不足\n','Missing requirements\n')+errs.join('\n'):say('構造・名前・PNG寸法を確認し、第一画像を表示できました。\n実際の生成実行・画質・権利・販売審査を保証する結果ではありません。','Structure, names and PNG dimensions passed; the first image decoded for preview.\nThis does not guarantee successful production, image quality, rights or shop acceptance.');
 $('heading').textContent=errs.length?say('購入前に整えたい部分','Requirements to resolve before buying'):say('自分の作品を試読する','Preview your own story');$('report').textContent=report;$('result').hidden=false;$('buy').hidden=errs.length>0;
 if(errs.length){if(url)URL.revokeObjectURL(url);return}checked={story,files,token};previewURL=url;$('preview-image').src=url;$('preview-image').alt=say('第一場面の作者提供画像','Your artwork for the first scene');renderPreview();$('preview').hidden=false;$('pack').disabled=false;
};
$('download').onclick=()=>save('reader-input-check.txt',report,'text/plain;charset=utf-8');
$('pack').onclick=async()=>{const snapshot=checked;if(!snapshot||snapshot.token!==generation||jsonLoading)return;$('pack').disabled=true;try{
 const bytes=await Promise.all(snapshot.files.map(f=>f.arrayBuffer()));if(checked!==snapshot||snapshot.token!==generation||jsonLoading)return;
 const files=[{name:'content.json',data:new TextEncoder().encode(JSON.stringify(snapshot.story,null,2)+'\n')},...bytes.map((b,i)=>({name:'art/'+['station','rain','harbor'][i]+'.png',data:new Uint8Array(b)}))];save('reader-inputs.zip',FilePack.zip(files),'application/zip');
 }catch{$('report').textContent=say('ZIPを作成できませんでした。素材を再確認してください。','Could not create the ZIP. Check the assets again.')}finally{if(checked===snapshot&&snapshot.token===generation)$('pack').disabled=false}};
$('preview-ja').onclick=()=>{previewLanguage='ja';renderPreview()};$('preview-en').onclick=()=>{previewLanguage='en';renderPreview()};
$('json-file').onchange=async()=>{const token=++jsonLoadEpoch;changed();const f=$('json-file').files[0];jsonLoading=!!f;const submit=$('check');for(const el of [submit,$('json'),$('example')])el.disabled=jsonLoading;if(!f)return;
 try{if(f.size>600000)throw Error();const text=new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer());if(text.length>150000)throw Error();if(token!==jsonLoadEpoch)return;$('json').value=text}catch{if(token===jsonLoadEpoch){report=say('JSONはUTF-8で15万字以内にしてください。現在の入力は保持しています。','Use UTF-8 JSON up to 150,000 characters. Your current input is preserved.');$('report').textContent=report;$('result').hidden=false}}finally{if(token===jsonLoadEpoch){jsonLoading=false;for(const el of [submit,$('json'),$('example')])el.disabled=false}}
};
window.addEventListener('pagehide',()=>{if(previewURL)URL.revokeObjectURL(previewURL)});
})();
