/* The passage into the close, built from the top star in the Scholé logo.
 *
 * One star, one size — the small one you see at the top — repeated on a
 * lattice that closes as it descends. Each gap between two rows is a step
 * smaller than the gap above it, and the spacing along the rows steps down
 * with it, so the field thickens row after row until it is the ground.
 *
 * The first row is left open and the next two are irregularly thinned. After
 * that, nothing is turned or moved: every star stays upright and the whole
 * band is drawn once at full strength. It is a printed pattern, not an
 * animation. The page moves past it.
 */
(function () {
  var bridge = document.querySelector('.star-bridge');
  var field = bridge && bridge.querySelector('.star-field');
  if (!bridge || !field) return;

  var NS = 'http://www.w3.org/2000/svg';

  /* Each row sits this much closer to its neighbour than the row above it did.
     A slow figure: the gaps step down by a twentieth at a time, so the field
     thickens the way a halftone does rather than in visible stages. */
  var DECAY = 1.05;
  /* Where the first row sits, so it is not cut by the top edge. */
  var TOP = .045;
  /* Star width, in pixels against the viewport. It never changes down the band
     — the field thickens by the spacing closing, never by the star growing —
     and it is deliberately not tied to the band's height, so the band can be
     given the room a slow decay needs without the star growing with it. */
  var STAR_MIN = 8;
  var STAR_MAX = 14;
  var STAR_VW = .0095;
  /* The band has to be solid for this much of it before its bottom edge, or the
     footer's own top edge is what you see. Measured in star heights, budgeted
     out of the band before the open run gets any — never a fraction of the
     band, which is how it came to end before the lace had shut.
     Three star heights is where the pixels go to zero light; this is that with
     margin. Do not trust arithmetic here — a star with thin arms covers far
     less of its own box than it looks like it does, and the rows only overlap
     in two phases, so the last holes are columns that no amount of stacking
     fills. Measure it: scratchpad/bridge/at.mjs reads the pixels. */
  var SOLID_TAIL = 3.5;
  /* Once they have merged, no row below is legible as a row, and carrying a
     twentieth-at-a-time on from there would spend the rest of the band creeping
     towards a spacing it never reaches. The close is taken at a brisker step —
     it is the lace shutting, not the pattern, and it is over in six rows. */
  var CLOSE_DECAY = 1.28;
  /* Two floors, reached below the line where no row is legible as a row. A star
     with concave sides does not tile — the holes between four of them shrink
     with the spacing but never vanish — so these are how fine the lace gets,
     and they have to be fine enough that the rows below them close it outright.
     There is nothing laid in behind to help: the solid at the foot of the band
     is stars, all the way down, which is the only way it meets the footer
     without an edge. */
  var MIN_GAP = .25;   /* of a star's height */
  var MIN_PITCH = .45; /* of a star's width  */

  var cols = 0;

  function mix(a, b, amount) {
    function part(hex, at) { return parseInt(hex.slice(at, at + 2), 16); }
    function hex(value) { return Math.round(value).toString(16).padStart(2, '0'); }
    var t = Math.max(0, Math.min(1, amount));
    return '#' +
      hex(part(a, 1) + (part(b, 1) - part(a, 1)) * t) +
      hex(part(a, 3) + (part(b, 3) - part(a, 3)) * t) +
      hex(part(a, 5) + (part(b, 5) - part(a, 5)) * t);
  }

  function build() {
    field.textContent = '';
    cols = 0;

    var width = bridge.clientWidth || 1;
    var height = bridge.clientHeight || 1;
    var star = Math.max(STAR_MIN, Math.min(STAR_MAX, width * STAR_VW));
    var starH = star * (116 / 108);

    function place(x, y) {
      var svg = document.createElementNS(NS, 'svg');
      var use = document.createElementNS(NS, 'use');
      svg.setAttribute('viewBox', '76 0 108 116');
      svg.setAttribute('class', 'star-dot');
      svg.style.left = (x * 100).toFixed(3) + '%';
      svg.style.top = (y * 100).toFixed(3) + '%';
      svg.style.width = star.toFixed(2) + 'px';
      svg.style.setProperty('--star-color', mix('#6e7bb0', '#997ac9', x));
      use.setAttribute('href', '#i-star');
      svg.appendChild(use);
      field.appendChild(svg);
      cols++;
    }

    /* Budget the band from the bottom up, so the close always completes inside
       it whatever height it is given.
       The close is a run from a star's height down to the floor at CLOSE_DECAY,
       which is worth this much: */
    var closeSpan = starH * (1 - Math.pow(1 / CLOSE_DECAY,
      Math.log(1 / MIN_GAP) / Math.log(CLOSE_DECAY))) / (1 - 1 / CLOSE_DECAY);
    /* and under that, the depth that has to come out solid: */
    var solidSpan = starH * SOLID_TAIL;
    /* What is left is the open run — the part anyone actually reads as a
       pattern. A run stepping down by DECAY from `g` to a star's height is
       worth `(g - starH) * DECAY / (DECAY - 1)`, so this is the first gap that
       spends exactly that much band and no more. */
    var openSpan = Math.max(0, height * (1 - TOP) - closeSpan - solidSpan);
    var gap = starH + openSpan * (DECAY - 1) / DECAY;
    /* And this is the spacing along the first row that closes at the same row
       the gaps do, so the pattern reaches the ground from both directions at
       once: the rows merge when the gap is down to a star's height, the row
       closes when the spacing is down to two star widths. */
    var pitch = star * 2 * (gap / starH);
    var y = height * TOP;
    var row = 0;
    var merged = false;

    while (y < height + starH) {
      /* The spacing along the rows steps down in pairs, not row by row. Two
         rows a pitch apart interleave exactly — the second starts in the middle
         of the first one's gaps — and that only holds while they share a pitch.
         Shrink it every row and each row lands a little off the gap above it,
         further off the further along the row you look, and the field goes to
         moiré. */
      var pair = row % 2;
      var offset = pair ? pitch / 2 : 0;

      /* One pitch past each edge, so the pattern runs off the sides the way a
         tessellation should instead of stopping short of them. */
      for (var px = offset - pitch; px < width + pitch; px += pitch) {
        place(px / width, y / height);
      }

      /* The rows have merged: the pattern is finished and what is left is the
         lace between the stars, which shuts at CLOSE_DECAY. */
      if (!merged && gap <= starH && pitch <= star * 2) merged = true;

      y += gap;
      var step = merged ? CLOSE_DECAY : DECAY;
      gap = Math.max(starH * MIN_GAP, gap / step);
      if (pair) pitch = Math.max(star * MIN_PITCH, pitch / (step * step));
      row++;

    }
  }

  var lastWidth = 0;
  var pending = 0;
  function rebuild() {
    if (bridge.clientWidth === lastWidth) return;
    lastWidth = bridge.clientWidth;
    build();
  }
  /* Building the band is a few thousand elements and a few tens of a second's
     worth of milliseconds — once, which is fine, but a window drag fires resize
     on every frame of it. Wait for the drag to stop. */
  function scheduleRebuild() {
    clearTimeout(pending);
    pending = setTimeout(rebuild, 160);
  }

  addEventListener('resize', scheduleRebuild, { passive: true });
  build();
  lastWidth = bridge.clientWidth;

  /* Tuning handle: __stars.lattice reports what the current width drew. */
  window.__stars = {
    rebuild: build,
    get lattice() { return { stars: field.childElementCount }; }
  };
})();
