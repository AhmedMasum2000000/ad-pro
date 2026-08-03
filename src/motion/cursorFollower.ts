/**
 * The custom cursor.
 *
 * One element, translated with the pointer and swollen over anything
 * clickable — a `Link` state for `.addHover` targets, a labelled `View`
 * state for media tiles. Position is written via `transform` on a RAF loop
 * rather than `left`/`top` on the `pointermove` event itself, so the visual
 * update is batched to the frame rate instead of firing once per mouse
 * event.
 */

import { damp } from '../lib/lerp';
import { qs } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

export interface CursorFollowerHandle {
  destroy: () => void;
}

export function initCursorFollower(): CursorFollowerHandle {
  const noop: CursorFollowerHandle = { destroy: () => {} };

  if (prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) {
    return noop;
  }

  const cursor = qs('#cursor');
  const label = qs('.cursor__label', cursor ?? document);
  if (!cursor) return noop;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let active = false;

  const onMove = (event: PointerEvent): void => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!active) {
      active = true;
      cursor.classList.add('is-active');
    }

    const hovered = (event.target as HTMLElement).closest<HTMLElement>(
      '.addHover, a, button, [data-cursor]',
    );
    const media = hovered?.closest<HTMLElement>('[data-cursor="media"]');

    cursor.classList.toggle('is-media', !!media);
    cursor.classList.toggle('is-hover', !!hovered && !media);
    if (label) label.textContent = media?.dataset.cursorLabel ?? 'View';
  };

  const onLeaveWindow = (): void => {
    active = false;
    cursor.classList.remove('is-active');
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeaveWindow);

  let frame = 0;
  let last = performance.now();

  const tick = (now: number): void => {
    const dt = Math.min(now - last, 50) / 1000;
    last = now;
    x = damp(x, targetX, 24, dt);
    y = damp(y, targetY, 24, dt);
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    destroy: () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeaveWindow);
    },
  };
}
