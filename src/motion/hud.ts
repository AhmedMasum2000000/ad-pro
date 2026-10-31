/**
 * The viewfinder's live state: the clock and the on-air lamp.
 *
 * Both report something real. The clock is Dhaka time, which is where the
 * screens are — a buyer in another timezone asking "are they running right
 * now?" gets the answer without doing the arithmetic. The lamp is lit while
 * the network is on air (09:00–23:00 Dhaka) and on standby outside those
 * hours. Standby is grey, never red: off air is a fact about the clock, not a
 * warning, and the readout says when it comes back.
 *
 * One tick a second, aligned to the second. The clock only shows seconds, so
 * anything faster is paint for nothing on an element that sits over the hero
 * photograph; aligning the interval to the wall clock keeps the display from
 * visibly lagging the real time by up to a second.
 *
 * Shell-level, but the chrome lives inside the home hero, which Barba swaps.
 * So the readouts are looked up on every tick rather than cached once — one
 * `querySelector` a second is nothing, and it means the instrument comes
 * back the moment a visitor returns to the home page, without a rebind.
 *
 * `body.chrome-on` is set here and is the only thing that makes the chrome
 * visible: drop this call from boot() and every trace of the instrument goes
 * with it.
 */

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

const LABEL_ON = 'On air';
const LABEL_OFF = `Off air · back ${String(ON_AIR_FROM).padStart(2, '0')}:00`;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Wall-clock time in Dhaka, whatever the visitor's own clock says. */
function dhakaNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + (DHAKA_OFFSET_MIN + now.getTimezoneOffset()) * 60_000);
}

export const isOnAir = (t: Date = dhakaNow()): boolean =>
  t.getHours() >= ON_AIR_FROM && t.getHours() < ON_AIR_UNTIL;

export function initHud(): HudHandle {
  document.body.classList.add('chrome-on');

  let lastOnAir: boolean | null = null;
  let lastClockText = '';
  let timeout = 0;
  let interval = 0;

  const tick = (): void => {
    const t = dhakaNow();

    const clockText = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
    if (clockText !== lastClockText) {
      lastClockText = clockText;
      document.querySelectorAll<HTMLElement>('[data-hud-clock]').forEach((clock) => {
        clock.textContent = clockText;
      });
    }

    const onAir = isOnAir(t);
    const lamps = document.querySelectorAll<HTMLElement>('[data-hud-lamp]');
    const labels = document.querySelectorAll<HTMLElement>('[data-hud-label]');
    // Only touch the DOM on the two moments a day this changes — or when a
    // fresh page has brought a fresh, unlabelled chrome with it.
    const fresh = Array.from(labels).some((l) => l.textContent !== (onAir ? LABEL_ON : LABEL_OFF));
    if (onAir !== lastOnAir || fresh) {
      lastOnAir = onAir;
      document.body.classList.toggle('is-onair', onAir);
      lamps.forEach((lamp) => {
        lamp.classList.toggle('is-onair', onAir);
        lamp.classList.toggle('is-standby', !onAir);
      });
      labels.forEach((label) => {
        label.textContent = onAir ? LABEL_ON : LABEL_OFF;
      });
    }
  };

  const stop = (): void => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
    timeout = 0;
    interval = 0;
  };

  /** Ticks now, then once a second on the second. */
  const run = (): void => {
    stop();
    tick();
    timeout = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));
  };

  run();

  // A clock in a background tab is telling no one anything.
  const onVisibility = (): void => {
    if (document.hidden) stop();
    else run();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    destroy: () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      document.body.classList.remove('chrome-on', 'is-onair');
    },
  };
}
