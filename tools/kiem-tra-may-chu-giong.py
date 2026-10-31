"""Kiểm tra đầy đủ từ máy chủ đến mô hình giọng đọc và tệp âm thanh."""
import json
import os
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def request_json(url, data=None):
    payload = json.dumps(data, ensure_ascii=False).encode('utf-8') if data else None
    request = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=35) as response:
        return json.loads(response.read().decode('utf-8'))


def main():
    with socket.socket() as port_socket:
        port_socket.bind(('127.0.0.1', 0))
        port = port_socket.getsockname()[1]
    with tempfile.TemporaryDirectory(prefix='dieu-lien-dai-voice-') as folder:
        environment = dict(os.environ, HOST='127.0.0.1', PORT=str(port),
                           DATA_DIR=folder, TIKTOK_USER='', PYTHONIOENCODING='utf-8')
        environment.pop('DISABLE_TTS', None)
        flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        process = subprocess.Popen(['node', 'server.js'], cwd=ROOT, env=environment,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                   creationflags=flags)
        base = f'http://127.0.0.1:{port}'
        try:
            for attempt in range(150):
                if process.poll() is not None:
                    raise RuntimeError('Máy chủ đã dừng bất thường')
                try:
                    state = request_json(base + '/api/state')
                    if state['tts']['status'] == 'ready':
                        break
                    if state['tts']['status'] in ('error', 'stopped'):
                        raise RuntimeError('Bộ đọc giọng chưa nạp thành công: ' + str(state['tts']['status']))
                except OSError:
                    pass
                time.sleep(0.2)
            else:
                raise RuntimeError('Bộ đọc giọng chưa sẵn sàng sau 30 giây')

            reply = request_json(base + '/rpc', {
                'jsonrpc': '2.0', 'id': 1, 'method': 'temple.speak',
                'params': {'text': 'Nam mô A Di Đà Phật. Cầu chúc bình an.', 'broadcast': False}
            })
            result = reply.get('result', {})
            if not result.get('ok'):
                raise RuntimeError('Không tổng hợp được giọng đọc: ' + str(reply))
            with urllib.request.urlopen(base + result['url'], timeout=10) as audio:
                header = audio.read(12)
            if not header.startswith(b'RIFF') or header[8:12] != b'WAVE':
                raise RuntimeError('Âm thanh được trả về không phải tệp WAV hợp lệ')
            print('Đạt: nạp mô hình, tổng hợp tiếng Việt, trả lời qua máy chủ và tải tệp WAV.')
        finally:
            process.terminate()
            try:
                process.wait(timeout=6)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == '__main__':
    main()
