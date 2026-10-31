// Chỉ xử lý tên tài khoản và đường dẫn công khai thuộc miền TikTok.
// Không đi theo đường chuyển hướng tới máy nội bộ hoặc miền không tin cậy.
const USERNAME = /^[a-zA-Z0-9._]{2,32}$/;

function trustedTikTokUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== 'https:' || parsed.port || parsed.username || parsed.password) return null;
    if (host !== 'tiktok.com' && !host.endsWith('.tiktok.com')) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function usernameFromUrl(url) {
  const match = url.pathname.match(/^\/@([^/]+)(?:\/|$)/);
  if (!match || !USERNAME.test(match[1])) return null;
  return match[1];
}

async function resolveTikTokUsername(rawInput, fetchImpl = fetch) {
  const value = String(rawInput || '').trim();
  if (!value || value.length > 512) throw new Error('Tên tài khoản hoặc đường dẫn TikTok không hợp lệ');
  const direct = value.replace(/^@/, '');
  if (USERNAME.test(direct)) return direct;
  const candidate = value.startsWith('tiktok.com/') || value.startsWith('www.tiktok.com/') ||
    value.startsWith('vm.tiktok.com/') || value.startsWith('vt.tiktok.com/')
    ? `https://${value}` : value;
  let url = trustedTikTokUrl(candidate);
  if (!url) throw new Error('Chỉ chấp nhận đường dẫn HTTPS thuộc tiktok.com');
  for (let hop = 0; hop < 5; hop++) {
    const username = usernameFromUrl(url);
    if (username) return username;
    const response = await fetchImpl(url.href, {
      redirect: 'manual',
      signal: AbortSignal.timeout(4000)
    });
    try { await response.body?.cancel(); } catch (_) {}
    const location = response.headers.get('location');
    if (response.status < 300 || response.status >= 400 || !location) break;
    url = trustedTikTokUrl(new URL(location, url).href);
    if (!url) throw new Error('Đường chuyển hướng không thuộc TikTok');
  }
  throw new Error('Không tìm thấy tên tài khoản từ đường dẫn TikTok');
}

module.exports = { resolveTikTokUsername };
