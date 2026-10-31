# Hệ thống thiết kế Diệu Liên Đài

## Tinh thần thị giác

**Thiền viện đương đại:** thanh tịnh, tinh xảo, trang nghiêm và có chiều sâu. Sân khấu Phật điện là chủ thể; các lớp điều khiển chỉ đóng vai trò dẫn đường. Tránh cảm giác trò chơi nhiều bảng nổi, những khối màu rực hoặc các hiệu ứng chiếu sáng quá đà. Chánh Điện và Đạo Tràng cần có cùng hệ nhận diện nhưng vẫn giữ tranh nền và cách bố trí đặc trưng.

## Màu chủ đạo

| Vai trò | Màu | Cách dùng |
| --- | --- | --- |
| Nền sâu | `#061D20` | Nền bao ngoài sân khấu, trang quản trị |
| Ngọc trầm | `#103D39` | Nền bảng điều khiển, lớp phủ |
| Ngọc trung tính | `#1F655C` | Nút thứ cấp, viền nhấn |
| Vàng đồng | `#CFAA68` | Điểm nhấn, khung trang trọng |
| Ngà ấm | `#F4EAD6` | Tiêu đề và thông tin quan trọng |
| Xanh bạc | `#BAD3C8` | Văn bản phụ, trạng thái bình thường |
| Đỏ cảnh báo | `#D78C79` | Cảnh báo lỗi hoặc trạng thái ngắt kết nối |

Hạn chế viền sáng trên mọi thẻ. Chỉ dùng vàng đồng cho chi tiết cần thu hút và không dùng các vùng phát sáng quá rộng che tranh nền.

## Kiểu chữ

- Tiêu đề chính: `Noto Serif`, độ đậm 700, khoảng cách chữ tiết chế; duy trì đầy đủ dấu tiếng Việt.
- Nội dung điều khiển: `Be Vietnam Pro`, độ đậm 400/500/600/700, tối thiểu 14 điểm trên máy tính và 16 điểm trên màn hình điện thoại.
- Số liệu: kiểu chữ không đổi độ rộng các chữ số, dễ theo dõi khi người xem thay đổi.
- Đường dẫn, nhãn trợ giúp và trạng thái cần có độ tương phản tốt, không làm mờ quá mức.

## Bố cục

- Điều khiển máy tính: sân khấu đứng 9:16 là điểm nhìn đầu tiên, bảng điều khiển có thứ tự thao tác rõ. Bảng được cuộn độc lập để sân khấu luôn ổn định.
- Điện thoại: các khối xếp dọc, chừa khoảng chạm tối thiểu 44 điểm, không có cuộn ngang.
- Khung phát 1080 × 1920: tôn trọng vùng khuôn mặt, tượng Phật, bàn thờ và nhân vật. Trạng thái nằm ở mép; nội dung đang phát sinh được ưu tiên tạm thời rồi tự biến mất. Không hiển thị các nút thử của người quản trị.
- Trang quản trị: nhóm cài đặt theo nhiệm vụ, thông tin trạng thái dễ quét nhanh; mã truy cập là một ô thông thường chứ không được dãn cao.

## Chi tiết và chuyển động

- Khoảng cách cơ sở 8 điểm; dùng nhịp 8, 12, 16, 24, 32 theo cấp bậc.
- Bo góc vừa phải 12 đến 20 điểm với bảng điều khiển; sân khấu có khung riêng gợi cánh sen, tránh bo quá tròn.
- Viền mảnh, bóng đổ thấp và sâu; không đặt hiệu ứng mờ kính dày lên vùng tranh.
- Chuyển động phản hồi 160 đến 280 mili giây, ưu tiên thay đổi độ mờ và vị trí bằng phép biến đổi. Không tạo chuyển động liên tục không cần thiết.
- Tôn trọng tùy chọn giảm chuyển động của hệ điều hành.
- Đảm bảo đủ độ tương phản tối thiểu 4,5:1 đối với văn bản thông thường khi có thể; nhãn điều khiển có trạng thái rê chuột, nhấn, vô hiệu và vị trí bàn phím rõ ràng.

## Ràng buộc chức năng

- Không đổi các mã định danh phần tử mà mã JavaScript đã dùng; không thay đổi đường dẫn lệnh điều khiển, cơ chế xác thực hoặc cấu trúc công đức.
- Không tự bật âm thanh, không tự kết nối TikTok, không cộng điểm từ người mô phỏng.
- Cảnh ẩn không được tiếp tục tạo hình hoặc phát nhạc; không được để hiệu ứng trang trí làm giảm tốc độ 30 khung hình mỗi giây trong trường hợp 100 nhân vật thử.

## Tiêu chuẩn nghiệm thu

Chụp và so sánh trực quan trước/sau cho sân khấu dọc, bảng điều khiển và trang quản trị. Kiểm tra 390 × 844, 1440 × 900, 1080 × 1920, Đạo Tràng có 100 người, chuyển cảnh, âm thanh, bàn phím, mã truy cập. Chạy các phép thử tự động và xác nhận tệp dữ liệu công đức thật có cùng mã kiểm tra trước/sau.
