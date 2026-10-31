"""Kiểm thử thiết kế Diệu Liên Đài với Chrome không giao diện.

Máy chủ thử hoạt động trên cổng tạm, dữ liệu nằm trong thư mục tạm và
không kết nối TikTok hay khởi động dịch vụ giọng đọc.
"""
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
IMAGES = ROOT / 'docs' / 'demo'


def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def rpc(base, method, params=None):
    request = urllib.request.Request(
        base + '/rpc',
        data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method,
                         'params': params or {}}, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        result = json.loads(response.read())
    assert not result.get('error'), result
    return result.get('result')


def no_horizontal_overflow(page, label):
    result = page.evaluate('''() => ({
        width: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth
    })''')
    assert result['content'] <= result['width'] + 2, f'{label}: tràn ngang {result}'


def draw_speed(page):
    page.evaluate('''() => {
        window.__veHinh = 0;
        const old = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function(...a) {
            if (this.canvas.id === 'c') window.__veHinh++;
            return old.apply(this, a);
        };
    }''')
    page.wait_for_timeout(3500)
    return round(page.evaluate('window.__veHinh') / 3.5, 2)


def main():
    IMAGES.mkdir(parents=True, exist_ok=True)
    port = free_port()
    base = f'http://127.0.0.1:{port}'
    with tempfile.TemporaryDirectory(prefix='dieu-lien-dai-thiet-ke-') as temp:
        env = dict(os.environ, HOST='127.0.0.1', PORT=str(port),
                   DATA_DIR=temp, DISABLE_TTS='1', TIKTOK_USER='',
                   PYTHONIOENCODING='utf-8')
        env.pop('RPC_TOKEN', None)
        flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        server = subprocess.Popen(['node', 'server.js'], cwd=ROOT, env=env,
                                  creationflags=flags,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            for _ in range(120):
                try:
                    urllib.request.urlopen(base + '/dao-trang.html', timeout=1).close()
                    break
                except Exception:
                    time.sleep(.1)
            else:
                raise RuntimeError('Không mở được máy chủ kiểm thử')

            errors = []
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                try:
                    def page_at(width, height):
                        page = browser.new_page(viewport={'width': width, 'height': height},
                                                device_scale_factor=1)
                        page.on('pageerror', lambda err: errors.append(str(err)))
                        return page

                    desktop = page_at(1440, 900)
                    desktop.goto(base, wait_until='domcontentloaded')
                    desktop.locator('#serverHealth[data-state="ok"]').wait_for(timeout=12000)
                    no_horizontal_overflow(desktop, 'bảng chính máy tính')
                    assert desktop.locator('link[rel="icon"]').get_attribute('href') == '/assets/dieu-lien-dai.svg'
                    assert desktop.locator('.dock-shortcuts a').count() == 4
                    for name in ('templeAudioControls', 'dockConnect', 'dockRituals', 'dockEvents'):
                        assert desktop.locator(f'#{name}').count() == 1
                    desktop.screenshot(path=str(IMAGES / 'thiet-ke-bang-chinh-1440.png'))
                    desktop.locator('.dock-shortcuts a[href="#dockEvents"]').click()
                    desktop.wait_for_function(
                        "document.querySelector('#quickDock').scrollTop > 100", timeout=5000)
                    desktop.locator('#btnSceneDao').click()
                    desktop.frame_locator('#daoSceneFrame').locator('#count').wait_for(timeout=12000)
                    assert desktop.locator('#btnSceneDao').get_attribute('aria-pressed') == 'true'
                    desktop.locator('#btnSceneTemple').click()
                    assert desktop.locator('#btnSceneTemple').get_attribute('aria-pressed') == 'true'

                    mobile = page_at(390, 844)
                    mobile.goto(base, wait_until='domcontentloaded')
                    no_horizontal_overflow(mobile, 'bảng chính điện thoại')
                    assert mobile.locator('.dock-shortcuts').evaluate(
                        'el => getComputedStyle(el).gridTemplateColumns.split(" ").length') == 2
                    assert mobile.locator('#inputDevoteeWish').evaluate(
                        'el => parseFloat(getComputedStyle(el).fontSize)') >= 16
                    mobile.screenshot(path=str(IMAGES / 'thiet-ke-dien-thoai-390.png'), full_page=True)
                    assert mobile.locator('#stageWrapper').bounding_box()['width'] <= 390
                    mobile_narrow = page_at(320, 568)
                    mobile_narrow.goto(base, wait_until='domcontentloaded')
                    no_horizontal_overflow(mobile_narrow, 'bảng chính điện thoại 320')
                    assert mobile_narrow.locator('#stageWrapper').bounding_box()['width'] <= 320
                    mobile_narrow.close()

                    admin = page_at(1440, 900)
                    admin.goto(base + '/admin', wait_until='domcontentloaded')
                    no_horizontal_overflow(admin, 'quản trị máy tính')
                    assert admin.locator('.admin-quick-links a').count() == 5
                    control = admin.locator('#adminAccessCode').bounding_box()
                    assert 36 <= control['height'] <= 55, f'Ô mã truy cập quá cao: {control}'
                    reset_check = admin.evaluate('''() => {
                        const originalPrompt = window.prompt;
                        const originalSend = window.sendRpc;
                        const calls = [];
                        window.sendRpc = (...args) => calls.push(args[0]);
                        for (const answer of [null, 'không', ' XÓA ']) {
                            window.prompt = () => answer;
                            confirmResetMerit();
                        }
                        window.prompt = originalPrompt;
                        window.sendRpc = originalSend;
                        return calls;
                    }''')
                    assert reset_check == ['temple.resetMerit'], (
                        f'Xác nhận đặt lại công đức không an toàn: {reset_check}')
                    admin.screenshot(path=str(IMAGES / 'thiet-ke-quan-tri-1440.png'))
                    admin_mobile = page_at(390, 844)
                    admin_mobile.goto(base + '/admin', wait_until='domcontentloaded')
                    no_horizontal_overflow(admin_mobile, 'quản trị điện thoại')
                    admin_mobile.screenshot(path=str(IMAGES / 'thiet-ke-quan-tri-390.png'), full_page=True)
                    admin_narrow = page_at(320, 568)
                    admin_narrow.goto(base + '/admin', wait_until='domcontentloaded')
                    no_horizontal_overflow(admin_narrow, 'quản trị điện thoại 320')
                    admin_narrow.close()

                    dao = page_at(1080, 1920)
                    dao.goto(base + '/dao-trang.html', wait_until='domcontentloaded')
                    dao.locator('#conn').filter(has_text='Đã kết nối').wait_for(timeout=12000)
                    rpc(base, 'temple.daoFill', {'count': 100})
                    dao.wait_for_function(
                        "document.getElementById('count')?.textContent?.includes('100/100')",
                        timeout=12000)
                    fps = draw_speed(dao)
                    assert fps >= 25, f'Tốc độ vẽ quá thấp: {fps}'
                    dao.screenshot(path=str(IMAGES / 'thiet-ke-dao-trang-100.png'))
                    no_horizontal_overflow(dao, 'đạo tràng')

                    obs = page_at(1080, 1920)
                    obs.goto(base + '/?obs=1&scene=dao', wait_until='domcontentloaded')
                    obs.frame_locator('#daoSceneFrame').locator('body.obs-overlay').wait_for(timeout=12000)
                    assert obs.frame_locator('#daoSceneFrame').locator('#giftGuide').is_hidden()
                    assert obs.locator('#quickDock').is_hidden()
                    obs.screenshot(path=str(IMAGES / 'thiet-ke-nguon-phat-1080.png'))
                    no_horizontal_overflow(obs, 'nguồn phát')
                    assert not errors, f'Lỗi trình duyệt: {errors[:6]}'
                    print(json.dumps({
                        'ket_qua': 'dat',
                        'toc_do_100_nguoi': fps,
                        'chieu_cao_o_ma_quan_tri': round(control['height'], 1),
                        'loi_javascript': len(errors),
                        'anh': str(IMAGES),
                    }, ensure_ascii=False, indent=2))
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
