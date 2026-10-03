/* Микроанимации и поведение боковой колонки */
(function () {
  var root = document.documentElement;
  var lenis = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var side = document.getElementById('side');
  var footer = document.getElementById('footer');

  /* Заголовок: каждое слово в своей маске, чтобы выезжало по очереди */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var words = el.textContent.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '').split(/[ \t\r\n]+/);
    el.setAttribute('aria-label', el.textContent.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, ''));
    el.innerHTML = words.map(function (w, i) {
      return '<span class="word" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });

  /* Стартовая анимация после загрузки шрифтов */
  var start = function () { requestAnimationFrame(function () { root.classList.add('is-ready'); }); };
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start); } else { start(); }

  /* Заголовки секций «печатаются» по буквам */
  document.querySelectorAll('.h2').forEach(function (el) {
    var t = el.textContent;
    el.setAttribute('aria-label', t);
    el.innerHTML = Array.prototype.map.call(t, function (ch, i) {
      return ch === ' ' ? ' ' : '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + ch + '</span>';
    }).join('');
  });

  /* Крупные абзацы проявляются из дымки слово за словом */
  document.querySelectorAll('.lead').forEach(function (el) {
    var words = el.textContent.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '').split(/[ \t\r\n]+/);
    el.setAttribute('aria-label', el.textContent.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, ''));
    el.innerHTML = words.map(function (w, i) {
      return '<span class="wg" aria-hidden="true" style="--i:' + i + '">' + w + '</span>';
    }).join(' ');
    el.removeAttribute('data-reveal');
    el.setAttribute('data-fx', '');
  });

  /* Появление блоков при прокрутке */
  var items = document.querySelectorAll('[data-reveal], [data-fx]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el, i) {
      /* Небольшая задержка внутри сетки работ, чтобы карточки шли волной */
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Плитки работ появляются волной: у каждой своя задержка */
  var cards = document.querySelectorAll('.card');
  cards.forEach(function (c, i) { c.style.setProperty('--d', (i % 2) * 160); });

  /* Активный пункт меню по положению на странице */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });

  function update() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    side.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);

    /* Параллакс размытого фона в плитках */
    cards.forEach(function (c) {
      var rr = c.getBoundingClientRect();
      if (rr.bottom < 0 || rr.top > window.innerHeight) { return; }
      var pp = ((rr.top + rr.height / 2) / window.innerHeight - 0.5) * 2;
      c.style.setProperty('--py', (pp * -26).toFixed(1) + 'px');
    });

    /* Футер: прогресс выезда из-под страницы от 0 до 1 */
    if (footer) {
      var r = footer.getBoundingClientRect();
      var fp = (window.innerHeight - r.top) / Math.max(1, r.height);
      footer.style.setProperty('--fp', Math.min(1, Math.max(0, fp)).toFixed(3));
    }

    var line = window.innerHeight * 0.4;
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) current = i; });
    if (max > 0 && y >= max - 4) current = sections.length - 1;
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { update(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();


  /* Плавная прокрутка Lenis */
  if (window.Lenis && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
    /* Якорные ссылки едут плавно, с учётом верхней панели на телефоне */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var target = id.length > 1 ? document.querySelector(id) : null;
        if (id === '#top') { e.preventDefault(); lenis.scrollTo(0, { force: true }); }
        else if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { force: true, offset: id === '#top' ? 0 : -(window.innerWidth < 1024 ? 56 : 0) });
        }
      });
    });
  }

  /* Мобильное меню */
  var toggle = side.querySelector('.side__toggle');
  var label = toggle.querySelector('.side__toggle-text');
  function setOpen(open) {
    side.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    label.textContent = open ? 'Закрыть' : 'Меню';
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  toggle.addEventListener('click', function () { setOpen(!side.classList.contains('is-open')); });
  side.querySelectorAll('.side__panel a, .side__brand').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) setOpen(false); });

  /* Форма заявки.
     Без сервера письмо с файлом отправить нельзя, поэтому есть два режима:
     1) FORM_ENDPOINT заполнен (адрес сервиса приёма форм): заявка и файл уходят сразу, без почтового клиента;
     2) FORM_ENDPOINT пустой: открывается письмо с текстом заявки, файл прикрепляется вручную. */
  var FORM_ENDPOINT = '';
  var MAX_FILE = 10 * 1024 * 1024;
  var form = document.getElementById('lead-form');
  var err = document.getElementById('form-error');
  var note = document.getElementById('form-note');
  var fileInput = document.getElementById('file');
  var fileName = document.getElementById('attach-name');
  var attach = fileInput.closest('.attach');

  fileInput.addEventListener('change', function () {
    var f = fileInput.files[0];
    if (!f) { fileName.textContent = 'Если есть своё ТЗ, прикрепите его. До 10 МБ'; attach.classList.remove('has-file'); return; }
    if (f.size > MAX_FILE) {
      fileInput.value = '';
      attach.classList.remove('has-file');
      fileName.textContent = 'Файл больше 10 МБ, выберите поменьше';
      return;
    }
    attach.classList.add('has-file');
    fileName.textContent = f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' КБ)';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var name = f.name.value.trim();
    var contact = f.contact.value.trim();
    note.hidden = true;
    form.querySelectorAll('.field').forEach(function (fl) { fl.classList.remove('is-invalid'); });
    form.querySelector('.check').classList.toggle('is-invalid', !f.agree.checked);
    if (!name) { f.name.closest('.field').classList.add('is-invalid'); }
    if (!contact) { f.contact.closest('.field').classList.add('is-invalid'); }
    if (!name || !contact || !f.agree.checked) {
      err.hidden = false;
      err.textContent = 'Укажите имя и контакт и подтвердите согласие.';
      return;
    }
    err.hidden = true;
    var file = fileInput.files[0];

    if (FORM_ENDPOINT) {
      var data = new FormData(form);
      fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) { throw new Error('send'); }
          form.reset(); attach.classList.remove('has-file'); fileName.textContent = 'Если есть своё ТЗ, прикрепите его. До 10 МБ';
          note.hidden = false; note.textContent = 'Заявка отправлена. Отвечу в течение дня.';
        })
        .catch(function () {
          err.hidden = false; err.textContent = 'Не получилось отправить. Напишите на почту или в Telegram.';
        });
      return;
    }

    var body = 'Имя: ' + name + '\nКонтакт: ' + contact + '\nЧто нужно: ' + f.type.value +
      (file ? '\nТЗ: ' + file.name + ' (прикреплю к этому письму)' : '') +
      '\n\n' + f.message.value.trim();
    window.location.href = 'mailto:polinaguseva13@yandex.ru?subject=' +
      encodeURIComponent('Заявка с сайта') + '&body=' + encodeURIComponent(body);
    if (file) {
      note.hidden = false;
      note.textContent = 'Письмо откроется без файла. Прикрепите ТЗ «' + file.name + '» к письму вручную.';
    }
  });

  /* Курсор-квадрат: плавно догоняет мышь, на ссылках и кнопках увеличивается */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cur = document.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    root.classList.add('has-cursor');
    var tx = 0, ty = 0, x = 0, y = 0, seen = false;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { x = tx; y = ty; seen = true; cur.classList.add('is-on'); }
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, label, input, select, textarea, .price'));
    });
    document.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });
    document.addEventListener('mouseenter', function () { if (seen) cur.classList.add('is-on'); });
    (function loop() {
      x += (tx - x) * 0.28; y += (ty - y) * 0.28;
      cur.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
  }

  /* Ссылки-заглушки (документы, Instagram) пока никуда не ведут и не прыгают наверх */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* Поле «О проекте»: одна строка, растёт по мере набора */
  var ta = form.querySelector('.field__area');
  function grow() { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
  ta.addEventListener('input', grow);
  form.addEventListener('reset', function () { setTimeout(grow, 0); });

  /* Почта: ссылка открывает письмо сразу, а адрес заодно копируется на случай, если почтовой программы нет */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var addr = a.getAttribute('href').replace('mailto:', '').split('?')[0];
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(function () {
          toast.textContent = 'Адрес скопирован';
          toast.classList.add('is-on');
          clearTimeout(toastTimer);
          toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
        }).catch(function () {});
      }
    });
  });

  /* Слайдер фото в «Обо мне»: берёт только те фото, которые реально загрузились */
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var slides = Array.prototype.slice.call(g.querySelectorAll('.gallery__slide'));
    var count = g.querySelector('.gallery__count');
    var ok = [];
    var cur = -1;
    var timer = null;
    var hovering = false;
    var visible = false;
    var pending = slides.length;

    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function show(i) {
      if (!ok.length) { return; }
      if (cur >= 0) { ok[cur].classList.remove('is-active'); }
      cur = (i + ok.length) % ok.length;
      ok[cur].classList.add('is-active');
      count.textContent = pad2(cur + 1) + ' / ' + pad2(ok.length);
    }
    function play() {
      clearInterval(timer);
      if (ok.length < 2 || reduce || hovering || !visible) { return; }
      timer = setInterval(function () { show(cur + 1); }, 4200);
    }
    function settle() {
      if (pending > 0) { return; }
      if (!ok.length) { g.classList.add('is-empty'); return; }
      show(0);
      play();
    }
    slides.forEach(function (img) {
      function done(good) {
        if (good) { ok.push(img); } else { img.remove(); }
        pending--;
        /* порядок как в разметке */
        ok.sort(function (a, b) { return slides.indexOf(a) - slides.indexOf(b); });
        settle();
      }
      if (img.complete) { done(img.naturalWidth > 0); }
      else {
        img.addEventListener('load', function () { done(true); }, { once: true });
        img.addEventListener('error', function () { done(false); }, { once: true });
      }
    });
    /* Ленивая загрузка не трогает скрытые слайды, поэтому просим их сразу */
    slides.forEach(function (img) { img.loading = 'eager'; });

    g.addEventListener('mouseenter', function () { hovering = true; play(); });
    g.addEventListener('mouseleave', function () { hovering = false; play(); });
    g.addEventListener('click', function () { show(cur + 1); play(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; play(); }, { threshold: 0.3 }).observe(g);
    } else { visible = true; }
  });

  /* Крупная фраза в подвале подгоняется так, чтобы самая длинная строка занимала всю ширину */
  var big = document.querySelector('.footer__big');
  function fitBig() {
    if (!big) { return; }
    big.style.fontSize = '100px';
    var avail = big.clientWidth;
    var widest = big.scrollWidth;   // ширина самой длинной строки при размере 100px
    if (widest > 0 && avail > 0) { big.style.fontSize = Math.floor(100 * avail / widest * 10) / 10 + 'px'; }
  }
  if (big) {
    fitBig();
    window.addEventListener('resize', fitBig);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitBig); }
  }

  /* Заполненные обязательные поля подсвечиваются зелёным */
  ['name', 'contact'].forEach(function (n) {
    var inp = form.elements[n];
    inp.addEventListener('input', function () {
      var fl = inp.closest('.field');
      fl.classList.remove('is-invalid');
      fl.classList.toggle('is-valid', !!inp.value.trim());
    });
  });
  form.elements.agree.addEventListener('change', function () { form.querySelector('.check').classList.remove('is-invalid'); });

  /* Эффект при прокрутке на фото в «Обо мне»: волна и разъезд цветов зависят от скорости прокрутки.
     Когда фото стоит на месте, фильтр полностью выключен, помех нет. */
  var fxTargets = document.querySelectorAll('.about .gallery');
  var fxDisp = document.getElementById('fx-disp');
  var fxR = document.getElementById('fx-r');
  var fxB = document.getElementById('fx-b');
  if (fxTargets.length && fxDisp && !reduce) {
    var lastY = window.scrollY, vel = 0, running = false;
    var onFxScroll = function () {
      var y = window.scrollY;
      vel += (y - lastY) * 0.35;
      lastY = y;
      if (!running) { running = true; requestAnimationFrame(fxTick); }
    };
    var fxTick = function () {
      vel *= 0.86;                                   /* плавно затухает */
      var k = Math.min(1, Math.abs(vel) / 45);       /* сила эффекта 0..1 */
      if (k < 0.015) {
        fxTargets.forEach(function (t) { t.style.filter = ''; t.style.transform = ''; });
        vel = 0; running = false; return;
      }
      var sign = vel < 0 ? -1 : 1;
      fxDisp.setAttribute('scale', (k * 32).toFixed(1));
      fxR.setAttribute('dx', (k * 6 * sign).toFixed(1));
      fxB.setAttribute('dx', (-k * 6 * sign).toFixed(1));
      fxTargets.forEach(function (t) {
        t.style.filter = 'url(#scroll-fx)';
        t.style.transform = 'skewY(' + (sign * k * 1.6).toFixed(2) + 'deg)';
      });
      requestAnimationFrame(fxTick);
    };
    window.addEventListener('scroll', onFxScroll, { passive: true });
  }
})();
