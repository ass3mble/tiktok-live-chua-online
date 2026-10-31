# An toàn khi phát trực tiếp và lưu trên GitHub

## Trước khi đưa mã lên kho lưu trữ

1. Giữ kho ở chế độ riêng tư cho tới khi giải quyết phần quyền sử dụng trong `NGUON-GOC-VA-BAN-QUYEN.md`.
2. Không tải lên `data/merit-state.json`, `.env`, thư mục `.venv`, `models`, bộ đệm âm thanh, tài khoản hoặc mã truy cập. Các đường dẫn này được loại trừ bằng `.gitignore`.
3. Không đưa tên tài khoản cá nhân vào giá trị mặc định của giao diện. Chỉ nhập tài khoản cần phát trong phiên sử dụng.
4. Kiểm tra hình ảnh và âm nhạc trước khi dùng thương mại hoặc phân phối công khai.

## Trong quá trình chạy

Máy chủ mặc định lắng nghe tại `127.0.0.1:3000` và không mở cổng ra mạng. Việc thay đổi `HOST` ra địa chỉ công cộng đòi hỏi mã `RPC_TOKEN` và giải pháp bảo vệ, mã hóa kết nối phù hợp. Không chia sẻ trực tiếp địa chỉ điều khiển qua mạng công khai.

Chương trình không tự phát trực tiếp và không tự kết nối TikTok nếu người dùng chưa khai báo biến `TIKTOK_USER` hoặc chủ động bấm kết nối.

## Khôi phục

Dữ liệu công đức nằm tại `data/merit-state.json`. Tạo bản sao lưu trước khi cập nhật chương trình hoặc thay máy tính. Khi tệp dữ liệu bị lỗi, máy chủ từ chối ghi đè để người dùng có thể phục hồi từ bản sao lưu.
