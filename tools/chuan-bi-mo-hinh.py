"""Tải và đặt mô hình ZeroTTS trong thư mục độc lập để ONNX đọc được trên Windows."""
from pathlib import Path
from shutil import copytree
import sys
from huggingface_hub import snapshot_download

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def main():
    root = Path(__file__).resolve().parents[1]
    destination = root / 'models' / 'zerotts'
    required = [
        'config.json',
        'onnx/codec/moss_audio_tokenizer_decode_full.onnx',
        'onnx/codec/moss_audio_tokenizer_decode_shared.data',
        'onnx/prefix_step.onnx',
        'onnx/text_encoder.onnx',
        'onnx/voice_encoder.onnx',
        'onnx/local_frame_decode.onnx',
    ]
    if all((destination / name).is_file() for name in required):
        print('Mô hình ZeroTTS đã có sẵn trong máy.')
        return
    print('Đang tải dữ liệu ZeroTTS và chuẩn bị cho Windows; lần đầu có thể mất khá lâu.', flush=True)
    downloaded = Path(snapshot_download(repo_id='zeroweight-ai/ZeroTTS'))
    copytree(downloaded, destination, symlinks=False, dirs_exist_ok=True)
    if not all((destination / name).is_file() for name in required):
        raise RuntimeError('Thiếu tệp mô hình ZeroTTS sau khi sao chép')
    print('Đã chuẩn bị mô hình ZeroTTS để chạy cục bộ.', flush=True)


if __name__ == '__main__':
    main()
