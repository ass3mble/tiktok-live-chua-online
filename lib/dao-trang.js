// Quản lý đạo tràng 2,5 chiều dùng chung kết nối TikTok của máy chủ.
// Dữ liệu nhân vật chỉ lưu trong bộ nhớ, tách khỏi bảng công đức bền vững.
const SKINS = ['man', 'woman', 'woman', 'man', 'granny', 'monk', 'nun', 'child'];
const SKIN_WORDS = [
  ['master', ['cao tăng', 'cao tang']],
  ['monk', ['sư', 'su', 'sư thầy', 'su thay', 'thầy']],
  ['nun', ['ni', 'ni cô', 'ni co', 'sư cô', 'su co']],
  ['child', ['tiểu', 'tieu', 'chú tiểu', 'chu tieu', 'bé']],
  ['granny', ['bà', 'ba', 'cụ', 'áo nâu']],
  ['woman', ['nữ', 'nu', 'chị', 'gái']],
  ['man', ['nam', 'anh', 'trai']]
];

function skinFromText(input) {
  const text = String(input || '').toLowerCase().normalize('NFC')
    .replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!text || text.split(' ').length > 3) return null;
  for (const [skin, phrases] of SKIN_WORDS) {
    if (phrases.includes(text)) return skin;
  }
  return null;
}

const DEMO_NAMES = ['Diệu Hạnh', 'Minh Tâm', 'Thiện Đức', 'Huệ An', 'Tịnh Nhã',
  'Quảng Trí', 'Pháp Hỷ', 'Diệu Liên', 'Bảo Ngọc', 'Trí Hải', 'Nguyên Thanh', 'Tâm Đăng',
  'Phước Lộc', 'An Lạc', 'Từ Tâm', 'Hạnh Nguyện', 'Ngọc Lan', 'Tuệ Minh'];

const CHANTS = [
  'Nam mô Bổn Sư Thích Ca Mâu Ni Phật. Nguyện đem công đức này hướng về khắp tất cả chúng sinh.',
  'Nam mô A Di Đà Phật. Nguyện cầu gia đình bình an, thân tâm thanh tịnh.',
  'Nam mô Đại Bi Quán Thế Âm Bồ Tát. Nguyện cho chúng sinh được an lạc và bình yên.',
  'Nguyện đem công đức tu hành hướng về mọi người, lòng từ bi rộng mở.'
];

function bounded(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : fallback;
}

class DaoTrang {
  constructor(notify = () => {}, now = () => Date.now()) {
    this.notify = notify;
    this.now = now;
    this.startedAt = now();
    this.viewers = new Map();
    this.chantIndex = 0;
    this.chantTimer = null;
    this.settings = {
      title: 'Diệu Liên Đài',
      subtitle: 'Tâm tịnh, liên khai',
      music: true,
      mo: true,
      moBpm: 52,
      autoChant: false,
      chantEveryMin: 3,
      seatMode: 'auto',
      joinOnEnter: false
    };
  }

  capacity() {
    if (this.settings.seatMode !== 'auto') return Number(this.settings.seatMode);
    const count = this.viewers.size;
    return [24, 36, 64, 100].find(value => count <= value) || 100;
  }

  list() {
    return [...this.viewers.values()].map(({ id, name, skin, avatar, coins, demo }) =>
      ({ id, name, skin, avatar, coins, demo }));
  }

  snapshot(tiktok = {}) {
    return { settings: { ...this.settings }, viewers: this.list(),
      cap: this.capacity(), startedAt: this.startedAt, tiktok };
  }

  send(type, event = {}) {
    this.notify({ type, ...event });
  }

  join(rawId, rawName, opts = {}) {
    const id = String(rawId || rawName || '').slice(0, 80).trim();
    if (!id) return null;
    const current = this.viewers.get(id);
    if (current) {
      current.lastAt = this.now();
      if (opts.avatar) current.avatar = String(opts.avatar).slice(0, 500);
      return current;
    }
    const maxSeats = this.settings.seatMode === 'auto' ? 100 : Number(this.settings.seatMode);
    if (this.viewers.size >= maxSeats) {
      const quiet = [...this.viewers.values()].filter(v => v.coins === 0)
        .sort((a, b) => Number(b.demo) - Number(a.demo) || a.lastAt - b.lastAt)[0];
      if (!quiet) return null;
      this.viewers.delete(quiet.id);
      this.send('leave', { id: quiet.id });
    }
    const name = String(rawName || id).slice(0, 32);
    const avatar = typeof opts.avatar === 'string' && /^https:\/\//.test(opts.avatar)
      ? opts.avatar.slice(0, 500) : '';
    const viewer = { id, name, skin: opts.skin || SKINS[this.viewers.size % SKINS.length],
      avatar, coins: 0, lastAt: this.now(), lastText: '', lastTextAt: 0,
      demo: Boolean(opts.demo) };
    this.viewers.set(id, viewer);
    this.send('join', { v: { id, name, skin: viewer.skin, avatar, coins: 0, demo: viewer.demo }, cap: this.capacity() });
    return viewer;
  }

