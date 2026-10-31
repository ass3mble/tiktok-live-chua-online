# Đưa Diệu Liên Đài lên GitHub

Dự án đã được tạo bằng một kho Git riêng với nhánh `main`, không giữ lịch sử của hai kho tham khảo. Các tệp chứa dữ liệu người xem, mô hình và tệp âm thanh đã tạo được loại trừ khỏi kho.

## Trước khi tải lên

1. Đọc [ghi chú bản quyền](NGUON-GOC-VA-BAN-QUYEN.md). Khi chưa có quyền công bố toàn bộ mã và tài nguyên, chỉ tạo kho **riêng tư**.
2. Chạy `npm test` để kiểm tra chức năng.
3. Chạy `python tools/kiem-tra-kho-ma.py` để xác nhận không có tệp dữ liệu riêng tư hoặc tên dự án cũ trong phần chương trình được đưa lên.

## Tạo kho riêng tư bằng giao diện GitHub

1. Trên GitHub, chọn tạo kho mã mới.
2. Đặt tên `dieu-lien-dai`, chọn chế độ **riêng tư**.
3. Không chọn tạo sẵn tệp giới thiệu, giấy phép hoặc tệp loại trừ: dự án đã có các tệp cần thiết.
4. Tại thư mục `C:\Users\DUYNAM\Desktop\Dieu Lien Dai`, mở dòng lệnh và chạy:

```powershell
git remote add origin https://github.com/TEN_TAI_KHOAN/dieu-lien-dai.git
git push -u origin main
```

Thay `TEN_TAI_KHOAN` bằng tên tài khoản GitHub sở hữu kho mới. Chỉ chạy các lệnh tải lên sau khi tạo kho riêng tư.

Nếu có công cụ GitHub trên máy và đã đăng nhập, có thể tạo kho riêng tư và tải lên bằng một lệnh:

```powershell
gh repo create dieu-lien-dai --private --source . --remote origin --push
```

## Khi muốn công khai

Trước khi chuyển thành kho công khai, cần xác minh hoặc thay thế các thành phần không có giấy phép tái phân phối rõ ràng và cập nhật tài liệu quyền sử dụng. Tạo lịch sử Git mới và đổi thương hiệu không phải là bằng chứng sở hữu toàn bộ phần mềm gốc.
