// Web image search + local image processing utilities.
//
// Search uses the Wikimedia Commons MediaWiki API. It's the only image source
// that works fully client-side with no API key, no auth, and CORS allowed.
// For typical AAC search queries ("ceiling fan", "school bus", etc.) the
// results are family-friendly; we still append a small word blacklist.
//
// All images that get saved to a button are first downloaded as a Blob, drawn
// to a canvas, resized to a max edge, and re-encoded as JPEG so they store
// compactly in IndexedDB and work offline thereafter. Cross-origin images
// require `crossOrigin = 'anonymous'` so the canvas isn't tainted; Wikimedia
// serves the right CORS headers for this.

export interface WebImage {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  title: string;
}

const COMMONS_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
// Excluded from queries to keep results child-safe. Wikimedia search
// supports `-word` to exclude tokens from titles.
const SAFE_EXCLUSIONS = '-pornography -pornographic -erotic -erotica -nude -nudity';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

interface RawPage {
  pageid?: number;
  title?: string;
  imageinfo?: { thumburl?: string; url?: string; mime?: string }[];
}

export async function searchWebImages(
  query: string,
  signal?: AbortSignal,
): Promise<WebImage[]> {
  const safeQuery = `${query} ${SAFE_EXCLUSIONS}`;
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: safeQuery,
    gsrnamespace: '6', // File: namespace
    gsrlimit: '24',
    prop: 'imageinfo',
    iiurlwidth: '240',
    iiprop: 'url|mime',
    format: 'json',
    origin: '*', // CORS: must be sent so Wikimedia returns Access-Control-Allow-Origin
  });
  const url = `${COMMONS_ENDPOINT}?${params.toString()}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Wikimedia search failed: HTTP ${res.status}`);
  const data = await res.json();
  const pages: Record<string, RawPage> = data?.query?.pages ?? {};

  return Object.values(pages).flatMap((p) => {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl) return [];
    if (info.mime && !ALLOWED_MIME.has(info.mime)) return [];
    const cleanTitle = (p.title ?? '')
      .replace(/^File:/, '')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/_/g, ' ');
    return [{
      id: p.pageid?.toString() ?? p.title ?? cleanTitle,
      thumbUrl: info.thumburl,
      fullUrl: info.url ?? info.thumburl,
      title: cleanTitle,
    }];
  });
}

// Download a remote image and return a compressed JPEG data URL. Uses
// crossOrigin=anonymous so the canvas isn't tainted (the source must serve
// permissive CORS headers — Wikimedia does).
export async function downloadImageAsDataUrl(
  url: string,
  maxEdge = 512,
  quality = 0.85,
): Promise<string> {
  const img = await loadCrossOriginImage(url);
  return drawImageToDataUrl(img, maxEdge, quality);
}

// Read a file from the device. If the file is small enough, store its
// original bytes as a base64 data URL; otherwise re-encode as a 512x512
// center-cropped JPEG to keep IndexedDB rows compact.
const ONE_MB = 1024 * 1024;
export async function fileToButtonImage(
  file: File,
  maxEdge = 512,
  quality = 0.85,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG, JPG, GIF, or WEBP).');
  }
  if (file.size <= ONE_MB) {
    // Small enough to keep as-is — preserves transparency for PNGs.
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  const img = await loadObjectUrlImage(file);
  return drawImageToDataUrl(img, maxEdge, quality);
}

// Draw an image into a square canvas with a center-crop. Used for the upload
// preview so every uploaded button has consistent square framing.
export async function fileToSquareDataUrl(
  file: File,
  size = 512,
  quality = 0.85,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG, JPG, GIF, or WEBP).');
  }
  const img = await loadObjectUrlImage(file);
  const dim = Math.min(img.width, img.height);
  const sx = (img.width - dim) / 2;
  const sy = (img.height - dim) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.drawImage(img, sx, sy, dim, dim, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', quality);
}

function loadCrossOriginImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function loadObjectUrlImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not decode image')); };
    img.src = objectUrl;
  });
}

function drawImageToDataUrl(img: HTMLImageElement, maxEdge: number, quality: number): string {
  const { width, height } = scaleToFit(img.naturalWidth, img.naturalHeight, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function scaleToFit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  if (w >= h) return { width: max, height: Math.round((h / w) * max) };
  return { width: Math.round((w / h) * max), height: max };
}
