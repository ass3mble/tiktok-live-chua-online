// Chặn các giá trị không hữu hạn và giới hạn đầu vào trước khi thay đổi dữ liệu.
function boundedInteger(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function safeSettings(current, incoming) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return { ...current };
  const next = { ...current };
  for (const name of ['ttsEnabled', 'bgMusicEnabled', 'sfxEnabled', 'autoSim']) {
    if (typeof incoming[name] === 'boolean') next[name] = incoming[name];
  }
  if (typeof incoming.ttsVoice === 'string' && /^[a-z0-9_-]{2,32}$/i.test(incoming.ttsVoice)) {
    next.ttsVoice = incoming.ttsVoice.toLowerCase();
  }
  if (incoming.smokeDensity != null && Number.isFinite(Number(incoming.smokeDensity))) {
    next.smokeDensity = Math.max(0, Math.min(2, Number(incoming.smokeDensity)));
  }
  if (incoming.autoSimIntervalMs != null) {
    next.autoSimIntervalMs = boundedInteger(incoming.autoSimIntervalMs, current.autoSimIntervalMs || 9500, 3000, 60000);
  }
  return next;
}

module.exports = { boundedInteger, safeSettings };
