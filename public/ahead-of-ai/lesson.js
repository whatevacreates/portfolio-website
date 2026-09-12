/* Scene B of the Harvard Way film, playing the way the film plays it.
 *
 * assets/exercises.js builds the activities; this is the film's camera,
 * ported from harvard-way-youtube-2026-08-20-v2/animation.html with the
 * landscape numbers: wide while a board fills, a push to 300% on the thing
 * that just changed, a hold long enough to read it, a pull back out, and a
 * race to the next board that dips as it crosses. The film ends its middle
 * on a hard cut to the celebration; here the page continues below, so the
 * sort earns its ending the other way — a pull back to the finished board,
 * a hold, and the loop.
 *
 * Driven by a clock, not the scroll. The section is the video embedded with
 * its white plate stripped away: it plays itself while it is on screen,
 * pauses off it, and the page scrolls past it freely.
 */
(function () {
  var stage = document.querySelector('.lesson-stage');
  var world = stage && stage.querySelector('.lesson-world');
  if (!stage || !world || typeof window.__buildExercises !== 'function' || !window.gsap) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The film's 16:9 frame. Every shot is computed in its units and the whole
     frame is scaled to the stage, so the deck shows the film's composition
     exactly — smaller, not reframed. */
  var W = 1920, H = 1080;
  var UNIT = 760, EXK = 1.755;
  var ZOOM = 3.00;    // the close-up on an answer
  var ZBLOCK = 2.05;  // the close-up on a lane — a lane is wider
  var GAP_U = (H / EXK) * 0.75;

  /* The world is laid out at SS× and the camera scale divided back down, so
     the type is rastered at (at least) the size the close-up shows it. Scaled
     up from a 1× layout, the 300% shot was soft in every engine that keeps a
     transformed layer's raster — which is what a viewer is reading at the
     film's stillest moment. SS matches ZOOM: the composed scale never
     exceeds 1, so nothing is ever magnified from its raster. */
  var SS = (window.CSS && CSS.supports && CSS.supports('zoom', '2')) ? 3 : 1;

  /* The decision tree's clock: stage one fills and picks, the camera goes in
     on that pick and stays, comes back out, and only then does stage two
     arrive. The sort's: it fills, the camera visits one lane and moves level
     to the other, then pulls out to the whole finished board. A stage takes
     5.60s to fill: the question and its options need to be READ before the
     pick answers them, and at 3.90 they could only be skimmed. */
  var T0 = { pickDone: 5.60, span: 16.80 };
  var T1 = { filled: 5.60, span: 5.60 + 5.50 };
  var RACE = 0.85;   // one activity to the next
  var HOLD = 1.6;    // the finished board holds before the loop restarts

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  var eases = {};
  function easeOf(name) { return eases[name] || (eases[name] = gsap.parseEase(name || 'power2.inOut')); }
  var inOut4 = gsap.parseEase('power4.inOut');

  var acts = [];
  var total = 0;
  var ready = false;
  var zoomer = null;

  /* Everything lives inside one wrapper that carries the SS× zoom, so the
     whole coordinate space scales as one piece. The zoom lands AFTER layOut
     has measured, so every stored rect stays in 1× world units; paint() is
     the only place that has to know. position:relative so the slots keep the
     wrapper, not the world, as their containing block. */
  function build() {
    world.textContent = '';
    zoomer = document.createElement('div');
    zoomer.style.position = 'relative';
    world.appendChild(zoomer);
    acts = window.__buildExercises(UNIT).map(function (made) {
      var slot = document.createElement('div');
      slot.className = 'lesson-act';
      slot.appendChild(made.el);
      zoomer.appendChild(slot);
      made.slot = slot;
      return made;
    });
  }

  /* Where each activity sits, and where the camera looks when it is wide and
     when it is in close. Measured with the world at rest, so every rect is in
     world units; the film does the same. */
  function layOut() {
    world.style.transform = 'none';
    var y = 0;
    acts.forEach(function (ex) {
      ex.slot.style.top = y + 'px';
      ex.height = ex.el.offsetHeight;
      ex.top = y;
      ex.wide = { x: UNIT / 2, y: y + ex.height / 2, zoom: 1 };

      var rootRect = ex.el.getBoundingClientRect();
      var local = function (el) {
        var r = el.getBoundingClientRect();
        return { x: r.left - rootRect.left, y: y + (r.top - rootRect.top), w: r.width, h: r.height };
      };

      if (ex.payoff) {
        /* The close-up hangs the answer in the top left of the frame, so both
           lines of the payoff are under it and the shot reads without a pan. */
        ex.payoff.placeUnder(ex.answerEl, ex.el, 1);
        if (ex.wire) ex.wire();
        var ans = local(ex.answerEl);
        var line = local(ex.payoff.node);
        var halfW = (W / 2) / (EXK * ZOOM);
        var halfH = (H / 2) / (EXK * ZOOM);
        var close = { x: ans.x + halfW - 26, y: ans.y + halfH - 54, zoom: ZOOM };
        var need = (line.y + line.h + 30) - (close.y + halfH);
        if (need > 0) close.y += need;
        ex.shots = [
          { at: 0.00, x: ex.wide.x, y: ex.wide.y, zoom: 1 },
          { at: T0.pickDone, x: ex.wide.x, y: ex.wide.y, zoom: 1 },
          { at: T0.pickDone + 1.05, x: close.x, y: close.y, zoom: close.zoom, ease: 'power2.inOut' },
          { at: T0.pickDone + 4.15, x: close.x, y: close.y, zoom: close.zoom },
          { at: T0.pickDone + 5.15, x: ex.wide.x, y: ex.wide.y, zoom: 1, ease: 'power2.inOut' },
          { at: T0.span, x: ex.wide.x, y: ex.wide.y, zoom: 1 },
        ];
        /* Stage one, a hold while the camera is in close, then stage two gets
           the same time stage one had. */
        ex.fill = [
          [0.00, 0], [T0.pickDone, 0.44],
          [T0.pickDone + 5.15, 0.44],
          [T0.pickDone + 10.75, 1], [T0.span, 1],
        ];
        ex.span = T0.span;
      } else {
        /* The sort. One shot per lane, a level move between them — the lanes
           are a comparison — and then out to the whole board. */
        var halfHB = (H / 2) / (EXK * ZBLOCK);
        var marks = ex.blocks.map(function (el) {
          var b = local(el);
          return { x: b.x + b.w / 2, y: b.y + b.h / 2 - halfHB * 0.10, zoom: ZBLOCK };
        });
        ex.shots = [
          { at: 0.00, x: ex.wide.x, y: ex.wide.y, zoom: 1 },
          { at: T1.filled, x: ex.wide.x, y: ex.wide.y, zoom: 1 },
          { at: T1.filled + 1.00, x: marks[0].x, y: marks[0].y, zoom: ZBLOCK, ease: 'power2.inOut' },
          { at: T1.filled + 1.90, x: marks[0].x, y: marks[0].y, zoom: ZBLOCK },
          { at: T1.filled + 3.00, x: marks[1].x, y: marks[1].y, zoom: ZBLOCK, ease: 'power2.inOut' },
          { at: T1.filled + 3.90, x: marks[1].x, y: marks[1].y, zoom: ZBLOCK },
          { at: T1.filled + 4.90, x: ex.wide.x, y: ex.wide.y, zoom: 1, ease: 'power2.inOut' },
          { at: T1.span, x: ex.wide.x, y: ex.wide.y, zoom: 1 },
        ];
        ex.fill = [[0.00, 0], [T1.filled, 1], [T1.span, 1]];
        ex.span = T1.span;
      }
      y += ex.height + GAP_U;
    });

    acts.forEach(function (ex, i) {
      ex.start = i === 0 ? 0 : acts[i - 1].start + acts[i - 1].span + RACE;
    });
    var last = acts[acts.length - 1];
    total = last.start + last.span + HOLD;
  }

  /* Keyframe walk: every mark carries the ease used to reach it. */
  function sample(marks, tau) {
    if (tau <= marks[0].at) return marks[0];
    for (var i = 1; i < marks.length; i += 1) {
      var b = marks[i];
      if (tau > b.at) continue;
      var a = marks[i - 1];
      var q = easeOf(b.ease)((tau - a.at) / (b.at - a.at));
      return {
        x: a.x + (b.x - a.x) * q,
        y: a.y + (b.y - a.y) * q,
        zoom: a.zoom + (b.zoom - a.zoom) * q,
      };
    }
    return marks[marks.length - 1];
  }

  /* A piecewise-linear map from an activity's own time to its progress, so it
     can hold while the camera is elsewhere. */
  function walk(pairs, tau) {
    if (tau <= pairs[0][0]) return pairs[0][1];
    for (var i = 1; i < pairs.length; i += 1) {
      if (tau > pairs[i][0]) continue;
      var a = pairs[i - 1], b = pairs[i];
      return a[1] + (b[1] - a[1]) * ((tau - a[0]) / (b[0] - a[0]));
    }
    return pairs[pairs.length - 1][1];
  }

  function camera(t) {
    var i = 0;
    for (var k = 0; k < acts.length; k += 1) if (t >= acts[k].start) i = k;
    var ex = acts[i];
    var tau = t - ex.start;
    var here = sample(ex.shots, tau);
    if (i < acts.length - 1 && tau > ex.span) {
      var next = acts[i + 1];
      var q = inOut4(clamp01((tau - ex.span) / RACE));
      return {
        x: here.x + (next.wide.x - here.x) * q,
        y: here.y + (next.wide.y - here.y) * q,
        zoom: 1 - 0.12 * Math.sin(Math.PI * q),
      };
    }
    return here;
  }

  /* How far into a close-up the camera is, for the dimming and the payoff:
     zoom 1 is wide, ZOOM is all the way in. */
  function closeness(ex, tau) { return clamp01((sample(ex.shots, tau).zoom - 1) / (ZOOM - 1)); }

  function paint(t) {
    if (!acts.length) return;
    var stageW = stage.clientWidth, stageH = stage.clientHeight;
    var F = stageW / W;
    var cam = camera(t);
    var k = F * EXK * cam.zoom;
    /* The world's content is SS× its measured size, so the scale comes back
       down by SS and the pan out to the (zoomed) pixel the camera wants. */
    world.style.transform =
      'translate(' + (stageW / 2).toFixed(2) + 'px,' + (stageH / 2).toFixed(2) + 'px) ' +
      'scale(' + (k / SS).toFixed(5) + ') ' +
      'translate(' + (-cam.x * SS).toFixed(2) + 'px,' + (-cam.y * SS).toFixed(2) + 'px)';

    acts.forEach(function (ex) {
      var tau = t - ex.start;
      ex.solve(walk(ex.fill, tau));
      var z = closeness(ex, tau);
      /* The dimming runs ahead of the camera: the one thing a close-up must
         not contain is the next question. */
      if (ex.dim) ex.dim(clamp01(z * 1.7));
      if (ex.payoff) ex.payoff.play(clamp01((tau - (T0.pickDone + 0.75)) / 1.60), 1.60, z);
    });
  }

  /* ── the clock ── */
  var t = 0, playing = false, raf = 0, last = 0;

  function frame(now) {
    raf = 0;
    t += Math.min(0.05, (now - last) / 1000);
    last = now;
    if (t >= total) t -= total;
    paint(t);
    if (playing) raf = requestAnimationFrame(frame);
  }
  function play() {
    if (playing || !ready) return;
    playing = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    playing = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* The activities are type-heavy: nothing is measured, and no frame is
     drawn, until the display face is in. */
  function start() {
    build();
    layOut();
    zoomer.style.zoom = SS;
    ready = true;
    if (reduced) { paint(total - HOLD); return; }
    paint(0);
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) play(); else pause(); });
    }, { threshold: 0.25 }).observe(stage);
    addEventListener('resize', function () { if (!playing) paint(t); }, { passive: true });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else start();

  window.__lesson = { seek: function (at) { pause(); t = at; paint(at); }, get total() { return total; } };
})();
