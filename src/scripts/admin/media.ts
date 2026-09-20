/**
 * Uploads.
 *
 * Two jobs beyond putting bytes in a bucket:
 *  · measure every image, because the public site needs width and height to
 *    reserve space and to build responsive sources. An image whose size the
 *    build does not know cannot be optimised.
 *  · grab a poster frame from a video automatically, so a reel is never posted
 *    with a black rectangle where its first impression should be.
 */
import { supabase, STORAGE_BUCKET } from './client';

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export interface UploadedImage {
  path: string;
  width: number;
  height: number;
}

function extensionOf(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,4}$/.test(fromName)) return fromName;
  return file.type.split('/')[1] ?? 'bin';
}

/** projects/<slug>/1737-3f9a21.jpg — unique, readable, and grouped by owner. */
function storagePath(folder: string, file: File): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${folder}/${stamp}-${rand}.${extensionOf(file)}`;
}

/** Natural dimensions, read from the file itself rather than trusted from anywhere. */
export function measureImage(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name} is larger than 15 MB.`);

  const { width, height } = await measureImage(file);
  const path = storagePath(folder, file);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return { path, width, height };
}

export async function uploadVideo(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('video/')) throw new Error(`${file.name} is not a video.`);
  if (file.size > MAX_VIDEO_BYTES) throw new Error(`${file.name} is larger than 50 MB.`);

  const path = storagePath(folder, file);
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return path;
}

/**
 * Pull a frame out of a video for its poster. One second in, because frame
 * zero of a cut is very often black.
 */
export function capturePoster(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const fail = (message: string) => {
      URL.revokeObjectURL(url);
      reject(new Error(message));
    };

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return fail('This browser cannot capture a poster frame.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return reject(new Error('Could not capture a poster frame.'));
          resolve(new File([blob], 'poster.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.86
      );
    };

    video.onerror = () => fail('That video could not be read in this browser.');
    video.src = url;
  });
}

/** Remove files from the bucket. Failures are logged, never fatal: a stray file is not worth losing an edit over. */
export async function deleteFiles(paths: string[]) {
  const real = paths.filter(Boolean);
  if (real.length === 0) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(real);
  if (error) console.warn('Could not delete storage files', real, error);
}

/** A hidden file input, opened by our own button so the control matches everything else. */
export function filePicker(accept: string, multiple: boolean, onPick: (files: File[]) => void) {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = accept;
  picker.multiple = multiple;
  picker.className = 'visually-hidden';
  picker.addEventListener('change', () => {
    const files = Array.from(picker.files ?? []);
    picker.value = '';
    if (files.length) onPick(files);
  });
  return picker;
}
