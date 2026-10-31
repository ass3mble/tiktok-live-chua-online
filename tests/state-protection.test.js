const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('Tệp công đức hỏng không được âm thầm thay bằng bảng rỗng',
  { timeout: 10000 }, async () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'dieu-lien-dai-du-lieu-hong-'));
    const file = path.join(folder, 'merit-state.json');
    const original = '{"totalMerit": 14799, "devotees": '; // Giả lập mất điện khi ghi tệp
    fs.writeFileSync(file, original, 'utf8');
    const child = spawn(process.execPath, ['server.js'], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATA_DIR: folder, DISABLE_TTS: '1', TIKTOK_USER: '', PORT: '0' },
      windowsHide: true, stdio: 'ignore'
    });
    try {
      const [code] = await once(child, 'exit');
      assert.notEqual(code, 0, 'Máy chủ cần từ chối đọc dữ liệu bị lỗi');
      assert.equal(fs.readFileSync(file, 'utf8'), original);
    } finally {
      if (child.exitCode === null) child.kill();
      fs.rmSync(folder, { recursive: true, force: true });
    }
  });

test('Tệp có số công đức vượt giới hạn không được ghi đè bằng dữ liệu khác',
  { timeout: 10000 }, async () => {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'dieu-lien-dai-du-lieu-so-'));
    const file = path.join(folder, 'merit-state.json');
    const original = '{"totalMerit":1e400,"devotees":{}}';
    fs.writeFileSync(file, original, 'utf8');
    const child = spawn(process.execPath, ['server.js'], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATA_DIR: folder, DISABLE_TTS: '1', TIKTOK_USER: '', PORT: '0' },
      windowsHide: true, stdio: 'ignore'
    });
    try {
      const [code] = await once(child, 'exit');
      assert.notEqual(code, 0);
      assert.equal(fs.readFileSync(file, 'utf8'), original);
    } finally {
      if (child.exitCode === null) child.kill();
      fs.rmSync(folder, { recursive: true, force: true });
    }
  });
