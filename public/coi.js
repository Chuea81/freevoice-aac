// Cross-origin isolation shim (imported into the Workbox-generated service
// worker via workbox.importScripts in vite.config.ts).
//
// GitHub Pages can't set COOP/COEP response headers, so this code adds them to
// the app-shell navigation response. That makes the page cross-origin isolated
// -> SharedArrayBuffer becomes available -> the on-device Kokoro neural voices
// can run on desktop web, not just the phone.
//
// COEP 'credentialless' is used (not 'require-corp') so cross-origin subresources
// (Google Fonts, ARASAAC pictograms, the HuggingFace model/voice downloads)
// keep loading without needing CORP headers.
//
// This listener is registered BEFORE Workbox's routing (importScripts runs at the
// top of the generated SW), so for top-level navigations it responds first and
// adds the headers. All non-navigation requests fall through to Workbox's normal
// precache/runtime caching untouched.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode !== 'navigate') return; // only the top-level document needs the headers
  const url = new URL(req.url);
  // Leave data/admin/terms paths to the normal flow.
  if (/^\/(app\/)?api\//.test(url.pathname) || url.pathname.startsWith('/admin') || url.pathname.startsWith('/terms')) {
    return;
  }
  event.respondWith((async () => {
    let resp = null;
    // App shell, cache-first (mirrors the PWA's offline navigateFallback).
    try {
      const names = await caches.keys();
      const pc = names.find((n) => n.includes('precache'));
      if (pc) {
        const cache = await caches.open(pc);
        resp = await cache.match('/app/index.html', { ignoreSearch: true });
      }
    } catch (e) { /* ignore — fall back to network */ }
    if (!resp) {
      try { resp = await fetch(req); } catch (e) { /* offline and not cached */ }
    }
    if (!resp) return Response.error();
    const headers = new Headers(resp.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
  })());
});
