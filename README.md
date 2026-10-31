# 🪷 TikTok Live Chùa Online | Diệu Liên Đài

**Chùa ảo tương tác dành cho TikTok LIVE · Interactive virtual temple for TikTok LIVE**

[🇻🇳 Tiếng Việt](#tieng-viet) · [🇬🇧 English](#english)

> **Mã nguồn đầy đủ:** Kho bao gồm chương trình, hình ảnh, âm thanh nền, tập lệnh cài đặt và bộ kiểm thử. Mô hình giọng đọc được tải riêng khi cài đặt; dữ liệu cá nhân và thông tin truy cập không được đưa lên kho.
>
> **Complete application source:** This repository includes the application, visual and background-audio assets, installation scripts, and tests. The voice model is downloaded separately. Personal data and access credentials are not included.

---

<a id="tieng-viet"></a>
## 🇻🇳 Tiếng Việt

### Giới thiệu

**TikTok Live Chùa Online (Diệu Liên Đài)** là dự án hỗ trợ tạo khung cảnh chùa ảo để phát trực tiếp trên TikTok. Người xem có thể tương tác qua bình luận, thả tim và quà tặng để kích hoạt các nghi thức mô phỏng: dâng hương, lễ Phật, cầu an, xin xăm và thỉnh chuông.

Chương trình chạy trên máy của người phát, nhận sự kiện từ phòng TikTok và hiển thị cảnh dọc **9:16 (1080 × 1920)**. Đây là **phần mềm hỗ trợ tạo cảnh phát**, không phải trang chùa trực tuyến đã được lưu trữ sẵn và **không tự bắt đầu phát trực tiếp**.

### Chức năng chính

| Chức năng | Mô tả |
| --- | --- |
| 🏯 Chánh Điện | Tượng Phật A Di Đà, dâng hương, đảnh lễ, hoa đăng, chuông, mõ, xin xăm và bảng công đức |
| 🪷 Đạo Tràng 2,5D | Nhân vật ngồi thiền, bố trí tự mở rộng từ 24 đến 100 chỗ, thay đổi trang phục qua bình luận |
| 💬 Tương tác TikTok | Nhận bình luận, lượt thích, theo dõi, chia sẻ và quà tặng để kích hoạt hiệu ứng |
| 🔊 Giọng đọc tiếng Việt | Đọc tên và lời nguyện với ZeroTTS sau khi cài mô hình giọng đọc |
| 🎛️ Bảng điều khiển | Chọn khung cảnh, quản lý âm thanh, kết nối phòng, thử nghi thức và xem trạng thái |
| 🛡️ Bảo vệ dữ liệu | Mặc định chạy trên máy cục bộ, hỗ trợ mã truy cập, lưu bảng công đức và chống tính trùng sự kiện |

### Cài đặt trên Windows

**Yêu cầu:** Node.js **20 trở lên**, trình duyệt hiện đại và phần mềm phát trực tiếp có hỗ trợ nguồn trình duyệt. Nếu muốn dùng giọng đọc, cần thêm **Python 3.11** và **uv**.

**Cách nhanh:**

1. Tải hoặc sao chép kho mã về máy.
2. Chạy **CAI-DAT.bat** để cài các thư viện cần thiết.
3. Chạy **CHAY-DIEU-LIEN-DAI.bat** để mở máy chủ.
4. Truy cập **http://127.0.0.1:3000** để dùng bảng điều khiển.

**Cài thủ công:**

~~~powershell
git clone https://github.com/ass3mble/tiktok-live-chua-online.git
cd tiktok-live-chua-online
npm ci
npm start
~~~

**Cài thêm giọng đọc tiếng Việt (không bắt buộc):**

~~~powershell
uv venv --python 3.11 .venv
uv pip install --python .venv/Scripts/python.exe zerotts pillow
.venv/Scripts/python.exe tools/chuan-bi-mo-hinh.py
~~~

Mô hình giọng đọc được tải riêng, không nằm trong kho GitHub. Nếu không cài giọng đọc, phần giao diện và các hiệu ứng hình ảnh vẫn có thể sử dụng.

### Thiết lập phát trực tiếp

1. Khởi động máy chủ và mở bảng điều khiển.
2. Chọn **Chánh Điện** hoặc **Đạo Tràng**. Mở khóa âm thanh trong trình duyệt nếu cần.
3. Khi có phòng TikTok đang phát, nhập tên tài khoản hoặc liên kết được hỗ trợ rồi bấm **Kết nối**. Không cần kết nối thật để thử các nghi thức mô phỏng.
4. Trong phần mềm phát trực tiếp, thêm một **nguồn trình duyệt** với địa chỉ bên dưới; đặt kích thước **1080 × 1920**.
5. Kiểm tra hình ảnh, âm thanh và sự kiện trước khi bắt đầu phát.

| Mục đích | Địa chỉ |
| --- | --- |
| Bảng điều khiển | http://127.0.0.1:3000 |
| Khung phát Chánh Điện | http://127.0.0.1:3000/?obs=1 |
| Khung phát Đạo Tràng | http://127.0.0.1:3000/?obs=1&scene=dao |
| Trang quản trị | http://127.0.0.1:3000/admin |

Các địa chỉ trên chỉ truy cập được khi máy chủ đang chạy trên máy tương ứng. Việc kết nối sự kiện TikTok phụ thuộc vào tình trạng phòng phát và thư viện kết nối bên thứ ba.

### Kiểm thử và xử lý sự cố

~~~powershell
npm test
python tools/qa-ui-thiet-ke.py
~~~

Lệnh kiểm tra giao diện cần cài sẵn thư viện Playwright và trình duyệt kiểm thử. Nếu **không có tiếng**, hãy mở khóa âm thanh trong bảng điều khiển và kiểm tra thiết lập đầu ra. Nếu **không nhận bình luận/quà**, hãy kiểm tra phòng đang phát, tên tài khoản và trạng thái kết nối. Nếu **khung hình lệch**, hãy đặt nguồn trình duyệt đúng tỷ lệ 9:16.

### Bảo mật và nguồn gốc

- Không công khai mã truy cập, tệp **.env**, dữ liệu người xem hoặc tệp công đức trong thư mục **data/**.
- Máy chủ mặc định chỉ nghe tại **127.0.0.1**. Không mở trực tiếp cổng điều khiển ra Internet.
- Đây là dự án cộng đồng, **không liên kết hoặc được TikTok chứng nhận**, cũng không phải một ngôi chùa có thật.
- Dự án được phát triển dựa trên [zane-tv/tiktok-live-temple-rpc](https://github.com/zane-tv/tiktok-live-temple-rpc) và tham khảo [kentjuno/chanh-dien-online](https://github.com/kentjuno/chanh-dien-online). Quyền sử dụng mã nguồn, hình ảnh và âm thanh phụ thuộc vào từng tác giả và thành phần; không mặc nhiên xem toàn bộ dự án thuộc một giấy phép duy nhất.

---

<a id="english"></a>
## 🇬🇧 English

### Overview

**TikTok Live Chùa Online (Diệu Liên Đài)** is a community project for creating an interactive **virtual Buddhist temple scene** during TikTok LIVE streams. Viewer comments, likes, follows, shares, and gifts can trigger simulated rituals such as incense offerings, prayers, bowing, fortune draws, and bell ringing.

The application runs **locally on the streamer's computer** and provides a vertical **9:16 (1080 × 1920)** scene for broadcasting software. It is **not a hosted online temple** and **does not start a TikTok broadcast automatically**.

### Features

| Feature | Description |
| --- | --- |
| 🏯 Main Sanctuary | Amitabha Buddha scene, incense, bowing, lanterns, bells, wooden fish, fortune draws, and merit leaderboard |
| 🪷 2.5D Meditation Hall | Seated characters, 24–100 adaptive seats, and outfit changes triggered by comments |
| 💬 TikTok interactions | Events from comments, likes, follows, shares, and gifts |
| 🔊 Vietnamese voice | Optional ZeroTTS speech for viewer names and prayers |
| 🎛️ Control panel | Scene selection, audio controls, room connection, ritual tests, and status information |
| 🛡️ Data protection | Localhost by default, optional access key, persistent merit tracking, and duplicate-event handling |

### Installation (Windows)

**Requirements:** Node.js **20+**, a modern browser, and streaming software that supports browser sources. **Python 3.11** and **uv** are optional requirements for the Vietnamese voice engine.

**Quick start:**

1. Download or clone this repository.
2. Run **CAI-DAT.bat** to install dependencies.
3. Run **CHAY-DIEU-LIEN-DAI.bat** to start the local server.
4. Open **http://127.0.0.1:3000** in your browser.

**Manual setup:**

~~~powershell
git clone https://github.com/ass3mble/tiktok-live-chua-online.git
cd tiktok-live-chua-online
npm ci
npm start
~~~

**Optional Vietnamese voice setup:**

~~~powershell
uv venv --python 3.11 .venv
uv pip install --python .venv/Scripts/python.exe zerotts pillow
.venv/Scripts/python.exe tools/chuan-bi-mo-hinh.py
~~~

The voice model is downloaded separately and is not stored in this repository. Visual scenes can still be used without speech synthesis.

### Streaming setup

1. Start the local server and open the dashboard.
2. Select **Main Sanctuary** or **Meditation Hall**, and unlock browser audio when needed.
3. To receive real viewer events, enter an active TikTok account or supported room URL and select **Connect**. You can test simulated rituals without a live connection.
4. Add a **browser source** to your streaming software using one of the URLs below. Set it to **1080 × 1920**.
5. Verify visuals, audio, and incoming events before going live.

| Purpose | Local URL |
| --- | --- |
| Dashboard | http://127.0.0.1:3000 |
| Main Sanctuary scene | http://127.0.0.1:3000/?obs=1 |
| Meditation Hall scene | http://127.0.0.1:3000/?obs=1&scene=dao |
| Admin controls | http://127.0.0.1:3000/admin |

These URLs only work while the local server is running. TikTok connectivity depends on the live room and a third-party connector.

### Testing and troubleshooting

~~~powershell
npm test
python tools/qa-ui-thiet-ke.py
~~~

The visual test requires Playwright and its browser dependencies. For **missing audio**, unlock sound in the dashboard and check the output settings. For **missing events**, confirm that the room is live and the connection is active. For **cropped scenes**, use a 9:16 browser source.

### Security and credits

- Never publish access tokens, **.env**, viewer information, or merit records from **data/**.
- The server binds to **127.0.0.1** by default. Do not expose its control endpoints directly to the public Internet.
- This is an independent community project, **not affiliated with or endorsed by TikTok**, and not an actual religious institution.
- Based on [zane-tv/tiktok-live-temple-rpc](https://github.com/zane-tv/tiktok-live-temple-rpc) with reference to [kentjuno/chanh-dien-online](https://github.com/kentjuno/chanh-dien-online). Respect the original authors and applicable rights to code, images, and audio; no single license is implied for every component.
