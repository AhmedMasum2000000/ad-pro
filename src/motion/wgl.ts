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

/* --- the character field ----------------------------------------------------
   A grid of glyphs drifting over the wash, densest where the pointer is. It
   shares this canvas rather than taking one of its own, because two
   full-screen contexts is the kind of decision that reads fine on a desktop
   and ruins a mid-range phone.

   It also updates far more slowly than the wash underneath — twelve times a
   second against sixty. That is not a compromise: a character field that
   interpolates smoothly stops looking like a terminal and starts looking like
   a screensaver. The discrete step is the effect.                          */

const GLYPHS = '.:-=+*#%@';
const ASCII_MS = 1000 / 12;

/** Two octaves of sines. Cheaper than real noise and, at this density,
    indistinguishable from it. */
function fieldValue(x: number, y: number, t: number): number {
  const a = Math.sin(x * 0.09 + t) * Math.cos(y * 0.11 - t * 0.7);
  const b = Math.sin((x + y) * 0.05 - t * 1.4);
  return (a * 0.6 + b * 0.4) * 0.5 + 0.5;
}

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

  // The glyph layer is drawn into its own buffer at the slow rate and then
  // composited every frame — one `drawImage` instead of four thousand
  // `fillText` calls sixty times a second.
  const glyphs = document.createElement('canvas');
  const gctx = glyphs.getContext('2d');
  let cell = 18;
  let cols = 0;
  let rows = 0;
  let lastGlyphs = 0;

  const build = (): void => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.round(width * SCALE));
    canvas.height = Math.max(1, Math.round(height * SCALE));

    // Coarser cells on a phone: fewer glyphs, and each one large enough to
    // read as a character rather than as noise on a dense display.
    cell = width < 768 ? 24 : 18;
    cols = Math.ceil(width / cell) + 1;
    rows = Math.ceil(height / cell) + 1;
    glyphs.width = Math.max(1, Math.round(width * SCALE));
    glyphs.height = Math.max(1, Math.round(height * SCALE));

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

  /**
   * Repaints the glyph buffer.
   *
   * Only cells above the threshold are drawn at all, so a sparse field costs
   * a few hundred `fillText` calls rather than one per cell. Density rises
   * towards the pointer, which is what makes the field feel answerable rather
   * than merely present.
   */
  const drawGlyphs = (t: number, px: number, py: number): void => {
    if (!gctx) return;
    gctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    gctx.clearRect(0, 0, width, height);
    gctx.font = `${cell - 6}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    gctx.textBaseline = 'top';

    const reach = Math.min(width, height) * 0.42;

    for (let row = 0; row < rows; row++) {
      const y = row * cell;
      for (let col = 0; col < cols; col++) {
        const x = col * cell;

        // Distance to the pointer, 1 at the pointer and 0 beyond its reach.
        const dx = x - px;
        const dy = y - py;
        const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / reach);

        const v = fieldValue(col, row, t) + near * 0.55;
        if (v < 0.72) continue;

        const strength = Math.min(1, (v - 0.72) / 0.5);
        const glyph = GLYPHS[Math.min(GLYPHS.length - 1, (strength * GLYPHS.length) | 0)];
        gctx.fillStyle = `rgba(107, 163, 232, ${(0.06 + strength * 0.2).toFixed(3)})`;
        gctx.fillText(glyph, x, y);
      }
    }
  };

  const draw = (now = 0, px = width / 2, py = height / 2): void => {
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

    if (now - lastGlyphs > ASCII_MS) {
      drawGlyphs(now * 0.00035, px, py);
      lastGlyphs = now;
    }

    // Composited in the canvas's own pixel space, so the transform is reset
    // first — the buffer is already at SCALE.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(glyphs, 0, 0);
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

    draw(now, smoothX, smoothY);
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
