/**
 * DOM primitives for the panel.
 *
 * Everything here builds real nodes and sets text with textContent rather than
 * innerHTML. That is not style: enquiry text is written by strangers on the
 * internet, and it lands in this panel. The only HTML strings in the whole
 * admin are the icon paths below, which we author.
 */

type Child = Node | string | number | null | undefined | false;

interface Props {
  class?: string;
  text?: string | number;
  html?: never;
  [key: string]: unknown;
}

/** el('button', { class: 'btn', onclick }, 'Save') */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'dataset') Object.assign(node.dataset, value as object);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2), value as EventListener);
    } else if (key in node && key !== 'list' && key !== 'type' && key !== 'role') {
      (node as unknown as Record<string, unknown>)[key] = value;
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}

export function clear(node: Element) {
  node.replaceChildren();
  return node;
}

/* ------------------------------------------------------------------ icons */

/**
 * One family, 24px box, 1.75 stroke, round caps — drawn here rather than
 * pulled from a font or an emoji so they all match.
 */
const PATHS: Record<string, string> = {
  inbox: 'M3 13h5l1.5 3h5L16 13h5M3 13l3-8h12l3 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z',
  work: 'M3 7h18v13H3zM3 7l2-3h14l2 3M9 12h6',
  film: 'M4 4h16v16H4zM9 4v16M15 4v16M4 9h5M15 9h5M4 15h5M15 15h5',
  identity: 'M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4ZM9.5 12l1.8 1.8L15 10',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  check: 'M4 12.5 9 17.5 20 6.5',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M19 12H5M11 18l-6-6 6-6',
  phone: 'M7 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 5 5a2 2 0 0 1 2-2Z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  whatsapp:
    'M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3ZM9.2 8.4c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.5.6c-.1.2-.2.3 0 .6a7 7 0 0 0 3.2 2.7c.3.1.4 0 .6-.1l.6-.7c.2-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.4a2 2 0 0 1-1.3 1.6 4 4 0 0 1-3-.4 11 11 0 0 1-4.6-4.3c-.6-1-.8-2-.6-2.8a2 2 0 0 1 .5-.8Z',
  publish: 'M12 20V8M6 14l6-6 6 6M5 4h14',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M18 13l-6 6-6-6',
  external: 'M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  signout: 'M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6',
  alert: 'M12 8v5M12 16.5v.5M10.3 4.3 2.6 18a1.5 1.5 0 0 0 1.3 2.2h16.2a1.5 1.5 0 0 0 1.3-2.2L13.7 4.3a1.5 1.5 0 0 0-2.6 0Z',
};

export function icon(name: keyof typeof PATHS | string, size = 18): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('icon');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', PATHS[name] ?? PATHS.alert);
  svg.append(path);
  return svg;
}

/* ----------------------------------------------------------------- pieces */

export function button(
  label: string,
  opts: { variant?: 'primary' | 'ghost' | 'danger' | 'quiet'; iconName?: string; onClick?: () => void; title?: string; type?: string } = {}
) {
  const { variant = 'ghost', iconName, onClick, title, type = 'button' } = opts;
  const b = el('button', { class: `btn btn--${variant}`, type, title, onclick: onClick });
  if (iconName) b.append(icon(iconName, 16));
  b.append(el('span', { text: label }));
  return b;
}

/** A labelled control. `hint` explains the rule before it is broken. */
export function field(
  label: string,
  control: HTMLElement,
  opts: { hint?: string; required?: boolean } = {}
) {
  const id = control.id || `f-${Math.random().toString(36).slice(2, 9)}`;
  control.id = id;
  const wrap = el('div', { class: 'field' });
  const lab = el('label', { class: 'field__label', for: id }, label);
  if (opts.required) lab.append(el('span', { class: 'field__req', text: '*', title: 'Required' }));
  wrap.append(lab, control);
  if (opts.hint) wrap.append(el('p', { class: 'field__hint', text: opts.hint }));
  return wrap;
}

export function input(props: Props = {}) {
  return el('input', { class: 'input', type: 'text', ...props });
}

export function textarea(props: Props = {}) {
  return el('textarea', { class: 'input input--area', rows: 4, ...props });
}

export function select(options: { value: string; label: string }[], props: Props = {}) {
  const s = el('select', { class: 'input input--select', ...props });
  for (const o of options) s.append(el('option', { value: o.value, text: o.label }));
  return s;
}

export function checkbox(label: string, checked: boolean, onChange: (v: boolean) => void) {
  const box = el('input', { type: 'checkbox', class: 'check__box', checked });
  box.addEventListener('change', () => onChange(box.checked));
  return el('label', { class: 'check' }, box, el('span', { text: label }));
}

/** Section heading inside a view. */
export function legend(text: string, note?: string) {
  const wrap = el('div', { class: 'legend' }, el('h2', { text }));
  if (note) wrap.append(el('p', { class: 'legend__note', text: note }));
  return wrap;
}

export function empty(title: string, body: string, action?: HTMLElement) {
  const box = el('div', { class: 'empty' }, icon('inbox', 28), el('h3', { text: title }), el('p', { text: body }));
  if (action) box.append(action);
  return box;
}

/** Placeholder rows while data loads: layout stays put, nothing jumps. */
export function skeleton(rows = 5) {
  const wrap = el('div', { class: 'skeleton' });
  for (let i = 0; i < rows; i++) wrap.append(el('div', { class: 'skeleton__row' }));
  return wrap;
}

export function errorBox(message: string, retry?: () => void) {
  const box = el('div', { class: 'notice notice--error' }, icon('alert', 20), el('p', { text: message }));
  if (retry) box.append(button('Try again', { onClick: retry }));
  return box;
}

/* ----------------------------------------------------------------- toasts */

let toastHost: HTMLElement | null = null;

export function toast(message: string, kind: 'ok' | 'error' = 'ok') {
  toastHost ??= document.body.appendChild(el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' }));
  const node = el('div', { class: `toast toast--${kind}` }, icon(kind === 'ok' ? 'check' : 'alert', 16), el('span', { text: message }));
  toastHost.append(node);
  setTimeout(() => {
    node.classList.add('is-out');
    node.addEventListener('transitionend', () => node.remove(), { once: true });
  }, kind === 'ok' ? 2600 : 5200);
}

/**
 * Destructive confirmation. A real <dialog> so focus is trapped, Esc works and
 * nothing can be clipped by an overflow ancestor.
 */
export function confirmDialog(opts: { title: string; body: string; confirmLabel: string }): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog' });
    let answer = false;
    dialog.append(
      el('h2', { class: 'dialog__title', text: opts.title }),
      el('p', { class: 'dialog__body', text: opts.body }),
      el(
        'div',
        { class: 'dialog__actions' },
        button('Cancel', { onClick: () => dialog.close() }),
        button(opts.confirmLabel, {
          variant: 'danger',
          onClick: () => {
            answer = true;
            dialog.close();
          },
        })
      )
    );
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(answer);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}

/* ------------------------------------------------------------------ dates */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Run an async action with the button disabled and saying what it is doing. */
export async function withBusy<T>(btn: HTMLButtonElement, busyLabel: string, run: () => Promise<T>): Promise<T | undefined> {
  const label = btn.querySelector('span');
  const original = label?.textContent ?? '';
  btn.disabled = true;
  btn.classList.add('is-busy');
  if (label) label.textContent = busyLabel;
  try {
    return await run();
  } finally {
    btn.disabled = false;
    btn.classList.remove('is-busy');
    if (label) label.textContent = original;
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
