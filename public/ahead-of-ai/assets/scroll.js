/* ============================================================
   Scholé - sales deck scroll engine.
   Zero dependencies. Everything is driven off three things:
     [data-sec]     a full-height section, optionally data-bg="…"
     [data-reveal]  anything that should land when its section arrives
     [data-count]   a number that counts on arrival (optionally from data-from)
   ============================================================ */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Phones reveal per element, not per section. Stacked sections run many
     screens tall down there, so a section-sized trigger either never fires
     (12% of a six-screen section never fits the root) or fires while the
     copy is still screens away. Below 680px every reveal lands as IT
     arrives, once, and stays. */
  var coarse = matchMedia('(max-width: 680px)').matches;
  var secs = [].slice.call(document.querySelectorAll('[data-sec]'));
  var bgs = {};
  [].forEach.call(document.querySelectorAll('.bg i'), function (el) {
    bgs[el.dataset.bg] = el;
  });

  /* ---- split [data-words] into per-word masks before anything measures ---- */
  [].forEach.call(document.querySelectorAll('[data-words]'), function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (word, i) {
      var mask = document.createElement('span');
      var inner = document.createElement('i');
      mask.className = 'w';
      mask.style.setProperty('--i', i);
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---- stagger: each section's reveals fire in document order ---- */
  secs.forEach(function (sec) {
    var step = +(sec.dataset.step || 90);
    [].forEach.call(sec.querySelectorAll('[data-reveal], .plate, .draw, .bar'), function (el, i) {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', i * step + 'ms');
    });
  });

  /* ---- counters ---- */
  function count(el) {
    var to = parseFloat(el.dataset.count);
    var from = el.hasAttribute('data-from') ? parseFloat(el.dataset.from) : 0;
    var dur = +(el.dataset.dur || 1100);
    var dec = +(el.dataset.dec || 0);
    var pre = el.dataset.pre || '';
    var suf = el.dataset.suf || '';
    if (!isFinite(from)) from = 0;
    var fmt = function (v) {
      return pre + v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suf;
    };
    if (reduced) { el.textContent = fmt(to); return; }
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = fmt(from);
    requestAnimationFrame(step);
  }

  /* ---- arrival: reveals land on the way down and lift on the way back up,
          so scrolling in reverse plays the section backwards ---- */
  var arrive = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) e.target.classList.add('in');
      else if (!coarse) e.target.classList.remove('in');
      if (!e.isIntersecting || coarse) return;  /* phone counters ride the element watch */
      [].forEach.call(e.target.querySelectorAll('[data-count]'), function (n) {
        var run = function () { count(n); };
        if (n.dataset.done && !reduced) { run(); return; }   /* count again */
        n.dataset.done = '1';
        setTimeout(run, parseInt(n.style.getPropertyValue('--d')) || 0);
      });
    });
  }, coarse ? { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
            : { rootMargin: '0px 0px -22% 0px', threshold: 0.12 });
  secs.forEach(function (s) { arrive.observe(s); });

  /* ---- rows inside a section animate on their own arrival, so a long section
          makes its points one at a time rather than all at once ---- */
  var rows = [].slice.call(document.querySelectorAll('[data-row]'));
  var rowWatch = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) e.target.classList.add('in');
      else if (!coarse) e.target.classList.remove('in');
    });
  }, { rootMargin: '0px 0px -22% 0px', threshold: 0.18 });
  rows.forEach(function (el) {
    var step = +(el.dataset.step || 90);
    [].forEach.call(el.querySelectorAll('[data-reveal], .draw'), function (n, i) {
      if (!n.style.getPropertyValue('--d')) n.style.setProperty('--d', i * step + 'ms');
    });
    rowWatch.observe(el);
  });
  /* CSS hides unrevealed rows only when this matching observer is live. */
  if (rows.length) document.documentElement.classList.add('row-reveals');

  /* ---- the phone element watch: each reveal (and each word-split line)
          lands when its own box crosses the lower edge, one-shot. Counters
          fire here too, so a number counts when it is actually seen. ---- */
  if (coarse) {
    var landing = new IntersectionObserver(function (entries) {
      /* The section-order stagger is rewritten on arrival: an element seven
         deep in its section would otherwise sit on a second of dead delay.
         Elements landing in the same batch step 90ms apart instead. */
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var d = i++ * 90;
        e.target.style.setProperty('--d', d + 'ms');
        e.target.classList.add('in-view');
        [].forEach.call(e.target.querySelectorAll('[data-count]'), function (n) {
          if (n.dataset.done) return;
          n.dataset.done = '1';
          setTimeout(function () { count(n); }, d);
        });
        landing.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    [].forEach.call(document.querySelectorAll('[data-reveal], [data-words]'), function (el) {
      landing.observe(el);
    });
  }

  /* ---- the active section drives background + ink + dots ---- */
  var dots = [].slice.call(document.querySelectorAll('.dots a'));
  var markBR = document.querySelector('.mark-br');
  var current = null;

  function activate(sec) {
    if (sec === current) return;
    current = sec;
    var key = sec.dataset.bg;
    if (key && bgs[key]) {
      for (var k in bgs) bgs[k].classList.toggle('on', k === key);
    }
    document.documentElement.dataset.ink = sec.dataset.ink || 'dark';
    if (markBR) markBR.dataset.ink = sec.dataset.ink || 'dark';
    var i = secs.indexOf(sec);
    dots.forEach(function (d, j) { d.classList.toggle('on', j === i); });
  }

  /* The section holding the top of the viewport owns the background, so it only
     changes once the section above has scrolled clean off. Checked on the same
     rAF as the progress bar rather than by observer, which makes the handover
     exact instead of approximate. */
  function ownerAt() {
    var probe = innerHeight * 0.04;
    var pick = secs[0];
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) pick = secs[i];
    }
    return pick;
  }

  /* ---- top progress bar + any [data-parallax] drift ---- */
  var prog = document.querySelector('.progress');
  var floats = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;

  function frame() {
    ticking = false;
    activate(ownerAt());
    var max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    if (reduced) return;
    floats.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1 … 1
      el.style.transform = 'translate3d(0,' + (p * +el.dataset.parallax).toFixed(2) + 'px,0)';
    });
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  addEventListener('resize', frame, { passive: true });
  frame();
})();
