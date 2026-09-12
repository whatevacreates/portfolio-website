/* ============================================================
   Section 5, point 03 — the Ask Olé panel, playing one exchange.

   This is the product's own chat, not an illustration of one:
   every token is lifted from the app (frontend colors.css and
   ole-chat-panel.tsx) — the white rounded panel with its
   gray-lightest border, the "Ask Olé" header, Olé with his amber
   "Your tutor" badge, the periwinkle user bubble, the gray-subtle
   thinking bubble, the amber hint card, the input bar. Olé himself
   is the same rig section 3 walks across the page — one character,
   drawn once, everywhere.

   The exchange is the app's real hint flow: "Give me a hint" (one
   of the panel's actual suggestion chips) types into the input,
   sends, Olé thinks, and the hint card lands in the app's own
   format — "Hint — {competence}" then "💡 Try this: … For
   example: …".

   The DOM's resting state is the finished chat, so with no GSAP,
   or under reduced motion, the point still shows its poster. The
   panel is laid out at a fixed 400px design width and scaled to
   the column, so the type never reflows — it only shrinks, like a
   screenshot would.
   ============================================================ */
(function () {
  var host = document.querySelector('.olechat');
  if (!host) return;

  var PW = 400; /* design width; height is whatever the chat needs */

  /* --- Olé, cropped to bulb + face-box (the rig minus legs). Geometry is the
     deck's section-3 rig, which is the app's Rive character. ids are
     per-instance so two avatars can blink independently. --- */
  var uid = 0;
  function ole(size) {
    var p = 'oc' + (uid++);
    return '<span class="oc-ole" style="width:' + size + 'px;height:' + size + 'px" aria-hidden="true">' +
      '<svg viewBox="-30 -20 396 700">' +
      '<defs>' +
      '<clipPath id="' + p + '-el"><path d="M61.16,475.56h101.73v69.47c0,17.81-14.46,32.26-32.26,32.26h-37.21c-17.81,0-32.26-14.46-32.26-32.26v-69.47h0Z"/></clipPath>' +
      '<clipPath id="' + p + '-er"><path d="M189.22,475.56h101.73v69.47c0,17.81-14.46,32.26-32.26,32.26h-37.21c-17.81,0-32.26-14.46-32.26-32.26v-69.47h0Z"/></clipPath>' +
      '</defs>' +
      '<path fill="#ffe05f" d="M334.9,150.88C325.14,55.07,236.63-13.68,140.13,2.31,55.11,16.4-6.14,94.78.49,180.71c3.75,48.67,27.79,90.66,63.01,118.63,22.89,18.17,37.03,45.16,39.99,74.23l.29,2.85,168.94-17.21-.29-2.82c-3.04-29.87,6.71-59.29,25.67-82.57,27.08-33.28,41.49-76.86,36.8-122.92h0Z"/>' +
      '<ellipse fill="#fff" fill-opacity=".3" cx="82" cy="60" rx="52" ry="33" transform="rotate(-25 82 60)"/>' +
      '<rect fill="#d39448" x="106.65" y="367.63" width="127.37" height="64.74" transform="translate(-39.57 21.49) rotate(-5.82)"/>' +
      '<path fill="#d39448" d="M52.59,438.99h245.42c15.55,0,28.17,12.62,28.17,28.17v168.37H24.42v-168.37c0-15.55,12.62-28.17,28.17-28.17h0Z"/>' +
      '<path fill="#f4b373" d="M66.69,455.64h217.21c13.48,0,24.43,10.62,24.43,23.7v138.95H42.26v-138.95c0-13.08,10.95-23.7,24.43-23.7h0Z"/>' +
      '<g class="oc-blink">' +
      '<path fill="#fff" d="M61.16,475.56h101.73v69.47c0,17.81-14.46,32.26-32.26,32.26h-37.21c-17.81,0-32.26-14.46-32.26-32.26v-69.47h0Z"/>' +
      '<path fill="#fff" d="M189.22,475.56h101.73v69.47c0,17.81-14.46,32.26-32.26,32.26h-37.21c-17.81,0-32.26-14.46-32.26-32.26v-69.47h0Z"/>' +
      '<g clip-path="url(#' + p + '-el)"><path fill="#7a613d" d="M128.63,536.17c-9.46-4.51-16.13-13.77-16.58-24.25,0-.06,0-.12,0-.19-.08-2.18-1.78-3.95-3.97-3.95h-12.35c-10.32,0-18.69,8.37-18.69,18.69v19.43c0,10.32,8.37,18.69,18.69,18.69h32.6c10.32,0,18.69-8.37,18.69-18.69v-3.21c0-2.35-2.02-4.16-4.35-3.94-4.39.41-9.08-.23-14.03-2.59h0Z"/></g>' +
      '<g clip-path="url(#' + p + '-er)"><path fill="#7a613d" d="M256.62,536.17c-9.46-4.51-16.13-13.77-16.58-24.25,0-.06,0-.12,0-.19-.08-2.18-1.78-3.95-3.97-3.95h-12.35c-10.32,0-18.69,8.37-18.69,18.69v19.43c0,10.32,8.37,18.69,18.69,18.69h32.6c10.32,0,18.69-8.37,18.69-18.69v-3.21c0-2.35-2.02-4.16-4.35-3.94-4.39.41-9.08-.23-14.03-2.59h0Z"/></g>' +
      '</g>' +
      '<path fill="#aa7a2f" d="M103.4,462.78c.03,5.86-3.91,10.95-9.55,12.51-4.48,1.24-8.7,3.33-12.5,6.22-4.33,3.29-7.85,7.48-10.35,12.23-2.71,5.15-8.45,7.93-14.13,6.66l-.28-.06c-8.12-1.82-12.37-10.83-8.55-18.22,4.24-8.2,10.29-15.43,17.73-21.1,6.47-4.92,13.67-8.48,21.32-10.58,8.18-2.24,16.27,3.85,16.31,12.33h0Z"/>' +
      '<path fill="#aa7a2f" d="M290.07,471.02c-4.47,3.78-10.91,4.02-15.72.69-3.82-2.65-8.14-4.55-12.79-5.61-5.3-1.22-10.78-1.23-16.02-.1-5.69,1.22-11.51-1.4-14.17-6.58l-.13-.26c-3.8-7.4.38-16.44,8.5-18.24,9.02-2,18.44-1.99,27.56.09,7.92,1.81,15.27,5.06,21.78,9.59,6.96,4.84,7.47,14.96.99,20.43h0Z"/>' +
      '</svg></span>';
  }

  /* lucide X, Loader2 and Send — the panel's actual icons */
  var X = '<svg class="oc-x" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var SPIN = '<svg class="oc-spin" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
  var SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

  var MSG = 'Give me a hint';

  host.innerHTML =
    '<div class="oc-scale"><div class="oc-panel">' +
      '<div class="oc-head"><span class="oc-title">Ask Olé</span>' + X + '</div>' +
      '<div class="oc-hr"></div>' +
      '<div class="oc-body">' +
        '<div class="oc-intro">' + ole(30) +
          '<span class="oc-name">Olé</span><span class="oc-badge">Your tutor</span></div>' +
        '<div class="oc-row"><div class="oc-user" id="oc-user">' + MSG + '</div></div>' +
        '<div class="oc-stage">' +
          '<div class="oc-hint" id="oc-hint">' +
            '<div class="oc-hint-head">' + ole(20) + '<span>Hint — Handling objections</span></div>' +
            '<p>💡 Try this: name the customer’s goal before the price. For example: “What would make this a win for your team?”</p>' +
          '</div>' +
          '<div class="oc-think" id="oc-think">' + SPIN + 'Thinking…</div>' +
        '</div>' +
      '</div>' +
      '<div class="oc-input">' +
        '<div class="oc-field"><span class="oc-ph" id="oc-ph">Ask a question…</span>' +
          '<span class="oc-typed" id="oc-typed"></span><span class="oc-caret" id="oc-caret"></span></div>' +
        '<span class="oc-send" id="oc-send">' + SEND + '</span>' +
      '</div>' +
    '</div></div>';

  /* The panel keeps its 400px design width and shrinks as one piece into
     whatever the point's art column gives it — type scales, never reflows. */
  var scaler = host.firstChild, panel = scaler.firstChild;
  function fit() {
    var s = Math.min(1, host.clientWidth / PW);
    scaler.style.transform = 'scale(' + s + ')';
    host.style.height = panel.offsetHeight * s + 'px';
  }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(host);

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof gsap === 'undefined' || !('IntersectionObserver' in window)) return;

  function $(id) { return document.getElementById(id); }

  /* T0 leaves room for the figure's own data-reveal to land first. The beats
     after it are the app's: chip text goes out as a user message, the panel
     thinks, the hint card arrives with the same 8px rise its motion.div has. */
  var T0 = 0.9, typer = { n: 0 };

  var tl = gsap.timeline({ paused: true });
  tl.set('#oc-user',  { autoAlpha: 0, y: 6, scale: 0.96 }, 0);
  tl.set('#oc-think', { autoAlpha: 0 }, 0);
  tl.set('#oc-hint',  { autoAlpha: 0, y: 8 }, 0);
  tl.set('#oc-caret', { autoAlpha: 0 }, 0);

  tl.to('#oc-ph', { autoAlpha: 0, duration: 0.18 }, T0);
  tl.to('#oc-caret', { autoAlpha: 1, duration: 0.12 }, T0);
  tl.fromTo(typer, { n: 0 }, {
    n: MSG.length, duration: 1.05, ease: 'none', snap: { n: 1 },
    onUpdate: function () { $('oc-typed').textContent = MSG.slice(0, typer.n); },
  }, T0 + 0.25);

  var tSend = T0 + 1.45;
  tl.to('#oc-send', { scale: 0.85, duration: 0.12, ease: 'power2.in' }, tSend);
  tl.to('#oc-send', { scale: 1, duration: 0.18, ease: 'power2.out' }, tSend + 0.12);
  tl.to(typer, {
    n: 0, duration: 0.01,
    onUpdate: function () { $('oc-typed').textContent = ''; },
  }, tSend + 0.16);
  tl.to('#oc-caret', { autoAlpha: 0, duration: 0.1 }, tSend + 0.16);
  tl.to('#oc-ph', { autoAlpha: 1, duration: 0.25 }, tSend + 0.3);
  tl.to('#oc-user', { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }, tSend + 0.16);

  tl.to('#oc-think', { autoAlpha: 1, duration: 0.3 }, tSend + 0.65);
  tl.to('#oc-think', { autoAlpha: 0, duration: 0.22 }, tSend + 1.85);
  tl.to('#oc-hint', { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, tSend + 1.95);

  /* Render the opening state now, or the paused timeline would leave the
     resting chat on screen until the first play. */
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
