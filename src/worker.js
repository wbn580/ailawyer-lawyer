const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data:; connect-src 'self' https://chat.ailawyer.lawyer; upgrade-insecure-requests",
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
