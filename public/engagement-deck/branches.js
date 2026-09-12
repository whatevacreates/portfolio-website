/* ============================================================
   Section 5, point 02 — one course, three routes, and a learner
   walking them.

   The mark is the static three-paths figure redrawn live: a dot
   sets out from the course, rides the trunk to the fork, and
   chooses the first branch — then the second, then the third —
   the chosen route inking itself in its end-dot's colour as it
   is travelled, and letting go as the next choice begins. That
   is the point's whole copy acted out: delivery that routes each
   learner differently.

   The DOM's resting state is the finished mark (all three routes
   drawn, traveller hidden), so with no GSAP, or under reduced
   motion, the point still shows its poster.
   ============================================================ */
(function () {
  var host = document.querySelector('.branches');
  if (!host) return;

  /* Geometry on the old PNG's canvas: trunk from the course dot to the fork,
     three cubic routes off it, end dots in the mark's own periwinkle ramp. */
  var START = [46, 120], FORK = [240, 120];
  var ROUTES = [
    { c1: [340, 120], c2: [452, 40],  end: [552, 40],  color: '#8f9ce0' },
    { c1: [340, 120], c2: [452, 120], end: [552, 120], color: '#8e83cf' },
    { c1: [340, 120], c2: [452, 200], end: [552, 200], color: '#7a6ec4' },
  ];
  var IDLE = '#cdd1ec';

  function d(r) {
    return 'M' + FORK + ' C' + r.c1 + ' ' + r.c2 + ' ' + r.end;
  }
  host.innerHTML =
    '<svg viewBox="0 0 600 240" preserveAspectRatio="xMinYMid meet" role="img"' +
    ' aria-label="One course routing each learner down a different branch">' +
    '<path d="M' + START + ' L' + FORK + '" fill="none" stroke="' + IDLE + '" stroke-width="9" stroke-linecap="round"/>' +
    ROUTES.map(function (r, i) {
      return '<path id="br-route' + i + '" d="' + d(r) + '" fill="none" stroke="' + IDLE + '" stroke-width="9" stroke-linecap="round"/>';
    }).join('') +
    '<circle cx="' + START[0] + '" cy="' + START[1] + '" r="13" fill="#5f5a85"/>' +
    ROUTES.map(function (r, i) {
      return '<circle id="br-end' + i + '" cx="' + r.end[0] + '" cy="' + r.end[1] + '" r="13" fill="' + r.color + '"/>';
    }).join('') +
    '<circle id="br-walker" cx="' + START[0] + '" cy="' + START[1] + '" r="11" fill="#5f5a85" opacity="0"/>' +
    '</svg>';

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof gsap === 'undefined' || !('IntersectionObserver' in window)) return;

  function $(id) { return document.getElementById(id); }
  var walker = $('br-walker');

  function lerp(a, b, t) { return a + (b - a) * t; }
  function cubic(p0, c1, c2, p1, t) {
    var u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
      u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
    ];
  }
  function put(p) { walker.setAttribute('cx', p[0]); walker.setAttribute('cy', p[1]); }

  /* One choice: out along the trunk, then down the route while it inks
     itself; the end dot answers, and the route lets go for the next run. */
  var tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.5 });
  ROUTES.forEach(function (r, i) {
    var t0 = i * 2.5;
    var trunk = { t: 0 }, route = { t: 0 };
    tl.set(walker, { attr: { cx: START[0], cy: START[1] } }, t0);
    tl.to(walker, { opacity: 1, duration: 0.2 }, t0);
    tl.to(trunk, {
      t: 1, duration: 0.45, ease: 'power1.in',
      onUpdate: function () { put([lerp(START[0], FORK[0], trunk.t), START[1]]); },
    }, t0 + 0.1);
    tl.to(route, {
      t: 1, duration: 0.85, ease: 'power1.out',
      onUpdate: function () { put(cubic(FORK, r.c1, r.c2, r.end, route.t)); },
    }, t0 + 0.55);
    tl.to('#br-route' + i, { attr: { stroke: r.color }, duration: 0.5 }, t0 + 0.55);
    tl.to('#br-end' + i, {
      scale: 1.35, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1,
      transformOrigin: '50% 50%',
    }, t0 + 1.3);
    tl.to(walker, { opacity: 0, duration: 0.25 }, t0 + 1.7);
    tl.to('#br-route' + i, { attr: { stroke: IDLE }, duration: 0.4 }, t0 + 1.9);
  });

  /* Same geometry as scroll.js's row observer: run while the row is on
     screen, restart from the first choice whenever it returns. */
  var watch = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) tl.play(0);
      else tl.pause(0);
    });
  }, { rootMargin: '0px 0px -22% 0px', threshold: 0.18 });
  watch.observe(host.closest('.point') || host);
})();
