(function(root){'use strict';
const top=['title','english_title','disclosure','scenes','endings','choices'];
function object(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function validate(d,language='en'){const errors=[];
 const localize=items=>language==='ja'?items.map(x=>x.replace('unexpected or missing field','未対応または不足する項目').replace('nonempty text required (max ','空欄不可・上限 ').replace('unsafe or duplicate id','IDが不正または重複').replace('two different endings required','異なる2結末への対応が必要').replace('missing ending','参照先の結末が不明').replace(/exactly (\d+) entries required/,'$1件が必要')):items;
 function keys(x,required,optional=[]){return object(x)&&required.every(k=>Object.hasOwn(x,k))&&Object.keys(x).every(k=>required.includes(k)||optional.includes(k))}
 function str(x,n,max=10000){if(typeof x!=='string'||!x.trim()||x.length>max)errors.push(n+': nonempty text required (max '+max+')')}
 if(!keys(d,top))return localize(['JSON: unexpected or missing field']);
 for(const k of top.slice(0,3))str(d[k],k,k==='disclosure'?2000:200);
 const used=new Set;
 for(const [key,count] of [['scenes',3],['endings',2]]){
  if(!Array.isArray(d[key])||d[key].length!==count){errors.push(key+': exactly '+count+' entries required');continue}
  d[key].forEach((x,i)=>{if(!keys(x,['id','title','ja','en'],['title_en'])){errors.push(key+'['+i+']: unexpected or missing field');return}if(typeof x.id!=='string'||!/^[a-z][a-z0-9_-]*$/.test(x.id)||x.id.length>100||used.has(x.id))errors.push(key+': unsafe or duplicate id');used.add(x.id);str(x.title,key+'.title',200);str(x.ja,key+'.ja');str(x.en,key+'.en');if(Object.hasOwn(x,'title_en'))str(x.title_en,key+'.title_en',200)});
 }
 if(!Array.isArray(d.choices)||d.choices.length!==2)errors.push('choices: exactly 2 entries required');
 else {const choiceIds=new Set,links=new Set;for(const x of d.choices){if(!keys(x,['id','label_ja','label_en','ending_id'])){errors.push('choices: unexpected or missing field');continue}if(typeof x.id!=='string'||!/^[a-z][a-z0-9_-]*$/.test(x.id)||x.id.length>100||choiceIds.has(x.id))errors.push('choices: unsafe or duplicate id');choiceIds.add(x.id);str(x.label_ja,'choice.label_ja',200);str(x.label_en,'choice.label_en',200);if(!Array.isArray(d.endings)||!d.endings.some(e=>object(e)&&e.id===x.ending_id))errors.push('choices: missing ending');links.add(x.ending_id)}if(links.size!==2)errors.push('choices: two different endings required')}
 return localize(errors);
}
const api={validate};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ReaderInput=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null);
