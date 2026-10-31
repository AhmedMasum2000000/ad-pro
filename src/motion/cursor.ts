/**
 * Magnetic hover.
 *
 * Elements marked `.addHover` lean toward the pointer while it is over them
 * and spring back on exit. The label inside a button (`.btn__label`) moves
 * against the lean at half strength, which is what makes the pull read as
 * physical — the button bends toward the hand, the word stays put.
 *
 * Applied only where a pointer can actually hover — on touch there is no
 * hover state to respond to, and binding the handlers would cost memory for
 * an effect nobody sees — and inert under `prefers-reduced-motion`.
 */

import { gsap } from 'gsap';
import { qsa } from '../lib/dom';
import { onReducedMotionChange, prefersReducedMotion } from '../lib/viewport';

const STRENGTH = 0.28;
/** The label moves the other way at half the element's displacement. */
const LABEL_STRENGTH = -0.5;

export interface CursorHandle {
  destroy: () => void;
}

export function initMagnetic(scope: ParentNode = document): CursorHandle {
  const noop: CursorHandle = { destroy: () => {} };

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return noop;

  const targets = qsa<HTMLElement>('.addHover', scope);
  if (targets.length === 0) return noop;

  const cleanups: Array<() => void> = [];

  for (const el of targets) {
    const label = el.querySelector<HTMLElement>('.btn__label');

    const onMove = (event: PointerEvent): void => {
      if (prefersReducedMotion()) return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      gsap.to(el, {
        x: dx * STRENGTH,
        y: dy * STRENGTH,
        duration: 0.5,
        ease: 'power3.out',
      });
      if (label) {
        gsap.to(label, {
          x: dx * STRENGTH * LABEL_STRENGTH,
          y: dy * STRENGTH * LABEL_STRENGTH,
          duration: 0.5,
          ease: 'power3.out',
        });
      }
    };

    const onLeave = (): void => {
      // elastic on the way back only — leaning in should feel controlled,
      // releasing should feel like a spring.
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      if (label) gsap.to(label, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { clearProps: 'x,y,transform' });
      if (label) gsap.set(label, { clearProps: 'x,y,transform' });
    });
  }

  // A visitor who switches reduced motion on mid-session gets every button
  // back at rest at once rather than wherever the pointer last left it.
  cleanups.push(
    onReducedMotionChange((reduced) => {
      if (!reduced) return;
      targets.forEach((el) => {
        gsap.set(el, { clearProps: 'x,y,transform' });
        const label = el.querySelector<HTMLElement>('.btn__label');
        if (label) gsap.set(label, { clearProps: 'x,y,transform' });
      });
    }),
  );

  return { destroy: () => cleanups.forEach((fn) => fn()) };
}
