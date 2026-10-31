const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');
const { TikTokLiveConnection, WebcastEvent, ControlEvent } = require('tiktok-live-connector');
const { GiftEventCounter } = require('./lib/gift-events');
const { createAccess } = require('./lib/access');
const { DaoTrang } = require('./lib/dao-trang');
const { boundedInteger, safeSettings } = require('./lib/input-rules');
const { resolveTikTokUsername } = require('./lib/tiktok-input');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const access = createAccess({ host: HOST, token: process.env.RPC_TOKEN });
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const TTS_CACHE_DIR = path.join(DATA_DIR, 'tts-cache');
const STATE_FILE = path.join(DATA_DIR, 'merit-state.json');

fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });

// ============================================================================
// 1. BỘ 18 QUẺ LINH XĂM DIỆU LIÊN ĐÀI (FORTUNE STICKS DECK)
// ============================================================================
const FORTUNE_DECK = [
  {
    number: 1,
    rank: 'Thượng Thượng Cát',
    title: 'Nhật Xuất Đông Phương — Mặt Trời Mọc Phương Đông',
    poem: 'Đông phương nhật xuất chiếu Càn Khôn\nHoa nở đầy cành rạng sắc xuân\nCông danh tài lộc đều viên mãn\nGia đạo bình an phúc lộc tồn.',
    meaning: 'Mọi sự mưu cầu đều đại cát đại lợi. Công việc hanh thông, quý nhân phù trợ, gia đình hòa thuận ấm êm.',
    ttsSummary: 'Quẻ số 1, Thượng Thượng Cát, Nhật Xuất Đông Phương. Mọi sự mưu cầu đều đại cát đại lợi, công danh tài lộc viên mãn, quý nhân phù trợ.'
  },
  {
    number: 8,
    rank: 'Thượng Cát',
    title: 'Kim Liên Khai Nở — Sen Vàng Tỏa Ngát',
    poem: 'Sen vàng nở rộ giữa hồ trong\nHương thơm lan tỏa khắp non sông\nLòng thành thắp nén nhang cầu nguyện\nTrời Phật chứng tri thỏa ước mong.',
    meaning: 'Tâm thiện lành ắt gặp phước báu. Cầu tài đắc tài, cầu bình an đắc bình an, bệnh tật tiêu trừ.',
    ttsSummary: 'Quẻ số 8, Thượng Cát, Kim Liên Khai Nở. Tâm thiện lành ắt gặp phước báu, cầu tài đắc tài, cầu bình an đắc bình an.'
  },
  {
    number: 12,
    rank: 'Đại Cát',
    title: 'Long Vân Tương Hội — Rồng Mây Gặp Gỡ',
    poem: 'Rồng thiêng gặp hội tầng mây xanh\nVượt Vũ Môn Quan rạng rỡ danh\nThí chủ kiên tâm hành thiện đạo\nPhúc dày lộc vượng khắp gia đình.',
    meaning: 'Thời vận đang lên mạnh mẽ. Thi cử đỗ đạt, kinh doanh phát đạt, gặp cơ hội lớn đổi đời.',
    ttsSummary: 'Quẻ số 12, Đại Cát, Long Vân Tương Hội. Thời vận đang lên mạnh mẽ, thi cử đỗ đạt, kinh doanh phát đạt.'
  },
  {
    number: 18,
    rank: 'Thượng Cát',
    title: 'Xuân Phong Đắc Ý — Gió Xuân Thuận Buồm',
    poem: 'Thuận buồm xuôi gió vượt trùng khơi\nBến giác bình yên nắng rạng ngời\nTài lộc dồi dào nhân duyên tốt\nBốn mùa hưng thịnh rộn niềm vui.',
    meaning: 'Đi xa gặp may, buôn bán thuận lợi, tình duyên êm đẹp, người thân mạnh khỏe.',
    ttsSummary: 'Quẻ số 18, Thượng Cát, Xuân Phong Đắc Ý. Thuận buồm xuôi gió, tài lộc dồi dào, nhân duyên tốt đẹp.'
  },
  {
    number: 24,
    rank: 'Trung Cát',
    title: 'Vũ Quá Thiên Thanh — Mưa Tạnh Trời Trong',
    poem: 'Mưa qua trời lại sáng trong ngần\nGian khó lùi xa đón phúc phần\nGiữ vững lòng thành đừng nản chí\nHoa thơm trái ngọt đến mười phân.',
    meaning: 'Khó khăn cũ sắp qua đi, vận may mới đang tới. Hãy kiên nhẫn và giữ tâm bình tĩnh.',
    ttsSummary: 'Quẻ số 24, Trung Cát, Vũ Quá Thiên Thanh. Mưa qua trời lại sáng trong, gian khó lùi xa để đón phúc phần mới.'
  },
  {
    number: 36,
    rank: 'Thượng Thượng Cát',
    title: 'Phúc Tinh Cao Chiếu — Sao Phúc Chiếu Mệnh',
    poem: 'Phúc tinh rực sáng giữa đêm rằm\nTừ bi Phật độ suốt quanh năm\nTài lộc tự nhiên về gõ cửa\nTrăm điều như ý vạn điều lành.',
    meaning: 'Sao Phúc chiếu mạng, tai qua nạn khỏi, tiền tài sung túc, gia đạo hưng long.',
    ttsSummary: 'Quẻ số 36, Thượng Thượng Cát, Phúc Tinh Cao Chiếu. Sao Phúc chiếu mạng, tài lộc tự nhiên gõ cửa, trăm điều như ý.'
  },
  {
    number: 52,
    rank: 'Thượng Cát',
    title: 'Ngọc Xuất Côn Sơn — Ngọc Quý Phát Sáng',
    poem: 'Ngọc quý Côn Sơn tỏa ánh ngời\nBấy lâu rèn giũa nay gặp thời\nTri âm tương ngộ cùng nâng đỡ\nSự nghiệp thăng hoa rạng rỡ đời.',
    meaning: 'Nỗ lực bấy lâu nay sắp được đền đáp xứng đáng. Có người tốt nâng đỡ trong công việc và cuộc sống.',
    ttsSummary: 'Quẻ số 52, Thượng Cát, Ngọc Xuất Côn Sơn. Nỗ lực bấy lâu sắp được đền đáp xứng đáng, sự nghiệp thăng hoa.'
  },
  {
    number: 68,
    rank: 'Đại Cát',
    title: 'Lộc Mã Đồng Hương — Lộc Tài Cùng Tới',
    poem: 'Lộc Mã song hành đến tận nhà\nLàm ăn buôn bán nở như hoa\nTâm thành bố thí thêm công đức\nPhú quý vinh hoa khắp một nhà.',
    meaning: 'Quẻ đại lợi về tài lộc và kinh doanh. Nên làm nhiều việc thiện để phúc đức càng thêm bền vững.',
    ttsSummary: 'Quẻ số 68, Đại Cát, Lộc Mã Đồng Hương. Đại lợi về tài lộc và buôn bán, phú quý vinh hoa khắp một nhà.'
  },
  {
    number: 81,
    rank: 'Thượng Cát',
    title: 'Nguyệt Nhập Trung Thiên — Trăng Rằm Giữa Đỉnh',
    poem: 'Trăng tròn vằng vặc giữa trời thu\nSoi sáng muôn phương sạch mây mù\nTình duyên viên mãn gia đình thuận\nTâm an vạn sự chẳng ưu tư.',
    meaning: 'Tình duyên và gia đạo vô cùng tốt đẹp. Người độc thân dễ gặp ý trung nhân, gia đình thêm tin vui.',
    ttsSummary: 'Quẻ số 81, Thượng Cát, Nguyệt Nhập Trung Thiên. Tình duyên viên mãn, gia đình hòa thuận, tâm an vạn sự lành.'
  },
  {
    number: 99,
    rank: 'Thượng Thượng Cát',
    title: 'Vạn Sự Viên Thành — Cửu Cửu Đại Cát',
    poem: 'Chín tầng mây trắng ánh hào quang\nTừ bi Phật Tổ độ nhân gian\nThí chủ lòng thành dâng lễ bái\nTrọn đời trường thọ hưởng vinh khang.',
    meaning: 'Quẻ tối thượng cát tường. Sức khỏe trường thọ, công danh hiển đạt, vạn sự viên thành.',
    ttsSummary: 'Quẻ số 99, Thượng Thượng Cát, Vạn Sự Viên Thành. Quẻ tối thượng cát tường, sức khỏe trường thọ, vạn sự như ý.'
  }
];

