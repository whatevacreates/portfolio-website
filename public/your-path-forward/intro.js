/* ============================================================
   The hero collision, borrowed from ../ahead-of-ai/intro.js.

   BEHIND? holds the hero until AHEAD. arrives and shoves it off
   the page, and the line underneath rises once the hit lands.
   Scroll away and back to the top and the old word returns, but
   only for a beat before it is hit again. It never gets to stay.

   Everything is measured off the real boxes, so the contact
   lands where it looks like it does at any width.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var stage = document.querySelector('.crash');
  if (!stage || typeof gsap === 'undefined') { return; }

  var old = document.querySelector('.crash-old');
  var glyphs = document.querySelectorAll('.crash-old span');
  var title = document.querySelector('.crash-new');
  var ghosts = document.querySelectorAll('.crash-ghost');
  var words = document.querySelectorAll('.hero-sub .w > i');

  /* How the old word is allowed to come back: rushed in reverse, held for a
     beat, then hit again, harder and faster than the first time. */
  var RETURN_RATE = 3.2;
  var RETURN_HOLD = 0.35;
  var REPLAY_RATE = 1.35;
  var COMEBACK_ARM_PX = 140;
  var COMEBACK_FIRE_PX = 40;

  /* Reduced motion keeps the finished state, so BEHIND? never comes on. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

  /* document.fonts.ready resolves once nothing is pending, which with
     font-display:swap can be before New Spirit has been requested at all. The
     title then measures in the fallback face and its start position lands
     short, leaving a sliver on screen. Ask for the face by name, then measure. */
  var faceReady = (document.fonts && document.fonts.load)
    ? Promise.all([
        document.fonts.load('400 120px "New Spirit"'),
        document.fonts.load('400 24px Inter')
      ]).then(function () { return document.fonts.ready; })
       .catch(function () { return null; })
    : Promise.resolve();
  faceReady.then(build);

  function build() {
    var M = {};

    /* Measured without disturbing anything: read the rect, subtract whatever x
       the element is already carrying. */
    function restEdge(el, side) {
      var x = parseFloat(gsap.getProperty(el, 'x')) || 0;
      return el.getBoundingClientRect()[side] - x;
    }
    function measure() {
      var titleRight = restEdge(title, 'right');
      var wordLeft = restEdge(glyphs[0], 'left');
      var bearing = parseFloat(getComputedStyle(old).fontSize) * 0.055;
      M.contact = Math.min(-40, wordLeft - titleRight + bearing);
      M.push = -M.contact;
      M.start = -(titleRight + 40);
      M.clear = (innerWidth - wordLeft) + 90;
    }
    measure();

    gsap.set([title, ghosts], { x: M.start, skewX: 13, autoAlpha: 1 });
    gsap.set(ghosts, { opacity: 0 });
    gsap.set(glyphs, { transformOrigin: '50% 100%' });
    gsap.set(words, { y: 0, yPercent: 108 });
    root.classList.add('crash-live');

    /* Being shoved, the word resists: takes the load, grinds, slips, catches,
       goes. One profile drives the title and the letters, so contact is rigid. */
    var GRIND = [
      { f: 0.05, d: 0.10, e: 'power2.out' },
      { f: 0.07, d: 0.07, e: 'none' },
      { f: 0.33, d: 0.13, e: 'power1.out' },
      { f: 0.37, d: 0.06, e: 'none' },
      { f: 0.72, d: 0.15, e: 'power1.out' },
      { f: 1.00, d: 0.11, e: 'none' }
    ];
    var JUDDER = [2.4, -1.6, 1.8, -1, 0.7, 0];

    var tl = gsap.timeline({ paused: true, onComplete: done });
    window.__intro = tl;

    tl.to(ghosts, { opacity: function (i) { return i ? 0.09 : 0.17; }, duration: 0.1 }, 0)
      .to(title, { x: function () { return M.contact; }, skewX: 3, duration: 0.44, ease: 'power1.out' }, 0)
      .to(ghosts, { x: function () { return M.contact; }, skewX: 3, opacity: 0,
                    duration: 0.6, stagger: 0.055, ease: 'power1.out' }, 0.02)

      .addLabel('hit', 0.44)
      .to(glyphs, {
        keyframes: GRIND.map(function (k, i) {
          return { x: function () { return M.push * k.f; }, y: JUDDER[i], duration: k.d, ease: k.e };
        }),
        stagger: 0.035
      }, 'hit')
      .to(title, {
        keyframes: GRIND.map(function (k) {
          return { x: function () { return M.contact + M.push * k.f; }, duration: k.d, ease: k.e };
        })
      }, 'hit')

      .to(glyphs, {
        x: function (i) { return M.clear + i * 34; },
        rotation: function (i) { return 1.1 + i * 0.8; },
        duration: 0.72, stagger: 0.035, ease: 'power2.out'
      }, 'hit+=0.62')
      .to(glyphs, { autoAlpha: 0, duration: 0.28 }, 'hit+=1.1')

      .to(title, { skewX: 0, duration: 0.3, ease: 'power2.out' }, 'hit+=0.5')
      .to(words, { yPercent: 0, duration: 0.72, stagger: 0.055, ease: 'power3.out' }, 'hit+=0.72');

    addEventListener('resize', function () { measure(); tl.invalidate(); }, { passive: true });
    /* Belt and braces: if anything settled after first paint, re-place the
       title before the collision starts. */
    addEventListener('load', function () {
      if (tl.progress() === 0 && !tl.isActive()) {
        measure(); tl.invalidate();
        gsap.set([title, ghosts], { x: M.start });
      }
    });

    gsap.delayedCall(0.7, function () { tl.play(); });

    /* ---- the comeback, on its short leash ----------------------------
       Armed when the hero has fully left the viewport and fired when it is
       fully back, rather than off two scroll thresholds: the thresholds
       raced the timeline, so a reader who scrolled during the first
       collision armed the trigger and then never fired it. */
    var cycling = false, armed = false;

    function done() { cycling = false; tl.timeScale(1); }

    tl.eventCallback('onReverseComplete', function () {
      gsap.delayedCall(RETURN_HOLD, function () { tl.timeScale(REPLAY_RATE).play(); });
    });

    /* Guarded on the timeline's own state rather than a flag set from
       onComplete: the flag could be missed, and then the comeback never
       fired again for the rest of the visit. */
    function comeback() {
      if (cycling || tl.isActive() || tl.progress() < 1) return;
      cycling = true;
      tl.timeScale(RETURN_RATE).reverse();   /* behind? rushes back... */
    }                                        /* ...then onReverseComplete hits it */

    /* Both triggers run: the observer is the accurate one, the scroll
       thresholds are the backstop. comeback() guards itself, so whichever
       arrives first wins and the second is a no-op. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var entry = entries[0];
        if (!entry.isIntersecting) { armed = true; return; }
        if (entry.intersectionRatio >= 0.99 && armed) { armed = false; comeback(); }
      }, { threshold: [0, 0.99] }).observe(stage);
    }

    addEventListener('scroll', function () {
      if (scrollY > COMEBACK_ARM_PX) { armed = true; return; }
      if (scrollY <= COMEBACK_FIRE_PX && armed) { armed = false; comeback(); }
    }, { passive: true });
  }
})();
