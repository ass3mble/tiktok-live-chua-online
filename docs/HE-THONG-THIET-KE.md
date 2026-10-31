# Hệ thống thiết kế Diệu Liên Đài

## Tinh thần nhận diện

**Thiền viện đương đại** là hướng thiết kế chính: an tĩnh, trang nghiêm, giản dị có chiều sâu. Nền giấy ngà là chất liệu thị giác của phần điều khiển. Sắc ngọc đêm và vàng đồng dẫn mắt về những hành động quan trọng. Bố cục sân khấu luôn ưu tiên tượng Phật, nhân vật và không gian kiến trúc.

Ba khu vực có vai trò riêng:

- **Chánh Điện và Đạo Tràng:** sân khấu tỷ lệ dọc 9:16. Lời hướng dẫn, số người, công đức nằm ở mép khung để tránh che mặt tượng.
- **Bảng điều khiển chính:** giao diện giấy ngà, thứ tự sử dụng từ chọn không gian đến trạng thái, âm thanh, kết nối và nghi lễ.
- **Trang quản trị:** nền sáng dễ đọc lâu, nhóm điều khiển rõ ràng và không lặp nhiều khung trang trí.

## Bảng màu chuẩn

| Màu | Mã | Vai trò |
| --- | --- | --- |
| Xanh ngọc đêm | #082e2d | Thanh thương hiệu, nút chính và sân khấu |
| Vàng đồng dịu | #cfab65 | Viền, đường phân tầng và hành động quan trọng |
| Giấy ngà | #f3f0e6 | Bảng điều khiển |
| Giấy sáng | #fbfaf5 | Ô nhập và khu vực quản trị |
| Giấy ngà đậm | #e9e5d8 | Vùng lựa chọn phụ |
| Chữ đậm | #163c37 | Nội dung trên nền sáng |
| Chữ phụ | #4d6257 | Hướng dẫn và mô tả |
| Viền tập trung | #ba8d35 | Điều khiển bàn phím |

Không dùng các chuyển sắc tím hoặc dãy khung sáng màu lặp vô hạn. Ưu tiên một nút chính rõ ràng trong mỗi nhóm, như nút lưu màu đồng và các nút phụ màu giấy.

## Chữ, kích thước và khoảng cách

- Tiêu đề thương hiệu và nhóm chức năng chính sử dụng **Noto Serif**.
- Thân chữ, trường nhập, nút và trạng thái sử dụng **Be Vietnam Pro** có dấu rõ ràng.
- Tiêu đề lớn khoảng 22 đến 32 điểm ảnh; tiêu đề nhóm khoảng 18 đến 20; chữ điều khiển khoảng 12 đến 14.
- Nhịp khoảng cách cơ bản 4, 8, 12, 16, 24 và 32 điểm ảnh.
- Dòng mô tả dùng cao dòng từ 1,5 đến 1,75. Chữ phụ cần đậm hơn khi đứng trên nền giấy.
- Giữ phông dự phòng có dấu trong trường hợp không tải được phông chữ.

## Bố cục máy tính và điện thoại

Máy tính đặt sân khấu bên trái và bộ điều khiển bên phải. Độ rộng sân khấu được tính từ khung 9:16. Bảng chính cuộn dọc độc lập, có thương hiệu và lối sang quản trị ở phần trên.

Ở điện thoại, sân khấu nằm phía trên và bộ điều khiển chuyển xuống dưới. Không cho trang tràn ngang. Nút hành động và ô nhập phải có vùng thao tác tối thiểu khoảng 44 điểm ảnh ở kích thước sử dụng thực tế.

Trang quản trị dùng thanh thương hiệu xanh đậm, thông tin trạng thái, dòng nhập mã truy cập gọn, sau đó là nhóm điều phối Đạo Tràng và các chức năng phụ. Ô mã truy cập cao 45 điểm ảnh, không bị kéo giãn theo chiều cao của khối chứa.

## Tầng thị giác trong sân khấu

1. Kiến trúc và tượng Phật là lớp chính, luôn được để thoáng.
2. Dòng tiêu đề nằm trong vùng mái phía trên, số người và thời gian ở dưới.
3. Chú thích và bảng công đức sử dụng các mép kiến trúc, không nằm trên vùng mặt.
4. Hộp quà và lời nguyện chỉ xuất hiện có thời hạn khi có sự kiện.
5. Khi có hơn 24 người, tối đa năm nhãn nổi bật được ưu tiên và kiểm tra va chạm. Vẫn vẽ đầy đủ 100 nhân vật.
6. Nút bật âm thanh nằm gần mép phải phía trên; các nút mô phỏng ẩn trong nguồn phát của OBS.

## Tiếp cận và chuyển động

Nút tương tác có trạng thái được chọn, vùng tập trung rõ ràng và thao tác bằng bàn phím. Ô nhập có nhãn; lỗi máy chủ dùng chữ giải thích cùng màu. Chuyển động nhấn mạnh thao tác nhưng không tạo nhấp nháy trang trí kéo dài. Khi người dùng yêu cầu giảm chuyển động, tắt hoạt họa trang trí không cần thiết.

Khi đổi sang Đạo Tràng, nhạc và hiệu ứng Chánh Điện phải ngừng. Khi quay lại, các điều khiển hoạt động bình thường. Mã truy cập lưu trong phiên, không đưa vào liên kết hiển thị cho người dùng.

## Hiệu năng, kiểm thử và ảnh đối chiếu

Cả hai không gian hướng đến 30 khung hình/giây. Khi trang bị ẩn hoặc cảnh không được chọn, giảm tải vẽ. Bộ kiểm thử riêng là tools/qa-ui-thiet-ke.py, dùng Chrome không giao diện và máy chủ cục bộ có dữ liệu tạm, dịch vụ giọng đọc tắt và không kết nối TikTok.

Các tình huống bắt buộc gồm máy tính 1440 x 900, điện thoại 390 x 844, nguồn phát 1080 x 1920, Đạo Tràng 100 người, không tràn ngang, không lỗi mã trình duyệt và kiểm tra chiều cao ô mã.

Ảnh trước cải tiến được giữ trong docs/demo/dieu-lien-dai-v2-*.png và docs/demo/hop-nhat-*.png. Ảnh sau cải tiến có tên bắt đầu bằng docs/demo/thiet-ke-.

Giữ nguyên các mã định danh giao diện, cách gọi máy chủ, cấu trúc sự kiện, dữ liệu thật, tài sản nguồn và các thư mục tham khảo. Không bổ sung thư viện mạng mới.
