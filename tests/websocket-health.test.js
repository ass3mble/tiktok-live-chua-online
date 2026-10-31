const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { startWebSocketHeartbeat } = require('../lib/websocket-health');

function fakeSocket() {
  const socket = new EventEmitter();
  socket.readyState = 1;
  socket.pingCount = 0;
  socket.terminateCount = 0;
  socket.ping = () => { socket.pingCount++; };
  socket.terminate = () => { socket.terminateCount++; };
  return socket;
}

test('Phát hiện kết nối chết và giữ kết nối còn trả lời', () => {
  const server = new EventEmitter();
  server.clients = new Set();
  const heartbeat = startWebSocketHeartbeat(server);
  try {
    const responsive = fakeSocket();
    const dead = fakeSocket();
    server.clients.add(responsive);
    server.clients.add(dead);
    server.emit('connection', responsive);
    server.emit('connection', dead);
    heartbeat.check();
    assert.equal(responsive.pingCount, 1);
    assert.equal(dead.pingCount, 1);

    responsive.emit('pong');
    heartbeat.check();
    assert.equal(responsive.pingCount, 2);
    assert.equal(responsive.terminateCount, 0);
    assert.equal(dead.terminateCount, 1);
  } finally {
    heartbeat.stop();
  }
  assert.equal(server.listenerCount('connection'), 0);
});

test('Lỗi gửi tín hiệu kiểm tra đóng kết nối ngay', () => {
  const server = new EventEmitter();
  const socket = fakeSocket();
  socket.ping = () => { throw new Error('Kết nối đã hỏng'); };
  server.clients = new Set([socket]);
  const heartbeat = startWebSocketHeartbeat(server);
  try {
    server.emit('connection', socket);
    heartbeat.check();
    assert.equal(socket.terminateCount, 1);
  } finally {
    heartbeat.stop();
  }
});
