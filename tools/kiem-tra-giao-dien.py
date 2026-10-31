"""Thử giao diện bằng trình duyệt không hiển thị và chụp ảnh đối chiếu."""
import os
import socket
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'docs' / 'demo'


def available_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def main():
    port = available_port()
    base = f'http://127.0.0.1:{port}'
    DEST.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='dieu-lien-dai-ui-') as data_dir:
        env = dict(os.environ, PORT=str(port), HOST='127.0.0.1', DATA_DIR=data_dir,
                   DISABLE_TTS='1', TIKTOK_USER='')
        flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        server = subprocess.Popen(['node', 'server.js'], cwd=ROOT, env=env,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                  creationflags=flags)
        try:
            for attempt in range(70):
                try:
                    urllib.request.urlopen(f'{base}/api/state', timeout=1).close()
                    break
                except Exception:
                    time.sleep(0.1)
            else:
                raise RuntimeError('Máy chủ thử nghiệm không sẵn sàng')

            errors = []
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                try:
                    desktop = browser.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
                    desktop.on('pageerror', lambda error: errors.append(str(error)))
                    desktop.goto(base, wait_until='domcontentloaded')
                    desktop.wait_for_function("document.querySelector('#statIncense').textContent.trim() === '0'", timeout=10000)
                    desktop.screenshot(path=str(DEST / 'dieu-lien-dai-v2-ban-dieu-khien.png'))
                    desktop.locator('#btnRpcIncense').click()
                    desktop.wait_for_function("document.querySelector('#statIncense').textContent.trim() === '3'", timeout=10000)

                    obs = browser.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
                    obs.on('pageerror', lambda error: errors.append(str(error)))
                    obs.goto(base + '/?obs=1', wait_until='domcontentloaded')
                    assert obs.locator('#quickDock').is_hidden(), 'Khung phát vẫn hiển thị bảng điều khiển'
                    assert obs.locator('#stageWrapper').bounding_box()['width'] <= 1080.5
                    obs.screenshot(path=str(DEST / 'dieu-lien-dai-v2-khung-phat-9x16.png'))

                    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
                    mobile.on('pageerror', lambda error: errors.append(str(error)))
                    mobile.goto(base, wait_until='domcontentloaded')
                    mobile.screenshot(path=str(DEST / 'dieu-lien-dai-v2-man-hinh-hep.png'))
                    assert mobile.locator('#stageWrapper').is_visible()

                    admin = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
                    admin.on('pageerror', lambda error: errors.append(str(error)))
                    admin.goto(base + '/admin', wait_until='domcontentloaded')
                    assert admin.locator('#adminAccessCode').is_visible()
                    admin.screenshot(path=str(DEST / 'dieu-lien-dai-v2-quan-tri.png'))
                    print('Đạt: màn hình chính, 9:16, kích thước hẹp, trang quản trị, lệnh thắp hương.')
                    if errors:
                        raise RuntimeError('Lỗi JavaScript: ' + '; '.join(errors[:6]))
                    print('Không phát hiện lỗi JavaScript chưa xử lý.')
                finally:
                    browser.close()
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()


if __name__ == '__main__':
    main()
