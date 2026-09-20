/**
 * The panel's shell: sign-in gate, navigation, and the Publish button.
 *
 * Routing is by hash (#/enquiries/<id>) so the panel stays a single static page
 * and the notification email can link straight to one enquiry.
 */
import { supabase, readableError } from './client';
import { el, clear, icon, button, toast, relativeTime, withBusy } from './ui';
import { renderEnquiries } from './enquiries';
import { renderProjects } from './projects';
import { renderReels } from './reels';
import { renderIdentities } from './identities';
import { renderSettings, getConfig, CONFIG_KEYS } from './settings';

const SECTIONS = [
  { id: 'enquiries', label: 'Enquiries', iconName: 'inbox' },
  { id: 'projects', label: 'Projects', iconName: 'work' },
  { id: 'reels', label: 'Reels', iconName: 'film' },
  { id: 'identities', label: 'Logos', iconName: 'identity' },
  { id: 'settings', label: 'Settings', iconName: 'settings' },
] as const;

const boot = document.getElementById('boot') as HTMLElement;
const gate = document.getElementById('gate') as HTMLElement;
const shell = document.getElementById('shell') as HTMLElement;
const view = document.getElementById('view') as HTMLElement;
const nav = document.getElementById('nav') as HTMLElement;
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const loginError = document.getElementById('login-error') as HTMLElement;

/* ------------------------------------------------------------- sign in */

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = loginForm.querySelector('button[type=submit]') as HTMLButtonElement;
  const email = (document.getElementById('email') as HTMLInputElement).value.trim();
  const password = (document.getElementById('password') as HTMLInputElement).value;
  loginError.textContent = '';

  await withBusy(submit, 'Signing in…', async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = readableError(error);
      return;
    }
    await start();
  });
});

async function signOut() {
  await supabase.auth.signOut();
  location.hash = '';
  shell.hidden = true;
  gate.hidden = false;
}

/* -------------------------------------------------------------- routing */

function currentRoute() {
  const [section = 'enquiries', id] = location.hash.replace(/^#\/?/, '').split('/');
  return { section: SECTIONS.some((s) => s.id === section) ? section : 'enquiries', id };
}

async function route() {
  const { section, id } = currentRoute();

  for (const btn of nav.querySelectorAll<HTMLButtonElement>('.nav__btn')) {
    const active = btn.dataset.section === section;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  }

  view.scrollTop = 0;

  switch (section) {
    case 'projects':
      return renderProjects(view, id);
    case 'reels':
      return renderReels(view, id);
    case 'identities':
      return renderIdentities(view);
    case 'settings':
      return renderSettings(view);
    default:
      return renderEnquiries(view, id);
  }
}

/* -------------------------------------------------------------- publish */

const publishBtn = document.getElementById('publish') as HTMLButtonElement;
const publishState = document.getElementById('publish-state') as HTMLElement;

/**
 * The site is static, so changes go live on the next build. This compares the
 * newest content change with the last publish and says so plainly, rather than
 * leaving the client to wonder why the site looks unchanged.
 */
async function refreshPublishState() {
  const [{ data: changedAt }, { data: log }] = await Promise.all([
    supabase.rpc('content_updated_at'),
    supabase.from('publish_log').select('triggered_at').order('triggered_at', { ascending: false }).limit(1),
  ]);

  const lastPublish = log?.[0]?.triggered_at ? new Date(log[0].triggered_at) : null;
  const lastChange = changedAt ? new Date(changedAt as string) : null;
  clear(publishState);

  if (lastChange && (!lastPublish || lastChange > lastPublish)) {
    publishState.append(el('span', { class: 'pill pill--warn', text: 'Unpublished changes' }));
    publishBtn.classList.add('btn--primary');
    publishBtn.classList.remove('btn--ghost');
  } else if (lastPublish) {
    publishState.append(el('span', { class: 'bar__note', text: `Published ${relativeTime(log![0].triggered_at)}` }));
    publishBtn.classList.remove('btn--primary');
    publishBtn.classList.add('btn--ghost');
  }
}

publishBtn.addEventListener('click', () =>
  withBusy(publishBtn, 'Publishing…', async () => {
    const config = await getConfig();
    if (!config[CONFIG_KEYS.buildHook]) {
      toast('Add the Netlify build hook in Settings first.', 'error');
      location.hash = '#/settings';
      return;
    }

    const { data, error } = await supabase.functions.invoke('trigger-build');
    if (error || (data as { ok?: boolean })?.ok === false) {
      toast(readableError(error ?? (data as { error?: string })?.error ?? 'Publish failed.'), 'error');
      return;
    }
    toast('Publishing. The site updates in about a minute.');
    await refreshPublishState();
  })
);

/* ---------------------------------------------------------------- start */

function buildNav() {
  clear(nav);
  for (const section of SECTIONS) {
    const btn = el(
      'button',
      {
        class: 'nav__btn',
        dataset: { section: section.id },
        onclick: () => {
          location.hash = `#/${section.id}`;
        },
      },
      icon(section.iconName, 18),
      el('span', { text: section.label })
    );
    nav.append(btn);
  }
}

async function start() {
  const { data } = await supabase.auth.getSession();
  boot.hidden = true;
  if (!data.session) {
    gate.hidden = false;
    shell.hidden = true;
    return;
  }

  // Signed in is not the same as allowed: the allowlist is what the database
  // checks, so the panel checks it too instead of showing empty screens.
  const { data: allowed, error } = await supabase.rpc('is_admin');
  if (error || !allowed) {
    await supabase.auth.signOut();
    gate.hidden = false;
    shell.hidden = true;
    loginError.textContent = 'That account is not an admin of this site.';
    return;
  }

  gate.hidden = true;
  shell.hidden = false;
  buildNav();
  await route();
  refreshPublishState();
}

document.getElementById('signout')?.addEventListener('click', signOut);
window.addEventListener('hashchange', route);

// Keep the publish banner honest while the panel sits open.
setInterval(() => {
  if (!shell.hidden) refreshPublishState();
}, 60_000);

start();
