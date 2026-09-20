/**
 * Settings: where the site rebuild is wired up, who gets notified, and how to
 * change your own password.
 *
 * The build hook lives in the database rather than in code so it can be changed
 * without a developer, and it is readable only by admins — anyone holding it
 * can force rebuilds of the site.
 */
import { supabase, readableError } from './client';
import {
  el, clear, button, field, input, toast, skeleton, errorBox, legend, formatDate, withBusy,
} from './ui';

export const CONFIG_KEYS = {
  buildHook: 'netlify_build_hook',
  notifyEmail: 'notify_email',
  adminUrl: 'admin_url',
} as const;

export async function getConfig(): Promise<Record<string, string>> {
  const { data } = await supabase.from('app_config').select('key,value');
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']));
}

async function setConfig(key: string, value: string) {
  const { error } = await supabase.from('app_config').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

export async function renderSettings(view: HTMLElement) {
  clear(view).append(skeleton(3));

  const [config, { data: log, error }, { data: session }] = await Promise.all([
    getConfig(),
    supabase.from('publish_log').select('*').order('triggered_at', { ascending: false }).limit(8),
    supabase.auth.getUser(),
  ]);

  if (error) {
    clear(view).append(errorBox(readableError(error), () => renderSettings(view)));
    return;
  }

  /* ---- publishing ---- */
  const hook = input({
    value: config[CONFIG_KEYS.buildHook] ?? '',
    placeholder: 'https://api.netlify.com/build_hooks/…',
    type: 'url',
  });
  const notify = input({
    value: config[CONFIG_KEYS.notifyEmail] ?? '',
    placeholder: 'you@basicblend.in',
    type: 'email',
  });

  const saveConfig = button('Save settings', {
    variant: 'primary',
    iconName: 'check',
    onClick: () =>
      withBusy(saveConfig, 'Saving…', async () => {
        try {
          await setConfig(CONFIG_KEYS.buildHook, hook.value.trim());
          await setConfig(CONFIG_KEYS.notifyEmail, notify.value.trim());
          await setConfig(CONFIG_KEYS.adminUrl, `${location.origin}/admin/`);
          toast('Settings saved');
        } catch (err) {
          toast(readableError(err), 'error');
        }
      }),
  });

  /* ---- password ---- */
  const pass1 = input({ type: 'password', autocomplete: 'new-password', minlength: 12 });
  const pass2 = input({ type: 'password', autocomplete: 'new-password', minlength: 12 });
  const savePass = button('Change password', {
    variant: 'primary',
    onClick: () =>
      withBusy(savePass, 'Changing…', async () => {
        if (pass1.value.length < 12) return toast('Use at least 12 characters.', 'error');
        if (pass1.value !== pass2.value) return toast('The two passwords do not match.', 'error');
        const { error: passError } = await supabase.auth.updateUser({ password: pass1.value });
        if (passError) return toast(readableError(passError), 'error');
        pass1.value = pass2.value = '';
        toast('Password changed');
      }),
  });

  /* ---- publish history ---- */
  const history = el('ul', { class: 'log' });
  for (const entry of log ?? []) {
    history.append(
      el('li', { class: 'log__row' },
        el('span', { text: formatDate(entry.triggered_at) }),
        el('span', { class: `pill pill--${entry.status === 'requested' ? 'live' : 'warn'}`, text: entry.status === 'requested' ? 'Published' : 'Failed' }),
        entry.detail ? el('span', { class: 'log__detail', text: entry.detail }) : null
      )
    );
  }
  if ((log ?? []).length === 0) history.append(el('li', { class: 'log__row' }, el('span', { text: 'Nothing published yet.' })));

  clear(view).append(
    el('div', { class: 'view__head' }, legend('Settings')),

    el('section', { class: 'panel' },
      legend('Publishing', 'Pressing Publish rebuilds the website with your latest changes. It needs the build hook from Netlify → Site configuration → Build & deploy → Build hooks.'),
      field('Netlify build hook URL', hook, { hint: 'Treat this like a password: anyone with it can rebuild the site.' }),
      field('Send new enquiries to', notify, { hint: 'Where the email notification for each new enquiry goes.' }),
      el('div', { class: 'panel__actions' }, saveConfig)
    ),

    el('section', { class: 'panel' },
      legend('Your account', session?.user?.email ?? undefined),
      el('div', { class: 'grid grid--2' },
        field('New password', pass1, { hint: 'At least 12 characters.' }),
        field('Repeat new password', pass2)
      ),
      el('div', { class: 'panel__actions' }, savePass)
    ),

    el('section', { class: 'panel' }, legend('Recent publishes'), history)
  );
}
