export default {
  async fetch(request, env) {
    const origin = env.ORIGIN_URL || 'https://process-management-4t4o.onrender.com';
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);

    originUrl.pathname = requestUrl.pathname;
    originUrl.search = requestUrl.search;

    const proxyRequest = new Request(originUrl, request);
    proxyRequest.headers.set('X-Forwarded-Host', requestUrl.host);
    proxyRequest.headers.set('X-Forwarded-Proto', requestUrl.protocol.replace(':', ''));

    return fetch(proxyRequest);
  },
};
