/* Яндекс.Метрика с согласием на cookie: до согласия счётчик не загружается.
   Баннер в стиле сайта; выбор хранится в браузере; ссылка «Настройки cookie» в подвале позволяет передумать. */
(function () {
  var ID = 110979650;
  var KEY = 'nf-cookie-consent';
  var loaded = false;
  var base = (function () {
    var s = document.currentScript; var u = s && s.src ? s.src : '';
    return u.replace(/analytics\.js.*$/, '');
  })();

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function load() {
    if (loaded || !ID) { return; } loaded = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }

  /* Цели: window.nfGoal('lead') и т.д.; работает только после согласия */
  window.nfGoal = function (name) { if (loaded && window.ym) { try { window.ym(ID, 'reachGoal', name); } catch (e) {} } };

  var banner;
  function hide() { if (banner) { banner.remove(); banner = null; } }
  function show() {
    if (banner) { return; }
    banner = document.createElement('div');
    banner.className = 'cc'; banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-label', 'Согласие на cookie');
    var docs = (location.pathname.indexOf('/docs/') > -1 ? '' : (location.pathname.indexOf('/brief/') > -1 ? '../docs/' : 'docs/'));
    if (base) { docs = base + 'docs/'; }
    banner.innerHTML =
      '<p class="cc__text">Сайт использует cookie Яндекс.Метрики, чтобы понимать, как им пользуются. Без вашего согласия они не включаются. Подробнее в <a class="doclink" href="' + docs + 'cookies.html">Политике cookie</a>.</p>' +
      '<div class="cc__actions"><button class="btn" type="button" data-cc="yes"><span class="btn__label">Принять</span></button>' +
      '<button class="btn btn--ghost" type="button" data-cc="no"><span class="btn__label">Отказаться</span></button></div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]'); if (!b) { return; }
      var yes = b.getAttribute('data-cc') === 'yes'; write(yes ? 'yes' : 'no'); hide(); if (yes) { load(); }
    });
  }

  function addSettingsLink() {
    var nav = document.querySelector('.footer__docs'); if (!nav || nav.querySelector('[data-cc-open]')) { return; }
    var a = document.createElement('a'); a.className = 'doclink'; a.href = '#'; a.setAttribute('data-cc-open', '');
    a.textContent = 'Настройки cookie';
    a.addEventListener('click', function (e) { e.preventDefault(); show(); });
    nav.appendChild(a);
    /* подвал стал выше: плавной прокрутке нужно пересчитать конец страницы, иначе последние ссылки остаются за краем */
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
  }

  function init() {
    if (!ID) { return; }
    addSettingsLink();
    var v = read();
    if (v === 'yes') { load(); } else if (v !== 'no') { setTimeout(show, 1200); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
