"""Kiểm tra bộ đọc tiếng Việt bằng một câu ngắn, chạy khi cần."""
from pathlib import Path
import sys
from zerotts import ZeroTTS

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def main():
    print('Đang nạp mô hình giọng đọc tiếng Việt, lần đầu có thể cần tải dữ liệu...', flush=True)
    local = Path(__file__).resolve().parents[1] / 'models' / 'zerotts'
    source = str(local) if (local / 'config.json').is_file() else 'zeroweight-ai/ZeroTTS'
    engine = ZeroTTS.from_pretrained(source, intra_op_num_threads=3)
    voices = engine.list_voices()
    if not voices:
        raise RuntimeError('Không tìm thấy giọng đọc khả dụng')
    voice = 'maichi' if 'maichi' in voices else voices[0]
    audio = engine.synthesize('Nam mô A Di Đà Phật. Chúc gia đình bình an.', voice=voice)
    if audio is None or audio.size == 0:
        raise RuntimeError('Không thể tổng hợp âm thanh')
    destination = Path(__file__).resolve().parents[1] / 'data' / 'tts-cache' / 'kiem-tra-giong.wav'
    destination.parent.mkdir(parents=True, exist_ok=True)
    engine.save_audio(audio, str(destination))
    print(f'Đã tạo âm thanh: {destination}', flush=True)


if __name__ == '__main__':
    main()