// ============================================================================
// 2. ZEROTTS PYTHON WORKER MANAGER (VOICE: MAI CHI)
// ============================================================================
class ZeroTTSManager {
  constructor() {
    this.proc = null;
    this.ready = false;
    this.status = 'starting';
    this.voice = 'maichi';
    this.voices = ['maichi'];
    this.model = 'zeroweight-ai/ZeroTTS';
    this.pending = new Map();
    this.inflight = new Map();
    this.reqCounter = 0;
    this.buffer = '';
    this.restartTimer = null;
    this.restartCount = 0;
    this.restartWindowAt = Date.now();
    this.stopping = false;
    if (process.env.DISABLE_TTS === '1') {
      this.status = 'disabled';
    } else {
      this.startWorker();
    }
  }

  resolvePythonBin() {
    const candidates = process.platform === 'win32'
      ? [path.join(__dirname, '.venv', 'Scripts', 'python.exe')]
      : [path.join(__dirname, '.venv', 'bin', 'python')];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return process.platform === 'win32' ? 'python' : 'python3';
  }

  startWorker() {
    if (this.stopping) return;
    const pyBin = this.resolvePythonBin();
    const scriptPath = path.join(__dirname, 'tts_worker.py');
    console.log(`[ZeroTTS] Khởi chạy worker với ${pyBin} (Giọng mặc định: Mai Chi)...`);

    this.status = 'loading';
    const worker = spawn(pyBin, [scriptPath], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      windowsHide: true
    });
    this.proc = worker;
    this.buffer = '';

    let failureHandled = false;
    const workerFailed = (reason, status = 'stopped') => {
      if (failureHandled) return;
      failureHandled = true;
      if (this.proc === worker) this.proc = null;
      this.ready = false;
      this.status = status;
      for (const [, item] of this.pending) {
        clearTimeout(item.timer);
        item.resolve({ ok: false, error: reason });
      }
      this.pending.clear();
      if (!this.stopping) this.scheduleRestart();
    };

    worker.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8');
      if (this.buffer.length > 1024 * 1024) {
        console.error('[ZeroTTS] Dữ liệu trả về vượt giới hạn an toàn');
        worker.kill();
        return;
      }
      let lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        this.handleWorkerLine(line.trim());
      }
    });

    worker.stderr.on('data', (chunk) => {
      const msg = chunk.toString('utf8').trim();
      if (msg) console.log(`[ZeroTTS stderr] ${msg}`);
    });

    worker.on('exit', (code) => {
      console.warn(`[ZeroTTS] Worker thoát với mã ${code}`);
      workerFailed(`Bộ đọc tiếng Việt đã dừng (mã ${code})`);
    });
    worker.on('error', (err) => {
      console.error('[ZeroTTS] Không thể khởi chạy Python:', err.message);
      workerFailed(err.message, 'error');
    });
  }

  scheduleRestart() {
    if (this.restartTimer || this.stopping || process.env.DISABLE_TTS === '1') return;
    const now = Date.now();
    if (now - this.restartWindowAt > 5 * 60000) {
      this.restartWindowAt = now;
      this.restartCount = 0;
    }
    if (this.restartCount >= 3) {
      this.status = 'error';
      console.error('[ZeroTTS] Đã thử khởi động lại 3 lần, cần kiểm tra môi trường Python.');
      return;
    }
    const delay = 2000 * (2 ** this.restartCount++);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.startWorker();
    }, delay);
  }

  stopWorker() {
    this.stopping = true;
    clearTimeout(this.restartTimer);
    this.restartTimer = null;
    if (this.proc) this.proc.kill();
  }

  handleWorkerLine(line) {
    try {
      const msg = JSON.parse(line);
      if (msg.type === 'status') {
        this.status = msg.status;
        this.model = msg.model || this.model;
        broadcastNotification('tts.status', this.getStatus());
      } else if (msg.type === 'ready') {
        this.ready = true;
        this.status = 'ready';
        this.voice = msg.voice || 'maichi';
        this.voices = msg.voices || ['maichi'];
        this.model = msg.model || this.model;
        console.log(`[ZeroTTS] Sẵn sàng sau ${msg.loadSec}s! Giọng: ${this.voice} (${this.voices.join(', ')})`);
        broadcastNotification('tts.status', this.getStatus());
      } else if (msg.type === 'result' && msg.id != null) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          clearTimeout(entry.timer);
          this.pending.delete(msg.id);
          entry.resolve(msg);
        }
      } else if (msg.type === 'error') {
        console.error('[ZeroTTS Error]', msg.error);
        this.status = 'error';
        broadcastNotification('tts.status', this.getStatus());
      }
    } catch (err) {
      console.log('[ZeroTTS stdout]', line);
    }
  }

  getStatus() {
    return {
      ready: this.ready,
      status: this.status,
      engine: 'ZeroTTS (zeroweight-ai/ZeroTTS)',
      voice: state.settings.ttsVoice || this.voice || 'maichi',
      voices: this.voices,
      model: this.model
    };
  }

  synthesize(text, voiceOverride) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return Promise.resolve({ ok: false, error: 'Empty text' });
    if (cleanText.length > 500) return Promise.resolve({ ok: false, error: 'Nội dung giọng đọc quá dài' });
    const voice = (voiceOverride || state.settings.ttsVoice || 'maichi').toLowerCase();
    const dedupKey = `${voice}::${cleanText}`;

    if (this.inflight.has(dedupKey)) {
      return this.inflight.get(dedupKey);
    }

    // Tránh nghẽn cả hệ thống khi nhiều người gửi lời cầu nguyện cùng lúc.
    if (this.pending.size >= 12) {
      return Promise.resolve({ ok: false, error: 'Hàng đợi giọng đọc đã đầy, vui lòng thử lại' });
    }

    const promise = new Promise((resolve) => {
      if (!this.proc || !this.ready) {
        return resolve({ ok: false, error: `ZeroTTS đang ở trạng thái: ${this.status}` });
      }
      const id = ++this.reqCounter;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, error: 'ZeroTTS synthesis timeout' });
      }, 30000);

      this.pending.set(id, { resolve, timer });
      const payload = JSON.stringify({ id, text: cleanText, voice }) + '\n';
      try {
        if (!this.proc || this.proc.stdin.destroyed) throw new Error('Tiến trình giọng đọc đã đóng');
        this.proc.stdin.write(payload, (err) => {
          if (!err || !this.pending.has(id)) return;
          clearTimeout(timer);
          this.pending.delete(id);
          resolve({ ok: false, error: err.message });
        });
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(id);
        resolve({ ok: false, error: err.message });
      }
    }).finally(() => {
      this.inflight.delete(dedupKey);
    });

    this.inflight.set(dedupKey, promise);
    return promise;
  }
}

