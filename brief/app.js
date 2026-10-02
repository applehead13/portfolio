'use strict';

/* =====================================================================
   БРИФ. Вопросы лежат массивом в начале файла: меняйте их здесь,
   остальной код трогать не нужно.

   У вопроса:
     id        — уникальный номер вопроса (для разметки)
     key       — ключ ответа (используется в черновике и в сообщении)
     label     — сам вопрос
     hint      — подсказка человеческим языком (под вопросом)
     required  — обязательный ли (true / false)
     important — показывать плашку «Важно»
     type      — 'textarea' | 'text' | 'links' | 'files' | 'consent'
     summary   — true: ответ попадает в первое сообщение-сводку
   ===================================================================== */
const STAGES = [
  {
    id: 'goal', num: '01', title: 'Бизнес-задача',
    lead: 'Сначала цель. Сайт делают не ради сайта, а ради результата. Отвечайте своими словами, как есть.',
    questions: [
      { id: 'q1', key: 'why', type: 'textarea', required: true, important: true, summary: true,
        label: 'Зачем бизнесу сайт именно сейчас?',
        hint: 'Что изменилось? Например, растёт спрос, запускаете новое направление или старый сайт перестал справляться.' },
      { id: 'q2', key: 'action', type: 'textarea', required: true, important: true, summary: true,
        label: 'Какое действие сайт должен приводить чаще: запись, звонок, расчёт, покупка?',
        hint: 'Выберите главное. Если их несколько, расставьте по важности.' },
      { id: 'q3', key: 'focus', type: 'textarea', required: false,
        label: 'Какое направление, география или сегмент в приоритете?',
        hint: 'Где вы хотите продавать больше всего: город, регион, тип клиентов, конкретная услуга.' }
    ]
  },
  {
    id: 'product', num: '02', title: 'Продукт и фокус',
    lead: 'Что именно вы продаёте и что хотите продавать больше. От этого зависит структура всего сайта.',
    questions: [
      { id: 'q4', key: 'sells', type: 'textarea', required: true,
        label: 'Что именно продаёт бизнес?',
        hint: 'Одной-двумя фразами, как объяснили бы человеку, который ничего о вас не знает.' },
      { id: 'q5', key: 'formats', type: 'textarea', required: false,
        label: 'Какие продукты или форматы можно купить?',
        hint: 'Перечислите: услуги, тарифы, пакеты, форматы работы.' },
      { id: 'q6', key: 'popular', type: 'textarea', required: false,
        label: 'Что покупают чаще всего?',
        hint: 'Если есть цифры или доли, напишите. Если нет, оценка на глаз тоже подойдёт.' },
      { id: 'q7', key: 'more', type: 'textarea', required: false,
        label: 'Что бизнес хочет продавать больше?',
        hint: 'То, что выгоднее или интереснее всего вам.' },
      { id: 'q8', key: 'contents', type: 'textarea', required: false,
        label: 'Что входит в продукт? Какие есть ограничения?',
        hint: 'Что клиент получает и чего получить нельзя: сроки, география, минимальный заказ.' }
    ]
  },
  {
    id: 'client', num: '03', title: 'Клиент: первая гипотеза',
    lead: 'Портрет покупателя. Не нужно идеальной аналитики, достаточно того, что вы знаете из опыта.',
    questions: [
      { id: 'q9', key: 'buyer', type: 'textarea', required: true,
        label: 'Кто обычно покупает?',
        hint: 'Кто эти люди: возраст, профессия, частный клиент или компания.' },
      { id: 'q10', key: 'trigger', type: 'textarea', required: false,
        label: 'В какой ситуации он начинает искать решение?',
        hint: 'Что происходит в жизни или бизнесе человека за день до того, как он вас ищет.' },
      { id: 'q11', key: 'criteria', type: 'textarea', required: false,
        label: 'Что для него, предположительно, важно при выборе?',
        hint: 'Цена, скорость, опыт, отзывы, гарантии. Это пока гипотеза, её можно проверить позже.' }
    ]
  },
  {
    id: 'sales', num: '04', title: 'Путь продажи',
    lead: 'От первого обращения до оплаты. Здесь видно, где сайт может помочь продавать лучше.',
    questions: [
      { id: 'q12', key: 'first', type: 'textarea', required: false,
        label: 'Кто первым общается с человеком?',
        hint: 'Менеджер, администратор, вы лично, чат-бот.' },
      { id: 'q13', key: 'path', type: 'textarea', required: false,
        label: 'Как выглядит путь от первого обращения до покупки?',
        hint: 'По шагам, как это происходит сейчас: заявка, звонок, встреча, договор, оплата.' },
      { id: 'q14', key: 'after', type: 'textarea', required: false,
        label: 'Что происходит сразу после заявки?',
        hint: 'Кто и через сколько перезванивает, что говорит.' },
      { id: 'q15', key: 'break', type: 'textarea', required: true, important: true, summary: true,
        label: 'Где сделки чаще всего рвутся?',
        hint: 'Самый важный ответ. Где клиенты пропадают, сомневаются или уходят к другим? Если не уверены, напишите, как думаете.' }
    ]
  },
  {
    id: 'proof', num: '05', title: 'Ценность и доказательства',
    lead: 'За что вас выбирают и чем это можно подтвердить. Сайт должен не обещать, а доказывать.',
    questions: [
      { id: 'q16', key: 'valued', type: 'textarea', required: false,
        label: 'За что клиенты особенно ценят компанию?',
        hint: 'Что они говорят сами, когда благодарят или возвращаются.' },
      { id: 'q17', key: 'different', type: 'textarea', required: false,
        label: 'Что компания делает иначе и чем это доказать?',
        hint: 'Чем вы отличаетесь от тех, кто делает то же самое.' },
      { id: 'q18', key: 'recommend', type: 'textarea', required: false,
        label: 'За что компанию рекомендуют?',
        hint: 'Что люди пересказывают друзьям и коллегам.' },
      { id: 'q19', key: 'have', type: 'textarea', required: true, important: true,
        label: 'Чем доказываем: что реально есть на руках?',
        hint: 'Отзывы, кейсы, цифры, сертификаты, лицензии, фото работ, награды. Только то, что можно показать.' },
      { id: 'q20', key: 'havenot', type: 'textarea', required: true, important: true,
        label: 'Чего нет: что обещать нельзя?',
        hint: 'Защита от выдумок. Напишите, чего у вас нет или что вы не можете гарантировать, чтобы я этого не обещала на сайте.' }
    ]
  },
  {
    id: 'materials', num: '06', title: 'Материалы и доступы',
    lead: 'Всё, что поможет быстрее разобраться. Не нужно ничего готовить заранее: приложите то, что есть.',
    questions: [
      { id: 'q21', key: 'access', type: 'textarea', required: false,
        label: 'Есть ли доступ к CRM, звонкам, перепискам, причинам отказа?',
        hint: 'Реальные разговоры с клиентами рассказывают о бизнесе больше любых анкет. Если доступ есть, напишите, какой.' },
      { id: 'q22', key: 'existing', type: 'textarea', required: false,
        label: 'Какие отзывы, FAQ, звонки или переписки уже есть?',
        hint: 'Перечислите, где это лежит. Сами материалы можно приложить ниже.' },
      { id: 'q23', key: 'assets', type: 'textarea', required: false,
        label: 'Есть ли сайт, презентации, прайс, документы, фото, рендеры?',
        hint: 'Что уже есть, чтобы не придумывать заново.' },
      { id: 'q24', key: 'links', type: 'links', required: false,
        label: 'Ссылки',
        hint: 'Сайт, соцсети, облако с файлами. По одной ссылке на строку.' },
      { id: 'q25', key: 'files', type: 'files', required: false,
        label: 'Файлы',
        hint: 'До 10 файлов, каждый до 18 МБ. Презентации, прайс, документы, фото.' }
    ]
  },
  {
    id: 'contacts', num: '07', title: 'Контакты',
    lead: 'Последний шаг. Куда мне написать, когда я прочитаю ваши ответы.',
    questions: [
      { id: 'q26', key: 'name', type: 'text', required: true, summary: true, autocomplete: 'name',
        label: 'Как вас зовут?', hint: '', placeholder: 'Имя и фамилия' },
      { id: 'q27', key: 'company', type: 'text', required: false, summary: true, autocomplete: 'organization',
        label: 'Компания или проект', hint: '', placeholder: 'Название' },
      { id: 'q28', key: 'contact', type: 'text', required: true, summary: true, autocomplete: 'off',
        label: 'Телеграм, телефон или почта',
        hint: 'Как вам удобнее, чтобы я связалась.', placeholder: '@username, +7 или почта' },
      { id: 'q29', key: 'extra', type: 'textarea', required: false,
        label: 'Что-то ещё, о чём я не спросила?',
        hint: 'Любые пожелания, сомнения, дедлайны, вещи, которые важно знать заранее.' },
      { id: 'q30', key: 'consent', type: 'consent', required: true,
        label: 'Согласие на обработку персональных данных', hint: '' }
    ]
  }
];

