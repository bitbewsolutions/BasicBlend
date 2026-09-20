/**
 * Projects: the case studies at /work/.
 *
 * Text is saved when Save is pressed; images save the moment they are added,
 * because an upload that vanishes because someone navigated away is the worst
 * kind of surprise. The editor says which is which.
 */
import { supabase, readableError, publicUrl } from './client';
import { groupServices } from '../../data/services';
import {
  el, clear, icon, button, field, input, textarea, checkbox, toast, confirmDialog,
  skeleton, empty, errorBox, legend, slugify, withBusy,
} from './ui';
import { uploadImage, deleteFiles, filePicker } from './media';

interface Project {
  id: string;
  slug: string;
  client: string;
  sub_brand: string | null;
  sector: string;
  teaser: string;
  overview: string;
  scope: string[];
  spec: { label: string; value: string }[];
  services: string[];
  feature_caption: string | null;
  published: boolean;
  sort: number;
}

interface Media {
  id: string;
  project_id: string;
  role: 'cover' | 'gallery' | 'feature';
  path: string;
  alt: string;
  width: number;
  height: number;
  sort: number;
}

const blank = (): Omit<Project, 'id'> => ({
  slug: '',
  client: '',
  sub_brand: null,
  sector: '',
  teaser: '',
  overview: '',
  scope: [],
  spec: [],
  services: [],
  feature_caption: null,
  published: false,
  sort: 99,
});

/* ------------------------------------------------------------------ list */

export async function renderProjects(view: HTMLElement, id?: string) {
  if (id) return renderEditor(view, id);

  clear(view).append(skeleton(4));

  const [{ data: projects, error }, { data: media }] = await Promise.all([
    supabase.from('projects').select('*').order('sort').order('created_at'),
    supabase.from('project_media').select('id,project_id,role,path'),
  ]);

  if (error) {
    clear(view).append(errorBox(readableError(error), () => renderProjects(view)));
    return;
  }

  const rows = (projects ?? []) as Project[];
  const shots = (media ?? []) as Pick<Media, 'id' | 'project_id' | 'role' | 'path'>[];

  const head = el(
    'div',
    { class: 'view__head' },
    legend('Projects', 'Case studies on the Work page. Drag-free ordering: the arrows set the order visitors see.'),
    button('New project', { variant: 'primary', iconName: 'plus', onClick: () => (location.hash = '#/projects/new') })
  );

  if (rows.length === 0) {
    clear(view).append(
      head,
      empty('No projects yet', 'Add a case study and it appears on the Work page after you publish.',
        button('New project', { variant: 'primary', iconName: 'plus', onClick: () => (location.hash = '#/projects/new') }))
    );
    return;
  }

  const list = el('ul', { class: 'cards' });

  rows.forEach((project, index) => {
    const mine = shots.filter((m) => m.project_id === project.id);
    const cover = mine.find((m) => m.role === 'cover');
    const galleryCount = mine.filter((m) => m.role === 'gallery').length;

    const thumb = cover
      ? el('img', { class: 'cards__thumb', src: publicUrl(cover.path), alt: '', loading: 'lazy' })
      : el('div', { class: 'cards__thumb cards__thumb--none' }, icon('image', 20));

    const meta = el(
      'div',
      { class: 'cards__meta' },
      el('h3', { class: 'cards__title', text: project.client }),
      el('p', { class: 'cards__sub', text: `${project.sector} · /work/${project.slug}/` }),
      el(
        'div',
        { class: 'cards__tags' },
        el('span', {
          class: `pill pill--${project.published ? 'live' : 'draft'}`,
          text: project.published ? 'Published' : 'Draft',
        }),
        el('span', { class: 'pill', text: `${galleryCount} creative${galleryCount === 1 ? '' : 's'}` }),
        !cover ? el('span', { class: 'pill pill--warn', text: 'No cover — will not appear' }) : null
      )
    );

    const move = async (direction: -1 | 1) => {
      const target = rows[index + direction];
      if (!target) return;
      const { error: moveError } = await supabase
        .from('projects')
        .upsert([
          { id: project.id, sort: target.sort, slug: project.slug, client: project.client, sector: project.sector, teaser: project.teaser, overview: project.overview },
          { id: target.id, sort: project.sort, slug: target.slug, client: target.client, sector: target.sector, teaser: target.teaser, overview: target.overview },
        ]);
      if (moveError) return toast(readableError(moveError), 'error');
      renderProjects(view);
    };

    const actions = el(
      'div',
      { class: 'cards__actions' },
      el('button', { class: 'iconbtn', title: 'Move up', disabled: index === 0, onclick: () => move(-1) }, icon('up', 16)),
      el('button', { class: 'iconbtn', title: 'Move down', disabled: index === rows.length - 1, onclick: () => move(1) }, icon('down', 16)),
      button('Edit', { onClick: () => (location.hash = `#/projects/${project.id}`) })
    );

    list.append(el('li', { class: 'cards__item' }, thumb, meta, actions));
  });

  clear(view).append(head, list);
}

