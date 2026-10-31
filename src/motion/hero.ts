/**
 * The broadcast-switcher hero.
 *
 * Six real sites, one on air at a time. The stage holds every slide stacked;
 * the live one is shown at full exposure, a blurred copy of it bleeds colour
 * into the ground behind, and the viewfinder readouts name it. Every few
 * seconds — or when a cue is hovered — the next site wipes in from the right
 * like a vision mixer cutting between cameras, and the readouts re-scramble
 * to the new name. That is the whole idea: the site is a screen that is on.
 *
 * Cost is deliberately bounded. One interval, paused the moment the hero
 * leaves the viewport or the tab is hidden; no rAF of its own (the pointer
 * parallax writes two custom properties, batched to a frame); the idle drift
 * is a single GSAP tween on the live image. The whole thing collapses to the
 * first slide, static, under `prefers-reduced-motion` or Save-Data, and
 * `destroy()` tears every piece down so a Barba navigation cannot leave a
 * timer switching slides on a page that no longer exists.
 */

import { gsap } from 'gsap';
import { qs, qsa } from '../lib/dom';
import { splitWords } from '../lib/split';
import { onReducedMotionChange, prefersReducedMotion } from '../lib/viewport';
import { scrambleTo } from './ascii';
import { pageVisible } from './curtain';

export interface HeroHandle {
  destroy: () => void;
}

const DEFAULT_INTERVAL = 5000;
/** A phone runs a slower cadence: the slide is the whole screen there. */
const COARSE_INTERVAL = 6000;

const noop: HeroHandle = { destroy: () => {} };

interface Slide {
  el: HTMLElement;
  img: HTMLImageElement | null;
  name: string;
  city: string;
  size: string;
  accent: string;
}

/** `navigator.connection` is not in lib.dom; read it defensively. */
function saveData(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return nav.connection?.saveData === true;
}

/** The readout text for a site: `[ LIVE · GULSHAN CIRCLE‑1, UPPER ]`. */
const siteReadout = (s: Slide): string => `[ LIVE · ${s.name.toUpperCase()} ]`;
const metaReadout = (s: Slide): string =>
  `[ ${[s.city, s.size].filter(Boolean).join(' · ').toUpperCase()} ]`;

