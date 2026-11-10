/**
 * The brief builder on the contact page.
 *
 * There is no backend. The form composes a plain-text brief from its fields
 * and hands it to whichever channel the visitor picks: a structured mailto,
 * a WhatsApp deep link, or the clipboard. The same text is mirrored live into
 * a preview as they type, so what they are about to send is never a surprise
 * — and so a visitor who would rather call can read the brief down the phone.
 *
 * Fields are read by name, not by position, so OWNER D can reorder or add a
 * field and the brief still comes out right; an unknown field is listed under
 * its label at the end rather than dropped.
 */

import { qs, qsa } from '../lib/dom';

export interface BriefHandle {
  destroy: () => void;
}

const DEFAULT_TO = 'info@adprobd.com';
const DEFAULT_WA = '8801958503753';

/** The brief's lines, in the order the office reads them. */
const LINES: Array<[label: string, field: string]> = [
  ['Cities or areas', 'city'],
  ['Campaign window', 'window'],
  ['Format (digital / static / open)', 'format'],
  ['Artwork exists', 'artwork'],
  ['Budget range', 'budget'],
  ['Best number', 'phone'],
  ['Name', 'name'],
  ['Company', 'company'],
  ['Email', 'email'],
];

const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function readValues(form: HTMLFormElement): Map<string, string> {
  const data = new FormData(form);
  const values = new Map<string, string[]>();
  data.forEach((value, key) => {
    if (typeof value !== 'string') return;
    const v = value.trim();
    if (!v) return;
    const list = values.get(key) ?? [];
    list.push(v);
    values.set(key, list);
  });

  const out = new Map<string, string>();
  values.forEach((list, key) => out.set(key, list.join(', ')));

  // The two dates read as one line: "1 Nov 2026 to 30 Nov 2026".
  const from = out.get('from');
  const to = out.get('to');
  if (from || to) {
    const fmt = (iso: string | undefined): string => {
      if (!iso) return '';
      const d = new Date(`${iso}T00:00:00`);
      return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    out.set('window', [fmt(from), fmt(to)].filter(Boolean).join(' to '));
    out.delete('from');
    out.delete('to');
  }
  return out;
}

function compose(values: Map<string, string>): { subject: string; body: string } {
  const used = new Set<string>();
  const lines = LINES.map(([label, field]) => {
    used.add(field);
    return `${label}: ${values.get(field) ?? ''}`;
  });
  values.forEach((value, key) => {
    if (!used.has(key)) lines.push(`${titleCase(key)}: ${value}`);
  });

  const cities = values.get('city');
  const window_ = values.get('window');
  const subject = `Brief: ${[cities ?? 'Bangladesh', window_].filter(Boolean).join(', ')}`;
  return { subject, body: lines.join('\n') };
}

export function initBrief(scope: ParentNode = document): BriefHandle {
  const form = qs<HTMLFormElement>('form[data-brief]', scope);
  if (!form) return { destroy: () => {} };

  const preview = qs<HTMLElement>('[data-brief-preview]', form);
  const to = form.dataset.briefTo || DEFAULT_TO;
  const wa = (form.dataset.briefWa || DEFAULT_WA).replace(/\D/g, '');

  let feedbackTimer = 0;

  const current = (): { subject: string; body: string } => compose(readValues(form));

  const render = (): void => {
    if (!preview) return;
    preview.textContent = current().body;
  };

  /** A short confirmation in the preview, then back to the brief. */
  const flash = (message: string): void => {
    if (!preview) return;
    window.clearTimeout(feedbackTimer);
    preview.textContent = message;
    feedbackTimer = window.setTimeout(render, 1800);
  };

  const sendMail = (): void => {
    const { subject, body } = current();
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const sendWhatsApp = (): void => {
    const { subject, body } = current();
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(`${subject}\n${body}`)}`;
    window.open(url, '_blank', 'noopener');
  };

  const copy = async (): Promise<void> => {
    const { subject, body } = current();
    const text = `${subject}\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      flash('Copied — paste it into any message.');
    } catch {
      // No clipboard permission (or an insecure context): the preview holds
      // the text, so selecting it is the honest fallback.
      if (preview) {
        const range = document.createRange();
        range.selectNodeContents(preview);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
      flash('Select the text below and copy it.');
    }
  };

  const onSubmit = (event: Event): void => {
    event.preventDefault();
    sendMail();
  };

  const onClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const send = target.closest<HTMLElement>('[data-brief-send]');
    if (send && send.dataset.briefSend === 'whatsapp') {
      event.preventDefault();
      sendWhatsApp();
      return;
    }
    if (target.closest('[data-brief-copy]')) {
      event.preventDefault();
      void copy();
    }
  };

  form.addEventListener('submit', onSubmit);
  form.addEventListener('click', onClick);
  form.addEventListener('input', render);
  form.addEventListener('change', render);

  // Chips mirror their checked state for engines without :has().
  const chips = qsa<HTMLInputElement>('.chip input', form);
  const onChip = (event: Event): void => {
    const input = event.currentTarget as HTMLInputElement;
    const group = input.type === 'radio' ? qsa<HTMLInputElement>(`input[name="${input.name}"]`, form) : [input];
    group.forEach((i) => i.closest('.chip')?.classList.toggle('is-checked', i.checked));
  };
  chips.forEach((chip) => {
    chip.closest('.chip')?.classList.toggle('is-checked', chip.checked);
    chip.addEventListener('change', onChip);
  });

  render();

  return {
    destroy: () => {
      window.clearTimeout(feedbackTimer);
      form.removeEventListener('submit', onSubmit);
      form.removeEventListener('click', onClick);
      form.removeEventListener('input', render);
      form.removeEventListener('change', render);
      chips.forEach((chip) => chip.removeEventListener('change', onChip));
    },
  };
}
