/**
 * The room parallax on the hero wall.
 *
 * The wall is a composition of screens at different depths. Scroll drift
 * alone cannot show that — a hero sits above the fold and barely moves — so
 * what makes fifteen flat rectangles read as a room is the pointer: move
 * across the wall and the near screens swing further than the far ones.
 *
 * Two numbers, written once per frame on the container: `--px` and `--py`,
 * each -1 to 1. Every tile derives its own translation from them and its own
 * `--depth` in CSS, so the cost is one style write for the whole wall no
 * matter how many screens are on it — not one per tile.
 *
 * The static composition is the real design. This is garnish, and it is
 * absent entirely for anyone who asked for reduced motion or who is on a
 * touch screen, where there is no pointer to answer.
 */

import { qsa } from '../lib/dom';
import { damp } from '../lib/lerp';
import { prefersReducedMotion } from '../lib/viewport';

export interface WallHandle {
  destroy: () => void;
}

const noop: WallHandle = { destroy: () => {} };

export function initWall(scope: ParentNode = document): WallHandle {
  const walls = qsa<HTMLElement>('[data-wall]', scope);
  if (!walls.length) return noop;

  if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return noop;
  }

  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  let last = 0;

  const onPointer = (event: PointerEvent): void => {
    // Normalised against the viewport rather than the wall, so the drift
    // stays continuous when the pointer leaves the hero on the way down.
    targetX = (event.clientX / window.innerWidth) * 2 - 1;
    targetY = (event.clientY / window.innerHeight) * 2 - 1;
    if (raf === 0) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  function frame(now: number): void {
    const dt = Math.min(now - last, 64);
    last = now;

    // Frame-rate independent easing, so the wall settles at the same speed on
    // a 60Hz panel and a 120Hz one.
    x = damp(x, targetX, 6, dt);
    y = damp(y, targetY, 6, dt);

    for (const wall of walls) {
      wall.style.setProperty('--px', x.toFixed(4));
      wall.style.setProperty('--py', y.toFixed(4));
    }

    // Below a thousandth the movement is under a tenth of a pixel on the
    // deepest tile. Stop rather than idle.
    const settled = Math.abs(x - targetX) < 0.001 && Math.abs(y - targetY) < 0.001;
    raf = settled ? 0 : requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', onPointer, { passive: true });

  return {
    destroy: () => {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('pointermove', onPointer);
      for (const wall of walls) {
        wall.style.removeProperty('--px');
        wall.style.removeProperty('--py');
      }
    },
  };
}
