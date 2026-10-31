# Báo cáo cải tiến Diệu Liên Đài ngày 01/11/2026

## Phạm vi

Giữ nguyên hai cảnh Chánh Điện và Đạo Tràng, cơ chế nhận sự kiện, mã truy cập, nghi thức và dữ liệu công đức. Không tự kết nối phòng TikTok, không phát âm thanh và không chỉnh sửa dữ liệu người xem trong quá trình kiểm thử.

Hướng thiết kế giữ nguyên tinh thần thiền viện đương đại: giấy ngà, xanh ngọc trầm, vàng đồng vừa phải. Các điều khiển phục vụ người vận hành, không che tượng hoặc làm rối khung phát dọc.

## Cải tiến đã thực hiện

1. Thêm lối tắt tới bốn nhóm ở bảng điều khiển chính và năm nhóm ở trang quản trị. Các đường dẫn đưa đến đúng mục, không thay đổi mã định danh hoặc thao tác máy chủ.
2. Tăng khả năng đọc của chữ, nút và trạng thái. Ô nhập trên điện thoại có cỡ chữ đủ lớn để tránh tình trạng phóng to ngoài ý muốn. Tăng nhãn và tên dễ hiểu cho trường nhập, thanh âm lượng.
3. Sửa đường dẫn biểu tượng trang cho cả ba giao diện. Giữ nguyên hình ảnh và nhạc gốc.
4. Yêu cầu nhập chính xác `XÓA` trước khi đặt lại bảng công đức, ngăn thao tác vô tình khi bấm nút.
5. Tối ưu việc xác định 24 người có công đức cao nhất, không cần sắp xếp toàn bộ danh sách khi người xem tăng nhiều. Giữ đúng thứ tự với người bằng điểm.
6. Kiểm tra định kỳ kết nối thời gian thực, tự đóng các kết nối không còn phản hồi. Dừng bộ hẹn giờ khi máy chủ ngừng.
7. Giữ đúng dấu tiếng Việt khi đọc dữ liệu trả về từ tiến trình tạo giọng nói, kể cả khi ký tự bị chia giữa hai lần nhận dữ liệu.
8. Khi tắt máy chủ, ưu tiên lưu công đức trước, tránh để thao tác ngắt kết nối ngoài mạng làm treo quá trình dừng.
9. Áp dụng cùng quy tắc địa chỉ ảnh an toàn cho ảnh đại diện cập nhật và ảnh đại diện được tạo mới.
10. Bổ sung các phép thử về bảng xếp hạng, kết nối, lưu công đức khi tắt, ảnh đại diện, điều hướng và xác nhận thao tác nguy hiểm.

## Kết quả kiểm thử

| Phép kiểm tra | Kết quả |
| --- | --- |
| Kiểm thử mã nguồn | 33/33 đạt, tăng từ 27 phép thử |
| Cú pháp máy chủ và mã giao diện | Đạt |
| Bố cục điện thoại 320 và 390 điểm ảnh | Không tràn ngang |
| Bố cục trang quản trị điện thoại 320 và 390 điểm ảnh | Không tràn ngang |
| Bảng điều khiển máy tính 1440 × 900 | Đạt |
| Khung phát 1080 × 1920 | Đạt |
| Đạo Tràng thử 100 người | Khoảng 30 hình/giây trong lần thử cuối |
| Lỗi mã trình duyệt phát hiện được | 0 |
| Ô mã truy cập trang quản trị | Cao 45 điểm ảnh, không dãn bất thường |
| Dữ liệu thật ở thư mục `data/` | Mã kiểm tra trước và sau giống nhau |

Ảnh kiểm thử được tạo trong `docs/demo/thiet-ke-*.png`. Đây là tệp sinh tự động, đã được loại khỏi danh sách tệp đưa lên kho mã nguồn. Bản sao mã nguồn trước khi sửa được lưu tại `sao-luu/truoc-toi-uu-20261101/` trên máy.

## Giới hạn xác minh

Các phép thử sử dụng máy chủ cục bộ, dữ liệu tạm và trình duyệt không hiển thị. Chưa thực hiện một buổi phát TikTok thật, chưa kiểm tra chất lượng âm thanh phát ra loa và chưa thử độ ổn định qua nhiều giờ liên tục. Các chức năng này cần kiểm chứng trong một phiên vận hành có giám sát.

## Lệnh kiểm tra lại

```powershell
npm test
python tools/qa-ui-thiet-ke.py
```
