// Phát hiện kết nối mất mạng âm thầm, vì TCP có thể giữ socket chết rất lâu.
function startWebSocketHeartbeat(server, intervalMs = 30000) {
  const markActive = (socket) => {
    socket.isAlive = true;
    socket.on('pong', () => { socket.isAlive = true; });
  };
  server.on('connection', markActive);

  const check = () => {
    for (const socket of server.clients) {
      if (socket.readyState !== 1 || socket.isAlive === false) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      try {
        socket.ping();
      } catch (_) {
        socket.terminate();
      }
    }
  };
  const timer = setInterval(check, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();

  return {
    check,
    stop() {
      clearInterval(timer);
      server.off('connection', markActive);
    }
  };
}

module.exports = { startWebSocketHeartbeat };