/* Прочие настройки */
const SETTINGS = {
  maxFiles: 10,            // сколько файлов можно приложить
  maxFileMb: 18,           // размер одного файла, МБ
  draftKey: 'brief-draft-v1',
  sendTimeoutMs: 90000,    // сколько ждём ответ приёмника
  telegram: 'https://t.me/ppolinaguseva'
};
const CONFIG = window.BRIEF_CONFIG || { endpoint: '' };

/* =====================================================================
   Вспомогательные функции
   ===================================================================== */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const pad2 = n => (n < 10 ? '0' : '') + n;
const NB = ' ';

/* Типографика: короткие слова не остаются в конце строки */
function nb(text) {
  if (!text) { return ''; }
  const re = /(^|[\s(«])(в|во|на|и|с|со|к|ко|о|об|от|до|по|за|из|у|а|но|я|не|ни|же|ли|бы|или|для|при|без|над|под|про|что|как|то) /gi;
  let prev;
  do { prev = text; text = text.replace(re, '$1$2' + NB); } while (prev !== text);
  return text.replace(/ (?=[—–])/g, NB);
}

function el(tag, attrs, text) {
  const node = document.createElement(tag);
  Object.keys(attrs || {}).forEach(k => node.setAttribute(k, attrs[k]));
  if (text != null) { node.textContent = text; }
  return node;
}

function fmtSize(bytes) {
  if (bytes < 1024 * 1024) { return Math.max(1, Math.round(bytes / 1024)) + ' КБ'; }
  return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';
}

let toastTimer = null;
function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
}

