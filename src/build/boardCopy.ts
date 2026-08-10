/**
 * Per-site copy.
 *
 * Fifty-eight listing pages that differ only in a heading are fifty-seven
 * pages of duplicate content, which is worth nothing to a search engine and
 * less than nothing to a visitor. Everything here is derived from the site's
 * own specification — its size and shape, how many hours it runs, how fine
 * its pitch is, what it faces — so two pages read differently because the two
 * screens genuinely are different.
 *
 * No rates appear anywhere. Screen time is quoted per site, so every page
 * ends at the phone number instead of a number.
 */

import { company, type Billboard } from '../data/site';

/* --- derived facts ---------------------------------------------------------
   The deck writes sizes as `W-30' x H-20'`, occasionally in inches and
   occasionally with a doubled quote mark. Parsing rather than reprinting lets
   the copy say "wider than it is tall" and mean it.                        */

export interface Dimensions {
  width: number;
  height: number;
  unit: 'ft' | 'in';
  ratio: number;
}

export function parseDimension(value: string): Dimensions | null {
  const match = /W-?\s*([\d.]+)\s*('{1,2}|"|”|ft)?\s*[x×]\s*H-?\s*([\d.]+)\s*('{1,2}|"|”|ft)?/i.exec(
    value,
  );
  if (!match) return null;

  const width = Number(match[1]);
  const height = Number(match[3]);
  if (!width || !height) return null;

  // A doubled quote is inches. Both sites that use it are small indoor
  // screens, and calling a 20-inch panel "20 feet wide" would be nonsense.
  const unit: 'ft' | 'in' = match[2] === "''" || match[2] === '"' || match[2] === '”' ? 'in' : 'ft';
  return { width, height, unit, ratio: width / height };
}

export const areaOf = (d: Dimensions): number => Math.round(d.width * d.height);

export function orientationOf(d: Dimensions): 'landscape' | 'portrait' | 'square' {
  if (d.ratio > 1.15) return 'landscape';
  if (d.ratio < 0.87) return 'portrait';
  return 'square';
}

/** Pitch in millimetres, from the "P5"/"P6"/"P10" model name. */
export function pitchOf(board: Billboard): number | null {
  const match = /P\s*(\d+(?:\.\d+)?)/i.exec(board.ledModel);
  return match ? Number(match[1]) : null;
}

/**
 * Roughly how far back a screen has to be read from before the pixel grid
 * stops being visible — the industry rule of thumb is one metre per
 * millimetre of pitch. It is an approximation and the copy says so.
 */
export function viewingDistance(board: Billboard): number | null {
  const pitch = pitchOf(board);
  return pitch ? Math.round(pitch) : null;
}

export function sizeWords(board: Billboard): string {
  const d = parseDimension(board.dimension);
  if (!d) return board.dimension;
  const unit = d.unit === 'in' ? 'inch' : 'ft';
  return `${d.width}${unit} × ${d.height}${unit}`;
}

/* --- prose ---------------------------------------------------------------- */

const orientationLine = (board: Billboard): string => {
  const d = parseDimension(board.dimension);
  if (!d) return '';
  if (d.unit === 'in') {
    return 'a compact indoor panel, read at close range rather than across a junction';
  }
  const shape = orientationOf(d);
  if (shape === 'portrait') {
    return 'a portrait screen, which suits a single product shot or a stacked headline better than a wide lock-up';
  }
  if (shape === 'square') {
    return 'close to square, so artwork built for either orientation adapts without a redraw';
  }
  return 'a landscape screen, which is the shape most brand lock-ups and film cuts are already built for';
};

const scaleLine = (board: Billboard): string => {
  const d = parseDimension(board.dimension);
  if (!d || d.unit === 'in') return '';
  const area = areaOf(d);
  if (area >= 700) return 'one of the largest faces in the network';
  if (area >= 400) return 'a large face by any measure';
  if (area >= 200) return 'a mid-sized face';
  return 'a compact face, close to the traffic rather than above it';
};

/** The one-sentence summary that becomes the meta description. */
export function boardSummary(board: Billboard): string {
  const size = sizeWords(board);
  const hours = board.hours ? `${board.hours} a day` : 'daily';
  return `${board.title} is a ${size} LED billboard in ${board.city} facing ${board.facing}, on air ${hours}. Call ${company.phone} for availability and price.`;
}

