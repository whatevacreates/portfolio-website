import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { Flip } from 'gsap/Flip';
import HoloMesh from './holomesh.jsx';

gsap.registerPlugin(ScrollTrigger, CustomEase, Flip);
// mobile browsers fire a resize when the URL bar slides away mid-scroll —
// a height-only blip; refreshing every trigger on it makes the pinned hero
// jump, so ScrollTrigger sits those out and the choreography matches desktop
ScrollTrigger.config({ ignoreMobileResize: true });
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

export default function Opening({ greeting = 'Put your seatbelts on. We are off for an adventure.' }) {
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
      // the same URL-bar blip reaches this listener too: everything fit()
      // measures is width-driven, so only a real width change (rotation,
      // split-screen, desktop drag) re-runs it — never a mid-build height tick
      let fitW = innerWidth;
      const onResize = () => { if (innerWidth !== fitW) { fitW = innerWidth; fit(); } };
      addEventListener('resize', onResize);
      unfit = () => {
        removeEventListener('resize', onResize);
        document.fonts?.removeEventListener('loadingdone', fit);
      };

      // in-flight carry timelines, killable by a scroll-up replay
      const flights = new Set();

      // the carry, as a ripple: the traveller is never seen moving. it
      // vanishes from its spot, and its passage shows only in the letters
      // along the path — each one, right to left, blinks into a random
      // letter, then another, then remembers itself — until the ripple
      // reaches the beginning and the letter reappears at the front,
      // straight, full-size, deciding itself with one last flicker.
      const carry = (el, isLast) => () => {
        const truth = el.dataset.ch;
        const step = .12;
        const jr = el.getBoundingClientRect();
        const frontEnd = front.getBoundingClientRect().right;
        // the path: every visible letter between the traveller and the
        // front word, walked right-to-left
        const stones = [...line.querySelectorAll('.op-w:not(.op-wc):not(.op-wx) .op-l')]
          .filter((s) => s !== el && s.getBoundingClientRect().left < jr.left && s.getBoundingClientRect().right > frontEnd)
          .sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left);
        // the disturbed letter: two quick wrong letters, then the truth
        // (width pinned so the line doesn't shiver underfoot)
        const flick = (s) => {
          s.style.width = `${s.offsetWidth}px`;
          gsap.to(s, {
            duration: .05, repeat: 1,
            onStart: () => { s.textContent = ALPHA[(Math.random() * 26) | 0]; },
            onRepeat: () => { s.textContent = ALPHA[(Math.random() * 26) | 0]; },
            onComplete: () => { s.textContent = s.dataset.ch; s.style.width = ''; },
          });
        };
        const tlj = gsap.timeline({ onComplete: () => flights.delete(tlj) });
        flights.add(tlj);
        // departure: the letter simply isn't there any more (its gap stays,
        // so the line doesn't reflow under the ripple)
        tlj.set(el, { visibility: 'hidden' }, 0);
        stones.forEach((s, i) => tlj.call(flick, [s], .06 + i * step));
        // arrival at the beginning: the words shove aside and the letter
        // reappears at the front of the line — travellers prepend, so
        // p·a·e·h·c arriving in that order still spells cheap
        tlj.call(() => {
          const others = cheapLetters.filter((l) => l !== el);
          const state = Flip.getState([...q('.op-w'), ...others]);
          front.style.display = 'inline-block';
          front.insertBefore(el, front.firstChild);
          if (isLast) cheap.style.display = 'none'; // nothing left but its word-gap
          el.style.visibility = '';
          Flip.from(state, { duration: .3, ease: landEase });
          // the arrival flicker before it commits
          el.style.width = '1ch';
          gsap.to(el, {
            duration: .05, repeat: 2,
            onRepeat: () => { el.textContent = ALPHA[(Math.random() * 26) | 0]; },
            onComplete: () => { el.textContent = truth; el.style.width = ''; },
          });
        }, [], .06 + stones.length * step + .04);
        // no refit here: the freed word-gap would make the font GROW just
        // before the typing shrinks it — the first typed letter's refit
        // absorbs the slack instead, so the size only ever travels down
      };

      // one letter of "expensive.": arrives undecided, flickers through the
      // alphabet, commits — and the whole line re-fits the panel width
      const reveal = (el, isLast) => () => {
        el.parentElement.style.display = 'inline-block'; // the word enters with its first letter
        el.style.display = 'inline-block';
        const truth = el.dataset.ch;
        const land = () => {
          el.textContent = truth;
          el.style.width = '';
          gsap.fromTo(el, { opacity: .25 }, { opacity: 1, duration: .16, ease: 'power1.out' });
          // the zoom-out riding along the typing: quick off the line, easing
          // into place — the last letter lands the full claim with a soft
          // settle just past its final size
          gsap.to(line, isLast
            ? { fontSize: fitTarget(), duration: .55, ease: 'back.out(1.4)' }
            : { fontSize: fitTarget(), duration: .3, ease: 'expo.out' });
        };
        if (/[a-z]/i.test(truth)) {
          el.style.width = '1ch';
          gsap.to(el, {
            duration: .05, repeat: 2,
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
        .from(rect, { autoAlpha: 0, y: 26, duration: .5 })
        .from(q('.op-mouse'), { autoAlpha: 0, y: -8, duration: .6 }, .5)
        .add('shuffle', '+=.15');
      // 2 · the reshuffle: p goes first, then a, e, h, c — launched every
      //     .35s so the ripples overlap and chase each other down the line.
      //     later letters have shorter paths, but never short enough to
      //     overtake: arrivals stay in departure order, so cheap still spells
      const LAUNCH = .35;
      const departures = [...cheapLetters].reverse();
      departures.forEach((el, i) =>
        tl.add(carry(el, i === departures.length - 1), `shuffle+=${i * LAUNCH}`));
      // the last ripple (c, 8 stones) sets the finish line
      const at = (departures.length - 1) * LAUNCH + .06 + 8 * .12 + .55;
      tl.add('type', `shuffle+=${at + .1}`);
      // 3 · the typing: expensive arrives letter by letter, quick — the line
      //     zooming out smoothly to keep both edges as it reveals itself
      xLetters.forEach((el, i) => tl.add(reveal(el, i === xLetters.length - 1), `type+=${i * .12}`));

      // scrolling back up into the hero replays the whole claim: put every
      // letter back where it was born, refit, and run the build again
      const replay = () => {
        // even mid-build: kill everything in flight and rebuild from zero
        flights.forEach((f) => f.kill());
        flights.clear();
        gsap.killTweensOf([line, ...q('.op-w'), ...cheapLetters, ...xLetters]);
        gsap.set([...q('.op-w'), ...cheapLetters, ...xLetters], { clearProps: 'transform,opacity' });
        cheapLetters.forEach((el) => {
          el.textContent = el.dataset.ch;
          el.style.width = '';
          el.style.visibility = '';
          cheap.appendChild(el);
        });
        cheap.style.display = '';
        front.style.display = '';
        xLetters.forEach((el) => { el.textContent = el.dataset.ch; el.style.width = ''; el.style.display = ''; });
        xLetters[0].parentElement.style.display = '';
        // refit only the type: the panel keeps its size, and a full fit()'s
        // ScrollTrigger.refresh() inside this scroll callback would corrupt
        // the greeting's scrub trigger
        line.style.fontSize = `${fitTarget()}px`;
        tl.restart(true);
      };
      // fires the moment the visitor scrolls back up across the hero's first
      // 10vh (5% of the 200vh section) — any dip toward the greeting and back
      // relaunches the claim; shallow enough to catch a scroll that only
      // reached "put your seatbelts on", deep enough to ignore pixel jitters
      ScrollTrigger.create({ trigger: q('.op')[0], start: '5% top', onLeaveBack: replay });

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
            <HoloMesh />
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
          <p className="op-hello-lead">{greeting}</p>
        </div>
      </div>
    </div>
  </section>;
}
