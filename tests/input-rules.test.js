const test = require('node:test');
const assert = require('node:assert/strict');
const { boundedInteger, safeSettings } = require('../lib/input-rules');

test('Giá trị số đặc biệt không được đi vào công đức', () => {
  assert.equal(boundedInteger('Infinity', 1, 1, 500000), 1);
  assert.equal(boundedInteger('abc', 1, 1, 500000), 1);
  assert.equal(boundedInteger(-500, 1, 1, 500000), 1);
  assert.equal(boundedInteger(9999999999, 1, 1, 500000), 500000);
  assert.equal(boundedInteger(5.9, 1, 1, 500000), 5);
});

test('Cấu hình máy chủ chỉ chấp nhận các trường và kiểu được phép', () => {
  const before = { ttsEnabled: true, bgMusicEnabled: true, sfxEnabled: true,
    smokeDensity: 1, autoSim: false, autoSimIntervalMs: 9500, ttsVoice: 'maichi' };
  const updated = safeSettings(before, { ttsEnabled: 'false', autoSim: 'true',
    bgMusicEnabled: false, smokeDensity: Infinity, autoSimIntervalMs: 1, ttsVoice: [],
    admin: true, unknownKey: 'hello' });
  assert.equal(updated.ttsEnabled, true);
  assert.equal(updated.autoSim, false);
  assert.equal(updated.bgMusicEnabled, false);
  assert.equal(updated.smokeDensity, 1);
  assert.equal(updated.autoSimIntervalMs, 3000);
  assert.deepEqual(Object.keys(updated).sort(), Object.keys(before).sort());
});
