/**
 * Hero slideshow.
 *
 * Autoplaying, with a visible pause control and a counter. The control is a
 * real button and the region is a live region, because an animation that
 * moves text on its own has to be stoppable to be usable.
 */

import { qs, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

const INTERVAL = 6000;

export interface SlideshowHandle {
  destroy: () => void;
}

export function initSlideshow(scope: ParentNode = document): SlideshowHandle {
  const root = qs('#slider', scope);
  const slides = qsa('.slide', scope);
  const control = qs<HTMLButtonElement>('.js-slideshow-control', scope);
  const counter = qs('.slideshow-control_num', scope);

  const noop: SlideshowHandle = { destroy: () => {} };
  if (!root || slides.length === 0) return noop;

  let index = 0;
  let timer = 0;
  // Reduced motion starts paused: the slides still exist and can be advanced
  // by hand, but nothing moves unless the visitor asks for it.
  let playing = !prefersReducedMotion();

  const total = slides.length;
  const pad = (n: number): string => String(n).padStart(2, '0');

  const render = (): void => {
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      // Hiding the inactive slides keeps their headings out of the accessibility
      // tree, so a screen reader does not read three competing <h1>s.
      slide.setAttribute('aria-hidden', String(!active));
    });
    if (counter) counter.textContent = `${pad(index + 1)} / ${pad(total)}`;
  };

  const advance = (): void => {
    index = (index + 1) % total;
    render();
  };

  const stop = (): void => {
    window.clearInterval(timer);
    timer = 0;
  };

  const start = (): void => {
    stop();
    if (!playing) return;
    timer = window.setInterval(advance, INTERVAL);
  };

  const setPlaying = (next: boolean): void => {
    playing = next;
    control?.classList.toggle('isPlaying', playing);
    control?.setAttribute('aria-pressed', String(!playing));
    if (control) {
      const label = qs('.slideshow-control__label', control);
      if (label) label.textContent = playing ? 'Pause' : 'Play';
    }
    if (playing) start();
    else stop();
  };

  const onControl = (): void => setPlaying(!playing);

  // Pausing on a hidden tab stops the counter racing ahead while nobody is
  // looking, so returning to the tab does not jump several slides.
  const onVisibility = (): void => {
    if (document.hidden) stop();
    else if (playing) start();
  };

  control?.addEventListener('click', onControl);
  document.addEventListener('visibilitychange', onVisibility);

  render();
  setPlaying(playing);

  return {
    destroy: () => {
      stop();
      control?.removeEventListener('click', onControl);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
