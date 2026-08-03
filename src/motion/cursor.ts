/**
 * Magnetic hover.
 *
 * Elements marked `.addHover` lean toward the pointer while it is over them
 * and spring back on exit. Applied only where a pointer can actually hover —
 * on touch there is no hover state to respond to, and binding the handlers
 * would cost memory for an effect nobody sees.
 */

import { gsap } from 'gsap';
import { qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

const STRENGTH = 0.28;

export interface CursorHandle {
  destroy: () => void;
}

export function initMagnetic(scope: ParentNode = document): CursorHandle {
  const noop: CursorHandle = { destroy: () => {} };

  if (prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) {
    return noop;
  }

  const targets = qsa('.addHover', scope);
  if (targets.length === 0) return noop;

  const cleanups: Array<() => void> = [];

  for (const el of targets) {
    const onMove = (event: PointerEvent): void => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      gsap.to(el, {
        x: dx * STRENGTH,
        y: dy * STRENGTH,
        duration: 0.5,
        ease: 'power3.out',
      });
    };

    const onLeave = (): void => {
      // elastic on the way back only — leaning in should feel controlled,
      // releasing should feel like a spring.
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    cleanups.push(() => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { x: 0, y: 0 });
    });
  }

  return { destroy: () => cleanups.forEach((fn) => fn()) };
}
