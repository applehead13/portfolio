/* Общие помощники: настоящие пиксели (целые квадраты по сетке клеток, без прозрачности) */
window.NF = (function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function burst(host, x, y, w, h, colors, cell, n) {
    if (reduce) { return; }
    n = n || 40;
    for (var i = 0; i < n; i++) {
      var sz = cell * (Math.random() < 0.25 ? 2 : 1);
      var d = document.createElement('span'); d.className = 'px';
      d.style.left = Math.round((x + rnd(0, Math.max(0, w - sz))) / cell) * cell + 'px';
      d.style.top = Math.round((y + rnd(0, Math.max(0, h - sz))) / cell) * cell + 'px';
      d.style.width = d.style.height = sz + 'px'; d.style.background = colors[Math.floor(Math.random() * colors.length)];
      host.appendChild(d);
      var a = rnd(0, Math.PI * 2), r = rnd(30, 120);
      var an = d.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + Math.round(Math.cos(a) * r / cell) * cell + 'px,' + Math.round(Math.sin(a) * r / cell) * cell + 'px)' }], { duration: rnd(450, 750), easing: 'steps(5, end)', fill: 'forwards' });
      an.onfinish = (function (el) { return function () { el.remove(); }; })(d);
    }
  }
  function fmt(ms) { return (ms / 1000).toFixed(1).replace('.', ','); }
  function sprite(art, cell, color) {
    var rects = '';
    art.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { if (row[x] === 'X') { rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; } } });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + art[0].length + ' ' + art.length + '" width="' + art[0].length * cell + '" height="' + art.length * cell + '" shape-rendering="crispEdges" fill="' + color + '">' + rects + '</svg>';
  }
  return { rnd: rnd, burst: burst, fmt: fmt, sprite: sprite, reduce: reduce,
    C: { text: '#ececE9', muted: '#8a8c86', accent: '#3f9669', dark: '#24593f', deep: '#123524', bg: '#0d0e0c', line: '#2a2c28' },
    PAGE: ['XXXXXX..', 'X....XX.', 'X.....XX', 'X......X', 'X.X..X.X', 'X......X', 'X..XX..X', 'X.X..X.X', 'X......X', 'XXXXXXXX'],
    SMILE: ['.X...X.', '.X...X.', '.......', 'X.....X', '.XXXXX.'],
    SAD: ['.X...X.', '.X...X.', '.......', '.XXXXX.', 'X.....X'] };
})();