function grow(area) {
  area.style.height = 'auto';
  area.style.height = area.scrollHeight + 2 + 'px';
}

/* =====================================================================
   Состояние
   ===================================================================== */
const state = {
  view: 'intro',        // intro | step | done
  step: 0,
  files: [],            // File[]
  sending: false
};
const total = STAGES.length;

/* =====================================================================
   Построение этапов из массива вопросов
   ===================================================================== */
function buildQuestion(q) {
  const wrap = el('div', { class: 'q' + (q.type === 'consent' ? ' q--consent' : ''), 'data-key': q.key });
  const fid = 'f-' + q.id;

  const head = el('div', { class: 'q__head' });
  head.append(el('label', { class: 'q__label', for: fid }, nb(q.label)));
  if (q.important) { head.append(el('span', { class: 'tag' }, 'Важно')); }
  else if (q.required && q.type !== 'consent') { head.append(el('span', { class: 'req' }, 'обязательно')); }
  wrap.append(head);
  if (q.hint) { wrap.append(el('p', { class: 'q__hint', id: fid + '-hint' }, nb(q.hint))); }

  let field;
  if (q.type === 'textarea' || q.type === 'links') {
    field = el('textarea', {
      class: 'input input--area' + (q.type === 'links' ? ' input--links' : ''),
      id: fid, name: q.key, rows: q.type === 'links' ? '3' : '4',
      placeholder: q.type === 'links' ? 'https://...' : 'Ваш ответ',
      'data-field': ''
    });
    field.addEventListener('input', () => grow(field));
    wrap.append(field);
  } else if (q.type === 'text') {
    field = el('input', {
      class: 'input', id: fid, name: q.key, type: 'text',
      placeholder: q.placeholder || '', autocomplete: q.autocomplete || 'off', 'data-field': ''
    });
    wrap.append(field);
  } else if (q.type === 'files') {
    wrap.append(buildDrop(fid));
  } else if (q.type === 'consent') {
    const label = el('label', { class: 'check' });
    const box = el('input', { class: 'check__input', type: 'checkbox', id: fid, name: q.key, 'data-field': '' });
    label.append(box, el('span', { class: 'check__box', 'aria-hidden': 'true' }));
    const text = el('span', { class: 'check__text' });
    text.innerHTML =
      'Согласна на <a class="doclink" href="../docs/consent.html" target="_blank" rel="noopener" data-doc="consent">обработку персональных данных</a> ' +
      'и принимаю <a class="doclink" href="../docs/privacy.html" target="_blank" rel="noopener" data-doc="privacy">политику конфиденциальности</a>';
    label.append(text);
    wrap.append(label);
  }
  if (field && q.hint) { field.setAttribute('aria-describedby', fid + '-hint'); }
  wrap.append(el('p', { class: 'q__error', role: 'alert' },
    q.type === 'consent' ? 'Без согласия отправить бриф нельзя.' : 'Это обязательный вопрос, напишите хотя бы пару слов.'));
  return wrap;
}

