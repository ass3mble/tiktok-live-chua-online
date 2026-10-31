"""Đo giao diện bằng Chromium ẩn, chỉ chạy trên máy chủ và dữ liệu thử tạm thời."""
import json
import os
import socket
import statistics
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = Path(tempfile.gettempdir()) / "dieu-lien-dai-kiem-toan-ui"
KEY = "ma-thu-nghiem-giao-dien"


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def rpc(base, method, params=None, key=None):
    data = json.dumps({"jsonrpc": "2.0", "id": int(time.time() * 1000),
                       "method": method, "params": params or {}},
                      ensure_ascii=False).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if key:
        headers["x-temple-key"] = key
    request = urllib.request.Request(base + "/rpc", data=data, headers=headers)
    with urllib.request.urlopen(request, timeout=12) as response:
        result = json.load(response)
        if result.get("error"):
            raise AssertionError(str(result["error"]))
        return result["result"]


def wait_server(base, key=None):
    last_error = None
    for _ in range(100):
        try:
            request = urllib.request.Request(base + "/dao-trang.html",
                headers={"x-temple-key": key} if key else {})
            with urllib.request.urlopen(request, timeout=1):
                return
        except (OSError, urllib.error.URLError) as exc:
            last_error = str(exc)
            time.sleep(.1)
    raise RuntimeError("Máy chủ thử không sẵn sàng: " + str(last_error))


FRAME_PROBE = """
(() => {
  const original = CanvasRenderingContext2D.prototype.clearRect;
  const samples = [];
  const templeSamples = [];
  CanvasRenderingContext2D.prototype.clearRect = function(...args) {
    if (this.canvas?.id === 'c' && this.canvas?.width === 1080) {
      samples.push(performance.now());
      if (samples.length > 240) samples.shift();
    } else if (this.canvas?.id === 'templeCanvas') {
      templeSamples.push(performance.now());
      if (templeSamples.length > 240) templeSamples.shift();
    }
    return original.apply(this, args);
  };
  window.__daoFrameTimes = samples;
  window.__templeFrameTimes = templeSamples;
})();
"""


def measure(frame, duration=3000, variable="__daoFrameTimes"):
    frame.evaluate("name => window[name].length = 0", variable)
    frame.wait_for_timeout(duration)
    times = frame.evaluate("name => window[name].slice()", variable)
    intervals = [b - a for a, b in zip(times, times[1:])]
    if len(intervals) < 10:
        raise AssertionError(f"Khung hình quá ít: {len(times)}")
    return {"mau": len(times), "hinh_moi_giay": round((len(times)-1)*1000/(times[-1]-times[0]), 2),
            "trung_vi_mili_giay": round(statistics.median(intervals), 2),
            "phan_vi_95_mili_giay": round(sorted(intervals)[int((len(intervals)-1)*.95)], 2)}


def new_page(browser, width, height, token=False):
    page = browser.new_page(viewport={"width": width, "height": height},
                            device_scale_factor=1)
    if token:
        page.add_init_script("sessionStorage.setItem('temple_access_key', " + json.dumps(KEY) + ")")
    return page