/** The opening paragraph on the listing page. */
export function boardIntro(board: Billboard): string {
  const size = sizeWords(board);
  const scale = scaleLine(board);
  const scalePart = scale ? `, ${scale}` : '';
  const window = board.schedule ? ` The screen runs ${board.schedule}` : ' The screen runs daily';
  const hours = board.hours ? `, ${board.hours} of on-air time` : '';
  const brk =
    board.breakTime && !/^n\/?a$/i.test(board.breakTime)
      ? `, with a maintenance break at ${board.breakTime}`
      : '';

  return `${board.title} is a ${size} LED screen in ${board.city}${scalePart}, facing ${board.facing}.${window}${hours}${brk}.`;
}

/** The second paragraph — technical, and different per screen. */
export function boardTechnical(board: Billboard): string {
  const parts: string[] = [];
  const shape = orientationLine(board);
  if (shape) parts.push(`It is ${shape}.`);

  const pitch = pitchOf(board);
  const distance = viewingDistance(board);
  if (pitch && distance) {
    parts.push(
      `The panel is ${board.ledModel} — ${pitch}mm between pixels, which reads cleanly from about ${distance} metres back and further, so it is built for the traffic passing it rather than for someone standing underneath.`,
    );
  }

  parts.push(
    `Artwork is delivered at ${board.resolution} in ${board.format}. Minimum booking is ${board.minimum || '60 min/day'}, and every campaign closes with a ${(board.reporting || 'log summary').toLowerCase()} showing when each spot actually played.`,
  );

  return parts.join(' ');
}

/** Why this site, in the language a planner would use. */
export function boardAudience(board: Billboard): string {
  const d = parseDimension(board.dimension);
  const big = d && d.unit === 'ft' && areaOf(d) >= 400;

  const cityLine =
    board.city === 'Dhaka'
      ? 'Dhaka carries the densest and slowest traffic in the country, which is what makes an out-of-home second here worth more than a second anywhere else.'
      : `${board.city} concentrates its traffic through a handful of junctions, so a single well-placed screen reaches a large share of the city rather than a slice of it.`;

  const useLine = big
    ? 'At this size the screen carries a full-motion cut without losing the logo, so it suits launches and brand films as readily as a price message.'
    : 'At this size the rule is one idea and one lock-up — short copy, high contrast, and the brand mark large enough to read at a glance.';

  return `${cityLine} ${useLine} Screen time is sold by the minute per day; tell us the window you want and we will confirm what is open on this face.`;
}

/* --- questions -------------------------------------------------------------
   Four per site, answered from that site's own row of the inventory. These
   feed both the visible FAQ and the FAQPage structured data.               */

export function boardFaqs(board: Billboard): { q: string; a: string }[] {
  const size = sizeWords(board);
  const pitch = pitchOf(board);
  const distance = viewingDistance(board);

  const entries: { q: string; a: string }[] = [
    {
      q: `How much does it cost to advertise on ${board.title}?`,
      a: `Screen time on this site is quoted rather than published, because the price depends on how many minutes a day you take and how long the campaign runs. Call ${company.phone} or email ${company.email} with your dates and you will have a written price, production included, within one working day.`,
    },
    {
      q: `What size is the ${board.title} screen?`,
      a: `${size}, running artwork at ${board.resolution}. Files are supplied as ${board.format}${
        pitch ? `, on a ${board.ledModel} panel — ${pitch}mm pixel pitch` : ''
      }.`,
    },
    {
      q: `What hours does the ${board.title} billboard run?`,
      a: board.schedule
        ? `${board.schedule}${board.hours ? `, which is ${board.hours} of on-air time a day` : ''}${
            board.breakTime && !/^n\/?a$/i.test(board.breakTime)
              ? `. There is a maintenance break at ${board.breakTime}`
              : ''
          }. Minimum booking is ${board.minimum || '60 min/day'}.`
        : `The screen runs daily${board.hours ? `, ${board.hours} of on-air time` : ''}. Minimum booking is ${board.minimum || '60 min/day'}. Call ${company.phone} for the current on-air window.`,
    },
    {
      q: `Which direction does ${board.title} face?`,
      a: `It faces ${board.facing}${
        distance ? `, and reads clearly from roughly ${distance} metres back and beyond` : ''
      }. Traffic approaching from that side has the screen in view for the length of the queue.`,
    },
  ];

  return entries;
}
