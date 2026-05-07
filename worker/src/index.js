export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      return proxyApi(request, env)
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('BloodChain Worker is running. Build frontend assets before serving the app.', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  },
}

async function proxyApi(request, env) {
  const backendOrigin = normalizeOrigin(env.BACKEND_ORIGIN)

  if (!backendOrigin) {
    return Response.json(
      {
        ok: false,
        message: 'BACKEND_ORIGIN is not configured. Set it to the deployed Express backend origin.',
      },
      { status: 503 },
    )
  }

  const targetUrl = new URL(request.url)
  const backendUrl = new URL(backendOrigin)
  targetUrl.protocol = backendUrl.protocol
  targetUrl.hostname = backendUrl.hostname
  targetUrl.port = backendUrl.port

  const proxiedRequest = new Request(targetUrl.toString(), request)
  return fetch(proxiedRequest)
}

function normalizeOrigin(value) {
  const text = String(value || '').trim().replace(/\/+$/, '')
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}
