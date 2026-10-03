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

  /* Эффект помех на фото в «Обо мне» при прокрутке.
     Шейдер взят с демо Lusion «WebGL Scroll Sync» (вертикальные полосы, которые сдвигаются и смазываются, как помехи)
     и работает на одном небольшом WebGL-холсте поверх фото. Сила зависит от скорости прокрутки.
     Когда фото стоит на месте, холст полностью скрыт, никаких помех нет. */
  (function () {
    var gal = document.querySelector('.about .gallery');
    if (!gal || reduce) { return; }
    var cv = document.createElement('canvas');
    cv.className = 'gallery__fx';
    cv.setAttribute('aria-hidden', 'true');
    gal.appendChild(cv);
    var gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: false });
    if (!gl) { cv.remove(); return; }

    var VS = 'attribute vec2 a_pos; varying vec2 v_uv; void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0., 1.); }';
    var FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
      'uniform sampler2D u_texture; uniform vec4 u_rands; uniform float u_strength; uniform float u_id;',
      'uniform vec2 u_scale; uniform vec2 u_offset; varying vec2 v_uv;',
      '#define NUM_SAMPLES 5',
      'vec4 hash43(vec3 p){ vec4 p4 = fract(vec4(p.xyzx) * vec4(.1031,.1030,.0973,.1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }',
      'vec2 cover(vec2 uv){ return uv * u_scale + u_offset; }',
      'void main(){',
      '  vec4 noises = hash43(vec3(gl_FragCoord.xy, u_id));',
      '  vec4 rands = hash43(vec3(floor(sin(v_uv.x * 2. + u_rands.x * 6.283) * mix(3., 40., u_rands.y)) * 30., u_id, u_rands.z));',
      '  vec2 uvOffset = vec2(0., (rands.x - .5) * 0.5 * (rands.y > .7 ? 1. : 0.)) / float(NUM_SAMPLES) * (0.05 + u_strength * 0.3);',
      '  vec2 uv = v_uv + noises.xy * uvOffset;',
      '  vec3 color = vec3(0.);',
      '  for (int i = 0; i < NUM_SAMPLES; i++) { color += texture2D(u_texture, cover(uv)).rgb; uv += uvOffset; }',
      '  color /= float(NUM_SAMPLES);',
      '  gl_FragColor = vec4(color, 1.);',
      '}'
    ].join('\n');

    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { cv.remove(); return; }
    var pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['u_texture', 'u_rands', 'u_strength', 'u_id', 'u_scale', 'u_offset'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(U.u_texture, 0);
    gl.uniform1f(U.u_id, 0);

    var uploaded = null, w = 0, h = 0;
    function size() {
      var r = gal.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      var nw = Math.max(1, Math.round(r.width * d)), nh = Math.max(1, Math.round(r.height * d));
      if (nw !== w || nh !== h) { w = nw; h = nh; cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
    }
    /* Имитация object-fit: cover вместе с object-position у текущего слайда */
    function bind(img) {
      if (img !== uploaded) {
        try { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); uploaded = img; } catch (e) { return false; }
      }
      var ia = img.naturalWidth / img.naturalHeight, ba = w / h;
      var pos = (getComputedStyle(img).objectPosition || '50% 50%').split(' ');
      var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || '50') / 100;
      var sx = 1, sy = 1;
      if (ia > ba) { sx = ba / ia; } else { sy = ia / ba; }
      gl.uniform2f(U.u_scale, sx, sy);
      gl.uniform2f(U.u_offset, (1 - sx) * px, (1 - sy) * (1 - py));
      return true;
    }

    var J = 0, lastY = window.scrollY, lastT = performance.now() / 1000, running = false, visible = false;
    var rnd = [0, 0, 0, 0];
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(gal);

    function tick() {
      var t = performance.now() / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
      var y = window.scrollY, dy = y - lastY; lastY = y;
      J *= Math.exp(-dt * 10);
      J += Math.min(Math.abs(dy) * 10 / window.innerHeight, 5);
      var strength = Math.min(1, J);
      var img = gal.querySelector('.gallery__slide.is-active') || gal.querySelector('.gallery__slide');
      if (visible && strength > 0.012 && img && img.naturalWidth) {
        size();
        if (bind(img)) {
          if (Math.random() > Math.exp(-dt * 25 * (1 + J))) { rnd = [Math.random(), Math.random(), Math.random(), Math.random()]; }
          gl.uniform4f(U.u_rands, rnd[0], rnd[1], rnd[2], rnd[3]);
          gl.uniform1f(U.u_strength, strength);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          cv.style.opacity = '1';
        }
      } else {
        cv.style.opacity = '0';
      }
      if (J > 0.004) { requestAnimationFrame(tick); } else { cv.style.opacity = '0'; running = false; }
    }
    window.addEventListener('scroll', function () {
      if (!running) { running = true; lastT = performance.now() / 1000; lastY = window.scrollY; requestAnimationFrame(tick); }
    }, { passive: true });
  })();

  /* Этапы работы: аккордеон, открыт один этап */
  var stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach(function (item) {
    var btn = item.querySelector('.step-item__head');
    btn.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      stepItems.forEach(function (o) {
        o.classList.remove('is-open');
        o.querySelector('.step-item__head').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* Телефон: подсвечиваем ту услугу в ценах, которая сейчас ближе всего к середине экрана */
  var priceList = document.querySelector('.prices');
  var touchMq = window.matchMedia('(hover: none), (max-width: 767px)');
  if (priceList) {
    var priceRows = Array.prototype.slice.call(priceList.querySelectorAll('.price'));
    var priceTick = false;
    var updatePrices = function () {
      priceTick = false;
      if (!touchMq.matches) {
        priceRows.forEach(function (r) { r.classList.remove('is-active'); });
        priceList.classList.remove('has-active');
        return;
      }
      var mid = window.innerHeight * 0.5, best = null, bestD = Infinity;
      priceRows.forEach(function (r) {
        var b = r.getBoundingClientRect();
        if (b.bottom < 0 || b.top > window.innerHeight) { return; }
        var d = Math.abs((b.top + b.height / 2) - mid);
        if (d < bestD) { bestD = d; best = r; }
      });
      priceRows.forEach(function (r) { r.classList.toggle('is-active', r === best && bestD < window.innerHeight * 0.38); });
      priceList.classList.toggle('has-active', !!priceList.querySelector('.is-active'));
    };
    var schedulePrices = function () { if (!priceTick) { priceTick = true; requestAnimationFrame(updatePrices); } };
    window.addEventListener('scroll', schedulePrices, { passive: true });
    window.addEventListener('resize', schedulePrices);
    updatePrices();
  }

  /* Помехи на заголовках: копия текста в атрибуте data-text (без номеров в скобках) */
  if (!reduce) {
    document.querySelectorAll('.h2, .hero__title, .footer__big, .contacts__side .lead').forEach(function (el) {
      var clone = el.cloneNode(true);
      clone.querySelectorAll('.price__num, .step-item__num, .ch, .word').forEach(function (n) { n.replaceWith(document.createTextNode(n.textContent)); });
      clone.querySelectorAll('.price__num, .step-item__num').forEach(function (n) { n.remove(); });
      var text = (el.getAttribute('aria-label') || clone.textContent).replace(/\s+/g, ' ').trim();
      if (el.classList.contains('price__title') || el.classList.contains('step-item__title')) {
        text = text.replace(/\s*0\d$/, '');
      }
      el.setAttribute('data-text', text);
      el.classList.add('glitch');
    });
  }

  /* Плитки работ: при наведении фото получает небольшие помехи (тот же шейдер, что на фото в «Обо мне»), логотип остаётся читаемым.
     Фото больше не размывается. Без наведения холст скрыт. */
  (function () {
    var canHover = window.matchMedia('(hover: hover) and (min-width: 768px)').matches;
    var tiles = document.querySelectorAll('.card__media--photo');
    if (!tiles.length || reduce || !canHover) { return; }

    var VS = 'attribute vec2 a_pos; varying vec2 v_uv; void main(){ v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0., 1.); }';
    var FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
      'uniform sampler2D u_texture; uniform vec4 u_rands; uniform float u_strength; uniform float u_id;',
      'uniform vec2 u_scale; uniform vec2 u_offset; varying vec2 v_uv;',
      '#define NUM_SAMPLES 5',
      'vec4 hash43(vec3 p){ vec4 p4 = fract(vec4(p.xyzx) * vec4(.1031,.1030,.0973,.1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }',
      'void main(){',
      '  vec4 noises = hash43(vec3(gl_FragCoord.xy, u_id));',
      '  vec4 rands = hash43(vec3(floor(sin(v_uv.x * 2. + u_rands.x * 6.283) * mix(3., 40., u_rands.y)) * 30., u_id, u_rands.z));',
      '  vec2 uvOffset = vec2(0., (rands.x - .5) * 0.5 * (rands.y > .7 ? 1. : 0.)) / float(NUM_SAMPLES) * (0.05 + u_strength * 0.3);',
      '  vec2 uv = v_uv + noises.xy * uvOffset;',
      '  vec3 color = vec3(0.);',
      '  for (int i = 0; i < NUM_SAMPLES; i++) { color += texture2D(u_texture, uv * u_scale + u_offset).rgb; uv += uvOffset; }',
      '  gl_FragColor = vec4(color / float(NUM_SAMPLES), 1.);',
      '}'
    ].join('\n');

    tiles.forEach(function (tile, index) {
      var img = tile.querySelector('.work__img');
      if (!img) { return; }
      var cv = document.createElement('canvas');
      cv.className = 'work__fx';
      cv.setAttribute('aria-hidden', 'true');
      tile.insertBefore(cv, tile.firstChild.nextSibling);
      var gl = cv.getContext('webgl', { premultipliedAlpha: false, alpha: false });
      if (!gl) { cv.remove(); return; }
      function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
      var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) { cv.remove(); return; }
      var pr = gl.createProgram();
      gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
      gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var U = {};
      ['u_texture', 'u_rands', 'u_strength', 'u_id', 'u_scale', 'u_offset'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(U.u_texture, 0);
      gl.uniform1f(U.u_id, index + 1);

      var ready = false, w = 0, h = 0, hovering = false, level = 0, running = false, lastT = 0, rnd = [0, 0, 0, 0];
      function size() {
        var r = tile.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        var nw = Math.max(1, Math.round(r.width * d)), nh = Math.max(1, Math.round(r.height * d));
        if (nw !== w || nh !== h) { w = nw; h = nh; cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
      }
      function upload() {
        if (ready || !img.naturalWidth) { return ready; }
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); ready = true; } catch (e) { return false; }
        return true;
      }
      function tick() {
        var t = performance.now() / 1000, dt = Math.min(0.1, t - lastT); lastT = t;
        /* наведение держит небольшой уровень помех с редкими всплесками; без наведения плавно затухает */
        if (hovering) { level = Math.max(level * Math.exp(-dt * 4), 0.22 + (Math.random() > 0.93 ? 0.35 : 0)); }
        else { level *= Math.exp(-dt * 7); }
        if (level < 0.03 && !hovering) { cv.style.opacity = '0'; running = false; return; }
        if (upload()) {
          size();
          var ia = img.naturalWidth / img.naturalHeight, ba = w / h, sx = 1, sy = 1;
          if (ia > ba) { sx = ba / ia; } else { sy = ia / ba; }
          var pos = (getComputedStyle(img).objectPosition || '50% 50%').split(' ');
          var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || '50') / 100;
          gl.uniform2f(U.u_scale, sx, sy);
          gl.uniform2f(U.u_offset, (1 - sx) * px, (1 - sy) * (1 - py));
          if (Math.random() > Math.exp(-dt * 25 * (1 + level))) { rnd = [Math.random(), Math.random(), Math.random(), Math.random()]; }
          gl.uniform4f(U.u_rands, rnd[0], rnd[1], rnd[2], rnd[3]);
          gl.uniform1f(U.u_strength, Math.min(1, level));
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          cv.style.opacity = '1';
        }
        requestAnimationFrame(tick);
      }
      function start() { if (!running) { running = true; lastT = performance.now() / 1000; requestAnimationFrame(tick); } }
      var host = tile.closest('.card') || tile;
      host.addEventListener('mouseenter', function () { hovering = true; level = 1; start(); });
      host.addEventListener('mouseleave', function () { hovering = false; start(); });
    });
  })();
})();
