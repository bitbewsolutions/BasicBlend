/**
 * The enquiries inbox: a list beside the enquiry you are reading.
 *
 * The job here is answering fast. Everything needed to reply — the number as a
 * WhatsApp link, the message in full, which page it came from — is on screen
 * without a second click, and the status and notes save where they are.
 */
import { supabase, readableError } from './client';
import { services } from '../../data/services';
import {
  el, clear, icon, button, toast, confirmDialog, skeleton, empty, errorBox,
  formatDate, relativeTime, textarea,
} from './ui';

type Status = 'new' | 'contacted' | 'closed' | 'spam';

interface Enquiry {
  id: string;
  created_at: string;
  name: string;
  business: string | null;
  phone: string;
  email: string | null;
  need: string | null;
  message: string;
  source_path: string | null;
  status: Status;
  notes: string | null;
}

const STATUSES: { value: Status; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
];

const serviceTitle = (slug: string | null) => {
  if (!slug) return null;
  if (slug === 'several') return 'A mix of services';
  return services.find((s) => s.slug === slug)?.title ?? slug;
};

let rows: Enquiry[] = [];
let filter: Status | 'all' = 'new';
let search = '';
let selectedId: string | null = null;
/** On a phone the list and the enquiry cannot share the screen; this says which one is showing. */
let detailOpen = false;
let channelOpen = false;

export async function renderEnquiries(view: HTMLElement, wantedId?: string) {
  if (wantedId) {
    selectedId = wantedId;
    detailOpen = true;
  }
  clear(view).append(skeleton(6));

  const { data, error } = await supabase
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    clear(view).append(errorBox(readableError(error), () => renderEnquiries(view)));
    return;
  }

  rows = (data ?? []) as Enquiry[];
  watchForNew(view);
  paint(view);
}

/** New enquiries appear while the panel is open, without a refresh. */
function watchForNew(view: HTMLElement) {
  if (channelOpen) return;
  channelOpen = true;
  supabase
    .channel('enquiries-inbox')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enquiries' }, (payload) => {
      const row = payload.new as Enquiry;
      if (rows.some((r) => r.id === row.id)) return;
      rows = [row, ...rows];
      toast(`New enquiry from ${row.name}`);
      if (document.querySelector('[data-view="enquiries"]')) paint(view);
    })
    .subscribe();
}

