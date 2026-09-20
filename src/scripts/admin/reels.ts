/**
 * Reels and films: the videos on /work/ and the Reels service page.
 *
 * A poster frame is captured from the video automatically on upload, so a reel
 * is never published showing a black rectangle. It can still be replaced by hand.
 */
import { supabase, readableError, publicUrl } from './client';
import {
  el, clear, icon, button, field, input, textarea, checkbox, select as selectEl,
  toast, confirmDialog, skeleton, empty, errorBox, legend, withBusy,
} from './ui';
import { uploadImage, uploadVideo, capturePoster, measureImage, deleteFiles, filePicker } from './media';

interface Reel {
  id: string;
  label: string;
  client: string;
  note: string;
  alt: string;
  video_path: string;
  poster_path: string;
  poster_width: number | null;
  poster_height: number | null;
  project_id: string | null;
  show_in_films: boolean;
  published: boolean;
  sort: number;
}

export async function renderReels(view: HTMLElement, id?: string) {
  if (id) return renderEditor(view, id);

  clear(view).append(skeleton(3));
  const { data, error } = await supabase.from('reels').select('*').order('sort').order('created_at');
  if (error) {
    clear(view).append(errorBox(readableError(error), () => renderReels(view)));
    return;
  }

  const rows = (data ?? []) as Reel[];
  const head = el(
    'div',
    { class: 'view__head' },
    legend('Reels & films', 'Shown in the films row on the Work page, and on a case page when linked to a project.'),
    button('New reel', { variant: 'primary', iconName: 'plus', onClick: () => (location.hash = '#/reels/new') })
  );

  if (rows.length === 0) {
    clear(view).append(head, empty('No reels yet', 'Upload a film and it joins the films row after you publish.',
      button('New reel', { variant: 'primary', iconName: 'plus', onClick: () => (location.hash = '#/reels/new') })));
    return;
  }

  const list = el('ul', { class: 'cards' });
  rows.forEach((reel, index) => {
    const move = async (dir: -1 | 1) => {
      const other = rows[index + dir];
      if (!other) return;
      await Promise.all([
        supabase.from('reels').update({ sort: other.sort }).eq('id', reel.id),
        supabase.from('reels').update({ sort: reel.sort }).eq('id', other.id),
      ]);
      renderReels(view);
    };

    list.append(
      el('li', { class: 'cards__item' },
        el('img', { class: 'cards__thumb cards__thumb--tall', src: publicUrl(reel.poster_path), alt: '', loading: 'lazy' }),
        el('div', { class: 'cards__meta' },
          el('h3', { class: 'cards__title', text: reel.client }),
          el('p', { class: 'cards__sub', text: `${reel.label} · ${reel.note}` }),
          el('div', { class: 'cards__tags' },
            el('span', { class: `pill pill--${reel.published ? 'live' : 'draft'}`, text: reel.published ? 'Published' : 'Draft' }),
            reel.show_in_films ? el('span', { class: 'pill', text: 'In films row' }) : null,
            reel.project_id ? el('span', { class: 'pill', text: 'On a case page' }) : null
          )
        ),
        el('div', { class: 'cards__actions' },
          el('button', { class: 'iconbtn', title: 'Move up', disabled: index === 0, onclick: () => move(-1) }, icon('up', 16)),
          el('button', { class: 'iconbtn', title: 'Move down', disabled: index === rows.length - 1, onclick: () => move(1) }, icon('down', 16)),
          button('Edit', { onClick: () => (location.hash = `#/reels/${reel.id}`) })
        )
      )
    );
  });

  clear(view).append(head, list);
}

