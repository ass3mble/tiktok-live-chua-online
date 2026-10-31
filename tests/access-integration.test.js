const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const WebSocket = require('ws');

test('Có mã truy cập: trang tĩnh vẫn mở, điều khiển và dữ liệu vẫn được bảo vệ',
  { timeout: 16000 }, async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dieu-lien-dai-ma-truy-cap-'));
    const listener = net.createServer().listen(0, '127.0.0.1');
    await once(listener, 'listening');
    const port = listener.address().port;
    listener.close();
    await once(listener, 'close');
    const base = `http://127.0.0.1:${port}`;
    const wsBase = `ws://127.0.0.1:${port}/ws`;
    const secret = 'ma-thu-nghiem-noi-bo';
    const child = spawn(process.execPath, ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port),
        RPC_TOKEN: secret, DISABLE_TTS: '1', DATA_DIR: dir, TIKTOK_USER: '' },
      stdio: 'ignore', windowsHide: true
    });
    try {
      let opened = false;
      for (let i = 0; i < 70; i++) {
        try { const response = await fetch(base); opened = response.status === 200; if (opened) break; }
        catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      assert.ok(opened, 'Máy chủ phải khởi động được');
      for (const page of ['/', '/admin', '/dao-trang.html', '/dao-trang-assets/hall.jpg']) {
        const result = await fetch(base + page);
        assert.equal(result.status, 200, page);
      }
      assert.equal((await fetch(base + '/api/state')).status, 403);
      assert.equal((await fetch(base + '/api/state', { headers: { 'x-temple-key': secret } })).status, 200);
      const body = JSON.stringify({ jsonrpc: '2.0', method: 'temple.getState', id: 1 });
      assert.equal((await fetch(base + '/rpc', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body })).status, 403);
      assert.equal((await fetch(base + '/rpc', { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-temple-key': secret }, body })).status, 200);

      const blocked = new WebSocket(wsBase, { origin: base });
      const error = await new Promise(resolve => blocked.once('error', resolve));
      assert.match(String(error.message), /403/);

      const connected = new WebSocket(`${wsBase}?key=${encodeURIComponent(secret)}`, { origin: base });
      const openedWs = new Promise(resolve => connected.once('open', resolve));
      await openedWs;
      const response = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Không nhận trạng thái có mã')), 2000);
        connected.once('message', bytes => {
          clearTimeout(timer); resolve(JSON.parse(String(bytes)));
        });
        connected.send(JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'temple.getState' }));
      });
      assert.equal(response.method, 'temple.state');
      connected.close();
      const spoofStatus = await new Promise((resolve, reject) => {
        http.get(base + '/admin', { headers: { Host: 'trang-la.example:3000' } }, response => {
          response.resume();
          resolve(response.statusCode);
        }).on('error', reject);
      });
      assert.equal(spoofStatus, 403);
    } finally {
      child.kill();
      fs.rmSync(dir, { force: true, recursive: true });
    }
  });
