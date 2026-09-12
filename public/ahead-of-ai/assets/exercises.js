/* Vendored from the Harvard Way YouTube cut:
 *   internal-programs/emails and socials/GENERATIONS/YOUTUBE GOOGLE ADS/
 *   harvard-way-youtube-2026-08-20-v2/exercises.js
 *
 * Scene B of that film — the activities solving themselves, on white, with no
 * product chrome. Unmodified, so a fix there can be dropped straight back in
 * here. It exposes one entry point, window.__buildExercises(unit), which returns
 * the activities as { el, beats, solve(p), dim(q), payoff }. The film drives
 * solve() off its own timeline; here lesson.js drives it off the scroll.
 */
(function () {
/* ============================================================================
   The lesson's exercises, rebuilt live.
   ============================================================================
   The middle scene shows the activities and nothing else — no header, no rail,
   no action bar — solving themselves on white. That rules out the screenshot
   plates the first cut used: a plate cannot animate. So the five activities are
   rebuilt here as DOM, on the product's own tokens (styles/colors.css,
   styles/lesson.css, and the component classes each variant carries), and
   driven by one progress number each.

   Geometry is DECLARED, never measured. Every activity lays out inside a
   760-unit-wide box with explicit row heights, and the whole box is scaled by
   one factor per format. That is what lets the connection curves and the
   categorization flight paths be drawn from arithmetic instead of from
   getBoundingClientRect — nothing has to be re-measured after a font loads, and
   a frame seeked at 7.31s composes exactly like the same frame seeked at 3.02s.

   Each activity exposes:

     el          the node, absolutely positioned by the caller
     solve(p)    p in [0,1] — the whole self-completion, as a pure function
     beats       how many discrete things complete, so the caller can pulse
                 Olé on each one

   `solve` is called on every frame with the frame's own p. It never accumulates
   and never reads the clock, so seeking backwards is exact.
   ============================================================================ */

const NS = 'http://www.w3.org/2000/svg';

// The width of the box every activity lays out in, set per format before the
// five are built. It is not a constant because it is the one lever that trades
// width for type size: a 9:16 frame can only be 1080px wide, so the only way to
// get readable type into it is to lay the activities out NARROWER in units and
// scale them up harder. 760 for 16:9, 580 for 9:16 — a 33% larger face at the
// same rendered width.
let U = 760;
let NARROW = false;
// Row heights have to give when the columns do: at 580 units the connection and
// categorization labels wrap to a second line, and a fixed 58px row would clip
// them (and, worse, would leave the curve endpoints attached to nothing).
const RH = (wide, narrow) => (NARROW ? narrow : wide);

/* ── the product's tokens, the ones these five variants actually use ──────── */
const C = {
  darkest: '#0f172a',
  dark: '#334155',
  medium: '#64748b',
  lighter: '#e2e8f0',
  lightest: '#f1f5f9',
  success: '#10b981',
  successTint: 'rgba(16,185,129,0.10)',
  successBg: '#ecfdf5',
  solid: '#8287c7',
  solidTint: 'rgba(130,135,199,0.15)',
  blankFill: '#f5f3ff',
  blankBorder: '#ddd6fe',
  violet: '#6d28d9',
  lime: '#c7ef79',
  limeEdge: '#4f7d22',
};

/* Cards in the scatter-card categorization take their pastel off the board's
   own gradient ramp (card-visuals.ts): one continuous sweep across the pile. */
const CARD_TINTS = ['#f6dede', '#f3e4f7', '#e9e2fb', '#e0e8fb', '#dff0f4', '#dcf2ea'];

const el = (tag, css, parent, text) => {
  const n = document.createElement(tag);
  if (css) Object.assign(n.style, css);
  if (text !== undefined) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
};
const svg = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));
/** Local progress of item i out of n, where each item takes `span` of the run. */
const stagger = (p, i, n, span = 0.45) => {
  const start = n === 1 ? 0 : (i / (n - 1)) * (1 - span);
  return clamp01((p - start) / span);
};
const out3 = (p) => 1 - Math.pow(1 - p, 3);
const out2 = (p) => 1 - Math.pow(1 - p, 2);
const back = (p) => {           // a small overshoot, for things that pop in
  const s = 1.9;
  const q = p - 1;
  return q * q * ((s + 1) * q + s) + 1;
};

/** The check glyph, as a path that draws itself. */
function checkMark(parent, size, colour) {
  const s = svg('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' }, parent);
  const p = svg('path', {
    d: 'M5 12.5 L10 17.5 L19 7',
    stroke: colour, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    'stroke-dasharray': 26, 'stroke-dashoffset': 26,
  }, s);
  s.style.display = 'block';
  return { node: s, draw: (q) => p.setAttribute('stroke-dashoffset', String(26 * (1 - q))) };
}

/* ── the shared stem: the muted intro caption over the serif question ─────── */
function stem(root, intro, title) {
  if (intro) {
    el('div', {
      font: '400 13px Inter, sans-serif', color: C.dark, marginBottom: '6px', letterSpacing: '0',
    }, root, intro);
  }
  el('h2', {
    font: "400 24px 'New Spirit', Georgia, serif", color: C.darkest,
    lineHeight: '1.32', margin: '0 0 20px', letterSpacing: '-0.005em',
  }, root, title);
}

