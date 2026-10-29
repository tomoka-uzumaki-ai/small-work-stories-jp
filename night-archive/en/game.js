'use strict';
(() => {
  const data = JSON.parse(document.getElementById('game-data').textContent);
  const el = id => document.getElementById(id);
  const progress = data.cases.map(() => ({solved: false, read: false}));
  let current = 0;
  const language='en',fingerprint='ab0fb22627c6319dffb3d852c955f2f13a51645910c2e3a5921f8a7ae44c9c21';
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
      el('hint-button-' + id).textContent = 'Show this card’s hint';
    }
    el('card-status').textContent = 'Both cards are closed.';
  }
  function showCard(id) {
    const wasOpen = !el('card-' + id).hidden;
    closeCards();
    if (!wasOpen) {
      el('card-' + id).hidden = false;
      el('hint-'+id).hidden=!hintFlags[current][id];
      el('hint-button-'+id).setAttribute('aria-expanded',String(hintFlags[current][id]));
      el('hint-button-'+id).textContent=hintFlags[current][id]?'Hide hint':'Show this card’s hint';
      el('open-' + id).setAttribute('aria-expanded', 'true');
      el('card-status').textContent = 'Card ' + id + ' is open. Close it before passing the device.';
    }
  }
  function hideSolution() {
    el('solution').hidden = true;
    el('toggle-solution').setAttribute('aria-expanded', 'false');
    el('toggle-solution').textContent = 'Show answer';
  }
  function updateProgress() {
    const read = progress.filter(p => p.read).length;
    const solved = progress.filter(p => p.solved).length;
    el('progress').textContent = read + ' of ' + data.cases.length + ' endings read · correct answers: ' + solved + '. Save a progress file to continue later. Unsaved progress clears when this page closes.';
    Array.from(el('case-nav').children).forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === current));
      button.textContent = data.cases[i].title + (progress[i].solved ? ' ✓ Correct' : progress[i].read ? ' · Read' : '');
    });
    el('collection-ending').hidden = read !== data.cases.length;
  }
  function openSolution(solved) {
    const c = data.cases[current];
    el('solution-heading').textContent = 'Answer · ' + c.candidates.find(x => x.id === c.answer_id).label;
    el('explanation').textContent = c.explanation;
    el('ending').textContent = c.ending;
    el('solution').hidden = false;
    el('toggle-solution').setAttribute('aria-expanded', 'true');
    el('toggle-solution').textContent = 'Hide answer';
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
      el('hint-button-' + id).textContent = opening ? 'Hide hint' : 'Show this card’s hint';
    });
  }
  el('close-cards').addEventListener('click', closeCards);
  el('answer-form').addEventListener('submit', event => {
    event.preventDefault();markChanged();captureAnswer();
    const checked = document.querySelector('input[name="answer"]:checked');
    const correct = checked && checked.value === data.cases[current].answer_id;
    el('feedback').hidden = false;
    if (correct) {
      el('feedback').textContent = 'Correct. Read the reasoning and the ending below.';
      openSolution(true);
      el('solution-heading').focus();
    } else {
      el('feedback').textContent = checked ? 'This choice does not fit at least one of the cards. Compare both clues and try again.' : 'Choose one answer first.';
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
  el('save-progress').addEventListener('click',()=>{captureAnswer();const saved=HarborProgress.make(data,language,fingerprint,current,answers,hintFlags);const url=URL.createObjectURL(new Blob([JSON.stringify(saved,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='night-archive-trial-progress-'+language+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);el('progress-status').textContent='Progress saved. Load this file to continue later.'});
  el('load-progress').addEventListener('change',async()=>{const token=++loadEpoch,edit=stateEpoch,file=el('load-progress').files[0];if(!file)return;try{if(!file.size||file.size>60000)throw Error();const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());if(text.length>50000)throw Error();const restored=HarborProgress.restore(JSON.parse(text),data,language,fingerprint);if(token!==loadEpoch||edit!==stateEpoch)return;restored.cases.forEach((c,i)=>{answers[i]=c.selectedAnswer;hintFlags[i]={...c.hints};progress[i]={solved:c.solved,read:false}});stateEpoch++;selectCase(restored.current,false,false);closeCards();hideSolution();el('feedback').hidden=true;el('collection-ending').hidden=true;el('progress-status').textContent='Progress restored for this edition. Cards and solutions remain closed.'}catch{if(token===loadEpoch&&edit===stateEpoch)el('progress-status').textContent='Could not load this file. Choose progress for this edition and language. Your current progress is unchanged.'}finally{if(token===loadEpoch)el('load-progress').value=''}});
  el('closing-text').textContent = data.closing;
  selectCase(0, false);
})();