async function renderEditor(view: HTMLElement, id: string) {
  const creating = id === 'new';
  clear(view).append(skeleton(4));

  const { data: projects } = await supabase.from('projects').select('id,client').order('sort');

  let reel: Reel = {
    id: '',
    label: 'Product film',
    client: '',
    note: '',
    alt: '',
    video_path: '',
    poster_path: '',
    poster_width: null,
    poster_height: null,
    project_id: null,
    show_in_films: true,
    published: true,
    sort: 99,
  };

  if (!creating) {
    const { data, error } = await supabase.from('reels').select('*').eq('id', id).single();
    if (error || !data) {
      clear(view).append(errorBox(error ? readableError(error) : 'That reel no longer exists.', () => (location.hash = '#/reels')));
      return;
    }
    reel = data as Reel;
  }

  /* ---- video + poster, uploaded before anything else can be saved ---- */
  let pendingVideo = reel.video_path;
  let pendingPoster = reel.poster_path;
  let pendingPosterSize = { width: reel.poster_width ?? 0, height: reel.poster_height ?? 0 };

  const mediaBox = el('div', { class: 'media-block' });

  const paintMedia = () => {
    clear(mediaBox);
    const preview = pendingPoster
      ? el('img', { class: 'tile__img tile__img--tall', src: publicUrl(pendingPoster), alt: '' })
      : el('div', { class: 'dropzone dropzone--tall' }, icon('film', 22), el('p', { text: 'No video yet' }));

    const videoPicker = filePicker('video/mp4,video/*', false, async (files) => {
      const file = files[0];
      const status = el('p', { class: 'note', text: 'Uploading video…' });
      mediaBox.append(status);
      try {
        const path = await uploadVideo(file, 'reels');
        status.textContent = 'Capturing a poster frame…';
        let posterFile: File | null = null;
        try {
          posterFile = await capturePoster(file);
        } catch (err) {
          console.warn(err);
        }
        if (pendingVideo && pendingVideo !== path) await deleteFiles([pendingVideo]);
        pendingVideo = path;
        if (posterFile) {
          const up = await uploadImage(posterFile, 'reels');
          if (pendingPoster) await deleteFiles([pendingPoster]);
          pendingPoster = up.path;
          pendingPosterSize = { width: up.width, height: up.height };
        }
        toast(posterFile ? 'Video uploaded, poster captured' : 'Video uploaded — add a poster image');
      } catch (err) {
        toast(readableError(err), 'error');
      }
      paintMedia();
    });

    const posterPicker = filePicker('image/*', false, async (files) => {
      try {
        const size = await measureImage(files[0]);
        const up = await uploadImage(files[0], 'reels');
        if (pendingPoster) await deleteFiles([pendingPoster]);
        pendingPoster = up.path;
        pendingPosterSize = size;
        toast('Poster updated');
      } catch (err) {
        toast(readableError(err), 'error');
      }
      paintMedia();
    });

    mediaBox.append(
      el('h3', { class: 'media-block__title', text: 'Video' }),
      el('p', { class: 'field__hint', text: 'Vertical MP4 up to 50 MB. The poster frame is captured automatically; replace it if a different frame sells it better.' }),
      el('div', { class: 'media-row' },
        preview,
        el('div', { class: 'media-row__tools' },
          button(pendingVideo ? 'Replace video' : 'Upload video', { variant: pendingVideo ? 'ghost' : 'primary', iconName: 'upload', onClick: () => videoPicker.click() }),
          button('Replace poster', { iconName: 'image', onClick: () => posterPicker.click() }),
          pendingVideo
            ? (() => {
                const a = el('a', { class: 'chip', href: publicUrl(pendingVideo), target: '_blank', rel: 'noopener' });
                a.append(icon('eye', 15), el('span', { text: 'Preview video' }));
                return a;
              })()
            : null
        )
      ),
      videoPicker,
      posterPicker
    );
  };
  paintMedia();

  /* ---- fields ---- */
  const label = input({ value: reel.label, maxlength: 60 });
  const client = input({ value: reel.client, maxlength: 120, required: true });
  const note = input({ value: reel.note, maxlength: 200, required: true });
  const alt = textarea({ rows: 2, maxlength: 500 });
  alt.value = reel.alt;

  const projectSelect = selectEl(
    [{ value: '', label: 'Not linked to a project' }, ...(projects ?? []).map((p) => ({ value: p.id, label: p.client }))],
    {}
  );
  projectSelect.value = reel.project_id ?? '';

  const inFilms = checkbox('Show in the films row on the Work page', reel.show_in_films, (v) => (reel.show_in_films = v));
  const published = checkbox('Published', reel.published, (v) => (reel.published = v));

  const save = button(creating ? 'Create reel' : 'Save changes', {
    variant: 'primary',
    iconName: 'check',
    onClick: () =>
      withBusy(save, 'Saving…', async () => {
        if (!pendingVideo || !pendingPoster) return toast('Upload the video first.', 'error');
        if (!client.value.trim() || !note.value.trim()) return toast('Client and one-line note are both needed.', 'error');
        if (!alt.value.trim()) return toast('Describe the film for people who cannot see it.', 'error');

        const payload = {
          label: label.value.trim() || 'Film',
          client: client.value.trim(),
          note: note.value.trim(),
          alt: alt.value.trim(),
          video_path: pendingVideo,
          poster_path: pendingPoster,
          poster_width: pendingPosterSize.width || null,
          poster_height: pendingPosterSize.height || null,
          project_id: projectSelect.value || null,
          show_in_films: reel.show_in_films,
          published: reel.published,
          sort: reel.sort,
        };

        if (creating) {
          const { error } = await supabase.from('reels').insert(payload);
          if (error) return toast(readableError(error), 'error');
          toast('Reel created');
          location.hash = '#/reels';
          return;
        }
        const { error } = await supabase.from('reels').update(payload).eq('id', reel.id);
        if (error) return toast(readableError(error), 'error');
        toast('Saved');
      }),
  });

  const remove = !creating
    ? button('Delete reel', {
        variant: 'danger',
        iconName: 'trash',
        onClick: async () => {
          const ok = await confirmDialog({
            title: `Delete this ${reel.label.toLowerCase()}?`,
            body: 'The video and its poster are removed permanently. Unpublish it instead if you only want it off the site.',
            confirmLabel: 'Delete permanently',
          });
          if (!ok) return;
          const { error } = await supabase.from('reels').delete().eq('id', reel.id);
          if (error) return toast(readableError(error), 'error');
          await deleteFiles([reel.video_path, reel.poster_path]);
          toast('Reel deleted');
          location.hash = '#/reels';
        },
      })
    : null;

  clear(view).append(
    el('div', { class: 'view__head' },
      el('div', {},
        button('All reels', { iconName: 'back', variant: 'quiet', onClick: () => (location.hash = '#/reels') }),
        el('h1', { class: 'view__title', text: creating ? 'New reel' : reel.client })
      )
    ),
    el('section', { class: 'panel' }, mediaBox),
    el('section', { class: 'panel' },
      legend('Details'),
      el('div', { class: 'grid grid--2' },
        field('Client', client, { required: true }),
        field('Kind', label, { hint: 'e.g. Product film, Reel, Behind the scenes.' })
      ),
      field('One line about it', note, { required: true, hint: 'Shown under the film, e.g. “The Bullet Blender, shot and cut by our team.”' }),
      field('Description for screen readers', alt, { required: true, hint: 'What happens in the film, for people who cannot see or play it.' }),
      field('Show on a case page', projectSelect, { hint: 'Optional. Adds this film to that project’s page.' })
    ),
    el('section', { class: 'panel panel--foot' },
      inFilms,
      published,
      el('div', { class: 'panel__actions' }, save, remove)
    )
  );
}
