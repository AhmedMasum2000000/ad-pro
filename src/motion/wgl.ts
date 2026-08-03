/**
 * The ambient background field.
 *
 * A drifting wash of light behind the whole document that leans toward the
 * pointer and settles when it stops.
 *
 * This used to be PixiJS, which cost ~486KB to draw blurred circles. Canvas 2D
 * does the same thing in a few hundred bytes: radial gradients are already
 * soft, so the blur that justified a WebGL pipeline was never needed. That
 * one change took the JS payload down by roughly two thirds, which matters
 * far more on a Dhaka mobile connection than the renderer ever did.
 *
 * Everything here is decorative and best-effort: if the 2D context is
 * refused, the site is exactly the site minus this file.
 */

import { damp } from '../lib/lerp';
import { prefersReducedMotion } from '../lib/viewport';

interface Blob {
  hue: string;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
  depth: number;
}

export interface FieldHandle {
  destroy: () => void;
}

// The brand blues, spread light-to-dark so the field reads with depth rather
// than as one flat wash. Raw RGB triples because each blob composes its own
// alpha stops around them.
const COLORS = [
  '107, 163, 232', // --brand-sky
  '44, 111, 198', // --brand-blue
  '30, 58, 99', // --brand-navy
  '78, 132, 210', // midpoint, keeps the gradient from banding
];

export function initField(): FieldHandle {
  const canvas = document.getElementById('wgl_canvas') as HTMLCanvasElement | null;
  const noop: FieldHandle = { destroy: () => {} };
  if (!canvas) return noop;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return noop;

  let width = 0;
  let height = 0;
  let blobs: Blob[] = [];

  // A soft wash needs no pixel precision, so it renders at half resolution
  // and is scaled up by the transform below. On a phone that's a quarter of
  // the fill cost for no visible difference.
  const SCALE = 0.5;

  const build = (): void => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.round(width * SCALE));
    canvas.height = Math.max(1, Math.round(height * SCALE));

    const count = width < 768 ? 3 : 5;
    blobs = Array.from({ length: count }, (_, i) => {
      const baseX = width * (0.12 + 0.2 * i);
      const baseY = height * (i % 2 === 0 ? 0.3 : 0.7);
      return {
        hue: COLORS[i % COLORS.length]!,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        radius: Math.max(width, height) * (0.28 + (i % 3) * 0.08),
        speed: 0.00009 + i * 0.00003,
        phase: i * 1.7,
        // Nearer blobs answer the pointer more strongly, which reads as depth.
        depth: 0.3 + i * 0.16,
      };
    });
  };

  const draw = (): void => {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    for (const b of blobs) {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      g.addColorStop(0, `rgba(${b.hue}, 0.14)`);
      g.addColorStop(0.55, `rgba(${b.hue}, 0.05)`);
      g.addColorStop(1, `rgba(${b.hue}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  build();

  let pointerX = width / 2;
  let pointerY = height / 2;
  let smoothX = pointerX;
  let smoothY = pointerY;

  const onPointerMove = (event: PointerEvent): void => {
    pointerX = event.clientX;
    pointerY = event.clientY;
  };

  // Reduced motion still gets the composition, held still — one frame,
  // redrawn only on resize.
  if (prefersReducedMotion()) {
    draw();
    const onResizeStatic = (): void => {
      build();
      draw();
    };
    window.addEventListener('resize', onResizeStatic, { passive: true });
    return { destroy: () => window.removeEventListener('resize', onResizeStatic) };
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });

  let frame = 0;
  let last = performance.now();
  let running = true;

  const tick = (now: number): void => {
    // Capped: a backgrounded tab resumes with a huge delta that would
    // otherwise teleport everything across the screen in one frame.
    const dt = Math.min(now - last, 50) / 1000;
    last = now;

    smoothX = damp(smoothX, pointerX, 2.2, dt);
    smoothY = damp(smoothY, pointerY, 2.2, dt);

    const offsetX = (smoothX - width / 2) / width;
    const offsetY = (smoothY - height / 2) / height;

    for (const b of blobs) {
      const wanderX = Math.sin(now * b.speed + b.phase) * width * 0.06;
      const wanderY = Math.cos(now * b.speed * 1.3 + b.phase) * height * 0.05;
      b.x = damp(b.x, b.baseX + wanderX + offsetX * 140 * b.depth, 1.6, dt);
      b.y = damp(b.y, b.baseY + wanderY + offsetY * 140 * b.depth, 1.6, dt);
    }

    draw();
    if (running) frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  const stop = (): void => {
    running = false;
    cancelAnimationFrame(frame);
  };

  const start = (): void => {
    if (running) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const onVisibility = (): void => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  let resizeFrame = 0;
  const onResize = (): void => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(build);
  };
  window.addEventListener('resize', onResize, { passive: true });

  return {
    destroy: () => {
      stop();
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
