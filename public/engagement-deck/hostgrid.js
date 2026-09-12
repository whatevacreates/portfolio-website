/* ============================================================
   Section 5, point 01 — six course cards tile into one box.

   Three arrive from the left, three from the right, landing
   CHECKERBOARDED so the finished grid is visibly mixed rather
   than split down the middle. The interleave is the whole
   argument — "or both" is a layout, not a caption. Cards
   carrying the Scholé mark are the catalogue's, plain ones are
   yours; the point's own copy says the rest.

   Ported from internal-programs .../ANIMATIONS/host-any-content-2026-08-21-v1,
   which also renders the same piece as a GIF/WebM for decks that
   cannot run script. The DOM's resting state is the finished
   grid, so with no GSAP, or under reduced motion, the point
   still shows its poster.
   ============================================================ */
(function () {
  var host = document.querySelector('.hostgrid');
  if (!host) return;

  var W = 1200, H = 675;

  /* brand.css --grad-close-b: the brand gradient's right-hand stop, and the
     purple every border here is drawn in. tint(a) is that purple mixed over
     white — solid colours, not alphas, so nothing changes over the mist. */
  var PURPLE = [153, 122, 201];
  function tint(a) {
    return '#' + PURPLE.map(function (c) {
      return Math.round(255 - a * (255 - c)).toString(16).padStart(2, '0');
    }).join('');
  }
  var PURPLE_HEX = tint(1);

  /* The box, and the grid inside it. Everything below is struck from these
     numbers. The strokes are heavier than the source's 2/2.5: the original was
     drawn to show at 1200px and this figure runs about a third of that. */
  var FRAME = { x: 170, y: 118, w: 860, h: 440, r: 30 };
  var PAD = 34, GAP = 26, COLS = 3, ROWS = 2;
  var CARD_W = (FRAME.w - 2 * PAD - (COLS - 1) * GAP) / COLS;
  var CARD_H = (FRAME.h - 2 * PAD - (ROWS - 1) * GAP) / ROWS;

  /* The Scholé stars — circle, diamond, star ascending, the whole mark, never
     the sparkle alone. Geometry from schole-stars.svg; only the fill is ours. */
  var STARS_VB = [183.02, 210.95];
  var STARS =
    '<path d="M178.68,51.35s-.04,0-.06,0c-15.01,0-27.74-20.58-28.28-45.3.01-.59.02-1.18.02-1.78,0-2.16-1.61-3.93-3.74-4.23-2.15-.3-4.19,1.07-4.79,3.15-.11.39-.17.8-.17,1.21,0,.55,0,1.1.01,1.64-.58,24.67-13.3,45.18-28.28,45.18-.13,0-.25.05-.38.06h-12.29c-2.4,0-4.34,1.94-4.34,4.34s1.94,4.34,4.34,4.34h13.79c14.85,1,27.19,22.07,27.19,47.01,0,2.4,1.94,4.34,4.34,4.34s4.34-1.94,4.34-4.34c0-25.45,12.96-46.95,28.3-46.95,2.4,0,4.34-1.94,4.34-4.34s-1.94-4.34-4.34-4.34Z"/>' +
    '<circle cx="17.97" cy="192.98" r="17.97"/>' +
    '<path d="M113.46,144.16l-5.41-4.22c-3.74-2.92-7.12-6.29-10.04-10.04l-4.22-5.41c-2.06-2.64-6.05-2.64-8.11,0l-4.22,5.41c-2.92,3.74-6.29,7.12-10.04,10.04l-5.41,4.22c-2.64,2.06-2.64,6.05,0,8.11l5.41,4.22c3.74,2.92,7.12,6.29,10.04,10.04l4.22,5.41c2.06,2.64,6.05,2.64,8.11,0l4.22-5.41c2.92-3.74,6.29-7.12,10.04-10.04l5.41-4.22c2.64-2.06,2.64-6.05,0-8.11Z"/>';

  function roundRect(x, y, w, h, r) {
    return 'M' + (x + r) + ',' + y + ' H' + (x + w - r) +
      ' A' + r + ',' + r + ' 0 0 1 ' + (x + w) + ',' + (y + r) +
      ' V' + (y + h - r) + ' A' + r + ',' + r + ' 0 0 1 ' + (x + w - r) + ',' + (y + h) +
      ' H' + (x + r) + ' A' + r + ',' + r + ' 0 0 1 ' + x + ',' + (y + h - r) +
      ' V' + (y + r) + ' A' + r + ',' + r + ' 0 0 1 ' + (x + r) + ',' + y + ' Z';
  }

  /* card(mine) — one course card at its own origin: solid white body, a
     thumbnail band, two lines of nothing in particular. A catalogue card is
     the same card at full-strength purple with the mark on its thumbnail —
     someone else's content, badged. */
  function card(mine) {
    var ip = 16, bandH = 78, bw = CARD_W - 2 * ip;
    var markH = 46, markW = markH * STARS_VB[0] / STARS_VB[1];
    var mx = ip + (bw - markW) / 2, my = ip + (bandH - markH) / 2;
    return '<path d="' + roundRect(0, 0, CARD_W, CARD_H, 16) + '" fill="#ffffff"' +
      ' stroke="' + (mine ? tint(0.55) : PURPLE_HEX) + '" stroke-width="3"/>' +
      '<path d="' + roundRect(ip, ip, bw, bandH, 9) + '" fill="' + tint(mine ? 0.14 : 0.34) + '"/>' +
      (mine ? '' : '<g transform="translate(' + mx + ' ' + my + ') scale(' + (markH / STARS_VB[1]) + ')"' +
                   ' fill="' + PURPLE_HEX + '">' + STARS + '</g>') +
      '<path d="' + roundRect(ip, ip + bandH + 22, bw, 10, 5) + '" fill="' + tint(mine ? 0.30 : 0.42) + '"/>' +
      '<path d="' + roundRect(ip, ip + bandH + 46, bw * 0.62, 10, 5) + '" fill="' + tint(mine ? 0.30 : 0.42) + '"/>';
  }

  /* The checkerboard: (row + col) even is yours, odd is the catalogue's —
     three each, and no two of the same kind share an edge. A grid that filled
     the left half then the right would say "your content OR ours". */
  var SLOTS = [];
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      SLOTS.push({
        mine: (r + c) % 2 === 0,
        col: c,
        x: FRAME.x + PAD + c * (CARD_W + GAP),
        y: FRAME.y + PAD + r * (CARD_H + GAP),
      });
    }
  }

  /* The viewBox crops the source canvas to the box plus travel room: full
     width so cards are seen crossing the margins, trimmed above and below. */
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 92 ' + W + ' 492"' +
    ' preserveAspectRatio="xMaxYMid meet"' +
    ' role="img" aria-label="Six course cards — yours and Scholé’s catalogue, mixed — tiling into one box">' +
    '<path d="' + roundRect(FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.r) + '"' +
    ' fill="none" stroke="' + PURPLE_HEX + '" stroke-width="3.5"/>' +
    '<g id="hg-grid">' +
    SLOTS.map(function (s, i) {
      return '<g id="hg-slot' + i + '" transform="translate(' + s.x + ' ' + s.y + ')">' +
             '<g id="hg-card' + i + '">' + card(s.mine) + '</g></g>';
    }).join('') +
    '</g></svg>';
  host.innerHTML = svg;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof gsap === 'undefined' || !('IntersectionObserver' in window)) return;

  /* Arrival order: within each side, the FARTHEST slot first. A card slides in
     along its own row and far-to-near means it passes empty slots, not landed
     ones. The two crossings that survive are covered by raising the flier to
     the front on start — painting order is the only depth cue an SVG has. */
  var indexed = SLOTS.map(function (s, i) { return { i: i, s: s }; });
  function byFar(side) {
    return indexed.filter(function (o) { return o.s.mine === side; })
      .sort(function (a, b) { return side ? b.s.col - a.s.col : a.s.col - b.s.col; });
  }
  var MINE = byFar(true), THEIRS = byFar(false);
  var ARRIVALS = MINE.reduce(function (list, m, k) {
    list.push(m);
    if (THEIRS[k]) list.push(THEIRS[k]);
    return list;
  }, []);

  /* Each card starts wholly off its own side of the source canvas, outside
     the viewBox crop, so nothing appears out of thin air inside the figure. */
  function startX(s) { return s.mine ? -(s.x + CARD_W + 80) : (W - s.x + 80); }

  function $(id) { return document.getElementById(id); }

  /* T_FIRST leaves room for the figure's own data-reveal to land first. */
  var T_FIRST = 1.0, STAGGER = 0.42, T_CARD = 0.6;

  var tl = gsap.timeline({ paused: true });
  SLOTS.forEach(function (s, i) {
    tl.set('#hg-card' + i, { x: startX(s), opacity: 0 }, 0);
  });
  ARRIVALS.forEach(function (o, k) {
    var at = T_FIRST + k * STAGGER;
    tl.to('#hg-card' + o.i, {
      x: 0, duration: T_CARD, ease: 'power3.out',
      onStart: function () { $('hg-grid').appendChild($('hg-slot' + o.i)); },
    }, at);
    /* A third of the travel, not all of it: power3.out puts a card within its
       own width of its slot in the first third, so a fade spread over the
       whole tween would have it arrive still see-through. */
    tl.to('#hg-card' + o.i, { opacity: 1, duration: T_CARD * 0.34, ease: 'none' }, at);
  });
  /* Render the opening state now, or the paused timeline would leave the
     resting grid on screen until the first play. */
  tl.progress(1).progress(0);

  /* Same geometry as scroll.js's row observer: play on arrival, reset on the
     way out so scrolling back replays it, like every other row on the page. */
  var watch = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) tl.play(0);
      else tl.pause(0);
    });
  }, { rootMargin: '0px 0px -22% 0px', threshold: 0.18 });
  watch.observe(host.closest('.point') || host);
})();
