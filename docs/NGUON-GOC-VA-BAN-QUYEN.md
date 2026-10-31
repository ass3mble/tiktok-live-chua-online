# Nguồn gốc và tình trạng quyền sử dụng

Diệu Liên Đài có tên thương hiệu, cách trình bày và lịch sử Git riêng. Tuy nhiên, phần mềm **không phải sản phẩm được viết hoàn toàn từ đầu**. Tên mới và việc tạo kho riêng không làm thay đổi quyền tác giả đối với phần mã hay tài sản kế thừa.

## Phần kế thừa

1. [zane-tv/tiktok-live-temple-rpc](https://github.com/zane-tv/tiktok-live-temple-rpc): nền tảng nghi thức Chánh Điện, các lớp nhân vật, máy chủ và giao diện. **Không tìm thấy tệp LICENSE trong lịch sử nguồn đã kiểm tra tại thời điểm tách dự án.** Khi không có giấy phép, không được tự suy ra rằng mã có thể phân phối công khai hoặc cấp phép lại theo MIT.
2. [kentjuno/chanh-dien-online](https://github.com/kentjuno/chanh-dien-online): tham khảo Đạo Tràng 2,5 chiều, sắp xếp chỗ, nhân vật và các hiệu ứng. Kho này có giấy phép MIT. Giữ nguyên thông báo bản quyền tại [GIAY-PHEP-KENTJUNO.txt](GIAY-PHEP-KENTJUNO.txt).
3. Các phần phát triển thêm: hợp nhất hai khung cảnh, bảo vệ dữ liệu, kiểm soát truy cập, kiểm thử, giọng đọc ZeroTTS trên Windows, tối ưu hiệu năng, nhận diện Diệu Liên Đài và tài liệu mới.

## Hình ảnh và âm thanh

- Nhiều hình ảnh Chánh Điện, tượng Phật và nhân vật xuất phát từ dự án thứ nhất. Cần xác minh tác giả và quyền phân phối lại.
- Tài nguyên Đạo Tràng xuất phát từ dự án thứ hai. Tác giả nguồn cho biết hình ảnh được tạo bằng Google Flow và âm nhạc được tạo bằng Gemini; cần kiểm tra điều khoản quyền sử dụng của từng dịch vụ trước khi phát hành hoặc sử dụng thương mại.
- ZeroTTS, thư viện đọc sự kiện TikTok và các thư viện phụ thuộc có điều kiện cấp phép riêng; xem danh sách phụ thuộc trong `package-lock.json` và bộ thư viện Python sau khi cài.

## Trạng thái khuyến nghị

Chủ dự án xác nhận tác giả cho phép sử dụng và tự phát triển dự án để công bố trên GitHub. Thông tin này được ghi nhận theo xác nhận của chủ dự án, **chưa phải văn bản cấp phép đã được kiểm chứng độc lập**. Nên lưu bằng chứng về phạm vi cho phép đối với mã, hình ảnh và âm thanh để xử lý các thắc mắc quyền sử dụng nếu có.

Không gắn giấy phép MIT cho **toàn bộ** dự án khi chưa rõ quyền của các phần kế thừa. Tệp giấy phép MIT từ Kent Juno chỉ áp dụng trong phạm vi phần được họ cấp phép. Điều này không thay thế tư vấn pháp lý.

## Quy tắc ghi nhận

- Giữ liên kết và thông báo bản quyền gốc khi sử dụng mã liên quan.
- Không nhận là tác giả duy nhất của hai kho tham khảo.
- Khi có giấy phép hoặc quyền bổ sung, cập nhật tài liệu này và cấp phép cho phần mình sở hữu một cách rõ ràng.