/* ---------------------------------------------------------------- editor */

async function renderEditor(view: HTMLElement, id: string) {
  const creating = id === 'new';
  clear(view).append(skeleton(5));

  let project: Project | Omit<Project, 'id'> = blank();
  let media: Media[] = [];

  if (!creating) {
    const [{ data, error }, { data: mediaRows }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_media').select('*').eq('project_id', id).order('sort'),
    ]);
    if (error || !data) {
      clear(view).append(errorBox(error ? readableError(error) : 'That project no longer exists.', () => (location.hash = '#/projects')));
      return;
    }
    project = data as Project;
    media = (mediaRows ?? []) as Media[];
  }

  const draft = { ...project } as Project;
  let slugTouched = !creating;

  /* ---- basics ---- */
  const clientInput = input({ value: draft.client, maxlength: 120, required: true });
  const slugInput = input({ value: draft.slug, maxlength: 60, pattern: '[a-z0-9]+(-[a-z0-9]+)*' });
  clientInput.addEventListener('input', () => {
    draft.client = clientInput.value;
    if (!slugTouched) slugInput.value = slugify(clientInput.value);
  });
  slugInput.addEventListener('input', () => {
    slugTouched = true;
    slugInput.value = slugify(slugInput.value);
  });

  const subBrand = input({ value: draft.sub_brand ?? '', maxlength: 120 });
  const sector = input({ value: draft.sector, maxlength: 120, required: true });
  const teaser = input({ value: draft.teaser, maxlength: 300, required: true });
  const overview = textarea({ rows: 5, maxlength: 4000, required: true });
  overview.value = draft.overview;

  const basics = el(
    'section',
    { class: 'panel' },
    legend('The project'),
    el('div', { class: 'grid grid--2' },
      field('Client', clientInput, { required: true }),
      field('Sub-brand', subBrand, { hint: 'Optional, e.g. a product range.' })
    ),
    el('div', { class: 'grid grid--2' },
      field('Sector', sector, { required: true, hint: 'Shown above the client name, e.g. Kitchen chimneys.' }),
      field('Page address', slugInput, { hint: `basicblend.in/work/${draft.slug || '…'}/` })
    ),
    field('Teaser', teaser, { required: true, hint: 'One line, shown on cards.' }),
    field('Overview', overview, { required: true, hint: 'What the work was. Describe the work, not the client’s past problems, and never claim results.' })
  );

  /* ---- repeatable lists ---- */
  const scopeList = repeatableLines(draft.scope, (v) => (draft.scope = v), 'e.g. Campaign creative across two brands');
  const specList = repeatablePairs(draft.spec, (v) => (draft.spec = v));

  /* ---- services ---- */
  const servicesBox = el('div', { class: 'services' });
  for (const group of groupServices()) {
    const col = el('div', {}, el('p', { class: 'services__group', text: group.label }));
    for (const service of group.services) {
      col.append(
        checkbox(service.title, draft.services.includes(service.slug), (on) => {
          draft.services = on
            ? [...draft.services, service.slug]
            : draft.services.filter((s) => s !== service.slug);
        })
      );
    }
    servicesBox.append(col);
  }

  const details = el(
    'section',
    { class: 'panel' },
    legend('What we did', 'The scope list on the case page, and the spec plate beside the title.'),
    field('Scope', scopeList.node, { hint: 'One deliverable per line.' }),
    field('Spec rows', specList.node, { hint: 'Describe the kind of work, never how much: no post counts or client counts.' }),
    field('Services used', servicesBox, { hint: 'Links the case page to those service pages, and lists this case as proof on them.' })
  );

  /* ---- media ---- */
  const mediaPanel = el('section', { class: 'panel' });
  const paintMedia = () => {
    clear(mediaPanel).append(
      legend('Images', creating ? undefined : 'Images save as soon as they finish uploading.')
    );

    if (creating) {
      mediaPanel.append(
        el('p', { class: 'note', text: 'Save the project first, then add its images here.' })
      );
      return;
    }

    const projectId = (draft as Project).id;
    const cover = media.find((m) => m.role === 'cover');
    const gallery = media.filter((m) => m.role === 'gallery').sort((a, b) => a.sort - b.sort);
    const feature = media.find((m) => m.role === 'feature');

    const reload = async () => {
      const { data } = await supabase.from('project_media').select('*').eq('project_id', projectId).order('sort');
      media = (data ?? []) as Media[];
      paintMedia();
    };

    const addFiles = async (files: File[], role: Media['role'], startSort: number) => {
      const progress = el('p', { class: 'note', text: `Uploading 0 of ${files.length}…` });
      mediaPanel.append(progress);
      let done = 0;
      try {
        for (const file of files) {
          const up = await uploadImage(file, `projects/${draft.slug || projectId}`);
          const { error } = await supabase.from('project_media').insert({
            project_id: projectId,
            role,
            path: up.path,
            width: up.width,
            height: up.height,
            alt: '',
            sort: startSort + done,
          });
          if (error) throw error;
          done++;
          progress.textContent = `Uploading ${done} of ${files.length}…`;
        }
        toast(`${done} image${done === 1 ? '' : 's'} added`);
      } catch (err) {
        toast(readableError(err), 'error');
      }
      await reload();
    };

    /* cover */
    const coverPicker = filePicker('image/*', false, (files) =>
      cover ? replaceImage(cover, files[0], reload) : addFiles(files, 'cover', 0)
    );
    mediaPanel.append(
      el('div', { class: 'media-block' },
        el('h3', { class: 'media-block__title', text: 'Cover' }),
        el('p', { class: 'field__hint', text: 'The campaign grid shown on cards and at the top of the case page. Required before publishing.' }),
        cover
          ? mediaTile(cover, { onReplace: () => coverPicker.click(), onAlt: reload })
          : el('div', { class: 'dropzone' },
              icon('image', 22),
              el('p', { text: 'No cover yet' }),
              button('Choose image', { variant: 'primary', iconName: 'upload', onClick: () => coverPicker.click() })
            ),
        coverPicker
      )
    );

    /* gallery */
    const galleryPicker = filePicker('image/*', true, (files) =>
      addFiles(files, 'gallery', gallery.length)
    );
    const grid = el('div', { class: 'media-grid' });
    gallery.forEach((item, index) => {
      grid.append(
        mediaTile(item, {
          onAlt: reload,
          onDelete: reload,
          onMove: index === 0 && gallery.length === 1 ? undefined : async (dir) => {
            const other = gallery[index + dir];
            if (!other) return;
            await Promise.all([
              supabase.from('project_media').update({ sort: other.sort }).eq('id', item.id),
              supabase.from('project_media').update({ sort: item.sort }).eq('id', other.id),
            ]);
            reload();
          },
        })
      );
    });
    mediaPanel.append(
      el('div', { class: 'media-block' },
        el('h3', { class: 'media-block__title', text: `Creatives (${gallery.length})` }),
        el('p', { class: 'field__hint', text: 'Individual posts, shown as a strip on the case page and in the home page marquee.' }),
        gallery.length ? grid : el('p', { class: 'note', text: 'None yet.' }),
        button('Add creatives', { iconName: 'upload', onClick: () => galleryPicker.click() }),
        galleryPicker
      )
    );

    /* feature */
    const featurePicker = filePicker('image/*', false, (files) =>
      feature ? replaceImage(feature, files[0], reload) : addFiles(files, 'feature', 0)
    );
    const caption = input({ value: draft.feature_caption ?? '', maxlength: 200, placeholder: 'Campaign presentation: “From hype to happening”' });
    caption.addEventListener('change', async () => {
      draft.feature_caption = caption.value.trim() || null;
      const { error } = await supabase.from('projects').update({ feature_caption: draft.feature_caption }).eq('id', projectId);
      if (error) toast(readableError(error), 'error');
      else toast('Caption saved');
    });
    mediaPanel.append(
      el('div', { class: 'media-block' },
        el('h3', { class: 'media-block__title', text: 'Campaign layout' }),
        el('p', { class: 'field__hint', text: 'Optional. One wider presentation image shown once, with a caption.' }),
        feature
          ? el('div', {}, mediaTile(feature, { onReplace: () => featurePicker.click(), onAlt: reload, onDelete: reload }), field('Caption', caption))
          : button('Add layout image', { iconName: 'upload', onClick: () => featurePicker.click() }),
        featurePicker
      )
    );
  };
  paintMedia();

  /* ---- publish + save ---- */
  const publishToggle = checkbox('Published (visible on the site after the next publish)', draft.published, (on) => {
    draft.published = on;
  });

  const save = button(creating ? 'Create project' : 'Save changes', {
    variant: 'primary',
    iconName: 'check',
    onClick: () =>
      withBusy(save, 'Saving…', async () => {
        draft.client = clientInput.value.trim();
        draft.slug = slugify(slugInput.value || clientInput.value);
        draft.sub_brand = subBrand.value.trim() || null;
        draft.sector = sector.value.trim();
        draft.teaser = teaser.value.trim();
        draft.overview = overview.value.trim();
        draft.scope = scopeList.value();
        draft.spec = specList.value();

        const missing = [
          !draft.client && 'client',
          !draft.slug && 'page address',
          !draft.sector && 'sector',
          !draft.teaser && 'teaser',
          !draft.overview && 'overview',
        ].filter(Boolean);
        if (missing.length) return toast(`Still needed: ${missing.join(', ')}.`, 'error');

        const hasCover = media.some((m) => m.role === 'cover');
        if (draft.published && !creating && !hasCover) {
          return toast('Add a cover image before publishing this project.', 'error');
        }

        const payload = {
          slug: draft.slug,
          client: draft.client,
          sub_brand: draft.sub_brand,
          sector: draft.sector,
          teaser: draft.teaser,
          overview: draft.overview,
          scope: draft.scope,
          spec: draft.spec,
          services: draft.services,
          feature_caption: draft.feature_caption,
          published: creating ? false : draft.published,
          sort: draft.sort,
        };

        if (creating) {
          const { data, error } = await supabase.from('projects').insert(payload).select().single();
          if (error) return toast(readableError(error), 'error');
          toast('Project created. Add its images next.');
          location.hash = `#/projects/${data.id}`;
          return;
        }

        const { error } = await supabase.from('projects').update(payload).eq('id', (draft as Project).id);
        if (error) return toast(readableError(error), 'error');
        toast('Saved');
      }),
  });

  const remove = !creating
    ? button('Delete project', {
        variant: 'danger',
        iconName: 'trash',
        onClick: async () => {
          const ok = await confirmDialog({
            title: `Delete ${draft.client}?`,
            body: 'The project, its page and all of its images are removed permanently. Unpublish it instead if you only want it off the site.',
            confirmLabel: 'Delete permanently',
          });
          if (!ok) return;
          const paths = media.map((m) => m.path);
          const { error } = await supabase.from('projects').delete().eq('id', (draft as Project).id);
          if (error) return toast(readableError(error), 'error');
          await deleteFiles(paths);
          toast('Project deleted');
          location.hash = '#/projects';
        },
      })
    : null;

  const header = el(
    'div',
    { class: 'view__head' },
    el('div', {},
      button('All projects', { iconName: 'back', variant: 'quiet', onClick: () => (location.hash = '#/projects') }),
      el('h1', { class: 'view__title', text: creating ? 'New project' : draft.client })
    ),
    !creating && draft.published
      ? (() => {
          const a = el('a', { class: 'chip', href: `/work/${draft.slug}/`, target: '_blank', rel: 'noopener' });
          a.append(icon('external', 16), el('span', { text: 'View live page' }));
          return a;
        })()
      : null
  );

  clear(view).append(
    header,
    basics,
    details,
    mediaPanel,
    el('section', { class: 'panel panel--foot' },
      publishToggle,
      el('div', { class: 'panel__actions' }, save, remove)
    )
  );
}

