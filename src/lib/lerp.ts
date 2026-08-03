/** Small maths helpers shared by the motion modules. */

export const lerp = (from: number, to: number, amount: number): number =>
  from + (to - from) * amount;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Frame-rate independent smoothing.
 *
 * A plain `lerp(current, target, 0.1)` per frame moves twice as fast at 120Hz
 * as it does at 60Hz, so the same animation feels different on different
 * displays. Scaling by elapsed time makes the approach rate a property of the
 * design rather than of the monitor.
 */
export const damp = (from: number, to: number, smoothing: number, dt: number): number =>
  lerp(from, to, 1 - Math.exp(-smoothing * dt));

/** Maps `value` from one range to another without clamping. */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
