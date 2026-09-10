import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(CustomEase, Flip);
// hand-drawn physics: a breath of inertia, a confident middle,
// then a long, soft settle — no mechanical symmetry
const buildEase = CustomEase.create('build', 'M0,0 C0.42,0 0.05,1 1,1');
// the landing: overshoots past its seat, sinks back, sits — a body with mass
const landEase = CustomEase.create('land', 'M0,0 C0.3,0 0.25,1.4 0.55,1.05 0.75,0.95 0.9,1 1,1');

// every word is an actor; every letter inside it can be recast
const Word = ({ w, cls }) => <span className={`op-w${cls ? ` ${cls}` : ''}`} data-w={w}>
  {[...w].map((ch, i) => <span className="op-l" data-ch={ch} key={i}>{ch}</span>)}
</span>;

// Section 01 — the claim, one line, always touching both edges.
//
//   1. "Ideas are cheap" — one big line filling the panel.
//   2. the reshuffle: "cheap" travels to the front letter by letter,
//      each letter peeling off and flying home (FLIP), capitals untouched.
//   3. the typing: "expensive" is appended letter by letter, each new
//      letter flickering through the alphabet before it commits; with
//      every landed letter the whole line re-fits the panel width, so
//      the sentence zooms out to reveal it without ever leaving the edges.
//
// The rectangle never moves: width from the viewport, height locked to
// the opening line, the type breathing inside it.

