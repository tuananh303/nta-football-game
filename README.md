# Luân Lưu 11m

Game đá luân lưu 11m với 78 CLB của Ngoại hạng Anh, La Liga, Bundesliga và Serie A, đội hình mùa 2026/27 (sau kỳ chuyển nhượng hè 2026). Giao diện tiếng Việt, chạy trên trình duyệt máy tính và điện thoại.

- **Đấu với máy**: chọn CLB, chọn đối thủ (hoặc ngẫu nhiên), độ khó Dễ / Thường / Khó.
- **Giải đấu mini**: 8 đội loại trực tiếp (tứ kết, bán kết, chung kết); các trận khác máy tự đá.
- **Đấu online**: tạo phòng có mã 4 ký tự, gửi mã hoặc link cho người ở máy khác.

Cách chơi: khi sút, chạm vào khung thành để ngắm rồi bấm lần nữa khi vạch lực ở vùng xanh (vùng đỏ dễ bay khỏi xà). Khi bắt, chạm vào chỗ đoán bóng tới. Mỗi đội 5 lượt, hoà thì đá đột tử. Bàn phím: mũi tên để ngắm, Space / Enter để chốt.

## Chạy

Cần Node.js 18 trở lên. Không cần cài thư viện nào.

```bash
npm start
```

Mở http://localhost:3100. Đổi cổng bằng biến môi trường `PORT`.

## Chơi online với máy khác

Máy chạy `npm start` là máy chủ. Khi khởi động, máy chủ in ra địa chỉ trong mạng nội bộ, ví dụ `http://192.168.1.20:3100`.

- **Cùng mạng Wi-Fi / LAN**: người kia mở địa chỉ đó. Lần đầu Windows có thể hỏi cho phép Node.js qua tường lửa: chọn *Allow* cho mạng Private.
- **Khác mạng (qua Internet)**: cần đưa game lên một máy chủ có địa chỉ công khai (VPS, hoặc cùng máy chủ IIS / Nginx với website Bộ Sưu Tập theo cách reverse proxy). Đấu online dùng Server-Sent Events, nên reverse proxy không được gom dữ liệu: Nginx đã được báo qua header `X-Accel-Buffering: no`; với IIS ARR đặt *Response buffer threshold* = 0.

Phòng đấu lưu trong bộ nhớ máy chủ: khởi động lại máy chủ thì phòng mất; phòng bỏ không 30 phút tự xoá. Mỗi lượt có 20 giây, hết giờ máy sẽ chọn hộ.

## Cấu trúc

```
server.js            Máy chủ: phục vụ giao diện, API phòng online (/api/rooms...)
public/index.html    Trang game
public/css/game.css  Giao diện (sáng / tối)
public/js/data.js    Danh sách CLB, thủ môn, 7 cầu thủ sút mỗi CLB, chỉ số
public/js/core.js    Luật: phân xử quả sút, loạt luân lưu, máy chơi (dùng chung trình duyệt + máy chủ)
public/js/render.js  Vẽ sân, khung thành, thủ môn, bóng trên canvas
public/js/match.js   Một trận: ngắm, thanh lực, đổ người, bảng tỉ số
public/js/game.js    Các màn hình: trang chủ, chọn CLB, giải mini, phòng online
public/js/sound.js   Âm thanh tổng hợp (sút, còi, khán giả)
```

## Sửa đội hình

Đội hình nằm trong `public/js/data.js`, mỗi CLB một dòng: thủ môn `['Tên', chỉ số bắt]` và 7 cầu thủ `['Tên', chỉ số sút]`. Chỉ số là ước lượng cho game (khoảng 70–92). Danh sách được tổng hợp từ tin chuyển nhượng hè 2026; một số CLB nhỏ và đội mới lên hạng có thể chưa khớp hoàn toàn với đội hình thực tế, sửa trực tiếp trong file là xong.
