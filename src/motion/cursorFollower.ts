/**
 * The custom cursor.
 *
 * One element, translated with the pointer and swollen over anything
 * clickable — a ring state (`.is-hover`) for links, buttons and `.addHover`
 * targets, and a labelled media state (`.is-media`, "View" or whatever the
 * tile's `data-cursor-label` says) over photographs that lead somewhere.
 * Position is written via `transform` on a RAF loop rather than `left`/`top`
 * on the `pointermove` event itself, so the visual update is batched to the
 * frame rate instead of firing once per mouse event.
 *
 * Shell-level: it survives Barba navigations. It reads the hovered element
 * from each event rather than binding to the page's nodes, so there is
 * nothing to rebind when the page changes.
 */

import { damp } from '../lib/lerp';
import { qs } from '../lib/dom';
import { onReducedMotionChange, prefersReducedMotion } from '../lib/viewport';

export interface CursorFollowerHandle {
  destroy: () => void;
}

const HOVER_TARGETS = '.addHover, a, button, [data-cursor]';

export function initCursorFollower(): CursorFollowerHandle {
  const noop: CursorFollowerHandle = { destroy: () => {} };

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return noop;

  const cursor = qs('#cursor');
  const label = qs('.cursor__label', cursor ?? document);
  if (!cursor) return noop;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let active = false;
  let frame = 0;
  let last = performance.now();

  const onMove = (event: PointerEvent): void => {
    if (prefersReducedMotion()) return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!active) {
      active = true;
      cursor.classList.add('is-active');
      if (frame === 0) frame = requestAnimationFrame(tick);
    }

    const hovered = (event.target as HTMLElement).closest<HTMLElement>(HOVER_TARGETS);
    const media = hovered?.closest<HTMLElement>('[data-cursor="media"]') ?? null;

    cursor.classList.toggle('is-media', !!media);
    cursor.classList.toggle('is-hover', !!hovered && !media);
    if (label) label.textContent = media?.dataset.cursorLabel ?? 'View';
  };

  const hide = (): void => {
    active = false;
    cursor.classList.remove('is-active', 'is-hover', 'is-media');
  };

  const tick = (now: number): void => {
    const dt = Math.min(now - last, 50) / 1000;
    last = now;
    x = damp(x, targetX, 24, dt);
    y = damp(y, targetY, 24, dt);
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    // Park the loop once the follower has caught up and the pointer has left.
    const settled = !active && Math.abs(x - targetX) < 0.5 && Math.abs(y - targetY) < 0.5;
    frame = settled ? 0 : requestAnimationFrame(tick);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', hide);

  const stopMotionWatch = onReducedMotionChange((reduced) => {
    if (reduced) hide();
  });

  return {
    destroy: () => {
      cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', hide);
      stopMotionWatch();
      hide();
    },
  };
}
