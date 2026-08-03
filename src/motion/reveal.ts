/**
 * Scroll-triggered reveals.
 *
 * One IntersectionObserver for the whole page rather than a ScrollTrigger per
 * element: the browser does the intersection maths off the main thread, and
 * elements unobserve themselves once shown, so a long projects list does not
 * keep hundreds of live callbacks around.
 */

import { gsap } from 'gsap';
import { qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

export interface RevealHandle {
  destroy: () => void;
}

export function initReveals(scope: ParentNode = document): RevealHandle {
  const targets = qsa('[data-reveal]', scope);
  if (targets.length === 0) return { destroy: () => {} };

  // Reduced motion: everything is simply visible. Setting the final state
  // explicitly matters because the initial state below is applied inline.
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return { destroy: () => {} };
  }

  gsap.set(targets, { opacity: 0, y: 28 });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target as HTMLElement;
        // Children marked for stagger animate as a group; otherwise the
        // element itself moves.
        const children = qsa('[data-reveal-item]', el);
        const subject = children.length > 0 ? children : el;

        if (children.length > 0) gsap.set(children, { opacity: 0, y: 24 });

        gsap.to(subject, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: children.length > 0 ? 0.08 : 0,
          delay: Number(el.dataset.revealDelay ?? 0),
        });

        if (children.length > 0) gsap.set(el, { opacity: 1, y: 0 });

        observer.unobserve(el);
      }
    },
    {
      // Fires a little before the element reaches the fold, so the motion has
      // finished by the time it is properly in view.
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.1,
    },
  );

  targets.forEach((el) => observer.observe(el));

  return { destroy: () => observer.disconnect() };
}
