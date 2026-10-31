const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

test('120 nghi thức đồng thời cộng đủ công đức và lưu một trạng thái nguyên vẹn',
  { timeout: 18000 }, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dieu-lien-dai-tai-'));
    const netServer = net.createServer().listen(0, '127.0.0.1');
    await once(netServer, 'listening');
    const port = netServer.address().port;
    netServer.close();
    await once(netServer, 'close');
    const url = `http://127.0.0.1:${port}`;
    const child = spawn(process.execPath, ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port),
        DISABLE_TTS: '1', TIKTOK_USER: '', DATA_DIR: dir },
      windowsHide: true, stdio: 'ignore'
    });
    try {
      let ready = false;
      for (let i = 0; i < 80; i++) {
        try { ready = (await fetch(url + '/api/state')).ok; if (ready) break; } catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.ok(ready);
      const start = performance.now();
      const results = await Promise.all(Array.from({ length: 120 }, (_, i) => fetch(url + '/rpc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: i, method: 'temple.burnIncense',
          params: { user: `Phật tử ${i}`, count: 1, readTts: false } })
      }).then(response => response.json())));
      assert.ok(results.every(result => !result.error));
      const state = await (await fetch(url + '/api/state')).json();
      assert.equal(state.totalIncense, 120);
      assert.equal(state.totalMerit, 600);
      assert.equal(state.leaderboard.length, 24);
      await new Promise(resolve => setTimeout(resolve, 1100));
      const saved = JSON.parse(fs.readFileSync(path.join(dir, 'merit-state.json'), 'utf8'));
      assert.equal(saved.totalIncense, 120);
      assert.equal(saved.totalMerit, 600);
      assert.equal(Object.keys(saved.devotees).length, 120);
      // Lần ghi tiếp theo phải thay tệp đã tồn tại, đặc biệt quan trọng trên Windows.
      const next = await fetch(url + '/rpc', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 300, method: 'temple.burnIncense',
          params: { user: 'Phật tử 0', count: 1, readTts: false } })
      }).then(response => response.json());
      assert.equal(next.error, undefined);
      await new Promise(resolve => setTimeout(resolve, 1100));
      const updated = JSON.parse(fs.readFileSync(path.join(dir, 'merit-state.json'), 'utf8'));
      assert.equal(updated.totalIncense, 121);
      assert.equal(updated.totalMerit, 605);
      assert.equal(Object.keys(updated.devotees).length, 120);
      // Không đặt ngưỡng phần cứng cố định vì máy thử có thể đang làm việc khác.
      assert.ok(performance.now() - start < 15000);
    } finally {
      child.kill();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
