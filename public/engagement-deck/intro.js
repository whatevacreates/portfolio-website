/* ============================================================
   Deck 01 - the cover collision.

   The page opens already composed, with LMS centred and nothing
   else moving. The collision plays itself, once, with the page
   held still. Scroll away and back to the top and the old word
   returns - but only briefly: it is allowed a moment on screen
   and then it is smashed again. It never gets to stay.

   Everything is measured in pixels off the real boxes, so the
   contact lands where it looks like it does at any width, and
   mobile runs the same collision with the title simply set on
   two lines.
   ============================================================ */
(function () {
  var root = document.documentElement;
  var stage = document.querySelector('.crash');
  if (!stage || typeof gsap === 'undefined') { root.classList.remove('intro', 'locked'); return; }

  var old = document.querySelector('.crash-old');
  var glyphs = document.querySelectorAll('.crash-old span');
  var title = document.querySelector('.crash-new');
  var ghosts = document.querySelectorAll('.crash-ghost');
  var words = document.querySelectorAll('.cover-sub .w > i');
  var cover = document.querySelector('.cover');

  /* How the old word is allowed to come back: rushed in reverse, held for a
     beat, then hit again - harder and faster than the first time. Measured end
     to end (word re-entering → word gone again) this keeps it on screen for
     about 1.7s, inside the two seconds it is allowed. */
  var RETURN_RATE = 3.2;   /* rewind speed */
  var RETURN_HOLD = 0.35;  /* how long it is left standing */
  var REPLAY_RATE = 1.35;  /* the second hit is quicker than the first */

  function settle() {
    gsap.set([old, ghosts], { autoAlpha: 0 });
    gsap.set(words, { y: 0, yPercent: 0 });
    gsap.set('.cover-sub', { autoAlpha: 1 });
    root.classList.remove('intro', 'locked');
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { settle(); return; }

  /* document.fonts.ready resolves once nothing is *pending* - which, with
     font-display:swap, can be before New Spirit has even been requested. The
     title then measures in the fallback face (827px instead of 1171px here) and
     its start position lands short, leaving a sliver on screen. Ask for the
     face by name first, then measure. */
  var faceReady = (document.fonts && document.fonts.load)
    ? Promise.all([
        document.fonts.load('400 120px "New Spirit"'),
        document.fonts.load('400 24px Inter')
      ]).then(function () { return document.fonts.ready; })
       .catch(function () { return null; })
    : Promise.resolve();
  faceReady.then(build);

  function build() {
    scrollTo(0, 0);

    /* Measured without disturbing anything: read the rect, subtract whatever x
       the element is already carrying. */
    var M = {};
    function restEdge(el, side) {
      var x = parseFloat(gsap.getProperty(el, 'x')) || 0;
      return el.getBoundingClientRect()[side] - x;
    }
    function measure() {
      var vw = innerWidth;
      var titleRight = restEdge(title, 'right');
      var wordLeft = restEdge(glyphs[0], 'left');
      /* LMS sits dead centre - it is the whole cover until it is hit */
      var bearing = parseFloat(getComputedStyle(old).fontSize) * 0.055;
      M.contact = Math.min(-40, wordLeft - titleRight + bearing);
      M.push = -M.contact;
      M.start = -(titleRight + 40);
      M.clear = (vw - wordLeft) + 90;
    }
    measure();
    addEventListener('resize', function () { measure(); tl.invalidate(); }, { passive: true });
    /* belt and braces: if anything settled after first paint, re-place the
       title before the collision starts */
    addEventListener('load', function () {
      if (tl.progress() === 0 && !tl.isActive()) {
        measure(); tl.invalidate();
        gsap.set([title, ghosts], { x: M.start });
      }
    });

    gsap.set([title, ghosts], { x: M.start, skewX: 13, autoAlpha: 1 });
    gsap.set(ghosts, { opacity: 0 });
    gsap.set(glyphs, { transformOrigin: '50% 100%' });
    gsap.set(words, { y: 0, yPercent: 108 });
    gsap.set('.cover-sub', { autoAlpha: 1 });
    root.classList.remove('intro');

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

    gsap.delayedCall(0.7, function () { tl.play(); });

    /* ---- the comeback, on its short leash ---------------------------- */
    var settled = false, cycling = false, armed = false;

    function done() {
      settled = true; cycling = false;
      tl.timeScale(1);
      root.classList.remove('locked');
    }

    function smashAgain() {
      gsap.delayedCall(RETURN_HOLD, function () { tl.timeScale(REPLAY_RATE).play(); });
    }
    tl.eventCallback('onReverseComplete', smashAgain);

    function comeback() {
      if (!settled || cycling) return;
      cycling = true;
      tl.timeScale(RETURN_RATE).reverse();   /* LMS rushes back… */
    }                                        /* …then onReverseComplete hits it */

    addEventListener('scroll', function () {
      if (scrollY > 140) armed = true;             /* they left the cover */
      else if (scrollY <= 40 && armed) { armed = false; comeback(); }
    }, { passive: true });
  }
})();