  chat({ id, name, text, avatar = '', demo = false } = {}) {
    const rawText = String(text || '').slice(0, 120);
    if (!rawText.trim()) return null;
    const skin = skinFromText(rawText);
    const viewer = this.join(id, name, { avatar, demo, skin: skin || undefined });
    if (!viewer) return null;
    if (skin && viewer.skin !== skin) {
      viewer.skin = skin;
      this.send('skin', { id: viewer.id, skin });
    }
    viewer.lastText = rawText;
    viewer.lastTextAt = this.now();
    this.send('chat', { id: viewer.id, name: viewer.name, text: rawText });
    return viewer;
  }

  gift({ id, name, avatar = '', coins = 1, giftName = '', count = 1, demo = false, ttsText = '' } = {}) {
    const viewer = this.join(id, name, { avatar, demo });
    if (!viewer) return null;
    const amount = bounded(coins, 1, 500000, 1);
    const repeat = bounded(count, 1, 9999, 1);
    viewer.coins += amount;
    const prayer = viewer.lastText && this.now() - viewer.lastTextAt < 90000
      && viewer.lastText.length > 6 ? viewer.lastText : 'Nguyện cầu bình an cho gia đình';
    this.send('gift', { id: viewer.id, name: viewer.name, giftName: String(giftName || 'Hoa sen').slice(0, 70),
      count: repeat, coins: amount, total: viewer.coins, tier: amount >= 100 ? 3 : amount >= 10 ? 2 : 1,
      prayer, ttsText });
    return viewer;
  }

  like(id, count = 1) {
    const viewer = this.viewers.get(String(id));
    if (!viewer) return;
    this.send('like', { id: viewer.id, n: bounded(count, 1, 100, 1) });
  }

  fillDemo(rawCount) {
    const maxSeats = this.settings.seatMode === 'auto' ? 100 : Number(this.settings.seatMode);
    const wanted = Math.min(maxSeats, bounded(rawCount, 0, 100, 0));
    let existing = [...this.viewers.values()].filter(v => v.demo).length;
    // Chỉ lấp chỗ còn trống, không đẩy khán giả thật ra ngoài để xếp người mẫu.
    while (this.viewers.size < wanted && this.viewers.size < maxSeats) {
      const i = existing++;
      const name = DEMO_NAMES[i % DEMO_NAMES.length] + (i >= DEMO_NAMES.length ? ` ${Math.floor(i / DEMO_NAMES.length) + 1}` : '');
      this.join(`demo_${i}`, name, { demo: true, skin: SKINS[i % SKINS.length] });
    }
    return this.snapshot();
  }

  clearDemo() {
    for (const [id, viewer] of this.viewers) {
      if (viewer.demo) {
        this.viewers.delete(id);
        this.send('leave', { id });
      }
    }
    return this.snapshot();
  }

  clearAll() {
    for (const id of this.viewers.keys()) this.send('leave', { id });
    this.viewers.clear();
    return this.snapshot();
  }

  changeSettings(incoming = {}) {
    const s = this.settings;
    for (const [key, maxLength] of [['title', 50], ['subtitle', 85]]) {
      if (typeof incoming[key] === 'string') {
        const clean = incoming[key].normalize('NFC').replace(/[<>\u0000-\u001F]/g, '')
          .replace(/\s+/g, ' ').trim().slice(0, maxLength);
        if (clean) s[key] = clean;
      }
    }
    if (typeof incoming.seatMode === 'string' && ['auto', '24', '36', '64', '100'].includes(incoming.seatMode)) s.seatMode = incoming.seatMode;
    if (s.seatMode !== 'auto') {
      const maxSeats = Number(s.seatMode);
      while (this.viewers.size > maxSeats) {
        const sorted = [...this.viewers.values()].sort((a, b) => a.lastAt - b.lastAt);
        const leave = sorted.find(v => v.demo) || sorted.find(v => v.coins === 0) || sorted[0];
        this.viewers.delete(leave.id);
        this.send('leave', { id: leave.id });
      }
    }
    for (const key of ['music', 'mo', 'autoChant', 'joinOnEnter']) {
      if (typeof incoming[key] === 'boolean') s[key] = incoming[key];
    }
    if (incoming.moBpm != null) s.moBpm = bounded(incoming.moBpm, 20, 120, s.moBpm);
    if (incoming.chantEveryMin != null) s.chantEveryMin = bounded(incoming.chantEveryMin, 1, 60, s.chantEveryMin);
    this.configureChant();
    this.send('settings', { settings: { ...s }, cap: this.capacity() });
    return this.snapshot();
  }

  chant() {
    const text = CHANTS[this.chantIndex++ % CHANTS.length];
    this.send('chant', { text });
    return { text };
  }

  configureChant() {
    if (this.chantTimer) clearInterval(this.chantTimer);
    this.chantTimer = this.settings.autoChant
      ? setInterval(() => this.chant(), this.settings.chantEveryMin * 60000) : null;
    if (this.chantTimer && typeof this.chantTimer.unref === 'function') this.chantTimer.unref();
  }
}

module.exports = { DaoTrang, skinFromText };
