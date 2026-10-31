const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

test('Dừng máy chủ lưu ngay công đức chưa đến hạn ghi tự động', { timeout: 12000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dieu-lien-dai-shutdown-'));
  const listener = net.createServer().listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  listener.close();
  await once(listener, 'close');
  const base = `http://127.0.0.1:${port}`;
  // Gửi tín hiệu từ bên trong tiến trình để mô phỏng dừng mềm cả trên Windows.
  const runner = "require('./server'); process.stdin.resume(); process.stdin.once('data', () => process.emit('SIGTERM'));";
  const child = spawn(process.execPath, ['-e', runner], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port),
      DISABLE_TTS: '1', TIKTOK_USER: '', DATA_DIR: dir },
    stdio: ['pipe', 'ignore', 'ignore'], windowsHide: true
  });

  try {
    let ready = false;
    for (let i = 0; i < 70; i++) {
      if (child.exitCode !== null) throw new Error('Máy chủ dừng trước khi mở cổng');
      try { ready = (await fetch(base + '/api/state')).ok; if (ready) break; } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready);
    const response = await fetch(base + '/rpc', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'temple.burnIncense',
        params: { user: 'Người Kiểm Thử', count: 3, readTts: false } })
    });
    assert.equal((await response.json()).result.state.totalMerit, 15);
    // Dừng ngay, trước khi bộ hẹn giờ lưu sau 800ms kết thúc.
    const exited = once(child, 'exit');
    child.stdin.write('stop\n');
    const [code] = await Promise.race([
      exited,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Dừng máy chủ quá lâu')), 5000))
    ]);
    assert.equal(code, 0);
    const saved = JSON.parse(fs.readFileSync(path.join(dir, 'merit-state.json'), 'utf8'));
    assert.equal(saved.totalIncense, 3);
    assert.equal(saved.totalMerit, 15);
  } finally {
    if (child.exitCode === null) child.kill();
    fs.rmSync(dir, { force: true, recursive: true });
  }
});
