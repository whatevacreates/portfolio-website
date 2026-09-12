/* ============================================================
   Section 3 - the headline lands, then Olé walks it.

   The plates still drop into place, but Olé's travel is tied to
   scroll progress. His two feet alternate through a real gait:
   one swings forward while the other is planted. Reversing the
   scroll turns him around and walks him back to the left.
   ============================================================ */
(function () {
  var sec = document.querySelector('.teach');
  if (!sec || typeof gsap === 'undefined') return;

  var head = sec.querySelector('.teach-head');
  var plates = sec.querySelectorAll('.plate');
  var walk = sec.querySelector('.ole-walk');
  var rig = sec.querySelector('#t-ole-svg');
  var footLeft = sec.querySelector('#t-foot-left');
  var footRight = sec.querySelector('#t-foot-right');
  if (!head || !plates.length || !walk || !rig || !footLeft || !footRight) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var metrics = null;
  var started = false;
  var direction = 1;
  var shownDirection = 0;
  var lastScrollY = scrollY;
  var ticking = false;
  var setWalkX = gsap.quickSetter(walk, 'x', 'px');
  var setWalkY = gsap.quickSetter(walk, 'y', 'px');

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function measure() {
    var first = plates[0].getBoundingClientRect();
    var host = walk.offsetParent.getBoundingClientRect();
    var width = walk.offsetWidth;
    /* Olé enters at the centre of the first line, then walks toward its end.
       Reverse scrolling turns him around and returns him to that midpoint. */
    var startX = first.left - host.left + (first.width - width) / 2;
    var endX = first.right - host.left - 20 - width;

    metrics = {
      startX: startX,
      endX: Math.max(startX, endX),
      topY: first.top - host.top - walk.offsetHeight
    };
    setWalkY(metrics.topY);
  }

  function progress() {
    var r = head.getBoundingClientRect();
    var start = innerHeight * 0.64;
    var end = innerHeight * 0.08;
    return clamp01((start - r.top) / (start - end));
  }

  function setFoot(el, x, lift, turn, pivotX) {
    el.setAttribute('transform',
      'translate(' + x.toFixed(2) + ' ' + (-lift).toFixed(2) + ') ' +
      'rotate(' + turn.toFixed(2) + ' ' + pivotX + ' 711)');
  }

  function drawFeet(p) {
    if (reduced) {
      footLeft.removeAttribute('transform');
      footRight.removeAttribute('transform');
      return;
    }

    /* Fit a whole number of strides onto the plate so both ends are stable.
       The phase starts at a grounded, split stance rather than in mid-air. */
    var distance = metrics.endX - metrics.startX;
    var cycles = Math.max(5, Math.round(distance / 80));
    var phase = Math.PI / 2 + p * cycles * Math.PI * 2;
    var swing = Math.sin(phase);
    var velocity = Math.cos(phase) * direction;
    var stride = 26;
    var lift = 17;

    setFoot(footLeft, stride * swing, lift * Math.max(0, velocity), -8 * velocity, 143.5);
    setFoot(footRight, -stride * swing, lift * Math.max(0, -velocity), 8 * velocity, 210.2);
  }

  function face(dir, instant) {
    if (dir === shownDirection) return;
    shownDirection = dir;
    gsap.killTweensOf(rig);
    gsap.to(rig, {
      scaleX: dir,
      duration: instant || reduced ? 0 : 0.16,
      ease: 'power2.out',
      transformOrigin: '50% 100%'
    });
  }

  function render(instant) {
    ticking = false;
    if (!started) return;
    if (!metrics) measure();

    var p = progress();
    var x = metrics.startX + (metrics.endX - metrics.startX) * p;
    face(direction, instant);
    setWalkX(x);
    drawFeet(p);
  }

  function requestRender() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  function reveal() {
    if (reduced) {
      gsap.set(plates, { clearProps: 'all' });
      gsap.set(walk, { autoAlpha: 1 });
      return;
    }

    gsap.timeline()
      .from(plates[0], {
        x: -120, y: -190, rotation: -7, autoAlpha: 0,
        duration: 0.62, ease: 'power3.out'
      }, 0)
      .from(plates[1], {
        x: 140, y: -210, rotation: 6, autoAlpha: 0,
        duration: 0.62, ease: 'power3.out'
      }, 0.16)
      .to(plates[0], { y: 0, duration: 0.34, ease: 'bounce.out' }, 0.62)
      .to(plates[1], { y: 0, duration: 0.34, ease: 'bounce.out' }, 0.78)
      .to(walk, { autoAlpha: 1, duration: 0.2 }, 0.88);
  }

  function start() {
    if (started) return;
    started = true;
    measure();
    gsap.set(walk, { autoAlpha: 0 });
    face(direction, true);
    render(true);
    reveal();
  }

  var ready = document.fonts && document.fonts.load
    ? document.fonts.load('400 40px "New Spirit"').catch(function () {})
    : Promise.resolve();

  new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      ready.then(start);
      obs.disconnect();
    });
  }, { threshold: 0.24 }).observe(head);

  addEventListener('scroll', function () {
    var nextY = scrollY;
    if (nextY > lastScrollY + 1) direction = 1;
    else if (nextY < lastScrollY - 1) direction = -1;
    lastScrollY = nextY;
    requestRender();
  }, { passive: true });

  addEventListener('resize', function () {
    metrics = null;
    requestRender();
  }, { passive: true });
})();
