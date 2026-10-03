/* Оформление брифа так же, как на основном сайте: меню-бургер, очередь появления (печать и проявление по порядку),
   помехи на заголовках, пиксельный курсор. Логика самого брифа живёт в app.js. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var side = document.getElementById('side');

  /* Левая панель собирается после загрузки шрифтов */
  var start = function () { requestAnimationFrame(function () { root.classList.add('is-ready'); }); };
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start); } else { start(); }

  /* ===== Меню-бургер (телефон и планшет) ===== */
  var toggle = side.querySelector('.side__toggle');
  var label = toggle.querySelector('.side__toggle-text');
  function setOpen(open) {
    if (side.classList.contains('is-open') === open) { return; }
    side.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    label.textContent = open ? 'Закрыть' : 'Меню';
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', function () { setOpen(!side.classList.contains('is-open')); });
  side.querySelectorAll('.side__panel a, .side__brand').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); } });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) { setOpen(false); } });

  /* Ссылка-заглушка Instagram никуда не ведёт */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ===== Единая очередь появления: тексты печатаются, остальное проявляется, всё по порядку сверху вниз ===== */
  var seq = [], seqBusy = true;
  setTimeout(function () { seqBusy = false; seqNext(); }, 350);
  function onScreen(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; }
  function order(a, b) {
    if (a.el === b.el) { return a.kind === 'reveal' ? -1 : 1; }
    return (a.el.compareDocumentPosition(b.el) & 4) ? -1 : 1;
  }
  function seqNext() {
    if (seqBusy || !seq.length) { return; }
    seq.sort(order);
    var it = seq.shift(), el = it.el, dur;
    if (it.kind === 'type') { el.classList.add('is-typed'); dur = el.__typeDur || 0; }
    else { el.classList.add('is-in'); dur = 90; }
    if (window.innerWidth < 1024 && el.closest('.side')) { dur = Math.min(dur, 40); }
    if (!onScreen(el)) { seqNext(); return; }
    seqBusy = true;
    setTimeout(function () { seqBusy = false; seqNext(); }, dur);
  }
  function seqAdd(el, kind) { seq.push({ el: el, kind: kind }); seqNext(); }

  /* Печать: каждая буква в своём span, появляются по очереди */
  function typeify(el) {
    if (el.hasAttribute('data-typed')) { return; }
    el.setAttribute('data-typed', '');
    var total = 0;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) { if (walker.currentNode.nodeValue.trim()) { nodes.push(walker.currentNode); } }
    nodes.forEach(function (node) {
      var parts = node.nodeValue.split(/([ \t\r\n]+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (part) {
        if (!part) { return; }
        if (/^[ \t\r\n]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var word = document.createElement('span');
        word.className = 'tw';
        Array.prototype.forEach.call(part, function (ch) {
          var c = document.createElement('span');
          c.className = 'tc';
          c.style.setProperty('--i', total++);
          c.textContent = ch;
          word.appendChild(c);
        });
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    var ts = 0.022;   // одна скорость печати везде
    el.style.setProperty('--ts', ts.toFixed(4) + 's');
    el.__typeDur = total * ts * 1000 + 60;
  }

  /* Что проявляется блоками и что печатается */
  /* Как в «Контактах» на основном сайте: заголовки, вступления, подписи полей и сами поля стоят на месте сразу;
     печатаются только пояснения и подсказки; главные кнопки проявляются последними; подвал без печати */
  var REVEAL_SEL = '.intro__list li, .intro__actions .btn, .done__photo, .done__steps li, .done__actions .btn';
  var TYPE_SEL = [
    '.intro__list strong', '.intro__list span',
    '.q__hint', '.drop__hint',
    '.done__steps strong', '.done__steps span', '.done__note'
  ].join(', ');

  if (!reduce && 'IntersectionObserver' in window) {
    document.querySelectorAll(REVEAL_SEL).forEach(function (el) { el.setAttribute('data-reveal', ''); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); seqAdd(e.target, 'reveal'); } });
    }, { rootMargin: '0px', threshold: 0.05 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

    var typeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { typeObs.unobserve(e.target); seqAdd(e.target, 'type'); } });
    }, { rootMargin: '0px', threshold: 0 });
    document.querySelectorAll(TYPE_SEL).forEach(function (el) {
      if (el.parentElement && el.parentElement.closest('[data-typed]')) { return; }
      typeify(el);
      el.classList.add('typing');
      typeObs.observe(el);
    });
  }

  /* ===== Помехи на заголовках и пиксельные смайлик и палец ===== */
  function withTail(h, cls) {
    /* последнее слово заголовка вместе с картинкой не переносится по отдельности */
    var text = h.textContent.replace(/\s+/g, ' ').trim();
    var i = text.lastIndexOf(' ');
    var head = i > -1 ? text.slice(0, i + 1) : '';
    var last = i > -1 ? text.slice(i + 1) : text;
    h.setAttribute('aria-label', text);
    h.textContent = '';
    if (head) { h.appendChild(document.createTextNode(head)); }
    var tail = document.createElement('span');
    tail.className = 'hero__tail';
    tail.setAttribute('aria-hidden', 'true');
    tail.appendChild(document.createTextNode(last));
    var pic = document.createElement('span');
    pic.className = cls;
    pic.setAttribute('aria-hidden', 'true');
    tail.appendChild(pic);
    h.appendChild(tail);
    return text;
  }
  var intro = document.querySelector('.intro__title');
  var done = document.querySelector('.done__title');
  var texts = {};
  if (intro) { texts.intro = withTail(intro, 'smile'); }
  if (done) { texts.done = withTail(done, 'thumb'); }

  if (!reduce) {
    var played = function (el) {
      el.classList.add('is-glitching');
      setTimeout(function () { el.classList.remove('is-glitching'); }, 1700);
    };
    var heads = Array.prototype.slice.call(document.querySelectorAll('.intro__title, .stage__title, .done__title'));
    heads.forEach(function (h) {
      var t = (h === intro && texts.intro) || (h === done && texts.done) || h.textContent.replace(/\s+/g, ' ').trim();
      h.setAttribute('data-text', t);
      h.classList.add('glitch');
    });
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) { return; }
          gio.unobserve(e.target);
          played(e.target);
        });
      }, { threshold: 0.6 });
      heads.forEach(function (h) { gio.observe(h); });
    }
  }

  /* ===== Курсор: пиксельная стрелка, на ссылках и кнопках пиксельная рука (только мышь) ===== */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cur = document.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    root.classList.add('has-cursor');
    var tx = 0, ty = 0, seen = false;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; cur.classList.add('is-on'); }
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, label, input, select, textarea, .dot'));
    });
    document.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });
    document.addEventListener('mouseenter', function () { if (seen) { cur.classList.add('is-on'); } });
    (function loop() {
      cur.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }
})();