function buildDrop(fid) {
  const box = el('div', { class: 'q__files' });
  const drop = el('label', { class: 'drop', for: fid });
  const input = el('input', { class: 'drop__input', type: 'file', id: fid, multiple: '' });
  drop.append(input,
    el('span', { class: 'drop__title' }, 'Перетащите файлы сюда или нажмите, чтобы выбрать'),
    el('span', { class: 'drop__hint' }, 'До ' + SETTINGS.maxFiles + ' файлов, каждый до ' + SETTINGS.maxFileMb + ' МБ'));
  const msg = el('p', { class: 'drop__msg', id: 'drop-msg', role: 'status' });
  const list = el('ul', { class: 'files', id: 'files-list' });
  box.append(drop, msg, list);

  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', e => { if (e.dataTransfer) { addFiles(e.dataTransfer.files); } });
  return box;
}

function addFiles(fileList) {
  const msg = $('#drop-msg');
  const problems = [];
  Array.from(fileList).forEach(f => {
    if (state.files.length >= SETTINGS.maxFiles) { problems.push('Можно приложить не больше ' + SETTINGS.maxFiles + ' файлов.'); return; }
    if (f.size > SETTINGS.maxFileMb * 1024 * 1024) { problems.push('Файл «' + f.name + '» больше ' + SETTINGS.maxFileMb + ' МБ.'); return; }
    if (state.files.some(x => x.name === f.name && x.size === f.size)) { return; }
    state.files.push(f);
  });
  msg.textContent = Array.from(new Set(problems)).join(' ');
  renderFiles();
}

function renderFiles() {
  const list = $('#files-list');
  list.textContent = '';
  state.files.forEach((f, i) => {
    const li = el('li', { class: 'file' });
    const name = el('span', { class: 'file__name' }, f.name);
    name.append(el('span', { class: 'file__size' }, fmtSize(f.size)));
    const del = el('button', { class: 'file__del', type: 'button', 'aria-label': 'Удалить файл ' + f.name }, 'Удалить');
    del.addEventListener('click', () => { state.files.splice(i, 1); renderFiles(); $('#drop-msg').textContent = ''; });
    li.append(name, del);
    list.append(li);
  });
}