/* ── the payoff line ──────────────────────────────────────────────────────────
   Every activity carries one line that only exists for the close-up: the thing
   the answer bought you. It is laid out as a single non-wrapping line running
   to the RIGHT of the answer, because the camera reveals it by panning along
   it — a wrapped block cannot be read by a pan.

   Its words rise out of their own masks, which is the sales decks' treatment
   for a subline and the reason it reads as premium rather than as a caption:
   `.w { overflow:hidden }` with the word inside translated 108% down, 0.8s on
   cubic-bezier(.22,.61,.36,1), 58ms apart
   (exciting_sales_decks/assets/brand.css, and the engagement deck's copy of it).

   At the wide shot it is invisible, so its size is free — it is set big enough
   to fill a 300% frame and nothing else has to give. */
const PAYOFF_EASE = (p) => {
  // cubic-bezier(.22,.61,.36,1), sampled — the decks' --ease.
  const cx = 3 * 0.22, bx = 3 * (0.36 - 0.22) - cx, ax = 1 - cx - bx;
  const cy = 3 * 0.61, by = 3 * (1 - 0.61) - cy, ay = 1 - cy - by;
  let t = p;
  for (let i = 0; i < 6; i += 1) {
    const x = ((ax * t + bx) * t + cx) * t - p;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(d) < 1e-6) break;
    t -= x / d;
  }
  return ((ay * t + by) * t + cy) * t;
};

function buildPayoff(root, text) {
  const line = el('div', {
    position: 'absolute', left: '0px', top: '0px', opacity: '0',
    // 27, not 34: at 300% the frame is 365 world units across, and the longer
    // of the two lines runs 375 at 34 — its last word landed off the edge of
    // the shot it was written for. 27 leaves a margin the frame can breathe in.
    font: `400 27px 'New Spirit', Georgia, serif`, color: C.darkest,
    letterSpacing: '-0.01em', lineHeight: '1.30',
  }, root);
  // A `|` starts a new line. Two short lines stacked hold in one shot where a
  // long one has to be panned across — and where the shot is framed on the
  // answer, holding is the better move.
  const words = [];
  text.split('|').forEach((row, ri, rows) => {
    const rowEl = el('div', { whiteSpace: 'nowrap' }, line);
    row.trim().split(' ').forEach((w, i, all) => {
      const mask = el('span', {
        display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom',
        paddingBottom: '0.14em', marginBottom: '-0.14em',
      }, rowEl);
      words.push(el('span', { display: 'inline-block' }, mask, w));
      if (i < all.length - 1) rowEl.appendChild(document.createTextNode(' '));
    });
  });
  return {
    node: line,
    // Hung under the answer, once the answer has a real box.
    placeUnder(answerEl, rootEl, unitsPerPx) {
      const r = rootEl.getBoundingClientRect();
      const a = answerEl.getBoundingClientRect();
      line.style.left = `${(a.left - r.left) * unitsPerPx}px`;
      line.style.top = `${(a.bottom - r.top) * unitsPerPx + 30}px`;
    },
    // q in [0,1] across the whole reveal; each word takes 0.8s of a run the
    // caller scales, 58ms apart.
    // `seen` is how far into the close-up the camera is: the line belongs to
    // that shot and to no other, so it leaves with it rather than being left
    // lying across the board at the wide shot.
    play(q, span, seen) {
      const step = 0.058 / span;
      const dur = 0.8 / span;
      words.forEach((w, i) => {
        const a = clamp01((q - i * step) / dur);
        w.style.transform = `translateY(${(108 * (1 - PAYOFF_EASE(a))).toFixed(2)}%)`;
      });
      line.style.opacity = String(Math.min(q > 0 ? 1 : 0, seen));
    },
  };
}

/* ── 0 · the decision tree ────────────────────────────────────────────────── */
// The lesson delivery's newest board, and the one the run opens on. In the
// product each stage sits on a full-width chevron BAND with a giant ghost
// numeral behind the copy. Neither is here: on a video frame the band reads as
// a coloured box the exercise is trapped in, and the numeral competes with the
// only thing that matters, which is the answer. What is kept is the part that
// carries the meaning — the stage's serif title over its scenario and question,
// the option you picked staying lit while the ones you did not go grey. The
// product draws a thread from the pick down into the stage it leads to; it is
// not here, because the close-up lands on that pill and a line running out of
// the bottom of the frame reads as something the shot is missing.
const DT = {
  pill: '#ffffff',
  pillEdge: '#e2e8f0',
  chosen: '#c7ef79',
  chosenEdge: '#4f7d22',
};

