const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const WebSocket = require('ws');

async function availablePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitServer(base, child) {
  for (let i = 0; i < 60; i += 1) {
    if (child.exitCode !== null) throw new Error('Máy chủ dừng bất thường');
    try {
      const response = await fetch(`${base}/api/state`);
      if (response.ok) return;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Máy chủ không khởi động trong thời gian kiểm thử');
}

test('Máy chủ, lệnh tương tác và chặn nguồn truy cập lạ', { timeout: 20000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dieu-lien-dai-test-'));
  const port = await availablePort();
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', DATA_DIR: dir, DISABLE_TTS: '1', TIKTOK_USER: '' },
    stdio: 'ignore',
    windowsHide: true
  });
  try {
    await waitServer(base, child);
    const state = await (await fetch(`${base}/api/state`)).json();
    assert.equal(state.totalMerit, 0);
    assert.equal(state.tiktok.connected, false);

    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'temple.burnIncense', params: { user: 'Người Thử', count: 3 } });
    const blocked = await fetch(`${base}/rpc`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://trang-la.example' }, body
    });
    assert.equal(blocked.status, 403);
    const accepted = await fetch(`${base}/rpc`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body
    });
    assert.equal(accepted.status, 200);
    const output = await accepted.json();
    assert.equal(output.result.state.totalIncense, 3);
    assert.equal(output.result.state.totalMerit, 15);

    const rpc = async (method, params) => {
      const response = await fetch(`${base}/rpc`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
        body: JSON.stringify({ jsonrpc: '2.0', id: 31, method, params })
      });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.error, undefined);
      return data.result;
    };
    await rpc('temple.daoDemoChat', { name: 'Ngọc', text: 'nữ' });
    const gift = await rpc('temple.daoDemoGift', { name: 'Ngọc', giftName: 'Đèn sen', coins: 30 });
    assert.equal(gift.daoState.viewers[0].coins, 30);
    assert.equal(gift.daoState.viewers[0].skin, 'woman');
    const fill = await rpc('temple.daoFill', { count: 36 });
    assert.equal(fill.viewers.length, 36);
    const clear = await rpc('temple.daoClear', {});
    assert.equal(clear.viewers.length, 0);
    const setting = await rpc('temple.daoSettings', { seatMode: '64', autoChant: false });
    assert.equal(setting.cap, 64);
    const afterDemo = await (await fetch(`${base}/api/state`)).json();
    assert.equal(afterDemo.totalMerit, 15, 'Mô phỏng không được thay đổi công đức thật');

    const illegalGift = await rpc('temple.offerGift', { user: 'Người thử', coins: 'Infinity',
      giftName: 'Tài lộc', readTts: false });
    assert.ok(Number.isFinite(illegalGift.state.totalMerit));
    const beforeSettings = illegalGift.state.settings;
    const settings = await rpc('temple.updateSettings', { sfxEnabled: 'false',
      autoSim: 'true', unknownProperty: 1, smokeDensity: 400 });
    assert.equal(settings.settings.sfxEnabled, beforeSettings.sfxEnabled);
    assert.equal(settings.settings.autoSim, false);
    assert.equal(settings.settings.smokeDensity, 2);
    assert.equal(settings.settings.unknownProperty, undefined);

    await new Promise(resolve => setTimeout(resolve, 1100));
    const saved = JSON.parse(fs.readFileSync(path.join(dir, 'merit-state.json'), 'utf8'));
    assert.equal(saved.totalMerit, illegalGift.state.totalMerit);
    assert.ok(Number.isFinite(saved.totalMerit));

    const connection = new WebSocket(`ws://127.0.0.1:${port}/ws`, { origin: base });
    await once(connection, 'open');
    const received = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Không nhận trạng thái qua WebSocket')), 1000);
      connection.once('message', (raw) => { clearTimeout(timeout); resolve(JSON.parse(String(raw))); });
      connection.send(JSON.stringify({ jsonrpc: '2.0', id: 8, method: 'temple.getState' }));
    });
    assert.equal(received.method, 'temple.state');
    connection.close();
  } finally {
    child.kill();
    fs.rmSync(dir, { force: true, recursive: true });
  }
});