// ============================================================================
// 3. TRẠNG THÁI CHÙA ONLINE & BẢNG VÀNG CÔNG ĐỨC
// ============================================================================
const DEFAULT_STATE = {
  totalIncense: 0,
  totalMerit: 0,
  woodenFishHits: 0,
  bellRings: 0,
  lanternCount: 0,
  fortuneCount: 0,
  activeIncenseSticks: 3,
  haloIntensity: 0.45,
  offerings: {
    lotus: 0,
    fruit: 0,
    lamp: 0,
    dragon: 0
  },
  devotees: {},
  recentEvents: [],
  settings: {
    ttsEnabled: true,
    ttsVoice: 'maichi',
    bgMusicEnabled: true,
    sfxEnabled: true,
    smokeDensity: 1.0,
    autoSim: false,
    autoSimIntervalMs: 9500
  },
  tiktok: {
    connected: false,
    connecting: false,
    username: '',
    roomId: null,
    viewerCount: 0,
    lastError: null
  }
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
        throw new Error('Dữ liệu gốc không phải một đối tượng hợp lệ');
      }
      const numberFields = ['totalIncense', 'totalMerit', 'woodenFishHits', 'bellRings',
        'lanternCount', 'fortuneCount', 'activeIncenseSticks'];
      for (const field of numberFields) {
        if (saved[field] !== undefined && (!Number.isSafeInteger(saved[field]) || saved[field] < 0)) {
          throw new Error(`Giá trị ${field} bị sai hoặc quá giới hạn`);
        }
      }
      if (saved.devotees != null && (typeof saved.devotees !== 'object' || Array.isArray(saved.devotees))) {
        throw new Error('Bảng công đức không đúng cấu trúc');
      }
      for (const devotee of Object.values(saved.devotees || {})) {
        if (!devotee || !Number.isSafeInteger(devotee.merit) || devotee.merit < 0) {
          throw new Error('Có người xem mang giá trị công đức không hợp lệ');
        }
      }
      return {
        ...DEFAULT_STATE,
        ...saved,
        devotees: saved.devotees || {},
        offerings: { ...DEFAULT_STATE.offerings, ...(saved.offerings || {}) },
        // Tương tác thử luôn tắt sau khi khởi động lại, tránh số liệu giả xuất hiện ngoài ý muốn.
        settings: { ...DEFAULT_STATE.settings, ...(saved.settings || {}), autoSim: false },
        tiktok: { ...DEFAULT_STATE.tiktok }
      };
    }
  } catch (e) {
    // Không thay thế dữ liệu thật bằng bảng rỗng nếu tệp bị lỗi.
    // Người vận hành có thể khôi phục bản sao thay vì mất toàn bộ bảng công đức.
    if (fs.existsSync(STATE_FILE)) {
      throw new Error(`Tệp công đức không hợp lệ, chưa ghi đè: ${STATE_FILE}. ${e.message}`);
    }
    throw e;
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

let state = loadState();

let saveTimer = null;
let firstUnflushedAt = 0;
let pendingWrite = Promise.resolve();
function serializeState() {
  return JSON.stringify({
    totalIncense: state.totalIncense,
    totalMerit: state.totalMerit,
    woodenFishHits: state.woodenFishHits,
    bellRings: state.bellRings,
    lanternCount: state.lanternCount,
    fortuneCount: state.fortuneCount,
    activeIncenseSticks: state.activeIncenseSticks,
    offerings: state.offerings,
    devotees: state.devotees,
    settings: state.settings
  }, null, 2);
}

function flushState() {
  clearTimeout(saveTimer);
  saveTimer = null;
  firstUnflushedAt = 0;
  const serialized = serializeState();
  // Chụp dữ liệu ở thời điểm gọi, ghi tuần tự và thay tệp nguyên khối.
  pendingWrite = pendingWrite.catch(() => {}).then(async () => {
    const tempPath = `${STATE_FILE}.tmp`;
    await fs.promises.writeFile(tempPath, serialized, 'utf8');
    await fs.promises.rename(tempPath, STATE_FILE);
  }).catch((error) => {
    console.error('[Trạng thái] Lỗi ghi dữ liệu:', error.message);
    throw error;
  });
  return pendingWrite;
}

function saveState() {
  if (!firstUnflushedAt) firstUnflushedAt = Date.now();
  if (Date.now() - firstUnflushedAt >= 5000) {
    flushState().catch(() => {});
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { flushState().catch(() => {}); }, 800);
}

let leaderboardDirty = true;
let leaderboardCache = [];
function getLeaderboard(limit = 6) {
  if (leaderboardDirty) {
    leaderboardCache = Object.values(state.devotees)
      .sort((a, b) => b.merit - a.merit)
      .slice(0, 24)
      .map((d, index) => ({
      rank: index + 1,
      name: d.name,
      uniqueId: d.uniqueId,
      avatar: d.avatar || '',
      merit: d.merit,
      incense: d.incense || 0,
      lastWish: d.lastWish || ''
    }));
    leaderboardDirty = false;
  }
  return leaderboardCache.slice(0, limit);
}
// Bộ lọc chặn ký tự lạ (Cuneiform 𒐫, Zalgo, Braille, ký tự spam) & từ ngữ phản cảm
const WEIRD_SPAM_RE = /[\u{12000}-\u{1254F}\uFDFD\u2800-\u28FF\u2580-\u259F]|[\u0300-\u036F]{3,}/u;
const BRACKET_EMOTE_RE = /\[[^\]]{1,24}\]/g;
const ALLOWED_VI_TEXT_RE = /[^0-9a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ\s.,!?]/g;
const ALLOWED_VI_NAME_RE = /[^0-9a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ\s._-]/g;
const VI_LETTER_RE = /[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/g;
const BAD_WORDS_RE = /(đá dái|địt|lồn|cặc|đm|vcl|vl|yamate|i cư|lừa đảo|lừa à|te-le gram|telegram|bố là trùm)/i;

function isBlockedSpamOrToxic(raw) {
  if (!raw) return true;
  const s = String(raw);
  if (WEIRD_SPAM_RE.test(s)) return true;
  if (BAD_WORDS_RE.test(s)) return true;
  return false;
}

function sanitizeUserName(rawName) {
  const normalized = String(rawName || '')
    .normalize('NFKC')
    .normalize('NFC')
    .replace(BRACKET_EMOTE_RE, ' ')
    .replace(ALLOWED_VI_NAME_RE, ' ')
    .replace(/(.)\1{3,}/gi, '$1$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 26);

  if (!normalized || BAD_WORDS_RE.test(normalized)) {
    return 'Thí Chủ Hữu Duyên';
  }
  const letters = normalized.match(VI_LETTER_RE) || [];
  if (letters.length < 2) {
    return 'Thí Chủ Hữu Duyên';
  }
  return normalized;
}

function sanitizeWishText(rawWish) {
  if (!rawWish) return '';
  const cleaned = String(rawWish)
    .normalize('NFKC')
    .normalize('NFC')
    .replace(BRACKET_EMOTE_RE, ' ')
    .replace(ALLOWED_VI_TEXT_RE, ' ')
    .replace(/([.,!?])\1+/g, '$1')
    .replace(/(.)\1{2,}/gi, '$1$1')
    .replace(/\s+/g, ' ')
    .replace(/^[.,!?\s-]+|[.,!?\s-]+$/g, '')
    .slice(0, 120);

  if (!cleaned || BAD_WORDS_RE.test(cleaned)) return '';
  const letters = cleaned.match(VI_LETTER_RE) || [];
  if (letters.length < 2) return '';
  return cleaned;
}

function recordDevotee(user, uniqueId, avatar, meritDelta, incenseDelta = 0, giftDelta = 0, wish = '') {
  const displayName = sanitizeUserName(user || uniqueId);
  const cleanWish = sanitizeWishText(wish);
  const cleanId = String(uniqueId || displayName).slice(0, 80);
  const cleanAvatar = typeof avatar === 'string' && /^https:\/\//i.test(avatar)
    ? avatar.slice(0, 512) : '';
  const key = `u:${cleanId}`;
  if (!Object.hasOwn(state.devotees, key)) {
    state.devotees[key] = {
      name: displayName,
      uniqueId: cleanId,
      avatar: cleanAvatar,
      merit: 0,
      incense: 0,
      gifts: 0,
      lastWish: ''
    };
  }
  const dev = state.devotees[key];
  dev.name = displayName;
  if (cleanAvatar) dev.avatar = cleanAvatar;
  dev.merit += meritDelta;
  dev.incense += incenseDelta;
  dev.gifts += giftDelta;
  if (cleanWish) dev.lastWish = cleanWish;

  state.totalMerit += meritDelta;
  leaderboardDirty = true;
  state.haloIntensity = Math.min(1.0, 0.35 + (state.totalMerit % 1000) / 1400);
  return dev;
}

function pushEventLog(evt) {
  const entry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...evt
  };
  state.recentEvents.unshift(entry);
  if (state.recentEvents.length > 35) {
    state.recentEvents.length = 35;
  }
  return entry;
}

function getPublicState() {
  return {
    totalIncense: state.totalIncense,
    totalMerit: state.totalMerit,
    woodenFishHits: state.woodenFishHits,
    bellRings: state.bellRings,
    lanternCount: state.lanternCount,
    fortuneCount: state.fortuneCount,
    activeIncenseSticks: state.activeIncenseSticks,
    haloIntensity: state.haloIntensity,
    offerings: state.offerings,
    leaderboard: getLeaderboard(24),
    recentEvents: state.recentEvents.slice(0, 15),
    settings: state.settings,
    tiktok: state.tiktok,
    tts: zeroTts ? zeroTts.getStatus() : { ready: false, status: 'init', voice: 'maichi' }
  };
}

const daoTrang = new DaoTrang((event) => {
  broadcastNotification('temple.daoEvent', event);
  const voiceText = event.type === 'chant' ? event.text :
    event.type === 'gift' ? event.ttsText : '';
  // Chỉ một tiến trình đọc tiếng cho cả hai khung cảnh, không nhân đôi bản thu.
  if (voiceText && state.settings.ttsEnabled !== false && zeroTts?.ready) {
    zeroTts.synthesize(voiceText, state.settings.ttsVoice || 'maichi').then((result) => {
      if (result.ok) broadcastNotification('temple.daoEvent',
        { type: 'tts', url: result.url, text: voiceText });
    }).catch(() => {});
  }
});

function broadcastDaoState() {
  broadcastNotification('temple.daoState', daoTrang.snapshot(state.tiktok));
}

function daoViewerId(user, uniqueId) {
  return uniqueId ? String(uniqueId) : `demo:${String(user || 'khach').slice(0, 40)}`;
}

// ============================================================================
// 4. NGHI THỨC TƯƠNG TÁC (RITUAL HANDLERS)
// ============================================================================
const Rituals = {
  burnIncense(params = {}) {
    const user = sanitizeUserName(params.user);
    const uniqueId = params.uniqueId || '';
    const avatar = params.avatar || '';
    const count = boundedInteger(params.count, 3, 1, 9);
    const wish = sanitizeWishText(params.wish) || 'Thành tâm dâng hương bái Phật, cầu bình an cát tường';
    const merit = count * 5;

    state.totalIncense += count;
    state.activeIncenseSticks = Math.min(36, state.activeIncenseSticks + count);
    const devotee = recordDevotee(user, uniqueId, avatar, merit, count, 0, wish);

    const ttsText = params.readTts === false
      ? ''
      : `Nam mô A Di Đà Phật. Cảm tạ thí chủ ${devotee.name} đã thành tâm thắp ${count} nén hương thơm. ${wish}.`;

    const event = pushEventLog({
      type: 'burnIncense',
      user: devotee.name,
      uniqueId: devotee.uniqueId,
      avatar: devotee.avatar,
      count,
      merit,
      wish,
      ttsText,
      ttsVoice: state.settings.ttsVoice || 'maichi'
    });

    saveState();
    broadcastNotification('temple.event', { event, state: getPublicState() });
    return { event, state: getPublicState() };
  },

  strikeWoodenFish(params = {}) {
    const user = sanitizeUserName(params.user);
    const uniqueId = params.uniqueId || '';
    const avatar = params.avatar || '';
    const count = boundedInteger(params.count, 1, 1, 50);
    const merit = count;

    state.woodenFishHits += count;
    const devotee = recordDevotee(user, uniqueId, avatar, merit, 0, 0);

    const event = pushEventLog({
      type: 'strikeWoodenFish',
      user: devotee.name,
      uniqueId: devotee.uniqueId,
      avatar: devotee.avatar,
      count,
      merit,
      ttsText: params.ttsText || ''
    });

    daoTrang.send('mo1');
    saveState();
    broadcastNotification('temple.event', { event, state: getPublicState() });
    return { event, state: getPublicState() };
  },

  ringBell(params = {}) {
    const user = sanitizeUserName(params.user);
    const uniqueId = params.uniqueId || '';
    const avatar = params.avatar || '';
    const count = boundedInteger(params.count, 1, 1, 9);
    const wish = sanitizeWishText(params.wish) || 'Thỉnh chuông Bát Nhã, phiền não tiêu tan, trí tuệ sáng ngời';
    const merit = count * 10;

    state.bellRings += count;
    const devotee = recordDevotee(user, uniqueId, avatar, merit, 0, 0, wish);

    const ttsText = params.readTts
      ? `Thí chủ ${devotee.name} thỉnh Đại Hồng Chung cầu nguyện: ${wish}.`
      : '';

    const event = pushEventLog({
      type: 'ringBell',
      user: devotee.name,
      uniqueId: devotee.uniqueId,
      avatar: devotee.avatar,
      count,
      merit,
      wish,
      ttsText,
      ttsVoice: state.settings.ttsVoice || 'maichi'
    });

    daoTrang.send('bell');
    saveState();
    broadcastNotification('temple.event', { event, state: getPublicState() });
    return { event, state: getPublicState() };
  },

  sendPrayer(params = {}) {
    const user = sanitizeUserName(params.user);
    const uniqueId = params.uniqueId || '';
    const avatar = params.avatar || '';
    const wish = sanitizeWishText(params.wish) || 'Cầu cho quốc thái dân an, gia đình mạnh khỏe hạnh phúc';
    const merit = 10;

    state.lanternCount += 1;
    const devotee = recordDevotee(user, uniqueId, avatar, merit, 1, 0, wish);

    const ttsText = params.readTts === false
      ? ''
      : `Lời cầu nguyện của thí chủ ${devotee.name}: ${wish}. Nam mô A Di Đà Phật.`;

    const event = pushEventLog({
      type: 'sendPrayer',
      user: devotee.name,
      uniqueId: devotee.uniqueId,
      avatar: devotee.avatar,
      wish,
      merit,
      ttsText,
      ttsVoice: state.settings.ttsVoice || 'maichi'
    });

    saveState();
    broadcastNotification('temple.event', { event, state: getPublicState() });
    return { event, state: getPublicState() };
  },

  offerGift(params = {}) {
    const user = sanitizeUserName(params.user);
    const uniqueId = params.uniqueId || '';
    const avatar = params.avatar || '';
    const coins = boundedInteger(params.coins, 10, 1, 500000);
    const giftType = ['lotus', 'fruit', 'lamp', 'dragon'].includes(params.giftType)
      ? params.giftType
      : (coins >= 100 ? 'dragon' : coins >= 20 ? 'fruit' : coins >= 5 ? 'lamp' : 'lotus');

    const giftLabels = {
      lotus: 'Đài Hoa Sen Vàng',
      fruit: 'Mâm Ngũ Quả Cát Tường',
      lamp: 'Đèn Lưu Ly Trí Tuệ',
      dragon: 'Đại Lễ Kim Long Chầu Phật'
    };
    const giftName = sanitizeWishText(params.giftName) || giftLabels[giftType];
    const multiplier = coins >= 100 ? 50 : coins >= 5 ? 30 : 20;
    const merit = Math.max(20, coins * multiplier);

    state.offerings[giftType] = (state.offerings[giftType] || 0) + 1;
    state.totalIncense += 3;
    state.activeIncenseSticks = Math.min(36, state.activeIncenseSticks + 3);

    const wish = sanitizeWishText(params.wish) || `Dâng cúng ${giftName} lên Tam Bảo`;
    const devotee = recordDevotee(user, uniqueId, avatar, merit, 3, 1, wish);

    const ttsText = params.readTts === false
      ? ''
      : `Công đức vô lượng! Cảm tạ thí chủ ${devotee.name} đã phát tâm dâng cúng ${giftName}, tích thêm ${merit} điểm công đức. Nguyện cầu chư Phật gia hộ cho thí chủ vạn sự cát tường như ý.`;

    const event = pushEventLog({
      type: giftType === 'dragon' ? 'grandCeremony' : 'offerGift',
      user: devotee.name,
      uniqueId: devotee.uniqueId,
      avatar: devotee.avatar,
      giftType,
      giftName,
      coins,
      merit,
      wish,
      ttsText,
      ttsVoice: state.settings.ttsVoice || 'maichi'
    });

    daoTrang.gift({ id: daoViewerId(devotee.name, uniqueId), name: devotee.name,
      avatar: devotee.avatar, coins, giftName, count: boundedInteger(params.count, 1, 1, 9999),
      demo: !uniqueId, ttsText });

    saveState();
    broadcastNotification('temple.event', { event, state: getPublicState() });
    return { event, state: getPublicState() };
  },

  drawFortune(params = {}) {
    const user = sanitizeUserName(params.user);
    const uniqueId = params.uniqueId || '';
    const avatar = params.avatar || '';
    const topic = sanitizeWishText(params.topic) || 'Gia đạo, Tài lộc và Bình an';
    const fortune = FORTUNE_DECK[Math.floor(Math.random() * FORTUNE_DECK.length)];
    const merit = 10;

    state.fortuneCount += 1;
    const devotee = recordDevotee(user, uniqueId, avatar, merit, 0, 0, `Xin xăm: Quẻ số ${fortune.number} (${fortune.rank})`);

    const ttsText = params.readTts === false
      ? ''
      : `Thí chủ ${devotee.name} vừa gieo được ${fortune.ttsSummary}`;

    const event = pushEventLog({
      type: 'drawFortune',
      user: devotee.name,
      uniqueId: devotee.uniqueId,
      avatar: devotee.avatar,
      topic,
      fortune,
      merit,
      ttsText,
      ttsVoice: state.settings.ttsVoice || 'maichi'
    });

    saveState();
    broadcastNotification('temple.event', { event, state: getPublicState() });
    return { event, state: getPublicState() };
  },

  grandCeremony(params = {}) {
    return this.offerGift({
      ...params,
      giftType: 'dragon',
      coins: boundedInteger(params.coins, 199, 100, 500000),
      giftName: params.giftName || 'Đại Lễ Hào Quang Vạn Trượng'
    });
  },

  updateSettings(params = {}) {
    const previousAutoSim = state.settings.autoSim;
    state.settings = safeSettings(state.settings, params);
    if (previousAutoSim !== state.settings.autoSim ||
      (state.settings.autoSim && params?.autoSimIntervalMs !== undefined)) {
      configureAutoSim(state.settings.autoSim);
    }
    saveState();
    broadcastNotification('temple.state', getPublicState());
    return getPublicState();
  },

  resetMerit() {
    state.totalIncense = 0;
    state.totalMerit = 0;
    state.woodenFishHits = 0;
    state.bellRings = 0;
    state.lanternCount = 0;
    state.fortuneCount = 0;
    state.activeIncenseSticks = 3;
    state.offerings = { lotus: 0, fruit: 0, lamp: 0, dragon: 0 };
    state.devotees = {};
    leaderboardDirty = true;
    state.recentEvents = [];
    saveState();
    broadcastNotification('temple.state', getPublicState());
    return getPublicState();
  }
};

// ============================================================================
// 5. TIKTOK LIVE CONNECTOR & COMMENT PARSER
// ============================================================================
let tiktokConn = null;
let tiktokConnectionGeneration = 0;
let tiktokRequestGeneration = 0;

const commentCooldownMap = new Map();

function parseViewerComment(commentText, user, uniqueId, avatar) {
  const raw = String(commentText || '').trim();
  if (!raw || isBlockedSpamOrToxic(raw)) {
    return null;
  }

  const cleanWish = sanitizeWishText(raw);
  if (!cleanWish || cleanWish.length < 3) {
    return null;
  }

  // Chống 1 người spam bình luận liên tục làm nghẽn hàng đợi TTS (cooldown 3.5 giây/người)
  const userKey = uniqueId || user || '';
  const now = Date.now();
  if (userKey) {
    const lastTs = commentCooldownMap.get(userKey) || 0;
    if (now - lastTs < 3500) {
      return null;
    }
    commentCooldownMap.set(userKey, now);
    if (commentCooldownMap.size > 600) {
      const oldestKey = commentCooldownMap.keys().next().value;
      commentCooldownMap.delete(oldestKey);
    }
  }

  const cleanUser = sanitizeUserName(user);
  const lower = cleanWish.toLowerCase();

  // 1. Xin xăm / Gieo quẻ
  if (
    lower.includes('xin xăm') ||
    lower.includes('xin xam') ||
    lower.includes('gieo quẻ') ||
    lower.includes('gieo que') ||
    lower.includes('rút quẻ') ||
    lower.includes('rut que') ||
    lower.includes('quẻ') ||
    lower.includes('que')
  ) {
    return Rituals.drawFortune({ user: cleanUser, uniqueId, avatar, topic: cleanWish });
  }

  // 2. Thỉnh chuông
  if (lower.includes('chuông') || lower.includes('chuong') || lower.includes('thỉnh chuông')) {
    return Rituals.ringBell({ user: cleanUser, uniqueId, avatar, count: 1, wish: cleanWish, readTts: true });
  }

  // 3. Gõ mõ
  if (lower.includes('gõ mõ') || lower.includes('go mo') || lower.includes('tụng kinh')) {
    return Rituals.strikeWoodenFish({ user: cleanUser, uniqueId, avatar, count: 3 });
  }

  // 4. Thắp hương / Bái Phật
  if (
    lower.includes('thắp hương') ||
    lower.includes('thap huong') ||
    lower.includes('dâng hương') ||
    lower.includes('dang huong') ||
    lower.includes('bái phật') ||
    lower.includes('bai phat') ||
    lower.includes('lạy phật') ||
    lower.includes('lay phat')
  ) {
    return Rituals.burnIncense({ user: cleanUser, uniqueId, avatar, count: 3, wish: cleanWish });
  }

  // 5. Cầu nguyện / Thả đèn hoa đăng
  if (
    lower.includes('cầu') ||
    lower.includes('cau ') ||
    lower.includes('nguyện') ||
    lower.includes('nguyen') ||
    lower.includes('nam mô') ||
    lower.includes('nam mo') ||
    lower.includes('mô phật') ||
    lower.includes('mo phat') ||
    lower.includes('a di đà') ||
    lower.includes('a di da') ||
    lower.includes('bình an') ||
    lower.includes('tài lộc') ||
    lower.includes('chúc')
  ) {
    return Rituals.sendPrayer({ user: cleanUser, uniqueId, avatar, wish: cleanWish });
  }

    // Không tự quy đổi một bình luận bất kỳ thành nghi thức.
    return null;
}

const giftEventCounter = new GiftEventCounter();
const socialEventTracker = new Map();

function extractUserFromEvent(data) {
  const u = data?.user || data || {};
  const uniqueId = u.uniqueId || u.displayId || data?.uniqueId || '';
  const user = u.nickname || uniqueId || data?.nickname || 'Thí Chủ';
  const avatar =
    u.profilePictureUrl ||
    u.avatarLarge?.urlList?.[0] ||
    u.avatarThumb?.urlList?.[0] ||
    u.avatarMedium?.urlList?.[0] ||
    data?.profilePictureUrl ||
    '';
  return { user, uniqueId, avatar };
}

async function connectTikTokLive(usernameOrUrl) {
  const requestGeneration = ++tiktokRequestGeneration;
  const cleanUser = await resolveTikTokUsername(usernameOrUrl);
  if (requestGeneration !== tiktokRequestGeneration) {
    throw new Error('Yêu cầu kết nối đã được thay bằng yêu cầu mới');
  }
  const generation = ++tiktokConnectionGeneration;
  if (!cleanUser) {
    throw new Error('Không tìm thấy @username hợp lệ từ dữ liệu nhập vào');
  }

  if (tiktokConn) {
    const previous = tiktokConn;
    tiktokConn = null;
    try {
      await previous.disconnect();
    } catch (_) {}
  }
  if (generation !== tiktokConnectionGeneration) {
    throw new Error('Yêu cầu kết nối đã bị hủy');
  }

  state.tiktok = {
    connected: false,
    connecting: true,
    username: cleanUser,
    roomId: null,
    viewerCount: 0,
    lastError: null
  };
  broadcastNotification('temple.state', getPublicState());
  broadcastDaoState();

  const connection = new TikTokLiveConnection(cleanUser, {
    // Tránh dùng lại danh sách sự kiện ban đầu khi tham gia phòng giữa phiên.
    processInitialData: false,
    fetchRoomInfoOnConnect: false,
    enableExtendedGiftInfo: true
  });
  tiktokConn = connection;
  // Sự kiện đến muộn từ phòng cũ không được sửa trạng thái hoặc ghi công đức.
  const onActive = (event, handler) => connection.on(event, (...args) => {
    if (tiktokConn === connection && generation === tiktokConnectionGeneration) handler(...args);
  });

  onActive(ControlEvent.CONNECTED, (roomState) => {
    state.tiktok.connected = true;
    state.tiktok.connecting = false;
    state.tiktok.roomId = roomState?.roomId || connection.roomId || null;
    state.tiktok.lastError = null;
    console.log(`[TikTok Live] Đã kết nối phòng @${cleanUser} (roomId: ${state.tiktok.roomId})`);
    broadcastNotification('temple.state', getPublicState());
    broadcastDaoState();
  });

  onActive(ControlEvent.DISCONNECTED, () => {
    state.tiktok.connected = false;
    state.tiktok.connecting = false;
    console.log(`[TikTok Live] Đã ngắt kết nối @${cleanUser}`);
    broadcastNotification('temple.state', getPublicState());
    broadcastDaoState();
  });

  onActive(ControlEvent.ERROR, (err) => {
    state.tiktok.lastError = err?.message || String(err);
    console.warn('[TikTok Live Warning]', state.tiktok.lastError);
    broadcastNotification('temple.state', getPublicState());
    broadcastDaoState();
  });

  onActive(WebcastEvent.ROOM_USER, (data) => {
    const viewerCount = Number(data?.total ?? data?.viewerCount ?? 0);
    if (viewerCount > 0) {
      state.tiktok.viewerCount = viewerCount;
      broadcastNotification('temple.viewerCount', { viewerCount });
    }
  });

  onActive(WebcastEvent.MEMBER, (data) => {
    const { user, uniqueId, avatar } = extractUserFromEvent(data);
    if (daoTrang.settings.joinOnEnter) daoTrang.join(daoViewerId(user, uniqueId), user, { avatar });
    // Vào phòng không phải lễ vật hay nghi thức, không tự cộng điểm công đức.
    recordDevotee(user, uniqueId, avatar, 0, 0, 0, 'Đã vào Chánh Điện lễ Phật');
    broadcastNotification('temple.state', getPublicState());
  });

  onActive(WebcastEvent.CHAT, (data) => {
    const { user, uniqueId, avatar } = extractUserFromEvent(data);
    const commentText = data?.content || data?.comment || '';
    console.log(`[TikTok Chat] ${user}: ${commentText}`);
    daoTrang.chat({ id: daoViewerId(user, uniqueId), name: user, text: commentText, avatar });
    parseViewerComment(commentText, user, uniqueId, avatar);
  });

  onActive(WebcastEvent.LIKE, (data) => {
    const { user, uniqueId, avatar } = extractUserFromEvent(data);
    const likeCount = Math.min(15, Math.max(1, Number(data?.count ?? data?.likeCount ?? 1)));
    daoTrang.like(daoViewerId(user, uniqueId), likeCount);
    Rituals.strikeWoodenFish({ user, uniqueId, avatar, count: likeCount });
  });

  const handleSocialEvent = (data, actionType = 'social') => {
    const { user, uniqueId, avatar } = extractUserFromEvent(data);
    const key = `${uniqueId || user}:${actionType}:${String(data?.action || '')}`;
    const now = Date.now();
    if (socialEventTracker.has(key) && now - socialEventTracker.get(key) < 2500) return;
    socialEventTracker.set(key, now);
    if (socialEventTracker.size > 500) socialEventTracker.delete(socialEventTracker.keys().next().value);
    Rituals.ringBell({
      user,
      uniqueId,
      avatar,
      count: 1,
      wish: 'Hữu duyên tương ngộ nơi cửa Phật, cầu bình an may mắn',
      readTts: false
    });
  };
  onActive(WebcastEvent.FOLLOW, data => handleSocialEvent(data, 'follow'));
  onActive(WebcastEvent.SHARE, data => handleSocialEvent(data, 'share'));
  onActive(WebcastEvent.SOCIAL, (data) => {
    const action = String(data?.action || '');
    const disp = String(data?.common?.displayText?.displayType || data?.displayType || '').toLowerCase();
    if (action === '1' || action === '3' || disp.includes('follow') || disp.includes('share')) {
      handleSocialEvent(data, disp.includes('share') || action === '3' ? 'share' : 'follow');
    }
  });

  onActive(WebcastEvent.GIFT, (data) => {
    const { user, uniqueId, avatar } = extractUserFromEvent(data);
    const giftObj = data?.gift || data?.giftDetails || data?.extendedGiftInfo || {};
    const giftId = String(data?.giftId || giftObj?.id || giftObj?.gift_id || 'rose');
    const deltaCount = giftEventCounter.count(data, uniqueId, giftId);
    if (deltaCount === 0) return;

    const diamondCount = boundedInteger(giftObj?.diamondCount || giftObj?.diamond_count ||
      data?.giftDetails?.diamondCount || data?.extendedGiftInfo?.diamond_count || data?.diamondCount,
      1, 1, 500000);
    const totalCoins = Math.min(500000, diamondCount * deltaCount);
    const rawGiftName = giftObj?.name || giftObj?.giftName || data?.giftName || giftObj?.describe || 'Hoa Hồng Tâm Thành';
    const displayGiftName = deltaCount > 1 ? `${deltaCount}x ${rawGiftName}` : rawGiftName;

    console.log(`[TikTok Gift] ${user} gửi ${displayGiftName} (${totalCoins} xu)`);

    Rituals.offerGift({
      user,
      uniqueId,
      avatar,
      coins: totalCoins,
      count: deltaCount,
      giftName: displayGiftName,
      wish: `Thành tâm dâng ${displayGiftName} kính lễ Đức Phật A Di Đà`
    });
  });

  try {
    const roomState = await connection.connect();
    if (generation !== tiktokConnectionGeneration || tiktokConn !== connection) {
      await connection.disconnect().catch(() => {});
      throw new Error('Phiên kết nối TikTok đã bị thay thế');
    }
    state.tiktok.connected = true;
    state.tiktok.connecting = false;
    state.tiktok.roomId = roomState?.roomId || connection.roomId || null;
    broadcastNotification('temple.state', getPublicState());
    broadcastDaoState();
    return state.tiktok;
  } catch (err) {
    if (generation !== tiktokConnectionGeneration || tiktokConn !== connection) throw err;
    state.tiktok.connected = false;
    state.tiktok.connecting = false;
    state.tiktok.lastError = err?.message || 'Không thể kết nối phòng Live (kiểm tra tài khoản đang phát Live chưa)';
    broadcastNotification('temple.state', getPublicState());
    broadcastDaoState();
    throw new Error(state.tiktok.lastError);
  }
}

function disconnectTikTokLive() {
  tiktokRequestGeneration++;
  tiktokConnectionGeneration++;
  if (tiktokConn) {
    try {
      Promise.resolve(tiktokConn.disconnect()).catch((err) => {
        console.warn('[TikTok] Lỗi khi ngắt kết nối:', err.message);
      });
    } catch (err) { console.warn('[TikTok] Lỗi khi ngắt kết nối:', err.message); }
    tiktokConn = null;
  }
  state.tiktok.connected = false;
  state.tiktok.connecting = false;
  state.tiktok.viewerCount = 0;
  broadcastNotification('temple.state', getPublicState());
  broadcastDaoState();
  return state.tiktok;
}

// ============================================================================
// 6. AUTO-SIMULATION ENGINE (CHẾ ĐỘ TỰ ĐỘNG GIẢ LẬP ĐÔNG NGƯỜI XEM)
// ============================================================================
let autoSimTimer = null;
const SIM_DEVOTEES = [
  { user: 'Ngọc Anh Nguyễn', uniqueId: 'ngocanh.98', wish: 'Con thành tâm cầu cho bố mẹ luôn mạnh khỏe, bình an' },
  { user: 'Trần Minh Quân', uniqueId: 'minhquan_bds', wish: 'Cầu tháng mới công việc thuận buồm xuôi gió, tài lộc hanh thông' },
  { user: 'Diệu Thảo Tâm An', uniqueId: 'tam_an_99', wish: 'Nam Mô A Di Đà Phật, nguyện cầu thế giới hòa bình chúng sinh an lạc' },
  { user: 'Lê Hoàng Nam', uniqueId: 'hoangnam.dev', wish: 'Cầu thi cử đỗ đạt điểm cao, sự nghiệp rộng mở' },
  { user: 'Phạm Thanh Hà', uniqueId: 'thanhha.lotus', wish: 'Cầu gia đạo êm ấm, con cái ngoan ngoãn học giỏi' },
  { user: 'Vũ Đức Thịnh', uniqueId: 'ducthinh88', wish: 'Con xin gieo một quẻ cầu tài lộc đầu năm' }
];

function runSingleSimulationStep() {
  const pick = SIM_DEVOTEES[Math.floor(Math.random() * SIM_DEVOTEES.length)];
  const roll = Math.random();
  const common = { user: pick.user, uniqueId: `demo:${pick.uniqueId}`,
    avatar: '', wish: pick.wish, merit: 0, ttsText: '', demo: true };
  let event;
  if (roll < 0.30) {
    event = { ...common, type: 'burnIncense', count: 3 };
  } else if (roll < 0.55) {
    event = { ...common, type: 'sendPrayer' };
  } else if (roll < 0.75) {
    event = { ...common, type: 'drawFortune', topic: pick.wish,
      fortune: FORTUNE_DECK[Math.floor(Math.random() * FORTUNE_DECK.length)] };
  } else if (roll < 0.90) {
    event = { ...common, type: 'offerGift', giftType: 'lotus',
      giftName: 'Hoa Sen Vàng Tinh Khiết', coins: 15 };
    daoTrang.gift({ id: common.uniqueId, name: pick.user, coins: 15, giftName: event.giftName,
      demo: true, ttsText: '' });
  } else {
    event = { ...common, type: 'ringBell', count: 1 };
  }
  daoTrang.chat({ id: common.uniqueId, name: pick.user, text: pick.wish, demo: true });
  // Mô phỏng chỉ phát hiệu ứng; không thay đổi hoặc ghi điểm công đức thật.
  broadcastNotification('temple.event', { event, state: getPublicState() });
}

function configureAutoSim(enabled) {
  state.settings.autoSim = Boolean(enabled);
  if (autoSimTimer) {
    clearInterval(autoSimTimer);
    autoSimTimer = null;
  }
  if (state.settings.autoSim) {
    console.log('[Mô phỏng] Đã bật chế độ tạo tương tác giả lập để kiểm thử.');
    runSingleSimulationStep();
    autoSimTimer = setInterval(runSingleSimulationStep, state.settings.autoSimIntervalMs || 9500);
  }
}

// ============================================================================
// 7. JSON-RPC 2.0 DISPATCHER
// ============================================================================
async function handleRpcCall(method, params = {}) {
  switch (method) {
    case 'temple.getState':
      return getPublicState();
    case 'temple.burnIncense':
      return Rituals.burnIncense(params);
    case 'temple.strikeWoodenFish':
      return Rituals.strikeWoodenFish(params);
    case 'temple.ringBell':
      return Rituals.ringBell(params);
    case 'temple.sendPrayer':
      return Rituals.sendPrayer(params);
    case 'temple.offerGift':
      return Rituals.offerGift(params);
    case 'temple.drawFortune':
      return Rituals.drawFortune(params);
    case 'temple.grandCeremony':
      return Rituals.grandCeremony(params);
    case 'temple.updateSettings':
      return Rituals.updateSettings(params);
    case 'temple.resetMerit':
      return Rituals.resetMerit();
    case 'temple.comment': {
      const viewer = String(params.user || 'Khách');
      daoTrang.chat({ id: daoViewerId(viewer, params.uniqueId), name: viewer,
        text: params.comment, avatar: params.avatar, demo: !params.uniqueId });
      return parseViewerComment(params.comment, viewer, params.uniqueId, params.avatar);
    }
    case 'temple.daoGetState':
      return daoTrang.snapshot(state.tiktok);
    case 'temple.daoFill':
      return daoTrang.fillDemo(params.count);
    case 'temple.daoClear':
      return daoTrang.clearDemo();
    case 'temple.daoClearAll':
      return daoTrang.clearAll();
    case 'temple.daoSettings':
      return daoTrang.changeSettings(params);
    case 'temple.daoChant':
      return daoTrang.chant();
    case 'temple.daoDemoChat': {
      const name = String(params.name || 'Khách thử').slice(0, 32);
      const text = String(params.text || 'Nam mô A Di Đà Phật').slice(0, 120);
      const viewer = daoTrang.chat({ id: daoViewerId(name, ''), name, text, demo: true });
      return { ok: Boolean(viewer), state: daoTrang.snapshot(state.tiktok) };
    }
    case 'temple.daoDemoGift': {
      const name = String(params.name || 'Khách thử').slice(0, 32);
      const coins = Math.max(1, Math.min(50000, Number(params.coins) || 1));
      const giftName = String(params.giftName || 'Hoa sen').slice(0, 50);
      const viewer = daoTrang.gift({ id: daoViewerId(name, ''), name, coins,
        giftName, demo: true, ttsText: '' });
      return { ok: Boolean(viewer), daoState: daoTrang.snapshot(state.tiktok) };
    }
    case 'temple.speak': {
      const res = await zeroTts.synthesize(params.text, params.voice || 'maichi');
      if (res.ok && params.broadcast !== false) {
        broadcastNotification('tts.play', {
          text: params.text,
          voice: res.voice,
          url: res.url
        });
        broadcastNotification('temple.daoEvent', {
          type: 'tts', text: params.text, url: res.url
        });
      }
      return res;
    }
    case 'temple.ttsStatus':
      return zeroTts.getStatus();
    case 'live.connect':
      return await connectTikTokLive(params.username);
    case 'live.disconnect':
      return disconnectTikTokLive();
    case 'live.setAutoSim':
      configureAutoSim(Boolean(params.enabled));
      saveState();
      broadcastNotification('temple.state', getPublicState());
      return getPublicState();
    default:
      throw new Error(`Không tìm thấy phương thức JSON-RPC: ${method}`);
  }
}

// ============================================================================
// 8. EXPRESS + WEBSOCKET SERVER
// ============================================================================
const app = express();
app.disable('x-powered-by');
// Khóa thay đổi trạng thái từ trang web khác; chỉ nhận lệnh cùng nguồn hoặc công cụ cục bộ.
app.use((req, res, next) => {
  if (!access.allowedPageRequest(req)) return res.status(403).json({ error: 'Truy cập bị từ chối' });
  const protectedPath = ['/rpc', '/api/tts', '/api/state'].includes(req.path) ||
    req.path.startsWith('/tts-cache/');
  if (protectedPath && !access.authorized(req)) {
    return res.status(403).json({ error: 'Cần mã truy cập hợp lệ' });
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '64kb' }));
app.use('/tts-cache', express.static(TTS_CACHE_DIR, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// HTTP JSON-RPC 2.0 Endpoint
app.post('/rpc', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};
  if (!method) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid JSON-RPC Request: thiếu method' }
    });
  }
  try {
    const result = await handleRpcCall(method, params || {});
    res.json({
      jsonrpc: jsonrpc || '2.0',
      id: id ?? null,
      result
    });
  } catch (err) {
    res.status(200).json({
      jsonrpc: jsonrpc || '2.0',
      id: id ?? null,
      error: { code: -32000, message: err.message || 'Server error' }
    });
  }
});