/* ------------------------------------------------------------- media bits */

function mediaTile(
  item: Media,
  opts: { onReplace?: () => void; onAlt?: () => void; onDelete?: () => void; onMove?: (dir: -1 | 1) => void }
) {
  const alt = input({ value: item.alt, placeholder: 'Describe this image', maxlength: 500, class: 'input input--sm' });
  alt.addEventListener('change', async () => {
    const { error } = await supabase.from('project_media').update({ alt: alt.value.trim() }).eq('id', item.id);
    if (error) return toast(readableError(error), 'error');
    item.alt = alt.value.trim();
    toast('Description saved');
    opts.onAlt?.();
  });

  const tools = el('div', { class: 'tile__tools' });
  if (opts.onMove) {
    tools.append(
      el('button', { class: 'iconbtn', title: 'Move earlier', onclick: () => opts.onMove!(-1) }, icon('up', 15)),
      el('button', { class: 'iconbtn', title: 'Move later', onclick: () => opts.onMove!(1) }, icon('down', 15))
    );
  }
  if (opts.onReplace) {
    tools.append(el('button', { class: 'iconbtn', title: 'Replace image', onclick: opts.onReplace }, icon('upload', 15)));
  }
  if (opts.onDelete) {
    tools.append(
      el('button', {
        class: 'iconbtn iconbtn--danger',
        title: 'Remove image',
        onclick: async () => {
          const ok = await confirmDialog({
            title: 'Remove this image?',
            body: 'It is deleted from the project and from storage.',
            confirmLabel: 'Remove',
          });
          if (!ok) return;
          const { error } = await supabase.from('project_media').delete().eq('id', item.id);
          if (error) return toast(readableError(error), 'error');
          await deleteFiles([item.path]);
          toast('Image removed');
          opts.onDelete?.();
        },
      }, icon('trash', 15))
    );
  }

  const missingAlt = !item.alt.trim();

  return el(
    'figure',
    { class: 'tile' },
    el('img', { class: 'tile__img', src: publicUrl(item.path), alt: '', loading: 'lazy' }),
    tools,
    el('figcaption', { class: 'tile__cap' },
      alt,
      missingAlt ? el('span', { class: 'tile__warn', text: 'Needs a description' }) : null
    )
  );
}