function buildDecisionTree(spec) {
  const root = el('div', { width: `${U}px`, position: 'relative' });

  const STAGE_GAP = 54;
  const stages = spec.stages.map((st, si) => {
    const wrap = el('div', {
      position: 'relative', width: `${U}px`, textAlign: 'center',
      marginTop: si === 0 ? '0' : `${STAGE_GAP}px`,
    }, root);

    // Three sizes, two colours, and that is the whole hierarchy: the stage
    // title in slate-900, the situation and the question in slate-700 at one
    // size. They were a grey caption and a bold question before, which read as
    // two unrelated things stacked rather than as one setup.
    const title = el('div', { font: `400 42px 'New Spirit', Georgia, serif`, color: C.darkest, marginBottom: '12px' }, wrap, st.title);
    const scenario = el('div', { font: '400 17px Inter, sans-serif', color: C.dark, marginBottom: '3px' }, wrap, st.scenario);
    const question = el('div', { font: '400 17px Inter, sans-serif', color: C.dark, marginBottom: '20px' }, wrap, st.question);

    const row = el('div', { display: 'flex', justifyContent: 'center', gap: '12px' }, wrap);
    const pills = st.options.map((text) => {
      const p = el('div', {
        // Centred, not left-aligned with the check pushed to the far edge: the
        // options sit in a row and a pill whose label starts at its left edge
        // reads as a list item. One grey for every label, picked or not — the
        // pill's fill and its check already say which one was chosen, and
        // darkening the text as well said it twice.
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
        background: DT.pill, border: `1.5px solid ${DT.pillEdge}`, borderRadius: '999px',
        padding: '11px 18px', maxWidth: '260px',
        font: '400 15px Inter, sans-serif', color: C.dark, lineHeight: '1.3',
        textAlign: 'center',
      }, row);
      el('span', {}, p, text);
      const disc = el('div', {
        width: '19px', height: '19px', flex: 'none', borderRadius: '50%',
        border: `1.6px solid ${DT.chosenEdge}`, opacity: '0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }, p);
      const mark = checkMark(disc, 15, DT.chosenEdge);
      return { p, disc, mark };
    });
    return { wrap, title, scenario, question, pills, chosen: st.chosen };
  });

  // The line between the two picks. It is drawn once the SECOND one has landed
  // — it is the connection between two decisions, so it has nothing to say
  // until both have been made. A single cubic with vertical handles: the two
  // pills sit at different x, and a curve that leaves and arrives straight down
  // is the only shape that reads as one move rather than as a detour.
  const wires = svg('svg', {
    width: U, height: 10,
    style: 'position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:-1',
  }, root);
  const link = svg('path', {
    fill: 'none', stroke: DT.chosen, 'stroke-width': 3, 'stroke-linecap': 'round',
  }, wires);

  const payoff = buildPayoff(root, spec.payoff);
  const answerEl = stages[0].pills[stages[0].chosen].p;

  return {
    el: root,
    beats: stages.length,
    payoff,
    answerEl,
    // Everything that is not the answer or its payoff steps back while the
    // camera is in close — the close-up is meant to hold one thing.
    dim(q) {
      const a = 1 - q;
      stages.forEach((st, si) => {
        st.pills.forEach((p, oi) => {
          if (si === 0 && oi === st.chosen) return;
          p.p.style.filter = `opacity(${a})`;
        });
        [...st.wrap.children].forEach((c) => {
          if (c === st.wrap.lastElementChild) return;   // the pill row
          c.style.filter = `opacity(${a})`;
        });
      });
    },
    solve(p) {
      // A stage arrives a line at a time, in the order a person would read it:
      // the moment, then the situation, then the question, then the options —
      // all three still unticked — and only then the pick. Landing the whole
      // stage at once gives the eye nowhere to go and the tick nothing to be an
      // answer TO; landing it in order is what makes a viewer read rather than
      // scan.
      const rise = (el, q, px = 12) => {
        el.style.opacity = String(q);
        el.style.transform = `translateY(${((1 - out3(q)) * px).toFixed(2)}px)`;
      };
      stages.forEach((st, si) => {
        const a = stagger(p, si, stages.length, 0.56);
        st.wrap.style.opacity = String(a > 0 ? 1 : 0);
        rise(st.title, clamp01(a / 0.10));
        rise(st.scenario, clamp01((a - 0.08) / 0.10), 10);
        // The question and the options arrive TOGETHER: a question with no
        // options under it is a caption, and the pair is what makes a viewer
        // start answering. Then a full second of nothing — the beat a person
        // actually spends deciding — and only then the pick.
        rise(st.question, clamp01((a - 0.19) / 0.10), 10);
        const pick = clamp01((a - 0.60) / 0.14);
        st.pills.forEach((q, oi) => {
          const arrive = clamp01((a - 0.20 - oi * 0.03) / 0.12);
          const isChosen = oi === st.chosen;
          q.p.style.transform = isChosen
            ? `translateY(${((1 - out3(arrive)) * 12).toFixed(2)}px) scale(${(1 + 0.05 * Math.sin(Math.PI * pick)).toFixed(4)})`
            : `translateY(${((1 - out3(arrive)) * 12).toFixed(2)}px)`;
          if (isChosen) {
            q.p.style.opacity = String(arrive);
            q.p.style.background = pick > 0 ? DT.chosen : DT.pill;
            q.p.style.borderColor = pick > 0 ? DT.chosenEdge : DT.pillEdge;
            q.p.style.borderBottomWidth = `${(1.5 + 2.5 * pick).toFixed(1)}px`;

            q.disc.style.opacity = String(pick);
            q.mark.draw(pick);
          } else {
            // The roads not taken fade back rather than disappearing.
            q.p.style.opacity = String(arrive * (1 - 0.62 * pick));
          }
        });
      });
      // The link, once the second pick is in.
      if (link.__geom) {
        const g = link.__geom;
        const q = out3(clamp01((p - 0.90) / 0.10));
        link.setAttribute('stroke-dashoffset', String(g.len * (1 - q)));
        link.style.opacity = String(q > 0 ? 1 : 0);
      }
    },
    // Once the pills have real boxes: strike the curve between the two picks.
    wire() {
      if (stages.length < 2) return;
      const r = root.getBoundingClientRect();
      const a = stages[0].pills[stages[0].chosen].p.getBoundingClientRect();
      const b = stages[1].pills[stages[1].chosen].p.getBoundingClientRect();
      const k = r.width / U;
      const x0 = (a.left + a.width / 2 - r.left) / k;
      const y0 = (a.bottom - r.top) / k;
      const x1 = (b.left + b.width / 2 - r.left) / k;
      const y1 = (b.top - r.top) / k;
      const bow = (y1 - y0) * 0.55;
      const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} C ${x0.toFixed(1)} ${(y0 + bow).toFixed(1)}, ${x1.toFixed(1)} ${(y1 - bow).toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      link.setAttribute('d', d);
      const len = link.getTotalLength();
      link.setAttribute('stroke-dasharray', String(len));
      link.setAttribute('stroke-dashoffset', String(len));
      link.__geom = { len };
    },
  };
}

/* ── 1 · multiple choice ──────────────────────────────────────────────────── */
// QuizOption: a content-hugging pill, `rounded-xl border-2 border-transparent
// bg-gray-lightest`, with a circular letter badge that fills solid and shrinks
// to 0.8 once the answer is graded (STATE_CHIP_SCALE — a solid disc reads
// heavier than the pale idle one at the same size).
function buildQuiz(spec) {
  const root = el('div', { width: `${U}px` });
  stem(root, spec.intro, spec.question);

  const rows = spec.options.map((text, i) => {
    const row = el('div', {
      display: 'flex', alignItems: 'flex-start', gap: '11px',
      background: C.lightest, border: '2px solid transparent', borderRadius: '13px',
      padding: '5px 22px 5px 10px', marginBottom: '13px', width: 'fit-content', maxWidth: '100%',
      transition: 'none',
    }, root);
    const chip = el('div', {
      width: '38px', height: '38px', flex: 'none', borderRadius: '50%',
      background: C.solidTint, color: C.darkest,
      font: "500 21px 'New Spirit', Georgia, serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginLeft: '-2px', position: 'relative',
    }, row, String.fromCharCode(65 + i));
    const tick = el('div', { position: 'absolute', opacity: '0', display: 'flex' }, chip);
    const mark = checkMark(tick, 20, '#fff');
    const label = el('div', {
      font: '400 17px Inter, sans-serif', color: C.darkest, lineHeight: '1.45', padding: '7px 0',
    }, row, text);
    return { row, chip, tick, mark, label };
  });

  const takeaway = el('div', {
    background: C.blankFill, borderRadius: '11px', padding: '13px 17px',
    font: '400 16px Inter, sans-serif', color: C.dark, marginTop: '4px',
  }, root, spec.takeaway);

  const right = spec.correct;
  return {
    el: root,
    beats: 1,
    solve(p) {
      // The options arrive first, then one of them is chosen.
      rows.forEach((r, i) => {
        const a = stagger(clamp01(p / 0.34), i, rows.length, 0.6);
        r.row.style.opacity = String(a);
        r.row.style.transform = `translateY(${((1 - out3(a)) * 14).toFixed(2)}px)`;
      });
      const g = clamp01((p - 0.40) / 0.34);          // grading the chosen answer
      const r = rows[right];
      r.row.style.borderColor = g > 0 ? C.success : 'transparent';
      r.row.style.background = g > 0
        ? `rgba(16,185,129,${(0.10 * g).toFixed(3)})` : C.lightest;
      r.chip.style.background = g > 0 ? C.success : C.solidTint;
      r.chip.style.transform = `scale(${(1 - 0.2 * out2(g)).toFixed(3)})`;
      r.chip.firstChild.textContent = g > 0.25 ? '' : String.fromCharCode(65 + right);
      r.tick.style.opacity = g > 0.25 ? '1' : '0';
      r.mark.draw(clamp01((g - 0.25) / 0.5));
      r.label.style.color = g > 0.4 ? C.success : C.darkest;
      r.label.style.fontWeight = g > 0.4 ? '600' : '400';

      const tk = clamp01((p - 0.72) / 0.28);
      takeaway.style.opacity = String(tk);
      takeaway.style.transform = `translateY(${((1 - out3(tk)) * 10).toFixed(2)}px)`;
    },
  };
}

/* ── 2 · connection ───────────────────────────────────────────────────────── */
// Two columns of pills; a matched pair turns success-green on both sides and a
// curve is drawn between them. The curve is a cubic with horizontal handles,
// which is what makes several of them cross without ever looking tangled.
function buildConnection(spec) {
  const root = el('div', { width: `${U}px` });
  stem(root, null, spec.title);
  el('div', {
    font: '400 14px Inter, sans-serif', color: C.medium, margin: '-14px 0 22px',
  }, root, spec.subtitle);

  const COL = Math.round(U * 0.418), ROW = RH(58, 78), GAP = 15, MID = U - COL * 2;
  const board = el('div', { position: 'relative', height: `${spec.pairs.length * (ROW + GAP)}px` }, root);
  const wires = svg('svg', {
    width: U, height: spec.pairs.length * (ROW + GAP), style: 'position:absolute;left:0;top:0;overflow:visible',
  }, board);

  // The right column is deranged, so the pairs are not row-aligned — which is
  // the whole point of the activity and the reason the curves have to cross.
  const rightOrder = spec.deranged;

  const pill = (text, x, y) => {
    const n = el('div', {
      position: 'absolute', left: `${x}px`, top: `${y}px`, width: `${COL}px`, height: `${ROW}px`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', boxSizing: 'border-box',
      background: '#fff', border: `1.6px solid ${C.lighter}`, borderRadius: '13px',
      font: '400 16px Inter, sans-serif', color: C.darkest,
    }, board);
    el('span', { paddingRight: '10px' }, n, text);
    const disc = el('div', {
      width: '22px', height: '22px', flex: 'none', borderRadius: '50%',
      background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: '0',
    }, n);
    const mark = checkMark(disc, 15, '#fff');
    return { n, disc, mark };
  };

  const lefts = spec.pairs.map((pr, i) => pill(pr.left, 0, i * (ROW + GAP)));
  const rights = rightOrder.map((idx, i) => pill(spec.pairs[idx].right, COL + MID, i * (ROW + GAP)));

  const curves = spec.pairs.map((_, i) => {
    const yL = i * (ROW + GAP) + ROW / 2;
    const yR = rightOrder.indexOf(i) * (ROW + GAP) + ROW / 2;
    const x0 = COL, x1 = COL + MID;
    const c = svg('path', {
      d: `M${x0} ${yL} C ${x0 + MID * 0.55} ${yL}, ${x1 - MID * 0.55} ${yR}, ${x1} ${yR}`,
      fill: 'none', stroke: C.success, 'stroke-width': 2.2, 'stroke-linecap': 'round',
    }, wires);
    const len = c.getTotalLength();
    c.setAttribute('stroke-dasharray', len);
    c.setAttribute('stroke-dashoffset', len);
    return { c, len };
  });

  const boardH = spec.pairs.length * (ROW + GAP);
  const payoff = buildPayoff(root, spec.payoff);
  root.style.position = 'relative';
  return {
    el: root,
    beats: spec.pairs.length,
    payoff,
    answerEl: lefts[0].n,
    dim(q) {
      const a = 1 - q;
      [...lefts, ...rights].forEach((p, i) => { if (i !== 0) p.n.style.filter = `opacity(${a})`; });
      wires.style.opacity = String(1 - 0.7 * q);
      [...root.children].forEach((c) => { if (c !== board && c !== payoff.node) c.style.filter = `opacity(${a})`; });
    },
    solve(p) {
      const arrive = clamp01(p / 0.26);
      [...lefts, ...rights].forEach((q, i) => {
        const a = stagger(arrive, i, lefts.length + rights.length, 0.7);
        q.n.style.opacity = String(a);
        q.n.style.transform = `translateY(${((1 - out3(a)) * 12).toFixed(2)}px)`;
      });
      const run = clamp01((p - 0.24) / 0.66);
      curves.forEach((cv, i) => {
        const a = stagger(run, i, curves.length, 0.42);
        cv.c.setAttribute('stroke-dashoffset', String(cv.len * (1 - out2(a))));
        const done = clamp01((a - 0.55) / 0.45);
        const rIdx = rightOrder.indexOf(i);
        for (const q of [lefts[i], rights[rIdx]]) {
          q.n.style.borderColor = done > 0 ? C.success : C.lighter;
          q.n.style.background = done > 0 ? C.successBg : '#fff';
          q.disc.style.opacity = String(done);
          q.disc.style.transform = `scale(${(0.6 + 0.4 * back(Math.max(0.001, done))).toFixed(3)})`;
          q.mark.draw(done);
        }
      });
    },
  };
}

/* ── 3 · sequencing ───────────────────────────────────────────────────────── */
// The items arrive shuffled and travel to their correct row. Motion is by
// transform only — every row keeps its layout slot — so nothing reflows and the
// travel can cross without the rows fighting for space.
function buildSequencing(spec) {
  const root = el('div', { width: `${U}px` });
  stem(root, null, spec.title);
  el('div', {
    font: '400 14px Inter, sans-serif', color: C.medium, margin: '-14px 0 20px',
  }, root, spec.subtitle);

  const ROW = RH(56, 68), GAP = 12;
  const board = el('div', { position: 'relative', height: `${spec.items.length * (ROW + GAP)}px` }, root);

  const rows = spec.items.map((text, i) => {
    const wrap = el('div', {
      position: 'absolute', left: '0', top: `${i * (ROW + GAP)}px`, width: `${U}px`, height: `${ROW}px`,
      display: 'flex', alignItems: 'center', gap: '14px',
    }, board);
    const gutter = el('div', {
      width: '26px', height: '26px', flex: 'none', borderRadius: '50%',
      background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: '0',
    }, wrap);
    const gMark = checkMark(gutter, 17, '#fff');
    const pill = el('div', {
      flex: '1', height: `${ROW}px`, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 16px', boxSizing: 'border-box',
      background: '#fff', border: `1.6px solid ${C.lighter}`, borderRadius: '13px',
      font: '400 16px Inter, sans-serif', color: C.darkest,
    }, wrap);
    const grip = el('span', { color: C.lighter, letterSpacing: '1px', marginRight: '12px' }, null, '⠿');
    const lbl = el('span', { display: 'flex', alignItems: 'center' }, pill);
    lbl.appendChild(grip);
    el('span', {}, lbl, text);
    const disc = el('div', {
      width: '22px', height: '22px', flex: 'none', borderRadius: '50%',
      background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: '0',
    }, pill);
    const mark = checkMark(disc, 15, '#fff');
    return { wrap, gutter, gMark, pill, disc, mark };
  });

  const banner = el('div', {
    marginTop: '10px', background: C.successBg, borderRadius: '11px', padding: '12px 16px',
    font: '400 15px Inter, sans-serif', color: C.limeEdge,
  }, root, spec.banner);

  // Where each item starts before it sorts itself out, in rows of offset.
  const shuffle = spec.shuffle;

  return {
    el: root,
    beats: spec.items.length,
    solve(p) {
      const arrive = clamp01(p / 0.22);
      rows.forEach((r, i) => {
        const a = stagger(arrive, i, rows.length, 0.7);
        r.wrap.style.opacity = String(a);
      });
      const sort = clamp01((p - 0.20) / 0.44);
      rows.forEach((r, i) => {
        const a = out3(stagger(sort, i, rows.length, 0.55));
        const from = (shuffle[i] - i) * (ROW + GAP);
        r.wrap.style.transform = `translateY(${(from * (1 - a)).toFixed(2)}px)`;
      });
      const grade = clamp01((p - 0.60) / 0.30);
      rows.forEach((r, i) => {
        const a = stagger(grade, i, rows.length, 0.5);
        r.pill.style.borderColor = a > 0 ? C.success : C.lighter;
        r.pill.style.background = a > 0 ? C.successBg : '#fff';
        for (const [d, m] of [[r.disc, r.mark], [r.gutter, r.gMark]]) {
          d.style.opacity = String(a);
          d.style.transform = `scale(${(0.6 + 0.4 * back(Math.max(0.001, a))).toFixed(3)})`;
          m.draw(a);
        }
      });
      const b = clamp01((p - 0.86) / 0.14);
      banner.style.opacity = String(b);
      banner.style.transform = `translateY(${((1 - out3(b)) * 8).toFixed(2)}px)`;
    },
  };
}

/* ── 4 · categorization ───────────────────────────────────────────────────── */
// The scatter pile deals itself into the zone wells. Each card flies on its own
// arc — a straight tween from a rotated pile to a level slot reads as a slide;
// carrying a little lift through the middle of the flight reads as a throw.
function buildCategorization(spec) {
  const root = el('div', { width: `${U}px` });
  const head = el('h3', {
    // The same face, weight and size the decision tree sets its stage titles
    // in — a bold cut here read as a different kind of thing entirely.
    font: "400 42px 'New Spirit', Georgia, serif", color: C.darkest,
    textAlign: 'center', margin: '0 0 8px',
  }, root, spec.title);
  const sub = el('div', {
    font: '400 17px Inter, sans-serif', color: C.dark, textAlign: 'center', marginBottom: '28px',
  }, root, spec.subtitle);

  const ZONE_W = Math.round(U * 0.4816), ZONE_X = [0, U - ZONE_W];
  const SLOT = RH(50, 64), SLOT_GAP = 9, WELL_PAD = 13;
  const perZone = spec.zones.map((z) => spec.items.filter((it) => it.zone === z.id).length);
  const WELL_H = WELL_PAD * 2 + Math.max(...perZone) * (SLOT + SLOT_GAP) - SLOT_GAP;
  // The pile only has to be tall enough to deal from — it is empty for most of
  // the time the activity is on screen, and at 128 units it left a quarter of
  // the block as white space under the subtitle once the cards had landed. 56
  // is enough: the cards still cross 220-plus units on their way to the far
  // slots. Starting them ABOVE the board instead would buy the same travel and
  // fly them straight over the title.
  const PILE_H = 56;

  const board = el('div', { position: 'relative', height: `${PILE_H + 34 + WELL_H}px` }, root);

  // the zones
  const zones = spec.zones.map((z, zi) => {
    const x = ZONE_X[zi];
    const tab = el('div', {
      position: 'absolute', left: `${x + 14}px`, top: `${PILE_H + 34 - 30}px`,
      background: C.lightest, borderRadius: '9px 9px 0 0', padding: '6px 15px',
      font: '600 14px Inter, sans-serif', color: C.darkest,
    }, board, z.name);
    const well = el('div', {
      position: 'absolute', left: `${x}px`, top: `${PILE_H + 34}px`,
      width: `${ZONE_W}px`, height: `${WELL_H}px`,
      background: '#f8fafc', border: `1.5px solid ${C.lighter}`, borderRadius: '15px',
    }, board);
    return { tab, well, x };
  });

  // the pile, and where each card lands
  const seat = spec.zones.map(() => 0);
  const cards = spec.items.map((it, i) => {
    const zi = spec.zones.findIndex((z) => z.id === it.zone);
    const k = seat[zi]++;
    // The pile has to fit the box: a card is ZONE_W - 2·WELL_PAD wide, so the
    // spread is what is left over. Six of those across 760 units overlap
    // heavily, which is what a scatter pile is — the rotation jitter is what
    // keeps it reading as a pile rather than as a stack.
    const cardW = ZONE_W - WELL_PAD * 2;
    const spread = U - cardW - 20;
    const from = {
      x: 10 + (i * spread) / (spec.items.length - 1),
      y: 1 + (i % 3) * 11,
      rot: -8 + ((i * 37) % 17),
    };
    const to = {
      x: ZONE_X[zi] + WELL_PAD,
      y: PILE_H + 34 + WELL_PAD + k * (SLOT + SLOT_GAP),
      rot: 0,
    };
    const n = el('div', {
      position: 'absolute', left: '0', top: '0',
      width: `${ZONE_W - WELL_PAD * 2}px`, height: `${SLOT}px`,
      display: 'flex', alignItems: 'center', gap: '12px', padding: '0 13px', boxSizing: 'border-box',
      background: CARD_TINTS[i % CARD_TINTS.length], borderRadius: '11px',
      font: '600 15px Inter, sans-serif', color: C.darkest,
      boxShadow: '0 2px 10px rgba(40,50,80,0.10)',
    }, board);
    const glyph = el('div', {
      width: '20px', height: '20px', flex: 'none', borderRadius: '6px',
      background: 'rgba(15,23,42,0.16)',
    }, n);
    el('span', { flex: '1' }, n, it.name);
    const disc = el('div', {
      width: '20px', height: '20px', flex: 'none', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: '0',
    }, n);
    const mark = checkMark(disc, 19, C.limeEdge);
    return { n, glyph, disc, mark, from, to, greenAt: 0 };
  });

  // Top to bottom, left lane first where two land level.
  [...cards]
    .sort((p, q) => (p.to.y - q.to.y) || (p.to.x - q.to.x))
    .forEach((c, i, all) => { c.greenAt = all.length > 1 ? i / (all.length - 1) : 0; });

  root.style.position = 'relative';
  return {
    el: root,
    beats: cards.length,
    // No payoff line on this one. The close-up is the two lanes themselves —
    // the camera reads the sort, not a sentence about it.
    blocks: [zones[0].well, zones[1].well],
    dim(q) {
      const a = 1 - q;
      // Only the head steps back — both lanes stay lit, because the camera
      // visits both of them.
      [...root.children].forEach((c) => { if (c !== board) c.style.filter = `opacity(${a})`; });
    },
    solve(p) {
      // Same order as the tree: what this is, then what you are sorting by,
      // then the lanes, then the cards.
      const line = (el, q, px = 10) => {
        el.style.opacity = String(q);
        el.style.transform = `translateY(${((1 - out3(q)) * px).toFixed(2)}px)`;
      };
      line(head, clamp01(p / 0.10));
      line(sub, clamp01((p - 0.08) / 0.10));
      const arrive = clamp01((p - 0.17) / 0.14);
      zones.forEach((z, i) => {
        const a = stagger(arrive, i, zones.length, 0.7);
        z.well.style.opacity = String(a);
        z.tab.style.opacity = String(a);
      });
      // The cards fall in their own colours and STAY in them until the last
      // one has landed. Turning each one green as it lands grades the board
      // card by card, which reads as six separate little verdicts; holding the
      // colour and then sweeping green top to bottom reads as one — you sorted
      // the pile, and then the pile was right.
      const deal = clamp01((p - 0.30) / 0.44);
      const green = clamp01((p - 0.78) / 0.20);
      cards.forEach((c, i) => {
        const a = stagger(deal, i, cards.length, 0.34);
        const f = out3(a);
        // a little lift through the middle of the flight, so it throws
        const lift = Math.sin(Math.PI * a) * -26;
        const x = c.from.x + (c.to.x - c.from.x) * f;
        const y = c.from.y + (c.to.y - c.from.y) * f + lift;
        const rot = c.from.rot * (1 - f);
        const appear = clamp01(a * 6);
        c.n.style.opacity = String(Math.max(appear, i === 0 ? 1 : 1));
        c.n.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${(1 + 0.05 * Math.sin(Math.PI * a)).toFixed(3)})`;
        // Its place in the green sweep: down the board, left lane before right
        // at the same height.
        const done = clamp01((green - c.greenAt * (1 - 0.34)) / 0.34);
        const landed = clamp01((a - 0.86) / 0.14);
        c.n.style.background = done > 0 ? C.lime : CARD_TINTS[i % CARD_TINTS.length];
        c.n.style.boxShadow = landed > 0.5 ? 'none' : '0 2px 10px rgba(40,50,80,0.10)';
        c.glyph.style.background = done > 0 ? 'rgba(30,60,10,0.35)' : 'rgba(15,23,42,0.16)';
        c.disc.style.opacity = String(done);
        c.mark.draw(done);
      });
    },
  };
}

/* ── 5 · fill in the blank ────────────────────────────────────────────────── */
// The answers rise into the blanks out of the blanks themselves — the product
// fills each gap from its own dropdown, not from a shared word bank, and a bank
// would also leave a hole in its row as each word was spent.
//
// Every blank is sized on its answer from the first frame, so nothing on the
// line reflows as the words land. A sentence that re-wraps mid-animation is the
// one thing that would give this away as a rebuild rather than the product.
function buildFillBlank(spec) {
  const root = el('div', { width: `${U}px` });
  el('div', {
    font: '400 13px Inter, sans-serif', color: C.dark, marginBottom: '8px',
  }, root, spec.intro);

  const line = el('div', {
    font: "400 27px 'New Spirit', Georgia, serif", color: C.darkest,
    lineHeight: '1.85', marginBottom: '26px',
  }, root);

  const blanks = [];
  spec.parts.forEach((part, i) => {
    el('span', {}, line, part);
    if (i < spec.answers.length) {
      const b = el('span', {
        display: 'inline-block', textAlign: 'center',
        background: C.blankFill, border: `2px solid ${C.blankBorder}`, borderRadius: '10px',
        padding: '1px 18px', margin: '0 3px 0 9px', verticalAlign: 'baseline',
        font: '600 24px Inter, sans-serif', color: C.violet,
        overflow: 'hidden',
      }, line);
      const inner = el('span', { display: 'inline-block' }, b, spec.answers[i]);
      blanks.push({ b, inner });
    }
  });

  const takeaway = el('div', {
    background: C.blankFill, borderRadius: '11px', padding: '13px 17px',
    font: '400 16px Inter, sans-serif', color: C.dark,
  }, root, spec.takeaway);

  return {
    el: root,
    beats: blanks.length,
    solve(p) {
      const arrive = clamp01(p / 0.26);
      line.style.opacity = String(arrive);
      const fill = clamp01((p - 0.28) / 0.50);
      blanks.forEach((bl, i) => {
        const a = out3(stagger(fill, i, blanks.length, 0.55));
        bl.inner.style.transform = `translateY(${((1 - a) * 130).toFixed(2)}%)`;
        bl.inner.style.opacity = String(clamp01(a * 2.5));
        const done = clamp01((a - 0.7) / 0.3);
        bl.b.style.borderColor = done > 0 ? C.success : C.blankBorder;
        bl.b.style.background = done > 0 ? C.successBg : C.blankFill;
        bl.b.style.color = done > 0 ? C.success : C.violet;
      });
      const tk = clamp01((p - 0.80) / 0.20);
      takeaway.style.opacity = String(tk);
      takeaway.style.transform = `translateY(${((1 - out3(tk)) * 10).toFixed(2)}px)`;
    },
  };
}

/* ── the two, as the lesson runs them ───────────────────────────────────────
   Two, and both about the same thing: which AI tool is for which job. The
   decision tree makes you commit to one, and the sort shows you the rule behind
   the commitment. It leads with the tree because when you are shown a question
   you want to answer it.

   `buildConnection` above is not in this run — the matching board was the third
   activity in the earlier cut and is kept because it is the obvious swap for
   either of these.

   The copy is cut short on purpose. Every line is read twice: once at the wide
   shot, where the whole board has to be legible at a glance, and once at 300%,
   where a third of it is on screen. Long options survive neither.            */
const EXERCISES = [
  () => buildDecisionTree({
    stages: [
      {
        title: 'Debug your agent',
        scenario: 'Your agent gives the wrong answer.',
        question: 'What do you check first?',
        options: ['The final answer', 'The agent trace', 'The prompt'],
        chosen: 1,
      },
      {
        title: 'One step deeper',
        scenario: 'It chose the wrong tool.',
        question: 'What do you fix?',
        options: ['The tool description', 'The system prompt', 'The routing logic'],
        chosen: 0,
      },
    ],
    payoff: 'Read the trace.|Then fix the description.',
  }),

  () => buildCategorization({
    title: 'Which tool for which job?',
    subtitle: 'Two tools, and the jobs each one is for',
    zones: [
      { id: 'code', name: 'Claude Code' },
      { id: 'cowork', name: 'Claude Cowork' },
    ],
    items: [
      { name: 'Build a website', zone: 'code' },
      { name: 'Make a presentation', zone: 'cowork' },
      { name: 'Create an AI agent', zone: 'code' },
      { name: 'Send me a weekly recap email', zone: 'cowork' },
      { name: 'Create an animation', zone: 'code' },
      { name: 'Analyze my meeting notes', zone: 'cowork' },
    ],
  }),
];

// Built on demand so the unit box can be set first.
window.__buildExercises = function (unit) {
  U = unit;
  NARROW = unit < 700;
  return EXERCISES.map((make) => make());
};

})();
