// script-src hashes below cover the site's small set of static inline <script> blocks
// (footer year fill, hero suggestion chips, nav scroll state, back-to-top, scroll reveal).
// These are boilerplate shared across pages, not per-page dynamic content, so the hash
// list only needs updating if that boilerplate script itself is edited.
// Regenerate with: node scripts/list-inline-script-hashes.mjs
const INLINE_SCRIPT_HASHES = [
  "'sha256-kQkbDlAyRAVCXi4u51ZtXon85dQ42YBM1jerHwNX95M='", // index.html: yr + chips(en) + nav + totop + reveal
  "'sha256-VJoduXWmQMirCf2lY3bTSyomckAv621Jg+Z2RmJ8sKk='", // zh/index.html: yr + chips(zh) + nav + totop + reveal
  "'sha256-LmmMmGD1iVm6NfEuKiKCYzvXqK8/4cqOde1Y+eZA2Es='", // simple pages: yr only
  "'sha256-i1s9qfum2Us918hCBnHCBlbgPwlt3DhtB+ga3nFSCnA='", // how-it-works pages: yr + reveal
  "'sha256-wRVTDHGAbXZqhQeDMqpAEEH5IThJlwxtlaIeDfcI36E='", // article/guide pages: footer year span
];

const SECURITY_HEADERS = {
  'Content-Security-Policy': `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://static.cloudflareinsights.com ${INLINE_SCRIPT_HASHES.join(' ')}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data:; connect-src 'self' https://chat.ailawyer.lawyer; upgrade-insecure-requests`,
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.ailawyer.lawyer') {
      url.hostname = 'ailawyer.lawyer';
      return Response.redirect(url.toString(), 308);
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
    const contentType = headers.get('Content-Type') || '';
    if (contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('xml')) {
      headers.set('Cache-Control', 'no-cache');
    } else if (/\.(?:css|js|svg|jpg|jpeg|png|webp|woff2?)$/i.test(url.pathname)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
