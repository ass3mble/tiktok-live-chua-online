# Đưa Diệu Liên Đài lên GitHub

Dự án đã được tạo bằng một kho Git riêng với nhánh `main`, không giữ lịch sử của hai kho tham khảo. Các tệp chứa dữ liệu người xem, mô hình và tệp âm thanh đã tạo được loại trừ khỏi kho.

## Trước khi tải lên

1. Đọc [ghi chú bản quyền](NGUON-GOC-VA-BAN-QUYEN.md), lưu lại bằng chứng tác giả cho phép sử dụng và phát triển các thành phần kế thừa. Không tự gắn giấy phép cho toàn bộ dự án khi chưa xác định phạm vi quyền.
2. Chạy `npm test` để kiểm tra chức năng.
3. Chạy `python tools/kiem-tra-kho-ma.py` để xác nhận không có tệp dữ liệu riêng tư hoặc tên dự án cũ trong phần chương trình được đưa lên.

## Tạo kho công khai bằng giao diện GitHub

1. Trên GitHub, chọn tạo kho mã mới.
2. Đặt tên `tiktok-live-chua-online`, chọn chế độ **công khai**. Mô tả: "Mã nguồn hỗ trợ phát trực tiếp chùa ảo tương tác trên TikTok: dâng hương, lễ Phật, cầu an bằng bình luận, thả tim và quà tặng; tích hợp giọng đọc tiếng Việt, hai khung cảnh và hình ảnh dọc 9:16."
3. Không chọn tạo sẵn tệp giới thiệu, giấy phép hoặc tệp loại trừ: dự án đã có các tệp cần thiết.
4. Tại thư mục `C:\Users\DUYNAM\Desktop\Dieu Lien Dai`, mở dòng lệnh và chạy:

```powershell
git remote set-url origin https://github.com/ass3mble/tiktok-live-chua-online.git
git push -u origin main
```

Kho đích được đặt theo tài khoản GitHub `ass3mble` đã xác nhận. Chỉ chạy lệnh tải lên khi đã tạo kho công khai trống cùng tên.

Không cần cài thêm công cụ GitHub để tải mã: dự án đã có nhánh `main` và đường dẫn `origin` được cấu hình. Nếu chưa có kho trên GitHub, tạo kho trống trên trang web trước rồi chạy hai lệnh trên.

## Ghi nhận quyền tác giả

Giữ nguyên phần nguồn gốc, ghi nhận tác giả trong tệp giới thiệu và văn bản quyền sử dụng. Chủ dự án đã xác nhận được phép sử dụng và tự phát triển, nhưng cần lưu bằng chứng về phạm vi cho phép nếu muốn cấp phép lại phần kế thừa cho người khác. Đổi tên và thương hiệu không làm thay đổi tác quyền ban đầu.