export default function Opening() {
  const root = useRef();

  useLayoutEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let unfit = () => {};

    const ctx = gsap.context((self) => {
      const q = self.selector;
      const rect = q('.op-rect')[0];
      const line = q('.op-line')[0];
      const meter = q('.op-meter')[0];
      const hello = q('.op-hello')[0];
      const cheap = line.querySelector('[data-w="cheap"]');
      const front = line.querySelector('.op-wc');
      const cheapLetters = [...cheap.querySelectorAll('.op-l')];
      const xLetters = [...line.querySelectorAll('.op-wx .op-l')];
      const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

      // exact fit of whatever the line currently shows: measure at 100px
      // (offsetWidth is a layout metric — in-flight transforms can't lie)
      const fitTarget = () => {
        const prev = line.style.fontSize;
        line.style.fontSize = '100px';
        const w = line.offsetWidth;
        line.style.fontSize = prev;
        return 100 * rect.clientWidth / w;
      };

      const fit = () => {
        // in dev the stylesheet can land after this effect: everything then
        // measures 0 and the sizes divide into garbage — wait it out
        meter.textContent = 'Ideas are cheap';
        if (!meter.offsetWidth) { requestAnimationFrame(fit); return; }
        const stage = q('.op-stage')[0];
        rect.style.width = `${Math.min(stage.clientWidth * (innerWidth < 620 ? .92 : .72), 1060)}px`;
        // panel height belongs to the opening line and never changes
        // full ink height (ascender to descender) plus room for the flight
        // ducks, so p, t and every letter height always stays inside
        const size1 = 100 * rect.clientWidth / meter.offsetWidth;
        rect.style.height = `${size1 * 1.02}px`;
        line.style.fontSize = `${fitTarget()}px`;
        ScrollTrigger.refresh();
      };
      fit();
      // ready can resolve before the display font is even requested (nothing
      // rendered in it yet) — loadingdone fires when the real face arrives
      document.fonts?.ready.then(fit);
      document.fonts?.addEventListener('loadingdone', fit);
      addEventListener('resize', fit);
      unfit = () => {
        removeEventListener('resize', fit);
        document.fonts?.removeEventListener('loadingdone', fit);
      };

      // the reshuffle, letter by letter: each letter of "cheap" peels off,
      // travels right-to-left along the baseline to where the current
      // letters sit — ducking slightly in flight so no ascender leaves the
      // panel — lands with a weighted bounce, and only then decides itself:
      // a short flicker through the alphabet before it commits.
      // FLIP shoves the other words aside on the same bezier.
      const carry = (el, isLast) => () => {
        const state = Flip.getState([...q('.op-w'), ...cheapLetters]);
        front.style.display = 'inline-block';
        front.appendChild(el);
        if (isLast) cheap.style.display = 'none'; // nothing left but its word-gap
        Flip.from(state, { duration: .62, ease: buildEase });
        // the flight: duck away from the letter's own ink — descenders duck
        // up, everything else ducks down — so no glyph crosses the panel edge
        const truth = el.dataset.ch;
        const duck = 'pgjqy'.includes(truth) ? -4 : 4;
        gsap.timeline()
          .to(el, { scale: .86, yPercent: duck, duration: .28, ease: 'power2.out' }, 0)
          .to(el, { scale: 1, yPercent: 0, duration: .34, ease: landEase }, .28);
        // the landing flicker: the slot hasn't decided which letter lives
        // here yet (width pinned so the neighbours don't shiver)
        gsap.to({}, {
          duration: .07, repeat: 2, delay: .55,
          onStart: () => { el.style.width = '1ch'; },
          onRepeat: () => { el.textContent = ALPHA[(Math.random() * 26) | 0]; },
          onComplete: () => { el.textContent = truth; el.style.width = ''; },
        });
        // no refit here: the freed word-gap would make the font GROW just
        // before the typing shrinks it — the first typed letter's refit
        // absorbs the slack instead, so the size only ever travels down
      };

      // one letter of "expensive.": arrives undecided, flickers through the
      // alphabet, commits — and the whole line re-fits the panel width
      const reveal = (el) => () => {
        el.parentElement.style.display = 'inline-block'; // the word enters with its first letter
        el.style.display = 'inline-block';
        const truth = el.dataset.ch;
        const land = () => {
          el.textContent = truth;
          el.style.width = '';
          gsap.fromTo(el, { opacity: .25 }, { opacity: 1, duration: .2, ease: 'power1.out' });
          gsap.to(line, { fontSize: fitTarget(), duration: .22, ease: 'power2.out' });
        };
        if (/[a-z]/i.test(truth)) {
          el.style.width = '1ch';
          gsap.to({}, {
            duration: .055, repeat: 2,
            onRepeat: () => { el.textContent = ALPHA[(Math.random() * 26) | 0]; },
            onComplete: land,
          });
        } else land();
      };

      if (reduce) {
        // finished state, no motion: "cheap ideas are expensive"
        front.style.display = 'inline-block';
        cheapLetters.forEach((el) => front.appendChild(el));
        cheap.style.display = 'none';
        xLetters.forEach((el) => { el.style.display = 'inline-block'; });
        xLetters[0].parentElement.style.display = 'inline-block';
        fit();
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        // 1 · the cheap claim, one big line in the panel
        .from(rect, { autoAlpha: 0, y: 26, duration: .8 })
        .from(q('.op-mouse'), { autoAlpha: 0, y: -8, duration: .7 }, .9)
        // 2 · the reshuffle: cheap travels to the front letter by letter
        .add('shuffle', '+=.45')
        .add('type', `shuffle+=${cheapLetters.length * .26 + .75}`);
      cheapLetters.forEach((el, i) =>
        tl.add(carry(el, i === cheapLetters.length - 1), `shuffle+=${i * .26}`));
      // 3 · the typing: expensive arrives letter by letter, the line
      //     zooming out fast to keep both edges as it reveals itself
      xLetters.forEach((el, i) => tl.add(reveal(el), `type+=${i * .21}`));

      // scroll: the settled claim hands over to Eva's greeting, scrubbed —
      // the visitor performs the transition, nothing vanishes on its own
      gsap.timeline({
        scrollTrigger: { trigger: q('.op')[0], start: 'top top', end: '+=90%', scrub: .9 },
      })
        .to(q('.op-mouse'), { autoAlpha: 0, duration: .12 }, 0)
        .to(q('.op-frame'), { autoAlpha: 0, y: -70, duration: .35, ease: 'power1.in' }, .05)
        .fromTo(hello, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: .4, ease: 'power1.out' }, .32);
    }, root);

    return () => { unfit(); ctx.revert(); };
  }, []);

  return <section className="op" ref={root}>
    <div className="op-stage">
      <div className="op-frame">
        <h1 className="op-claim">
          <span className="sr-only">Ideas are cheap. Cheap ideas are expensive.</span>
          <span className="op-rect" aria-hidden="true">
            <span className="op-line">
              <span className="op-w op-wc" data-w="cheap-front" />
              <Word w="ideas" />
              <Word w="are" />
              <Word w="cheap" />
              <Word w="expensive" cls="op-wx" />
            </span>
            <span className="op-meter" />
          </span>
        </h1>
      </div>

      <div className="op-mouse" aria-hidden="true">
        <svg viewBox="0 0 34 24">
          <polyline className="op-chev op-chev1" points="9,3 17,11 25,3" />
          <polyline className="op-chev op-chev2" points="9,12 17,20 25,12" />
        </svg>
      </div>

      <div className="op-hello">
        <div className="op-hello-copy">
          <svg className="op-hello-chev" viewBox="0 0 34 24" aria-hidden="true">
            <polyline className="op-chev op-chev1" points="9,3 17,11 25,3" />
            <polyline className="op-chev op-chev2" points="9,12 17,20 25,12" />
          </svg>
          <p className="op-hello-lead">Put your seatbelts on. We are off for an adventure.</p>
        </div>
      </div>
    </div>
  </section>;
}