// ZeroTTS HTTP Endpoint (Mai Chi default)
app.all('/api/tts', async (req, res) => {
  const rawText = req.body?.text ?? req.query?.text;
  const rawVoice = req.body?.voice ?? req.query?.voice ?? state.settings.ttsVoice ?? 'maichi';
  if (typeof rawText !== 'string' || rawText.length > 500 || typeof rawVoice !== 'string') {
    return res.status(400).json({ ok: false, error: 'Nội dung giọng đọc không hợp lệ' });
  }
  const text = rawText.trim();
  const voice = rawVoice.trim();
  if (!text) {
    return res.status(400).json({ ok: false, error: 'Thiếu nội dung text cần đọc' });
  }
  const result = await zeroTts.synthesize(text, voice);
  res.json(result);
});

app.get('/api/state', (_req, res) => {
  res.json(getPublicState());
});

const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  path: '/ws',
  maxPayload: 65536,
  verifyClient: ({ req }, done) => done(access.authorized(req), 403, 'Truy cập bị từ chối')
});

function broadcastNotification(method, params) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method,
    params
  });
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      if (client.bufferedAmount > 2 * 1024 * 1024) {
        client.terminate();
        continue;
      }
      client.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      jsonrpc: '2.0',
      method: 'temple.state',
      params: getPublicState()
    })
  );
  ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'temple.daoState',
    params: daoTrang.snapshot(state.tiktok) }));

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString('utf8'));
    } catch (_) {
      return;
    }
    if (!msg || !msg.method) return;
    try {
      const result = await handleRpcCall(msg.method, msg.params || {});
      if (msg.id !== undefined) {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result
          })
        );
      }
    } catch (err) {
      if (msg.id !== undefined) {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            error: { code: -32000, message: err.message || 'RPC Error' }
          })
        );
      }
    }
  });
});

