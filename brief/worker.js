/* Cloudflare Worker: принимает бриф с сайта и отправляет его в Telegram сообщениями.
   На сайте этот файл не нужен: его код разворачивается отдельно в Cloudflare (см. README.md).

   Нужные переменные окружения (Settings → Variables and Secrets):
     BOT_TOKEN       — токен бота от @BotFather (секрет)
     CHAT_ID         — id чата, куда слать брифы (ваш личный id или группы)
     ALLOWED_ORIGIN  — адрес сайта на GitHub Pages, например https://ваш-логин.github.io
                       (если не задан, разрешены любые сайты)

   Что приходит в Telegram:
     1) сводка: имя, компания, контакт и главные ответы;
     2) каждый этап отдельным сообщением, вопросы жирным;
     3) приложенные файлы документами.
   Пустые ответы не показываются. Длинные тексты режутся по абзацам под лимит 4096 символов. */

const TG_LIMIT = 4096;
const SAFE_LIMIT = 3800;   // запас: служебные символы и разметка

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') { return new Response(null, { status: 204, headers: cors }); }
    if (request.method !== 'POST') { return json({ ok: false, error: 'method' }, 405, cors); }

    try {
      const form = await request.formData();
      const payload = JSON.parse(String(form.get('payload') || '{}'));
      const messages = buildMessages(payload);
      if (!messages.length) { return json({ ok: false, error: 'empty' }, 400, cors); }

      for (const text of messages) { await tgSend(env, 'sendMessage', { text, parse_mode: 'HTML', disable_web_page_preview: true }); }

      /* Файлы отправляются документами следом за сообщениями */
      const name = payload.summary && payload.summary.items.find(i => i.key === 'name');
      for (const [field, value] of form.entries()) {
        if (!field.startsWith('file') || typeof value === 'string') { continue; }
        const fd = new FormData();
        fd.append('chat_id', env.CHAT_ID);
        fd.append('document', value, value.name);
        fd.append('caption', 'Файл к брифу' + (name ? ': ' + name.answer : '') + '\n' + value.name);
        await tgCall(env, 'sendDocument', fd);
      }
      return json({ ok: true }, 200, cors);
    } catch (err) {
      return json({ ok: false, error: 'server' }, 502, cors);
    }
  }
};

/* ---------- Формирование сообщений ---------- */

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildMessages(payload) {
  const out = [];

  /* 1) Сводка */
  const sum = (payload.summary && payload.summary.items) || [];
  const byKey = k => (sum.find(i => i.key === k) || {}).answer;
  const head = ['<b>Новый бриф на сайт</b>', ''];
  if (byKey('name')) { head.push('<b>Имя:</b> ' + esc(byKey('name'))); }
  if (byKey('company')) { head.push('<b>Компания:</b> ' + esc(byKey('company'))); }
  if (byKey('contact')) { head.push('<b>Контакт:</b> ' + esc(byKey('contact'))); }
  const blocks = [head.join('\n')];
  sum.filter(i => !['name', 'company', 'contact'].includes(i.key))
     .forEach(i => blocks.push('<b>' + esc(i.label) + '</b>\n' + esc(i.answer)));
  if (payload.files && payload.files.length) { blocks.push('Файлов приложено: ' + payload.files.length + ' (придут следом)'); }
  splitBlocks(blocks, '').forEach(m => out.push(m));

  /* 2) Каждый этап отдельным сообщением */
  (payload.stages || []).forEach(st => {
    if (!st.items || !st.items.length) { return; }   // пустые этапы не засоряют ленту
    const title = '<b>' + esc(st.num) + ' · ' + esc(st.title) + '</b>';
    const qa = st.items.map(i => '<b>' + esc(i.label) + '</b>\n' + esc(i.answer));
    splitBlocks(qa, title).forEach(m => out.push(m));
  });
  return out;
}

/* Склеивает блоки в сообщения не длиннее лимита. Режет по абзацам, не посреди фразы */
export function splitBlocks(blocks, title) {
  const msgs = [];
  let cur = title || '';
  const sep = '\n\n';
  const push = () => { if (cur.trim()) { msgs.push(cur); } cur = title ? title + ' (продолжение)' : ''; };

  blocks.forEach(block => {
    pieces(block).forEach(piece => {
      const add = (cur ? sep : '') + piece;
      if (cur.length + add.length > SAFE_LIMIT) { push(); cur += (cur ? sep : '') + piece; }
      else { cur += add; }
    });
  });
  if (cur.trim() && cur !== title) { msgs.push(cur); }
  else if (title && !msgs.length && cur.trim()) { msgs.push(cur); }
  return msgs;
}

/* Если один блок длиннее лимита, режем его по абзацам, потом по предложениям, потом по словам */
function pieces(block) {
  if (block.length <= SAFE_LIMIT) { return [block]; }
  const res = [];
  let cur = '';
  const take = unit => {
    if (unit.length > SAFE_LIMIT) {
      if (cur) { res.push(cur); cur = ''; }
      hard(unit).forEach(p => res.push(p));
      return;
    }
    if ((cur + '\n' + unit).length > SAFE_LIMIT) { res.push(cur); cur = unit; }
    else { cur = cur ? cur + '\n' + unit : unit; }
  };
  block.split('\n').forEach(par => {
    if (par.length <= SAFE_LIMIT) { take(par); return; }
    par.split(/(?<=[.!?…])\s+/).forEach(take);
  });
  if (cur) { res.push(cur); }
  return res;
}

/* Последний случай: одно «предложение» длиннее лимита, режем по пробелам */
function hard(text) {
  const res = [];
  let cur = '';
  text.split(' ').forEach(w => {
    if ((cur + ' ' + w).length > SAFE_LIMIT) { res.push(cur); cur = w.slice(0, SAFE_LIMIT); }
    else { cur = cur ? cur + ' ' + w : w; }
  });
  if (cur) { res.push(cur); }
  return res;
}

/* ---------- Telegram ---------- */

async function tgSend(env, method, body) {
  return tgCall(env, method, JSON.stringify({ chat_id: env.CHAT_ID, ...body }), { 'Content-Type': 'application/json' });
}

async function tgCall(env, method, body, headers, attempt = 0) {
  const res = await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/' + method, { method: 'POST', body, headers });
  if (res.status === 429 && attempt < 3) {
    const data = await res.json().catch(() => ({}));
    const wait = ((data.parameters && data.parameters.retry_after) || 1) * 1000;
    await new Promise(r => setTimeout(r, wait));
    return tgCall(env, method, body, headers, attempt + 1);
  }
  if (!res.ok) { throw new Error('telegram ' + res.status); }
  return res;
}

/* ---------- Служебное ---------- */

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allowed === '*' || origin === allowed ? (allowed === '*' ? '*' : origin) : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}