function buildSteps() {
  const host = $('#steps');
  STAGES.forEach((st, si) => {
    const sec = el('section', { class: 'step', 'data-step': String(si), hidden: '', 'aria-labelledby': 'st-' + si });
    const stage = el('div', { class: 'stage' });
    stage.append(
      el('div', { class: 'stage__num' }, st.num),
      el('h2', { class: 'stage__title', id: 'st-' + si, tabindex: '-1' }, nb(st.title)),
      el('p', { class: 'stage__lead' }, nb(st.lead)));
    const fields = el('div', { class: 'fields' });
    st.questions.forEach(q => fields.append(buildQuestion(q)));
    sec.append(stage, fields);
    host.append(sec);
  });
  const dots = $('#dots');
  STAGES.forEach((st, i) => {
    const b = el('button', { class: 'dot', type: 'button', role: 'listitem', 'aria-label': 'Этап ' + st.num + ': ' + st.title });
    b.addEventListener('click', () => go(i));
    dots.append(b);
  });
}

/* =====================================================================
   Чтение и запись ответов
   ===================================================================== */
function fieldOf(key) { return $('[data-key="' + key + '"] [data-field]'); }

function readValue(key) {
  const f = fieldOf(key);
  if (!f) { return ''; }
  return f.type === 'checkbox' ? f.checked : f.value.trim();
}

/* Собирает ответы по этапам: только заполненные вопросы */
function collect() {
  const stages = STAGES.map(st => {
    const items = [];
    st.questions.forEach(q => {
      if (q.type === 'consent' || q.type === 'files') { return; }
      const v = readValue(q.key);
      if (v) { items.push({ key: q.key, label: q.label, answer: v }); }
    });
    return { num: st.num, title: st.title, items };
  });
  const summary = { items: [] };
  STAGES.forEach(st => st.questions.forEach(q => {
    if (q.summary) {
      const v = readValue(q.key);
      if (v) { summary.items.push({ key: q.key, label: q.label, answer: v }); }
    }
  }));
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    page: location.href,
    summary,
    stages,
    files: state.files.map(f => ({ name: f.name, size: f.size }))
  };
}

/* Текст копии ответов для скачивания */
function toText(payload) {
  const out = ['БРИФ НА САЙТ', 'Дата: ' + new Date(payload.createdAt).toLocaleString('ru-RU'), ''];
  payload.stages.forEach(st => {
    if (!st.items.length) { return; }
    out.push(st.num + ' · ' + st.title.toUpperCase(), '');
    st.items.forEach(it => out.push(it.label, it.answer, ''));
  });
  if (payload.files.length) {
    out.push('ПРИЛОЖЕННЫЕ ФАЙЛЫ (пришлите их отдельно)', '');
    payload.files.forEach(f => out.push('— ' + f.name + ' (' + fmtSize(f.size) + ')'));
  }
  return out.join('\n');
}

