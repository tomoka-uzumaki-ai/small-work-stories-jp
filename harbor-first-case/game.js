'use strict';
(() => {
  const data = JSON.parse(document.getElementById('game-data').textContent);
  const el = id => document.getElementById(id);
  const progress = data.cases.map(() => ({solved: false, read: false}));
  let current = 0;
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
    el('progress').textContent = read + ' / ' + data.cases.length + '件の解答・結末を読了（正解した問題 ' + solved + '件）。進行はこのページを閉じると消えます。';
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
  function selectCase(index, moveFocus = true) {
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
      const copy = make('span', undefined, 'option-copy');
      copy.append(make('strong', candidate.label), make('small', candidate.detail));
      label.append(radio, copy);
      el('answer-options').append(label);
    }
    updateProgress();
    if (moveFocus) el('case-title').focus();
  }
  data.cases.forEach((c, i) => {
    const button = make('button', c.title);
    button.type = 'button';
    button.setAttribute('aria-controls', 'case-panel');
    button.addEventListener('click', () => selectCase(i));
    el('case-nav').append(button);
  });
  for (const id of ['A', 'B']) {
    el('open-' + id).addEventListener('click', () => showCard(id));
    el('hint-button-' + id).addEventListener('click', () => {
      const opening = el('hint-' + id).hidden;
      el('hint-' + id).hidden = !opening;
      el('hint-button-' + id).setAttribute('aria-expanded', String(opening));
      el('hint-button-' + id).textContent = opening ? 'ヒントを閉じる' : 'このカードのヒントを見る';
    });
  }
  el('close-cards').addEventListener('click', closeCards);
  el('answer-form').addEventListener('submit', event => {
    event.preventDefault();
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
    if (el('solution').hidden) openSolution(false);
    else hideSolution();
  });
  el('reset-case').addEventListener('click', () => {
    progress[current] = {solved: false, read: false};
    selectCase(current);
  });
  // Completion offer text is already in the page.
  selectCase(0, false);
})();
