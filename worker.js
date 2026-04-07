const TEXT_HEADERS = { 'content-type': 'text/plain; charset=utf-8' };

function buildProxyRequest(request, appOrigin) {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(appOrigin);

  targetUrl.pathname = incomingUrl.pathname;
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', incomingUrl.host);
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''));

  return new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: request.redirect,
  });
}

export default {
  async fetch(request, env) {
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }

      const requestUrl = new URL(request.url);
      if (requestUrl.pathname === '/') {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        if (indexResponse.status !== 404) {
          return indexResponse;
        }
      }
    }

    if (env.APP_ORIGIN) {
      const proxyRequest = buildProxyRequest(request, env.APP_ORIGIN);
      return fetch(proxyRequest);
    }

    return new Response(
      'Tobacco Tracker Worker is deployed, but no frontend origin is configured. Set APP_ORIGIN in Cloudflare Worker variables to proxy your app.',
      {
        status: 200,
        headers: TEXT_HEADERS,
      },
    );
  },
};
