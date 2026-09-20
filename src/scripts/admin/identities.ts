/**
 * Identities: logos delivered to clients, shown on /work/ and the branding
 * service page.
 *
 * These are small records, so they are edited in place in the list rather than
 * behind a second screen.
 */
import { supabase, readableError, publicUrl } from './client';
import {
  el, clear, icon, button, field, input, textarea, checkbox, toast, confirmDialog,
  skeleton, empty, errorBox, legend, withBusy,
} from './ui';
import { uploadImage, deleteFiles, filePicker } from './media';

interface Identity {
  id: string;
  client: string;
  sector: string;
  image_path: string;
  alt: string;
  width: number | null;
  height: number | null;
  published: boolean;
  sort: number;
}

export async function renderIdentities(view: HTMLElement) {
  clear(view).append(skeleton(3));

  const { data, error } = await supabase.from('identities').select('*').order('sort').order('created_at');
  if (error) {
    clear(view).append(errorBox(readableError(error), () => renderIdentities(view)));
    return;
  }

  const rows = (data ?? []) as Identity[];

  const addPicker = filePicker('image/*', false, async (files) => {
    try {
      const up = await uploadImage(files[0], 'identities');
      const { error: insertError } = await supabase.from('identities').insert({
        client: 'New client',
        sector: '',
        image_path: up.path,
        alt: '',
        width: up.width,
        height: up.height,
        published: false,
        sort: rows.length,
      });
      if (insertError) throw insertError;
      toast('Logo added — fill in the details');
      renderIdentities(view);
    } catch (err) {
      toast(readableError(err), 'error');
    }
  });

  const head = el(
    'div',
    { class: 'view__head' },
    legend('Logos & identities', 'Delivered identity work. Shown as work, never as a “trusted by” wall.'),
    button('Add logo', { variant: 'primary', iconName: 'plus', onClick: () => addPicker.click() })
  );

  if (rows.length === 0) {
    clear(view).append(head, addPicker, empty('No logos yet', 'Add a logo you designed and it appears with the identity work.',
      button('Add logo', { variant: 'primary', iconName: 'plus', onClick: () => addPicker.click() })));
    return;
  }

  const list = el('div', { class: 'ident-list' });

  rows.forEach((row, index) => {
    const client = input({ value: row.client, maxlength: 120 });
    const sector = input({ value: row.sector, maxlength: 160, placeholder: 'e.g. Hardware and modular kitchens' });
    const alt = textarea({ rows: 2, maxlength: 500, placeholder: 'Describe the mark for people who cannot see it' });
    alt.value = row.alt;

    const replacePicker = filePicker('image/*', false, async (files) => {
      try {
        const up = await uploadImage(files[0], 'identities');
        const { error: updateError } = await supabase
          .from('identities')
          .update({ image_path: up.path, width: up.width, height: up.height })
          .eq('id', row.id);
        if (updateError) throw updateError;
        await deleteFiles([row.image_path]);
        toast('Logo replaced');
        renderIdentities(view);
      } catch (err) {
        toast(readableError(err), 'error');
      }
    });

    const save = button('Save', {
      variant: 'primary',
      iconName: 'check',
      onClick: () =>
        withBusy(save, 'Saving…', async () => {
          if (!client.value.trim() || !sector.value.trim()) return toast('Client and sector are both needed.', 'error');
          if (!alt.value.trim()) return toast('Describe the logo for screen readers.', 'error');
          const { error: saveError } = await supabase
            .from('identities')
            .update({
              client: client.value.trim(),
              sector: sector.value.trim(),
              alt: alt.value.trim(),
              published: row.published,
              sort: row.sort,
            })
            .eq('id', row.id);
          if (saveError) return toast(readableError(saveError), 'error');
          toast('Saved');
        }),
    });

    const move = async (dir: -1 | 1) => {
      const other = rows[index + dir];
      if (!other) return;
      await Promise.all([
        supabase.from('identities').update({ sort: other.sort }).eq('id', row.id),
        supabase.from('identities').update({ sort: row.sort }).eq('id', other.id),
      ]);
      renderIdentities(view);
    };

    list.append(
      el('article', { class: 'ident' },
        el('div', { class: 'ident__media' },
          el('img', { class: 'ident__img', src: publicUrl(row.image_path), alt: '', loading: 'lazy' }),
          button('Replace', { iconName: 'upload', onClick: () => replacePicker.click() }),
          replacePicker
        ),
        el('div', { class: 'ident__fields' },
          el('div', { class: 'grid grid--2' }, field('Client', client), field('Sector', sector)),
          field('Description', alt),
          el('div', { class: 'ident__foot' },
            checkbox('Published', row.published, (v) => (row.published = v)),
            el('div', { class: 'ident__tools' },
              el('button', { class: 'iconbtn', title: 'Move up', disabled: index === 0, onclick: () => move(-1) }, icon('up', 16)),
              el('button', { class: 'iconbtn', title: 'Move down', disabled: index === rows.length - 1, onclick: () => move(1) }, icon('down', 16)),
              el('button', {
                class: 'iconbtn iconbtn--danger',
                title: 'Delete logo',
                onclick: async () => {
                  const ok = await confirmDialog({
                    title: `Delete the ${row.client} logo?`,
                    body: 'It is removed from the site and from storage permanently.',
                    confirmLabel: 'Delete permanently',
                  });
                  if (!ok) return;
                  const { error: deleteError } = await supabase.from('identities').delete().eq('id', row.id);
                  if (deleteError) return toast(readableError(deleteError), 'error');
                  await deleteFiles([row.image_path]);
                  toast('Logo deleted');
                  renderIdentities(view);
                },
              }, icon('trash', 16)),
              save
            )
          )
        )
      )
    );
  });

  clear(view).append(head, addPicker, list);
}
