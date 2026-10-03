/* Документы: меню-бургер на телефоне и пиксельный курсор, как на сайте. Никакой печати и появления. */
(function () {
  var root = document.documentElement;

  /* «Документ» стоит у верхнего правого угла всего заголовка: ширина подгоняется под самую длинную строку */
  function fitTag() {
    var h = document.querySelector('.doc__title--tag');
    if (!h) { return; }
    h.style.width = '';
    var rg = document.createRange();
    rg.selectNodeContents(h.firstChild);
    var rects = Array.prototype.slice.call(rg.getClientRects());
    if (!rects.length) { return; }
    var left = h.getBoundingClientRect().left;
    var textW = Math.max.apply(null, rects.map(function (r) { return r.right; })) - left;
    var tw = h.querySelector('.tag').getBoundingClientRect().width;
    h.style.setProperty('--tag-w', tw + 'px');
    h.style.width = Math.ceil(textW + tw + 8) + 1 + 'px';
  }
  fitTag();
  window.addEventListener('resize', fitTag);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fitTag); }
  var side = document.getElementById('side');
  var toggle = side.querySelector('.side__toggle');
  var label = toggle.querySelector('.side__toggle-text');
  function setOpen(open) {
    if (side.classList.contains('is-open') === open) { return; }
    side.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    label.textContent = open ? 'Закрыть' : 'Меню';
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { setOpen(!side.classList.contains('is-open')); });
  side.querySelectorAll('.side__panel a, .side__brand').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); } });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) { setOpen(false); } });
  document.querySelectorAll('a[href="#"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); }); });

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
      cur.classList.toggle('is-hover', !!e.target.closest('a, button, label, input, select, textarea'));
    });
    document.addEventListener('mouseleave', function () { cur.classList.remove('is-on'); });
    document.addEventListener('mouseenter', function () { if (seen) { cur.classList.add('is-on'); } });
    (function loop() { cur.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)'; requestAnimationFrame(loop); })();
  }
})();