function downloadCopy() {
  const payload = collect();
  const name = (readValue('name') || 'client').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'client';
  const blob = new Blob(['﻿' + toText(payload)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: 'brief-' + name + '-' + new Date().toISOString().slice(0, 10) + '.txt' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* =====================================================================
   Черновик в localStorage
   ===================================================================== */
let saveTimer = null;
let draftLocked = false;   // после успешной отправки черновик больше не пишем
function saveDraft() {
  if (draftLocked) { return; }
  try {
    const values = {};
    STAGES.forEach(st => st.questions.forEach(q => {
      if (q.type === 'files') { return; }
      values[q.key] = readValue(q.key);
    }));
    localStorage.setItem(SETTINGS.draftKey, JSON.stringify({ v: 1, step: state.step, started: state.view !== 'intro', values, ts: Date.now() }));
  } catch (e) { /* хранилище недоступно: ответы остаются на странице */ }
}
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 350); }

function loadDraft() {
  try {
    const raw = localStorage.getItem(SETTINGS.draftKey);
    if (!raw) { return null; }
    const d = JSON.parse(raw);
    return d && d.values ? d : null;
  } catch (e) { return null; }
}
function hasAnswers(d) { return d && Object.keys(d.values).some(k => d.values[k] === true || (typeof d.values[k] === 'string' && d.values[k])); }
function clearDraft() { clearTimeout(saveTimer); draftLocked = true; try { localStorage.removeItem(SETTINGS.draftKey); } catch (e) { /* ничего */ } }

function applyDraft(d) {
  Object.keys(d.values).forEach(k => {
    const f = fieldOf(k);
    if (!f) { return; }
    if (f.type === 'checkbox') { f.checked = !!d.values[k]; } else { f.value = d.values[k]; }
  });
  $$('textarea').forEach(grow);
}

/* =====================================================================
   Навигация по этапам
   ===================================================================== */
function updateChrome() {
  const idx = state.view === 'step' ? state.step : (state.view === 'done' ? total - 1 : -1);
  $('#count').textContent = (state.view === 'intro' ? '00' : pad2(idx + 1)) + ' / ' + pad2(total);
  $('#bar').style.setProperty('--p', (state.view === 'intro' ? 0 : state.view === 'done' ? 100 : ((idx + 1) / total) * 100) + '%');
  const showDock = state.view === 'step';
  $('#dock').hidden = !showDock;
  document.body.classList.toggle('has-dock', showDock);
  if (showDock) {
    $('#btn-prev').disabled = state.step === 0;
    $('#btn-next .btn__label').textContent = state.step === total - 1 ? 'Отправить' : 'Далее';
    $$('.dot').forEach((d, i) => {
      d.classList.toggle('is-current', i === state.step);
      d.classList.toggle('is-done', i !== state.step && STAGES[i].questions.some(q => q.type !== 'consent' && q.type !== 'files' && readValue(q.key)));
      d.setAttribute('aria-current', i === state.step ? 'step' : 'false');
    });
  }
}

function showView(name) {
  state.view = name;
  $('#view-intro').hidden = name !== 'intro';
  $('#view-done').hidden = name !== 'done';
  $$('.step').forEach((s, i) => { s.hidden = !(name === 'step' && i === state.step); });
  updateChrome();
}

function go(i, focusTitle) {
  state.step = Math.max(0, Math.min(total - 1, i));
  showView('step');
  window.scrollTo({ top: 0 });
  if (focusTitle !== false) {
    const t = $('#st-' + state.step);
    if (t) { t.focus({ preventScroll: true }); }
  }
  $$('.step:not([hidden]) textarea').forEach(grow);
  saveDraft();
}

/* Проверка обязательных вопросов этапа. Возвращает первый пустой или null */
function validateStage(si, mark) {
  let first = null;
  STAGES[si].questions.forEach(q => {
    if (!q.required) { return; }
    const wrap = $('[data-key="' + q.key + '"]');
    const v = readValue(q.key);
    const bad = !v;
    if (mark) { wrap.classList.toggle('is-invalid', bad); }
    if (bad && !first) { first = wrap; }
  });
  return first;
}

function focusFirst(wrap) {
  wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const f = $('[data-field]', wrap);
  if (f) { setTimeout(() => f.focus({ preventScroll: true }), 350); }
}

function next() {
  const bad = validateStage(state.step, true);
  if (bad) { focusFirst(bad); return; }
  if (state.step < total - 1) { go(state.step + 1); } else { submit(); }
}

/* =====================================================================
   Отправка
   ===================================================================== */
function showDone(mode) {
  const lead = $('#done-lead');
  const note = $('#done-note');
  if (mode === 'sent') {
    lead.textContent = 'Я получила ваш бриф и скоро с вами свяжусь.';
    note.hidden = true;
  } else if (mode === 'error') {
    lead.textContent = 'Бриф заполнен, но отправить его не получилось.';
    note.hidden = false;
    note.textContent = 'Ничего не потерялось: копия ответов скачалась на ваше устройство. Пришлите её мне в Telegram, и мы продолжим. Файлы, если они были, тоже приложите там.';
  } else {
    lead.textContent = 'Бриф заполнен. Осталось прислать его мне.';
    note.hidden = false;
    note.textContent = 'Автоматическая отправка пока не подключена, поэтому копия ответов скачалась на ваше устройство. Пришлите её мне в Telegram. Файлы, если они были, приложите там же.';
  }
  showView('done');
  window.scrollTo({ top: 0 });
  const t = $('#done-title');
  if (t) { t.focus({ preventScroll: true }); }
}

async function submit() {
  if (state.sending) { return; }
  /* Все обязательные вопросы всех этапов */
  for (let i = 0; i < total; i++) {
    const bad = validateStage(i, true);
    if (bad) {
      if (i !== state.step) { go(i, false); }
      setTimeout(() => focusFirst(bad), 80);
      toast('Заполните обязательные вопросы');
      return;
    }
  }
  saveDraft();   // ответы в безопасности ещё до отправки
  const payload = collect();

  /* Приёмник не подключён: даём скачать файл с ответами */
  if (!CONFIG.endpoint) {
    downloadCopy();
    showDone('manual');
    return;
  }

  state.sending = true;
  const btn = $('#btn-next');
  btn.disabled = true;
  $('#btn-next .btn__label').textContent = 'Отправляю';
  try {
    const fd = new FormData();
    fd.append('payload', JSON.stringify(payload));
    state.files.forEach((f, i) => fd.append('file' + i, f, f.name));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SETTINGS.sendTimeoutMs);
    const res = await fetch(CONFIG.endpoint, { method: 'POST', body: fd, signal: ctrl.signal });
    clearTimeout(timer);
    let ok = res.ok;
    try { const j = await res.json(); if (j && j.ok === false) { ok = false; } } catch (e) { /* тело не JSON, смотрим на статус */ }
    if (!ok) { throw new Error('send'); }
    clearDraft();
    showDone('sent');
  } catch (e) {
    downloadCopy();           // ответы не теряются ни при какой ошибке
    showDone('error');
  } finally {
    state.sending = false;
    btn.disabled = false;
  }
}

