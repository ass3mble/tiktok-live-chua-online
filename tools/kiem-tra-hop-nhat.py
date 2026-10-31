"""Kiểm thử hai không gian phát trong cùng máy chủ bằng trình duyệt không giao diện."""
import json
import os
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs' / 'demo'


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def rpc(base, method, params):
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method,
                       'params': params}, ensure_ascii=False).encode('utf-8')
    request = urllib.request.Request(base + '/rpc', data=body,
                                     headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode('utf-8'))
    if payload.get('error'):
        raise RuntimeError(f'Không thực hiện được lệnh {method}: {payload}')
    return payload.get('result')


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    port = free_port()
    base = f'http://127.0.0.1:{port}'
    with tempfile.TemporaryDirectory(prefix='dieu-lien-dai-hop-nhat-') as data_dir:
        env = dict(os.environ, PORT=str(port), HOST='127.0.0.1', DATA_DIR=data_dir,
                   DISABLE_TTS='1', TIKTOK_USER='', PYTHONIOENCODING='utf-8')
        flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        proc = subprocess.Popen(['node', 'server.js'], cwd=ROOT, env=env,
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                creationflags=flags)
        try:
            for attempt in range(100):
                try:
                    urllib.request.urlopen(base + '/api/state', timeout=1).close()
                    break
                except Exception:
                    time.sleep(.1)
            else:
                raise RuntimeError('Máy chủ kiểm thử không hoạt động')

            errors = []
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                try:
                    dao = browser.new_page(viewport={'width': 1080, 'height': 1920})
                    dao.on('pageerror', lambda err: errors.append(str(err)))
                    response = dao.goto(base + '/dao-trang.html', wait_until='domcontentloaded')
                    assert response.status == 200, 'Không tải được Đạo Tràng 2,5 chiều'
                    dao.wait_for_function("document.getElementById('count')?.textContent?.includes('0/')", timeout=10000)
                    assert dao.locator('#stage').is_visible()
                    dao.screenshot(path=str(OUTPUT / 'hop-nhat-dao-trang-25d.png'))

                    rpc(base, 'temple.daoFill', {'count': 36})
                    dao.wait_for_function("document.getElementById('count')?.textContent?.includes('36/36')", timeout=10000)
                    rpc(base, 'temple.daoDemoChat', {'name': 'Thiện Đức', 'text': 'sư'})
                    dao.wait_for_function("document.getElementById('count')?.textContent?.includes('37/64')", timeout=10000)
                    rpc(base, 'temple.daoDemoGift', {'name': 'Thiện Đức', 'giftName': 'Hoa sen vàng', 'coins': 99})
                    dao.wait_for_function("document.getElementById('giftWho')?.textContent?.includes('Thiện Đức')", timeout=10000)
                    dao.screenshot(path=str(OUTPUT / 'hop-nhat-dao-trang-tuong-tac.png'))

                    for w, h, name in [(1920, 1080, 'may-tinh'), (390, 844, 'dien-thoai')]:
                        main = browser.new_page(viewport={'width': w, 'height': h})
                        main.on('pageerror', lambda err: errors.append(str(err)))
                        main.goto(base + '/?scene=dao', wait_until='domcontentloaded')
                        main.wait_for_timeout(200)
                        assert main.locator('#stageWrapper').is_visible()
                        main.screenshot(path=str(OUTPUT / f'hop-nhat-2-che-do-{name}.png'))

                    obs = browser.new_page(viewport={'width': 1080, 'height': 1920})
                    obs.on('pageerror', lambda err: errors.append(str(err)))
                    obs.goto(base + '/?obs=1&scene=dao', wait_until='domcontentloaded')
                    assert obs.locator('#quickDock').is_hidden()
                    obs.frame_locator('#daoSceneFrame').locator('body.obs-overlay').wait_for(timeout=10000)
                    assert obs.frame_locator('#daoSceneFrame').locator('#giftGuide').is_hidden(), \
                        'Nguồn phát vẫn lộ các nút tương tác thử nghiệm'
                    obs.screenshot(path=str(OUTPUT / 'hop-nhat-khung-phat-9x16.png'))

                    with urllib.request.urlopen(base + '/dao-trang-assets/hall.jpg') as asset:
                        assert asset.status == 200, 'Thiếu ảnh nền Đạo Tràng 2,5 chiều'
                    state = json.loads(urllib.request.urlopen(base + '/api/state').read())
                    assert state['totalMerit'] == 0, 'Thử nghiệm không được cộng vào công đức thật'
                    if errors:
                        raise RuntimeError('Lỗi mã JavaScript: ' + '; '.join(errors[:8]))
                    print('Đạt: Hai chế độ chung máy chủ, 36-64 bồ đoàn, đổi vai, tặng quà, trang nhỏ, 9:16.')
                    print('Đạt: Mô phỏng không làm thay đổi công đức thật. Không phát hiện lỗi JavaScript.')
                finally:
                    browser.close()
        finally:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()


if __name__ == '__main__':
    main()