const zeroTts = new ZeroTTSManager();

server.listen(PORT, HOST, () => {
  console.log(`============================================================`);
  console.log(`🪷 DIỆU LIÊN ĐÀI ĐÃ KHỞI ĐỘNG`);
  console.log(`📺 Màn hình Live (9:16 OBS): http://localhost:${PORT}`);
  console.log(`🎛️ Bảng điều khiển RPC Admin: http://localhost:${PORT}/admin`);
  console.log(`🔌 JSON-RPC 2.0 Endpoint   : http://localhost:${PORT}/rpc (ws://localhost:${PORT}/ws)`);
  console.log(`============================================================`);

  // Chỉ tự kết nối phòng TikTok nếu người vận hành chủ động cấu hình TIKTOK_USER.
  const defaultChannel = process.env.TIKTOK_USER || '';
  if (defaultChannel) {
    connectTikTokLive(defaultChannel).catch((err) => {
      console.warn(`[Auto-Connect @${defaultChannel}] Chưa kết nối được ngay:`, err.message);
    });
  }
});

let isShuttingDown = false;
async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Máy chủ] Đang dừng an toàn (${signal}), lưu công đức...`);
  if (autoSimTimer) clearInterval(autoSimTimer);
  if (daoTrang.chantTimer) clearInterval(daoTrang.chantTimer);
  try { if (tiktokConn) await tiktokConn.disconnect(); } catch (_) {}
  for (const socket of wss.clients) socket.terminate();
  server.close();
  try { await flushState(); } catch (err) { console.error('[Trạng thái] Không thể lưu trước khi dừng:', err.message); }
  zeroTts.stopWorker();
  process.exit(0);
}
process.once('SIGINT', () => { void shutdown('SIGINT'); });
process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
