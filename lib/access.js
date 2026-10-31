const LOOPBACKS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function isLocalHost(host) {
  return LOOPBACKS.has(String(host || '').toLowerCase());
}

function createAccess({ host = '127.0.0.1', token = '' } = {}) {
  const secret = String(token).trim();
  if (!isLocalHost(host) && !secret) {
    throw new Error('Phải đặt RPC_TOKEN trước khi cho máy chủ lắng nghe trên mạng.');
  }

  function allowedPageRequest(req) {
    // Chặn đổi tên miền trỏ về máy cục bộ để điều khiển ứng dụng từ trang lạ.
    if (isLocalHost(host)) {
      let requestHost = '';
      try {
        requestHost = new URL(`http://${req.headers.host || ''}`).hostname.toLowerCase();
      } catch (_) { return false; }
      if (!isLocalHost(requestHost)) return false;
    }
    const origin = req.headers.origin;
    if (origin) {
      let sameOrigin = false;
      try {
        const parsed = new URL(origin);
        sameOrigin = ['http:', 'https:'].includes(parsed.protocol)
          && parsed.host.toLowerCase() === String(req.headers.host || '').toLowerCase();
      } catch (_) {}
      if (!sameOrigin) return false;
    }

    return true;
  }

  function authorized(req) {
    if (!allowedPageRequest(req)) return false;
    if (!secret) return true;
    const auth = req.headers.authorization || '';
    const key = req.headers['x-temple-key'] || '';
    let queryKey = '';
    try { queryKey = new URL(req.url, 'http://localhost').searchParams.get('key') || ''; } catch (_) {}
    return auth === `Bearer ${secret}` || key === secret || queryKey === secret;
  }

  return { authorized, allowedPageRequest, host, needsToken: Boolean(secret) };
}

module.exports = { createAccess, isLocalHost };