export function initHero(scope: ParentNode = document): HeroHandle {
  const hero = qs<HTMLElement>('[data-hero]', scope);
  if (!hero) return noop;

  const stage = qs<HTMLElement>('[data-stage]', hero);
  const slideEls = qsa<HTMLElement>('.hero__slide[data-slide]', stage ?? hero);
  if (!stage || slideEls.length === 0) return noop;

  const slides: Slide[] = slideEls.map((el) => ({
    el,
    img: el.querySelector('img'),
    name: el.dataset.name ?? '',
    city: el.dataset.city ?? '',
    size: el.dataset.size ?? '',
    accent: el.dataset.accent ?? '',
  }));

  const bleeds = {
    a: qs<HTMLElement>('.hero__bleed[data-bleed="a"]', hero),
    b: qs<HTMLElement>('.hero__bleed[data-bleed="b"]', hero),
  };
  const cues = qsa<HTMLButtonElement>('.hero__cue[data-cue]', hero);
  const chrome = qs<HTMLElement>('[data-chrome]', hero);
  const hudSite = qs<HTMLElement>('[data-hud-site]', hero);
  const hudMeta = qs<HTMLElement>('[data-hud-meta]', hero);

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  // A phone gets a plain crossfade: the wipe needs width to read as a wipe.
  const simpleSwitch = coarse || narrow;

  let current = Math.max(
    0,
    slideEls.findIndex((el) => el.classList.contains('is-live')),
  );
  let bleedSide: 'a' | 'b' = 'a';
  let busy = false;
  let timer = 0;
  let inView = true;
  // Nothing automatic — no clock, no drift — until the intro has played.
  // The IntersectionObserver below fires once on observe, which would
  // otherwise start both while the live slide is still fading in.
  let introDone = false;
  let drift: gsap.core.Tween | null = null;
  let switching: gsap.core.Timeline | null = null;
  let cancelSite: () => void = () => {};
  let cancelMeta: () => void = () => {};
  let destroyed = false;

  const ctx = gsap.context(() => {}, hero);
  const cleanups: Array<() => void> = [];

  /* --- state writers --------------------------------------------------------- */

  const srcOf = (s: Slide): string => s.img?.currentSrc || s.img?.src || '';

  /** Points the idle bleed at the slide and crossfades it in over the other. */
  const showBleed = (s: Slide, animate: boolean): void => {
    const next: 'a' | 'b' = animate ? (bleedSide === 'a' ? 'b' : 'a') : bleedSide;
    const incoming = bleeds[next];
    const outgoing = bleeds[next === 'a' ? 'b' : 'a'];
    const src = srcOf(s);
    if (!incoming) return;
    if (src) incoming.style.setProperty('--bleed-img', `url("${src}")`);
    incoming.classList.add('is-on');
    if (outgoing && outgoing !== incoming) outgoing.classList.remove('is-on');
    bleedSide = next;
  };

  const writeReadouts = (s: Slide, animate: boolean): void => {
    cancelSite();
    cancelMeta();
    if (hudSite) cancelSite = scrambleTo(hudSite, siteReadout(s), animate ? 12 : 0);
    if (hudMeta) cancelMeta = scrambleTo(hudMeta, metaReadout(s), animate ? 12 : 0);
  };

  const markLive = (index: number): void => {
    slides.forEach((s, i) => s.el.classList.toggle('is-live', i === index));
    cues.forEach((cue) => {
      const live = Number(cue.dataset.cue) === index;
      cue.classList.toggle('is-live', live);
      cue.setAttribute('aria-pressed', String(live));
    });
    const accent = slides[index]?.accent;
    if (accent) hero.style.setProperty('--accent', accent);
  };

  /** The whole hero at rest on `index`: no tweens, every class truthful. */
  const settle = (index: number): void => {
    ctx.kill();
    drift = null;
    switching = null;
    busy = false;
    introDone = true;
    slides.forEach((s) => {
      gsap.set(s.el, { clearProps: 'opacity,clipPath,zIndex' });
      if (s.img) gsap.set(s.img, { clearProps: 'scale,transform' });
    });
    markLive(index);
    const live = slides[index];
    if (live) {
      showBleed(live, false);
      writeReadouts(live, false);
    }
    current = index;
  };

  /* --- idle drift ------------------------------------------------------------ */

  const startDrift = (s: Slide): void => {
    drift?.kill();
    drift = null;
    if (!s.img || !introDone || prefersReducedMotion() || !inView) return;
    ctx.add(() => {
      drift = gsap.fromTo(
        s.img,
        { scale: 1 },
        { scale: 1.05, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 },
      );
    });
  };

  /* --- the switch ------------------------------------------------------------ */

  const go = (index: number): void => {
    if (destroyed || !introDone || index === current) return;
    // A cut while the last one is still wiping: finish that one on the spot
    // — its `onComplete` tidies the classes — and start the new one cleanly.
    // Dropping the request instead would make a hovered cue feel dead.
    if (busy && switching) switching.progress(1);
    if (busy) return;
    const incoming = slides[index];
    const outgoing = slides[current];
    if (!incoming || !outgoing) return;

    if (prefersReducedMotion()) {
      settle(index);
      return;
    }

    busy = true;
    drift?.kill();
    drift = null;
    current = index;

    // Cues, accent and readouts change on the cut, not after it: the
    // instrument reports what the mixer just did.
    markLive(index);
    writeReadouts(incoming, true);
    showBleed(incoming, true);

    ctx.add(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          outgoing.el.classList.remove('is-live');
          gsap.set(outgoing.el, { clearProps: 'opacity,zIndex' });
          gsap.set(incoming.el, { clearProps: 'clipPath,zIndex' });
          if (outgoing.img) gsap.set(outgoing.img, { clearProps: 'scale' });
          busy = false;
          switching = null;
          startDrift(incoming);
        },
      });
      switching = tl;

      // Both slides are live for the overlap; the incoming one sits on top.
      outgoing.el.classList.add('is-live');
      gsap.set(outgoing.el, { zIndex: 1, opacity: 1 });
      gsap.set(incoming.el, { zIndex: 2, opacity: 1 });

      if (simpleSwitch) {
        tl.fromTo(incoming.el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);
        tl.to(outgoing.el, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0);
        return;
      }

      tl.fromTo(
        incoming.el,
        { clipPath: 'inset(0 0 0 100%)' },
        { clipPath: 'inset(0 0 0 0%)', duration: 0.8, ease: 'power3.inOut' },
        0,
      );
      if (incoming.img) {
        tl.fromTo(
          incoming.img,
          { scale: 1.06 },
          { scale: 1, duration: 1.6, ease: 'power2.out' },
          0,
        );
      }
      tl.to(outgoing.el, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.6);
    });
  };

  const next = (): void => go((current + 1) % slides.length);

  /* --- the clock ------------------------------------------------------------- */

  const interval = (() => {
    const attr = Number(hero.dataset.switchInterval);
    const base = Number.isFinite(attr) && attr > 0 ? attr : DEFAULT_INTERVAL;
    return coarse ? Math.max(base, COARSE_INTERVAL) : base;
  })();

  const stopClock = (): void => {
    if (timer !== 0) window.clearInterval(timer);
    timer = 0;
  };

  const startClock = (): void => {
    stopClock();
    if (destroyed || !introDone || slides.length < 2 || !inView || document.hidden) return;
    if (prefersReducedMotion() || saveData()) return;
    timer = window.setInterval(next, interval);
  };

  /* --- the static fallback ----------------------------------------------------- */

  const h1 = qs<HTMLElement>('h1[data-split="words"]', hero);

  if (prefersReducedMotion() || saveData()) {
    settle(current);
    // The heading is still split for consistency of markup, then shown.
    if (h1) {
      const words = splitWords(h1).words;
      gsap.set(words, { yPercent: 0 });
    }
    const stop = onReducedMotionChange((reduced) => {
      if (!reduced && !saveData()) startClock();
      else {
        stopClock();
        settle(current);
      }
    });
    return {
      destroy: () => {
        stop();
        stopClock();
        ctx.revert();
        cancelSite();
        cancelMeta();
      },
    };
  }

  /* --- intro -------------------------------------------------------------------- */

  const live = slides[current];
  if (!live) return noop;

  markLive(current);
  if (hudSite) hudSite.textContent = siteReadout(live);
  if (hudMeta) hudMeta.textContent = metaReadout(live);

  // Set the hidden states now, before the curtain lifts, so the first visible
  // frame is the start of the animation and not a flash of the end state.
  const words = h1 ? splitWords(h1).words : [];
  const lede = qs<HTMLElement>('.hero__inner .lede', hero);
  const btns = qsa<HTMLElement>('.hero__inner .btn-wrapper .btn', hero);
  const ticks = qsa<HTMLElement>('.chrome__tick', chrome ?? hero);
  const reads = qsa<HTMLElement>('.chrome__read', chrome ?? hero);
  const frame = qs<HTMLElement>('.chrome__frame', chrome ?? hero);

  ctx.add(() => {
    gsap.set(live.el, { opacity: 0 });
    if (live.img) gsap.set(live.img, { scale: 1.12 });
    if (words.length) gsap.set(words, { yPercent: 110 });
    if (lede) gsap.set(lede, { opacity: 0, y: 16 });
    if (btns.length) gsap.set(btns, { opacity: 0, y: 12 });
    if (cues.length) gsap.set(cues, { opacity: 0, x: 16 });
    if (frame) gsap.set(frame, { opacity: 0 });
    if (ticks.length) gsap.set(ticks, { scaleX: 0, scaleY: 0 });
    if (reads.length) gsap.set(reads, { opacity: 0 });
  });

  // Ticks grow out of their own corner, so each needs its own origin.
  const tickOrigin = (tick: HTMLElement): string => {
    const c = tick.className;
    if (c.includes('--tr')) return 'right top';
    if (c.includes('--bl')) return 'left bottom';
    if (c.includes('--br')) return 'right bottom';
    return 'left top';
  };

  void pageVisible().then(() => {
    if (destroyed) return;
    if (prefersReducedMotion()) {
      settle(current);
      if (words.length) gsap.set(words, { yPercent: 0 });
      return;
    }

    ctx.add(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          introDone = true;
          startDrift(live);
          startClock();
        },
      });

      tl.to(live.el, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);
      if (live.img) tl.to(live.img, { scale: 1, duration: 1.6, ease: 'power2.out' }, 0);
      tl.call(() => showBleed(live, false), [], 0.5);

      if (frame) tl.to(frame, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.2);
      ticks.forEach((tick, i) => {
        tl.to(
          tick,
          {
            scaleX: 1,
            scaleY: 1,
            duration: 0.5,
            ease: 'expo.out',
            transformOrigin: tickOrigin(tick),
          },
          0.2 + i * 0.06,
        );
      });
      if (reads.length) {
        tl.to(reads, { opacity: 1, duration: 0.3, stagger: 0.06 }, 0.3);
        tl.call(() => writeReadouts(live, true), [], 0.3);
      }

      if (words.length) {
        tl.to(
          words,
          { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 },
          0.35,
        );
      }
      if (lede) tl.to(lede, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.6);
      if (btns.length) {
        tl.to(
          btns,
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 },
          0.75,
        );
      }
      if (cues.length) {
        tl.to(
          cues,
          { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05 },
          0.8,
        );
      }
    });
  });

  /* --- cues ---------------------------------------------------------------------- */

  const onCue = (event: Event): void => {
    const cue = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-cue]');
    const index = Number(cue?.dataset.cue);
    if (!Number.isFinite(index)) return;
    go(index);
    // A deliberate choice restarts the clock so the next automatic cut does
    // not land a moment after the visitor's own.
    startClock();
  };

  cues.forEach((cue) => {
    cue.addEventListener('click', onCue);
    if (fine) cue.addEventListener('pointerenter', onCue);
    cleanups.push(() => {
      cue.removeEventListener('click', onCue);
      cue.removeEventListener('pointerenter', onCue);
    });
  });

  /* --- pointer parallax ---------------------------------------------------------- */

  if (fine) {
    let px = 0;
    let py = 0;
    let raf = 0;
    const write = (): void => {
      raf = 0;
      hero.style.setProperty('--px', px.toFixed(3));
      hero.style.setProperty('--py', py.toFixed(3));
    };
    const onMove = (event: PointerEvent): void => {
      if (prefersReducedMotion()) return;
      const rect = hero.getBoundingClientRect();
      px = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      py = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      if (raf === 0) raf = requestAnimationFrame(write);
    };
    const onLeave = (): void => {
      px = 0;
      py = 0;
      if (raf === 0) raf = requestAnimationFrame(write);
    };
    hero.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      hero.style.removeProperty('--px');
      hero.style.removeProperty('--py');
    });
  }

  /* --- pausing ----------------------------------------------------------------- */

  // A switcher nobody can see is just a timer. Pause out of view and in a
  // background tab; resume where it left off.
  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      inView = entry.isIntersecting;
      if (inView) {
        startClock();
        if (!drift && !busy) startDrift(slides[current] ?? live);
      } else {
        stopClock();
        drift?.pause();
      }
    },
    { threshold: 0.15 },
  );
  io.observe(hero);

  const onVisibility = (): void => {
    if (document.hidden) stopClock();
    else startClock();
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  cleanups.push(
    onReducedMotionChange((reduced) => {
      if (reduced) {
        stopClock();
        settle(current);
        if (words.length) gsap.set(words, { yPercent: 0 });
        if (lede) gsap.set(lede, { clearProps: 'all' });
        if (btns.length) gsap.set(btns, { clearProps: 'all' });
        if (cues.length) gsap.set(cues, { clearProps: 'opacity,x,transform' });
        if (frame) gsap.set(frame, { clearProps: 'all' });
        if (ticks.length) gsap.set(ticks, { clearProps: 'all' });
        if (reads.length) gsap.set(reads, { clearProps: 'opacity' });
      } else {
        startClock();
      }
    }),
  );

  return {
    destroy: () => {
      destroyed = true;
      stopClock();
      io.disconnect();
      cleanups.forEach((fn) => fn());
      cancelSite();
      cancelMeta();
      drift?.kill();
      ctx.revert();
    },
  };
}