/* =====================================================================
   Запуск
   ===================================================================== */
function init() {
  buildSteps();

  /* Автосохранение и снятие подсветки ошибки при вводе */
  $('#steps').addEventListener('input', e => {
    const wrap = e.target.closest('.q');
    if (wrap) { wrap.classList.remove('is-invalid'); }
    scheduleSave();
    updateChrome();
  });
  $('#steps').addEventListener('change', e => {
    const wrap = e.target.closest('.q');
    if (wrap) { wrap.classList.remove('is-invalid'); }
    scheduleSave();
  });

  /* Ссылки-заглушки документов пока никуда не ведут */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="#"]');
    if (a) { e.preventDefault(); }
  });

  $('#btn-start').addEventListener('click', () => {
    const d = loadDraft();
    go(d && hasAnswers(d) && d.started ? Math.min(d.step || 0, total - 1) : 0);
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Стереть сохранённые ответы и начать заново?')) { return; }
    clearDraft();
    draftLocked = false;   // после «Начать заново» снова сохраняем
    $$('[data-field]').forEach(f => { if (f.type === 'checkbox') { f.checked = false; } else { f.value = ''; } });
    $$('.q').forEach(q => q.classList.remove('is-invalid'));
    state.files = []; renderFiles();
    $$('textarea').forEach(grow);
    $('#btn-reset').hidden = true;
    $('#btn-start .btn__label').textContent = 'Начать';
    toast('Черновик очищен');
  });
  $('#btn-prev').addEventListener('click', () => go(state.step - 1));
  $('#btn-next').addEventListener('click', next);
  $('#btn-download').addEventListener('click', downloadCopy);

  /* Восстановление черновика */
  const d = loadDraft();
  if (d && hasAnswers(d)) {
    applyDraft(d);
    $('#btn-start .btn__label').textContent = 'Продолжить';
    $('#btn-reset').hidden = false;
    toast('Черновик восстановлен');
  }
  showView('intro');
}

init();
