/**
 * Compresses an image file by resizing to maxDim on the longest edge
 * and re-encoding as JPEG at the given quality.
 *
 * A 12MB / 4000px photo from a modern phone becomes ~200KB / 1920px —
 * roughly a 60× reduction with no visible quality loss at display sizes.
 *
 * Files already under 500KB are returned unchanged to avoid re-encoding
 * tiny images (e.g. screenshots, already-compressed uploads).
 */
export async function compressImage(
  file: File,
  maxDim = 1920,
  quality = 0.8,
): Promise<File> {
  // Bypass compression for already-small files
  if (file.size < 500 * 1024) return file;

  // Non-image files shouldn't reach here, but be safe
  if (!file.type.startsWith('image/')) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // createImageBitmap can fail on broken/corrupt images — pass through
    return file;
  }

  let { width, height } = bitmap;

  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close(); // free GPU memory

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob returned null'));
    }, 'image/jpeg', quality);
  });

  const name = file.name.replace(/\.[^.]+$/, '.jpg');
  return new File([blob], name, { type: 'image/jpeg' });
}