function matches(row: Enquiry): boolean {
  if (filter !== 'all' && row.status !== filter) return false;
  if (!search) return true;
  const hay = [row.name, row.business, row.phone, row.email, row.message, serviceTitle(row.need)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(search.toLowerCase());
}

function paint(view: HTMLElement) {
  const visible = rows.filter(matches);
  // Keep reading whatever is open. Marking an enquiry 'contacted' while the
  // list is filtered to 'new' drops it out of the list, and having the pane
  // jump to a stranger mid-reply is how notes end up on the wrong person.
  if (!rows.some((r) => r.id === selectedId)) {
    selectedId = visible[0]?.id ?? null;
    detailOpen = false;
  }

  const counts = Object.fromEntries(
    STATUSES.map((s) => [s.value, rows.filter((r) => r.status === s.value).length])
  ) as Record<Status, number>;

  /* ---- toolbar: filter first, because triage is the usual task ---- */
  const tabs = el('div', { class: 'seg', role: 'tablist', 'aria-label': 'Filter enquiries' });
  for (const s of [...STATUSES, { value: 'all' as const, label: 'All' }]) {
    const active = filter === s.value;
    const count = s.value === 'all' ? rows.length : counts[s.value as Status];
    const tab = el(
      'button',
      {
        class: `seg__btn${active ? ' is-active' : ''}`,
        role: 'tab',
        'aria-selected': String(active),
        onclick: () => {
          filter = s.value as Status | 'all';
          paint(view);
        },
      },
      el('span', { text: s.label }),
      el('span', { class: 'seg__count', text: String(count) })
    );
    tabs.append(tab);
  }

  const searchInput = el('input', {
    class: 'input input--search',
    type: 'search',
    placeholder: 'Search name, phone, message…',
    value: search,
    'aria-label': 'Search enquiries',
  });
  searchInput.addEventListener('input', () => {
    search = searchInput.value;
    paint(view);
    // Repainting replaces the node, so put the cursor back where it was.
    const next = view.querySelector<HTMLInputElement>('.input--search');
    next?.focus();
    next?.setSelectionRange(next.value.length, next.value.length);
  });

  const toolbar = el(
    'div',
    { class: 'toolbar' },
    tabs,
    el('div', { class: 'toolbar__search' }, icon('search', 16), searchInput)
  );

  /* ---- list ---- */
  const list = el('ul', { class: 'inbox__list' });
  for (const row of visible) {
    const item = el(
      'li',
      {},
      el(
        'button',
        {
          class: `row${row.id === selectedId ? ' is-selected' : ''}`,
          'aria-current': row.id === selectedId ? 'true' : undefined,
          onclick: () => {
            selectedId = row.id;
            detailOpen = true;
            location.hash = `#/enquiries/${row.id}`;
            paint(view);
            view.querySelector('.detail')?.scrollIntoView({ block: 'nearest' });
          },
        },
        el(
          'span',
          { class: 'row__top' },
          el('span', { class: 'row__name', text: row.name }),
          el('span', { class: 'row__time', text: relativeTime(row.created_at) })
        ),
        el('span', { class: 'row__sub', text: row.business || serviceTitle(row.need) || row.phone }),
        el('span', { class: `dot dot--${row.status}`, title: row.status })
      )
    );
    list.append(item);
  }

  const listPane = el('div', { class: 'inbox__pane' }, toolbar, visible.length ? list : emptyFor());

  /* ---- detail ---- */
  const selected = rows.find((r) => r.id === selectedId);
  const detail = selected
    ? detailPane(selected, view)
    : el('div', { class: 'detail detail--blank' }, el('p', { text: 'Select an enquiry to read it.' }));

  clear(view).append(
    el('div', { class: 'inbox', dataset: { view: 'enquiries', detail: String(detailOpen && !!selected) } }, listPane, detail)
  );
}

function emptyFor() {
  if (search) return empty('Nothing matches', `No enquiry matches “${search}”.`);
  if (filter === 'new') return empty('Inbox clear', 'Every enquiry has been dealt with. New ones land here and email you.');
  return empty('Nothing here', `No enquiries marked ${filter}.`);
}

function detailPane(row: Enquiry, view: HTMLElement): HTMLElement {
  const pane = el('div', { class: 'detail' });

  const back = button('Back to list', { iconName: 'back', variant: 'quiet', onClick: () => {
    detailOpen = false;
    location.hash = '#/enquiries';
    paint(view);
  }});
  back.classList.add('detail__back');

  const head = el(
    'header',
    { class: 'detail__head' },
    back,
    el('h2', { class: 'detail__name', text: row.name }),
    el('p', { class: 'detail__when', text: `${formatDate(row.created_at)} · ${relativeTime(row.created_at)}` })
  );
  if (row.business) head.append(el('p', { class: 'detail__biz', text: row.business }));

  /* Reply actions first: this is what the page is for. */
  const waText = encodeURIComponent(
    `Hi ${row.name.split(' ')[0]}, thanks for your enquiry to Basic Blend.`
  );
  const waNumber = row.phone.replace(/\D/g, '').replace(/^0+/, '');
  const actions = el(
    'div',
    { class: 'detail__actions' },
    link(`https://wa.me/${waNumber.length === 10 ? '91' + waNumber : waNumber}?text=${waText}`, 'WhatsApp', 'whatsapp', true),
    link(`tel:${row.phone}`, row.phone, 'phone'),
    row.email ? link(`mailto:${row.email}`, row.email, 'mail') : null
  );

  const facts = el('dl', { class: 'facts' });
  const fact = (label: string, value: string) => {
    facts.append(el('dt', { text: label }), el('dd', { text: value }));
  };
  if (serviceTitle(row.need)) fact('Interested in', serviceTitle(row.need)!);
  if (row.source_path) fact('Sent from', row.source_path);
  fact('Received', formatDate(row.created_at));

  const message = el('div', { class: 'message' }, el('p', { class: 'message__label', text: 'Their message' }));
  // Keep the sender's line breaks; CSS white-space handles the rest.
  message.append(el('p', { class: 'message__body', text: row.message }));

  /* ---- status ---- */
  const statusRow = el('div', { class: 'seg seg--status' });
  for (const s of STATUSES) {
    const active = row.status === s.value;
    statusRow.append(
      el('button', {
        class: `seg__btn${active ? ' is-active' : ''}`,
        text: s.label,
        'aria-pressed': String(active),
        onclick: async () => {
          const previous = row.status;
          row.status = s.value;
          paint(view);
          const { error } = await supabase.from('enquiries').update({ status: s.value }).eq('id', row.id);
          if (error) {
            row.status = previous;
            paint(view);
            toast(readableError(error), 'error');
          }
        },
      })
    );
  }

  /* ---- private notes, saved on blur ---- */
  const notes = textarea({ rows: 3, placeholder: 'Private notes: what was quoted, when to follow up…' });
  notes.value = row.notes ?? '';
  const savedMark = el('span', { class: 'notes__state', text: '' });
  notes.addEventListener('blur', async () => {
    const value = notes.value.trim() || null;
    if (value === (row.notes ?? null)) return;
    savedMark.textContent = 'Saving…';
    const { error } = await supabase.from('enquiries').update({ notes: value }).eq('id', row.id);
    if (error) {
      savedMark.textContent = '';
      toast(readableError(error), 'error');
      return;
    }
    row.notes = value;
    savedMark.textContent = 'Saved';
    setTimeout(() => (savedMark.textContent = ''), 2000);
  });

  const del = button('Delete enquiry', {
    variant: 'danger',
    iconName: 'trash',
    onClick: async () => {
      const ok = await confirmDialog({
        title: 'Delete this enquiry?',
        body: `${row.name}'s enquiry will be removed permanently. Mark it as spam instead if you only want it out of the way.`,
        confirmLabel: 'Delete permanently',
      });
      if (!ok) return;
      const { error } = await supabase.from('enquiries').delete().eq('id', row.id);
      if (error) return toast(readableError(error), 'error');
      rows = rows.filter((r) => r.id !== row.id);
      selectedId = null;
      detailOpen = false;
      toast('Enquiry deleted');
      paint(view);
    },
  });

  pane.append(
    head,
    actions,
    message,
    facts,
    el('div', { class: 'detail__block' },
      el('div', { class: 'detail__block-head' }, el('h3', { text: 'Status' })),
      statusRow
    ),
    el('div', { class: 'detail__block' },
      el('div', { class: 'detail__block-head' }, el('h3', { text: 'Notes' }), savedMark),
      notes
    ),
    el('div', { class: 'detail__foot' }, del)
  );
  return pane;
}

function link(href: string, label: string, iconName: string, external = false) {
  const a = el('a', {
    class: 'chip',
    href,
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
  });
  a.append(icon(iconName, 16), el('span', { text: label }));
  return a;
}
