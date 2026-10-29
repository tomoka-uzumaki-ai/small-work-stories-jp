'use strict';
(() => {
  const data = JSON.parse(document.getElementById('game-data').textContent);
  const el = id => document.getElementById(id);
  const progress = data.cases.map(() => ({solved: false, read: false}));
  let current = 0;
  const language='ja',fingerprint='515b9ffe3e9f0bcb26e1332bc045e93e87a1c10a75804cb42c77a8b7b8588f66';
  const answers=data.cases.map(()=>null),hintFlags=data.cases.map(()=>({A:false,B:false}));
  let stateEpoch=0,loadEpoch=0;
  const markChanged=()=>{stateEpoch++;el('progress-status').textContent=''};
  const captureAnswer=()=>{const checked=document.querySelector('input[name="answer"]:checked');answers[current]=checked?checked.value:null};
  const make = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (className) n.className = className;
    return n;
  };
  function closeCards() {
    for (const id of ['A', 'B']) {
      el('card-' + id).hidden = true;
      el('open-' + id).setAttribute('aria-expanded', 'false');
      el('hint-' + id).hidden = true;
      el('hint-button-' + id).setAttribute('aria-expanded', 'false');
      el('hint-button-' + id).textContent = 'このカードのヒントを見る';
    }
    el('card-status').textContent = 'カードは二枚とも閉じています。';
  }
  function showCard(id) {
    const wasOpen = !el('card-' + id).hidden;
    closeCards();
    if (!wasOpen) {
      el('card-' + id).hidden = false;
      el('hint-'+id).hidden=!hintFlags[current][id];
      el('hint-button-'+id).setAttribute('aria-expanded',String(hintFlags[current][id]));
      el('hint-button-'+id).textContent=hintFlags[current][id]?'ヒントを閉じる':'このカードのヒントを見る';
      el('open-' + id).setAttribute('aria-expanded', 'true');
      el('card-status').textContent = 'カード' + id + 'だけを表示中。相手へ渡す前に閉じてください。';
    }
  }
  function hideSolution() {
    el('solution').hidden = true;
    el('toggle-solution').setAttribute('aria-expanded', 'false');
    el('toggle-solution').textContent = '解答を見る';
  }
  function updateProgress() {
    const read = progress.filter(p => p.read).length;
    const solved = progress.filter(p => p.solved).length;
    el('progress').textContent = read + ' / ' + data.cases.length + '件の解答・結末を読了（正解した問題 ' + solved + '件）。進捗ファイルを保存すると再開できます。未保存の進行は閉じると消えます。';
    Array.from(el('case-nav').children).forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === current));
      button.textContent = data.cases[i].title + (progress[i].solved ? ' ✓ 正解' : progress[i].read ? ' · 読了' : '');
    });
    el('collection-ending').hidden = read !== data.cases.length;
  }
  function openSolution(solved) {
    const c = data.cases[current];
    el('solution-heading').textContent = '解答 · ' + c.candidates.find(x => x.id === c.answer_id).label;
    el('explanation').textContent = c.explanation;
    el('ending').textContent = c.ending;
    el('solution').hidden = false;
    el('toggle-solution').setAttribute('aria-expanded', 'true');
    el('toggle-solution').textContent = '解答を閉じる';
    progress[current].read = true;
    if (solved) progress[current].solved = true;
    updateProgress();
  }
  function selectCase(index, moveFocus = true, capture=true) {
    if(capture)captureAnswer();
    current = index;
    const c = data.cases[current];
    closeCards();
    hideSolution();
    el('feedback').hidden = true;
    el('feedback').textContent = '';
    el('case-title').textContent = c.title;
    el('case-intro').textContent = c.intro;
    el('shared-heading').textContent = c.shared_heading;
    el('shared-note').textContent = c.shared_note;
    el('public-items').replaceChildren();
    for (const item of c.public_items) {
      const article = make('article', undefined, 'public-item');
      article.append(make('h3', item.label), make('p', item.detail));
      el('public-items').append(article);
    }
    el('public-items').hidden = c.public_items.length === 0;
    el('room-map').hidden = !c.map;
    el('map-body').replaceChildren();
    if (c.map) {
      for (let row = 0; row < c.map.rows; row++) {
        const tr = make('tr');
        for (let col = 0; col < c.map.cols; col++) tr.append(make('td', c.map.cells.find(x => x.row === row && x.col === col).label));
        el('map-body').append(tr);
      }
    }
    for (const card of c.cards) {
      el('card-heading-' + card.id).textContent = card.heading;
      el('card-text-' + card.id).textContent = card.text;
      el('hint-' + card.id).textContent = card.hint;
    }
    el('answer-legend').textContent = c.answer_heading;
    el('answer-options').replaceChildren();
    for (const candidate of c.candidates) {
      const label = make('label', undefined, 'option');
      const radio = make('input');
      radio.type = 'radio';
      radio.name = 'answer';
      radio.value = candidate.id;
      radio.checked=answers[current]===candidate.id;
      const copy = make('span', undefined, 'option-copy');
      copy.append(make('strong', candidate.label), make('small', candidate.detail));
      label.append(radio, copy);
      el('answer-options').append(label);
    }
    updateProgress();
    if (moveFocus) el('case-title').focus();
  }
  el('answer-form').addEventListener('change',()=>{captureAnswer();markChanged()});
  data.cases.forEach((c, i) => {
    const button = make('button', c.title);
    button.type = 'button';
    button.setAttribute('aria-controls', 'case-panel');
    button.addEventListener('click', () => {markChanged();selectCase(i)});
    el('case-nav').append(button);
  });
  for (const id of ['A', 'B']) {
    el('open-' + id).addEventListener('click', () => {markChanged();showCard(id)});
    el('hint-button-' + id).addEventListener('click', () => {
      markChanged();
      const opening = el('hint-' + id).hidden;
      hintFlags[current][id]=opening;
      el('hint-' + id).hidden = !opening;
      el('hint-button-' + id).setAttribute('aria-expanded', String(opening));
      el('hint-button-' + id).textContent = opening ? 'ヒントを閉じる' : 'このカードのヒントを見る';
    });
  }
  el('close-cards').addEventListener('click', closeCards);
  el('answer-form').addEventListener('submit', event => {
    event.preventDefault();markChanged();captureAnswer();
    const checked = document.querySelector('input[name="answer"]:checked');
    const correct = checked && checked.value === data.cases[current].answer_id;
    el('feedback').hidden = false;
    if (correct) {
      el('feedback').textContent = '正解です。理由と、この依頼の結末を読めます。';
      openSolution(true);
      el('solution-heading').focus();
    } else {
      el('feedback').textContent = checked ? 'この候補は、少なくとも一枚の条件を満たしません。二枚の情報を照らし合わせてみてください。' : '候補を一つ選んでください。';
      hideSolution();
    }
  });
  el('toggle-solution').addEventListener('click', () => {
    markChanged();if (el('solution').hidden) openSolution(false);
    else hideSolution();
  });
  el('reset-case').addEventListener('click', () => {
    markChanged();answers[current]=null;hintFlags[current]={A:false,B:false};
    progress[current] = {solved: false, read: false};
    selectCase(current,true,false);
  });
  el('save-progress').addEventListener('click',()=>{captureAnswer();const saved=HarborProgress.make(data,language,fingerprint,current,answers,hintFlags);const url=URL.createObjectURL(new Blob([JSON.stringify(saved,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='night-archive-trial-progress-'+language+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);el('progress-status').textContent='進捗を保存しました。続きはこのファイルを読み込んでください。'});
  el('load-progress').addEventListener('change',async()=>{const token=++loadEpoch,edit=stateEpoch,file=el('load-progress').files[0];if(!file)return;try{if(!file.size||file.size>60000)throw Error();const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());if(text.length>50000)throw Error();const restored=HarborProgress.restore(JSON.parse(text),data,language,fingerprint);if(token!==loadEpoch||edit!==stateEpoch)return;restored.cases.forEach((c,i)=>{answers[i]=c.selectedAnswer;hintFlags[i]={...c.hints};progress[i]={solved:c.solved,read:false}});stateEpoch++;selectCase(restored.current,false,false);closeCards();hideSolution();el('feedback').hidden=true;el('collection-ending').hidden=true;el('progress-status').textContent='同じ版の進捗を復元しました。カードと答えは閉じています。'}catch{if(token===loadEpoch&&edit===stateEpoch)el('progress-status').textContent='読み込めません。同じ版・同じ言語の進捗ファイルを選んでください。現在の進行は保持しています。'}finally{if(token===loadEpoch)el('load-progress').value=''}});
  el('closing-text').textContent = data.closing;
  selectCase(0, false);
})();
