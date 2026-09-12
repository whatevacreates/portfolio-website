/* Pharos rolls out as his section arrives — a short settle now, not a
   descent. Two custom properties, both 0 to 1 across the approach: --p is
   the drop, --r trails it and only starts once the landing has settled.
   All the geometry (where he rests, how far he rolls, the beam's diagonal)
   is CSS in deck.css; this file only scrubs the two values off the scroll.
   Scrub back and he pulls the ray in and rolls up again. */
(function () {
  var fig = document.querySelector('.pharos');
  if (!fig) return;

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  /* Out fast, settling slow — a thing on a cord does not arrive linearly. */
  function ease(p) { return 1 - Math.pow(1 - p, 3); }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    /* No roll-out: he stands landed with the ray thrown — the poster, the
       same resting state every other module keeps. */
    fig.style.setProperty('--p', 1);
    fig.style.setProperty('--r', 1);
    return;
  }

  var shownP = -1, shownR = -1;
  function render() {
    var box = fig.getBoundingClientRect();
    /* He is fully out by the time his own box is a third of the way up the
       screen, so he is standing before the stats he lights are read. */
    var p = clamp((innerHeight * .92 - box.top) / (innerHeight * .5));
    var v = Math.round(ease(p) * 1000) / 1000;
    /* The throw waits for the drop: by p = .55 the eased landing is all but
       done, and the beam gets the last stretch of the approach to itself. */
    var r = Math.round(ease(clamp((p - .55) / .35)) * 1000) / 1000;
    if (v === shownP && r === shownR) return;
    shownP = v; shownR = r;
    fig.style.setProperty('--p', v);
    fig.style.setProperty('--r', r);
  }

  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; render(); });
  }, { passive: true });
  addEventListener('resize', render, { passive: true });
  render();
  /* New Spirit landing reflows the copy above the grid, which moves the
     figure — re-measure once the fonts are in. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);

  window.__pharos = { at: function (v) {
    fig.style.setProperty('--p', v);
    fig.style.setProperty('--r', v);
  } };
})();