async function replaceImage(item: Media, file: File, done: () => void) {
  try {
    const up = await uploadImage(file, item.path.split('/').slice(0, -1).join('/'));
    const { error } = await supabase
      .from('project_media')
      .update({ path: up.path, width: up.width, height: up.height })
      .eq('id', item.id);
    if (error) throw error;
    await deleteFiles([item.path]);
    toast('Image replaced');
  } catch (err) {
    toast(readableError(err), 'error');
  }
  done();
}

/* ------------------------------------------------------- repeatable lists */

function repeatableLines(initial: string[], _onChange: (v: string[]) => void, placeholder: string) {
  const list = el('div', { class: 'repeat' });

  const addRow = (value = '') => {
    const text = input({ value, placeholder, maxlength: 200 });
    const row = el('div', { class: 'repeat__row' }, text,
      el('button', { class: 'iconbtn', title: 'Remove line', onclick: () => row.remove() }, icon('close', 15))
    );
    list.append(row);
    return text;
  };

  initial.forEach((v) => addRow(v));

  const wrap = el('div', {}, list,
    button('Add line', { iconName: 'plus', onClick: () => addRow().focus() })
  );

  return {
    node: wrap,
    value: () =>
      Array.from(list.querySelectorAll<HTMLInputElement>('input'))
        .map((i) => i.value.trim())
        .filter(Boolean),
  };
}

function repeatablePairs(initial: { label: string; value: string }[], _onChange: (v: { label: string; value: string }[]) => void) {
  const list = el('div', { class: 'repeat' });

  const addRow = (label = '', value = '') => {
    const l = input({ value: label, placeholder: 'Label, e.g. Sector', maxlength: 40 });
    const v = input({ value, placeholder: 'Value, e.g. Home appliances', maxlength: 80 });
    const row = el('div', { class: 'repeat__row repeat__row--pair' }, l, v,
      el('button', { class: 'iconbtn', title: 'Remove row', onclick: () => row.remove() }, icon('close', 15))
    );
    list.append(row);
    return l;
  };

  initial.forEach((p) => addRow(p.label, p.value));

  const wrap = el('div', {}, list, button('Add row', { iconName: 'plus', onClick: () => addRow().focus() }));

  return {
    node: wrap,
    value: () =>
      Array.from(list.querySelectorAll<HTMLDivElement>('.repeat__row'))
        .map((row) => {
          const [l, v] = Array.from(row.querySelectorAll('input'));
          return { label: l.value.trim(), value: v.value.trim() };
        })
        .filter((p) => p.label && p.value),
  };
}
