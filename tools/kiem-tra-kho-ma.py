"""Kiểm tra dự án trước khi đưa mã lên một kho GitHub riêng tư."""
from pathlib import Path
import json
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
BLOCKED_NAMES = (
    'node_modules/', '.venv/', 'models/', 'nguon-tham-khao/', 'sao-luu/',
    'data/merit-state.json', 'data/tts-cache/',
)
OLD_BRANDS = ('Liên Hoa Tịnh Cảnh', 'LIÊN HOA TỊNH CẢNH', 'LIEN HOA TINH CANH',
              'Chùa Linh Ứng Online', 'CHÙA LINH ỨNG', '@zenfacts_vn', 'Quỳnh_Finn',
              'Vân Liên Đài', 'VÂN LIÊN ĐÀI', 'van-lien-dai')


def main():
    metadata = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
    lock = json.loads((ROOT / 'package-lock.json').read_text(encoding='utf-8'))
    assert metadata['name'] == 'dieu-lien-dai', 'Tên gói không khớp'
    assert lock['name'] == metadata['name']
    assert lock['version'] == metadata['version']
    assert (ROOT / 'public/assets/dieu-lien-dai.svg').is_file(), 'Thiếu biểu trưng'

    result = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT, check=True,
                            capture_output=True)
    tracked = [name.decode('utf-8') for name in result.stdout.split(b'\x00') if name]
    assert tracked, 'Kho chưa có tệp theo dõi'
    for path in tracked:
        if path == '.env' or (path.startswith('.env.') and path != '.env.example') or path.startswith(BLOCKED_NAMES):
            raise RuntimeError(f'Tệp không được xuất bản: {path}')
        filename = ROOT / path
        if filename.stat().st_size > 50 * 1024 * 1024:
            raise RuntimeError(f'Tệp quá lớn cần kiểm tra: {path}')
        if filename.suffix.lower() in {'.html', '.js', '.css', '.svg', '.py'} and path != 'tools/kiem-tra-kho-ma.py':
            content = filename.read_text(encoding='utf-8-sig')
            for old in OLD_BRANDS:
                if old in content:
                    raise RuntimeError(f'Tên cũ còn trong chương trình: {path}: {old}')
    assert not (ROOT / 'data/merit-state.json').exists(), 'Tệp công đức thật không được đặt trong dự án phát hành'
    print(f'ĐẠT: {len(tracked)} tệp được quản lý, không có dữ liệu công đức hay tên cũ trong chương trình.')
    print('LƯU Ý: Cần xác minh quyền phân phối mã và tài sản trước khi công khai kho.')


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    main()