def run_one(base, browser, authenticated=False):
    errors = []
    key = KEY if authenticated else None
    if authenticated:
        ordinary = new_page(browser, 390, 844)
        ordinary.goto(base + "/", wait_until="domcontentloaded")
        ordinary.locator("#serverHealth[data-state='error']").wait_for(timeout=10000)
        ordinary.locator("#inputAccessCode").fill(KEY)
        ordinary.locator("#inputAccessCode").dispatch_event("change")
        ordinary.locator("#serverHealth[data-state='ok']").wait_for(timeout=10000)
        assert ordinary.evaluate("sessionStorage.getItem('temple_access_key')") == KEY
        assert "key=" not in ordinary.url
        ordinary.close()
    desktop = new_page(browser, 1440, 900, authenticated)
    desktop.add_init_script(FRAME_PROBE)
    desktop.on("pageerror", lambda error: errors.append(str(error)))
    desktop.goto(base + "/", wait_until="domcontentloaded")
    desktop.locator("#serverHealth[data-state='ok']").wait_for(timeout=10000)
    assert desktop.locator("#btnSceneTemple").get_attribute("aria-pressed") == "true"
    temple_fps = measure(desktop, variable="__templeFrameTimes")
    desktop.locator("#btnSceneDao").click()
    frame = desktop.frame_locator("#daoSceneFrame")
    frame.locator("#count").wait_for(timeout=10000)
    assert desktop.locator("#btnSceneDao").get_attribute("aria-pressed") == "true"
    assert desktop.evaluate("location.search.includes('scene=dao')")
    desktop.evaluate("window.__templeFrameTimes.length = 0")
    desktop.wait_for_timeout(700)
    assert desktop.evaluate("window.__templeFrameTimes.length") == 0, (
        "Hiệu ứng Chánh Điện vẫn vẽ khi Đạo Tràng đang hiển thị")
    desktop.evaluate("""() => {
      window.__nhacChaDaBat = 0;
      const original = TempleAudioEngine.prototype.startZenAmbience;
      TempleAudioEngine.prototype.startZenAmbience = function(...args) {
        window.__nhacChaDaBat++;
        return original.apply(this,args);
      };
    }""")
    desktop.locator("#btnToggleMusic").click()
    desktop.locator("#btnToggleMusic").click()
    assert desktop.evaluate("window.__nhacChaDaBat") == 0, "Nhạc nền Chánh Điện phát khi đang chọn Đạo Tràng"
    desktop.locator("#btnSceneTemple").click()
    assert desktop.locator("#daoSceneFrame").get_attribute("src") is None
    assert desktop.locator("#btnSceneTemple").get_attribute("aria-pressed") == "true"
    desktop.locator("#btnUnlockAudio").focus()
    desktop.locator("#btnUnlockAudio").press("Enter")
    assert "Sẵn Sàng" in desktop.locator("#btnUnlockAudio").inner_text(), (
        "Không bật được âm thanh bằng phím Enter")
    desktop.locator("#cardIncense").focus()
    desktop.locator("#cardIncense").press("Enter")
    desktop.wait_for_function(
        "document.querySelector('#statIncense')?.textContent?.trim() === '3'", timeout=10000)

    direct = new_page(browser, 1080, 1920, authenticated)
    direct.add_init_script(FRAME_PROBE)
    direct.on("pageerror", lambda error: errors.append(str(error)))
    direct.goto(base + "/dao-trang.html", wait_until="domcontentloaded")
    direct.locator("#conn").filter(has_text="Đã kết nối").wait_for(timeout=10000)
    valid_voice_url = direct.evaluate("voiceUrlWithAccess('/tts-cache/am-thanh-thu.wav')")
    assert ("key=" in valid_voice_url) == authenticated
    assert direct.evaluate("voiceUrlWithAccess('https://example.com/foreign.wav')") is None
    rpc(base, "temple.daoClearAll", key=key)
    rpc(base, "temple.daoSettings", {"seatMode": "auto", "music": False, "mo": False}, key=key)
    rpc(base, "temple.daoFill", {"count": 100}, key=key)
    direct.wait_for_function("document.querySelector('#count')?.textContent?.includes('100/100')", timeout=10000)
    before = measure(direct)
    direct.screenshot(path=str(SCREENSHOTS / ("dao-100-xac-thuc.png" if authenticated else "dao-100.png")))
    assert direct.locator("#giftGuide").is_visible()
    assert direct.evaluate("visibleLabelIds?.size <= 5")
    for selector in ("[data-dao-gift='20']", "#btnDaoPrayer"):
        assert direct.locator(selector).is_enabled()
    # Chỉ khi bấm mới gửi lệnh mô phỏng.
    merit_before = rpc(base, "temple.daoGetState", key=key)
    direct.locator("#btnDaoPrayer").click()
    direct.wait_for_function("document.querySelector('#count').textContent.includes('100/')", timeout=10000)
    merit_after = rpc(base, "temple.daoGetState", key=key)
    assert len(merit_after["viewers"]) == len(merit_before["viewers"])
    obs = new_page(browser, 1080, 1920, authenticated)
    obs.on("pageerror", lambda error: errors.append(str(error)))
    obs.goto(base + "/?obs=1&scene=dao", wait_until="domcontentloaded")
    obs.frame_locator("#daoSceneFrame").locator("body.obs-overlay").wait_for(timeout=10000)
    assert obs.locator("#quickDock").is_hidden()
    assert obs.frame_locator("#daoSceneFrame").locator("#giftGuide").is_hidden()
    assert obs.locator("#stageWrapper").bounding_box()["width"] <= 1080.5
    obs.screenshot(path=str(SCREENSHOTS / ("dao-obs-xac-thuc.png" if authenticated else "dao-obs.png")))

    admin = new_page(browser, 1440, 900, authenticated)
    admin.on("pageerror", lambda error: errors.append(str(error)))
    admin.goto(base + "/admin", wait_until="domcontentloaded")
    assert "Diệu Liên Đài" in admin.locator("#ttsDirectText").input_value()
    admin.locator("#daoAdminStatus").filter(has_text="100").wait_for(timeout=10000)
    admin.locator("#btnDaoClear").click()
    direct.wait_for_function("document.querySelector('#count').textContent.startsWith('0/')", timeout=10000)
    admin.locator("[data-dao-fill='36']").click()
    direct.wait_for_function("document.querySelector('#count').textContent.startsWith('36/')", timeout=10000)
    admin.locator("#daoDemoName").fill("Hạnh Nguyện")
    admin.locator("#daoDemoText").fill("nữ")
    admin.locator("#btnDaoDemoChat").click()
    direct.wait_for_function("document.querySelector('#count').textContent.startsWith('37/')", timeout=10000)
    admin.locator("#btnDaoDemoGift").click()
    direct.locator("#giftWho").filter(has_text="Hạnh Nguyện").wait_for(timeout=10000)
    if errors:
        raise AssertionError("Lỗi trình duyệt: " + " | ".join(errors[:8]))
    desktop.close(); direct.close(); obs.close(); admin.close()
    return {"dao_100_nguoi": before, "chanh_dien": temple_fps}


