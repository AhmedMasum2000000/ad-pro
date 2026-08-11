/**
 * The two live readouts in the viewfinder chrome.
 *
 * Both report something real. The clock is Dhaka time, which is where the
 * screens are — a buyer in another timezone asking "are they running right
 * now?" gets the answer without doing the arithmetic. The lamp is lit while
 * the network is on air and dark outside its hours.
 *
 * Deliberately not on a rAF loop. A clock that changes ten times a second
 * needs ten updates a second, not sixty, and every one of them is a paint on
 * a fixed element that sits above the whole page. `setInterval` at 100ms costs
 * a sixth as much and looks identical.
 *
 * This module also sets `body.chrome-on`, which is the only thing that makes
 * the chrome visible. The markup ships to all 96 routes at once with no
 * incremental rollout, so the escape hatch is a single class name: drop this
 * call from boot() and every trace of the instrument goes with it.
 */

import { qs } from '../lib/dom';

export interface HudHandle {
  destroy: () => void;
}

/**
 * Dhaka is UTC+6 year-round — Bangladesh has observed no daylight saving since
 * the 2009 trial was abandoned, so a fixed offset is correct rather than a
 * shortcut, and it avoids shipping a timezone database for one clock.
 */
const DHAKA_OFFSET_MIN = 6 * 60;

/**
 * The network's operating window in Dhaka local hours. The sites run to their
 * own schedules — `hours` and `schedule` are per-board — but 9am to 11pm is
 * the envelope every one of them sits inside, so it is what the lamp reports.
 */
const ON_AIR_FROM = 9;
const ON_AIR_UNTIL = 23;

const TICK_MS = 100;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Wall-clock time in Dhaka, whatever the visitor's own clock says. */
function dhakaNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (DHAKA_OFFSET_MIN + now.getTimezoneOffset()) * 60_000);
}

export function initHud(): HudHandle {
  document.body.classList.add('chrome-on');

  const clock = qs<HTMLElement>('[data-hud-clock]');
  const label = qs<HTMLElement>('[data-hud-label]');

  if (!clock && !label) {
    return { destroy: () => document.body.classList.remove('chrome-on') };
  }

  let lastOnAir: boolean | null = null;

  const tick = (): void => {
    const t = dhakaNow();

    if (clock) {
      clock.textContent = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
    }

    const onAir = t.getHours() >= ON_AIR_FROM && t.getHours() < ON_AIR_UNTIL;
    // Only touch the DOM on the two moments a day this changes.
    if (onAir !== lastOnAir) {
      lastOnAir = onAir;
      document.body.classList.toggle('is-onair', onAir);
      if (label) label.textContent = onAir ? 'On air' : 'Off air';
    }
  };

  tick();
  let timer = window.setInterval(tick, TICK_MS);

  // A clock in a background tab is telling no one anything.
  const onVisibility = (): void => {
    window.clearInterval(timer);
    if (!document.hidden) {
      tick();
      timer = window.setInterval(tick, TICK_MS);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    destroy: () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.classList.remove('chrome-on', 'is-onair');
    },
  };
}