def main():
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    measurements = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            for authenticated in (False, True):
                with tempfile.TemporaryDirectory(prefix="dieu-lien-dai-ui-audit-") as tmp:
                    port = free_port()
                    base = f"http://127.0.0.1:{port}"
                    env = dict(os.environ, HOST="127.0.0.1", PORT=str(port),
                               DATA_DIR=tmp, TIKTOK_USER="", DISABLE_TTS="1",
                               PYTHONIOENCODING="utf-8")
                    if authenticated:
                        env["RPC_TOKEN"] = KEY
                    else:
                        env.pop("RPC_TOKEN", None)
                    flags = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                    log_path = Path(tmp) / "may-chu-thu.log"
                    log = open(log_path, "wb")
                    process = subprocess.Popen(["node", "server.js"], cwd=ROOT, env=env,
                                               stdout=log, stderr=subprocess.STDOUT,
                                               creationflags=flags)
                    try:
                        try:
                            wait_server(base)
                        except RuntimeError:
                            log.flush()
                            raise RuntimeError(
                                f"Máy chủ cổng {port} dừng={process.poll()}: "
                                + log_path.read_text(encoding="utf-8", errors="replace")[-2500:]
                            )
                        if authenticated:
                            try:
                                rpc(base, "temple.daoGetState")
                                raise AssertionError("Máy chủ cho lệnh không có mã truy cập")
                            except urllib.error.HTTPError as exc:
                                assert exc.code == 403, f"Sai mã trạng thái {exc.code}"
                        name = "co_ma" if authenticated else "khong_ma"
                        measurements[name] = run_one(base, browser, authenticated)
                    finally:
                        process.terminate()
                        try:
                            process.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            process.kill(); process.wait(timeout=5)
                        log.close()
        finally:
            browser.close()
    print(json.dumps({"ket_qua": "dat", "khung_hinh_100_nguoi": measurements,
                      "anh": str(SCREENSHOTS)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
