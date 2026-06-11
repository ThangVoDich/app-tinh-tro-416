# App Tính Trọ 416 Phan Huy Ích

Created by ThangVoDich.

Bản này là PWA offline, không cần server/backend/database.

## Chức năng

- Quản lý phòng: số phòng, tên người thuê, tiền phòng, giá điện, giá nước, phí cố định.
- Thêm phí khác mặc định cho từng phòng, ví dụ Wifi, giữ xe, rác.
- Lập hóa đơn theo tháng.
- Nhập điện kỳ trước/kỳ này, nước kỳ trước/kỳ này.
- Tự tính tiền điện/nước.
- Lưu hóa đơn theo phòng và tháng.
- Tạo hình hóa đơn PNG để lưu lại/chụp màn hình, không cần in.
- Export/Import backup JSON.

## Chạy thử trên Mac

```bash
python3 -m http.server 8000
```

Mở:

```text
http://localhost:8000
```

## Cài lên iPhone

Upload folder này lên GitHub Pages hoặc Cloudflare Pages để có link HTTPS.

Trên iPhone:

1. Mở link bằng Safari.
2. Bấm Share.
3. Chọn Add to Home Screen.
4. Bấm Add.

## Lưu ý

Dữ liệu nằm trong iPhone bằng localStorage. Không tự sync giữa nhiều máy.
Nên Export backup định kỳ.

## Tab Tháng mới

- Chọn tháng cần tính.
- App tự lấy số điện/nước kỳ trước từ hóa đơn gần nhất của từng phòng.
- Bạn chỉ cần nhập số điện/nước tháng này.
- Bấm Lưu tất cả phòng đã nhập để lưu hóa đơn hàng loạt.

## Bản v4

- Tab Tháng mới tự gợi ý tháng kế tiếp từ hóa đơn mới nhất.
- Khi lưu hóa đơn bên tab Hóa đơn, tab Tháng mới tự chuyển sang tháng sau.
- Mỗi phòng hiện rõ kỳ trước lấy từ hóa đơn tháng nào.

## Bản v5

- Tab Tháng mới không còn lọc theo tên người thuê nữa.
- Nếu phòng bị mất nhưng còn lịch sử hóa đơn, app tự khôi phục danh sách phòng từ hóa đơn cũ.

## Bản v6

- Đổi file script sang app-v6.js?v=6 để tránh trình duyệt/service worker giữ app.js cũ.
- Tab Tháng mới đọc lại dữ liệu phòng trực tiếp từ localStorage trước khi hiển thị.
- Hiện dòng debug: đang có bao nhiêu phòng và bao nhiêu hóa đơn đã lưu.


## Bản v7

- Tab **Tháng mới** được đưa lên đầu và mở mặc định.
- Bỏ nút **Lưu hóa đơn** riêng trong tab Hóa đơn.
- Gộp thành một nút duy nhất: **Tạo hình & lưu hóa đơn**.
- Ở tab **Tháng mới**, mỗi phòng cũng chỉ còn một nút: **Tạo hình & lưu**.
- Sau khi tạo hình, app sẽ **lưu hóa đơn luôn** và tự chuyển **Tháng mới** sang **tháng kế tiếp**, nên số mới vừa nhập sẽ thành số kỳ trước của tháng sau.


## Bản v8

- Fix lỗi bấm **Tạo hình & lưu hóa đơn** ở tab Hóa đơn ra ảnh bị trống/undefined.
- Nguyên nhân: nút click truyền nhầm event vào hàm tạo hóa đơn.
- Tăng cache version sang v8 để tránh trình duyệt giữ logic cũ.


## Bản v9

- Đổi ô chọn tháng từ native month picker sang danh sách tiếng Việt.
- Các ô tháng sẽ hiển thị dạng: Tháng 06/2026.
- Tránh lỗi iPhone/Chrome hiện Jan, Feb, Jun bằng tiếng Anh.


## Bản v10

- Sửa thanh tab trên điện thoại cho dễ nhìn hơn.
- Trên mobile, tab chuyển thành dạng lưới nút lớn, không còn bị thanh ngang mờ/khó kéo.
- Dễ bấm hơn cho các tab: Tháng mới, Phòng, Hóa đơn, Lịch sử, Backup.


## Bản v11

- Sửa màu và viền các nút/tab trên điện thoại.
- Tab không còn trong suốt khó nhìn.
- Nút active có viền và nền rõ hơn.
- Các nút phụ như Gợi ý tháng mới, Tải lại dữ liệu cũ cũng có viền rõ hơn.


## Bản v12

- Bỏ khung/nền đậm bao quanh cụm 5 tab trên điện thoại.
- Các ô nhập tiền tự thêm dấu phẩy khi gõ, ví dụ: 1000000 -> 1,000,000.
- Tính toán vẫn đọc đúng cả dạng 1,000,000 và 1.000.000.


## Bản v13

- Thêm phần **Phí khác tháng này** trực tiếp trong từng phòng ở tab **Tháng mới**.
- Có thể thêm/xóa phí khác ngay khi tính tháng mới.
- Khi bấm **Tạo hình & lưu**, phí khác sẽ được lưu vào hóa đơn của tháng đó.
- Nếu mở lại đúng tháng đã lưu, phí khác sẽ hiện lại để sửa/xóa.


## Bản v14

- Thêm tab riêng: **Ảnh hóa đơn**.
- Sau khi bấm **Tạo hình & lưu**, app sẽ tự chuyển sang tab này để xem ảnh hóa đơn.
- Tab **Hóa đơn** sau khi lưu xong sẽ tự reset form.
- Hóa đơn bỏ phần chữ ký.
- Thay bằng dòng: **Vui lòng thanh toán đúng hạn**.


## Bản v15

- Ảnh hóa đơn đã đổi dòng nhắc thành: **VUI LÒNG THANH TOÁN ĐÚNG HẠN** (in đậm, viết hoa).
- Có checkbox **Có wifi** lúc tạo hóa đơn.
- Thêm trường **Phí wifi (nếu có)** trong tab Phòng để cài số tiền wifi cho từng phòng.
- Tab **Tháng mới** chỉ lưu khi bấm **Tạo hình & lưu**; đã bỏ nút lưu hàng loạt để tránh lưu sớm.
- Phí khác thêm ở **Tháng mới** sẽ đi thẳng lên **ảnh hóa đơn** khi tạo.


## Bản v16

- Fix ảnh hóa đơn bị trùng chữ **Created by ThangVoDich** vào dòng **VUI LÒNG THANH TOÁN ĐÚNG HẠN**.
- Tab **Tháng mới** chỉ hiện phòng khi phòng đó đã có hóa đơn gốc/lịch sử trước đó.
- Flow đúng: vào tab **Hóa đơn** bấm **Tạo hình & lưu hóa đơn** trước, sau đó tab **Tháng mới** mới hiện dữ liệu kỳ trước.
- Khi add phí khác ở tab **Tháng mới**, bấm **Tạo hình & lưu** thì phí đó chắc chắn lên ảnh hóa đơn trước khi app chuyển sang tháng kế tiếp.


## Bản v17

- Fix trường hợp status bị đứng ở "Đang kiểm tra...".
- Status Online/Offline được cập nhật sớm ngay khi trang mở.
- Nếu JavaScript lỗi do cache cũ, app vẫn cố đổi status và báo lỗi rõ hơn.


## Bản v18

- Fix lỗi popup "App bị lỗi lúc khởi động".
- Nguyên nhân: code còn gọi nút cũ `closeImageBtn` nhưng nút này đã bị bỏ khi chuyển ảnh hóa đơn sang tab riêng.
- Không còn hiện alert lỗi khó chịu khi mở app.


## Bản v19

- Thêm VietQR theo đúng tổng tiền hóa đơn.
- Ngân hàng: VCB
- STK: 1031514285
- Chủ TK: NGUYEN BAO THANG
- Khi bấm **Tạo hình & lưu**, app sẽ hiện QR thanh toán kèm theo ảnh hóa đơn trong tab **Ảnh hóa đơn**.


## Bản v20

- QR thanh toán được làm to hơn.
- QR được đưa ra giữa.
- Thông tin ngân hàng, số tài khoản, chủ tài khoản, số tiền, nội dung được đưa xuống dưới QR.
- Áp dụng cả ở tab Ảnh hóa đơn và trên ảnh hóa đơn xuất ra.

## Bản v21

- Thêm tab **Thanh toán** để tự sửa tài khoản nhận tiền.
- Có thể đổi ngân hàng, số tài khoản, tên chủ tài khoản mà không cần sửa code.
- QR hóa đơn mới sẽ tự lấy thông tin trong tab **Thanh toán**.

## Bản v22

- Fix lỗi bấm **Tạo hình & lưu hóa đơn** bị đứng khi VietQR tải chậm hoặc không tải được.
- Nút tạo hóa đơn có trạng thái "Đang tạo hóa đơn..." để dễ biết app đang xử lý.
- Nếu QR không tải được vào ảnh PNG, app vẫn tạo và lưu hóa đơn bình thường, đồng thời hiện thông tin chuyển khoản dạng chữ.

## Bản v23

- Thêm dropdown 20 ngân hàng phổ biến ở Việt Nam trong tab **Thanh toán**.
- Chọn ngân hàng sẽ tự điền mã VietQR/BIN và tên ngân hàng.
- Vẫn có lựa chọn **Ngân hàng khác / tự nhập** nếu cần ngân hàng ngoài danh sách.

## Bản v24

- Fix dropdown ngân hàng bị trống.
- Danh sách 20 ngân hàng được nhúng sẵn vào HTML, không phụ thuộc JavaScript render option.
- Khi chọn ngân hàng, app vẫn tự điền mã VietQR/BIN và tên ngân hàng.


## Bản v25

- Fix layout phần QR trên ảnh hóa đơn.
- Chữ nhắc thanh toán và QR không còn bị lệch/đè nhau.
- Dòng Created by ThangVoDich được đẩy xuống dưới.
- Thêm dòng lưu ý: Chụp màn hình đã gửi sau khi thanh toán.


## Bản v26

- Fix phần Created by ThangVoDich bị đè lên dòng Lưu ý trong ảnh hóa đơn.
- Tăng khoảng cách phần QR/thông tin thanh toán.
- Mỗi khi bấm vào tab Hóa đơn, form sẽ tự reset lại.
- Fix lỗi clearQrPayment bị gọi đệ quy.


## Bản v27

- Đổi nội dung chuyển khoản VietQR sang dạng ngắn:
  - Ví dụ phòng 1 tháng 06/2026: `P1 06-2026`
- QR và ảnh hóa đơn đều dùng nội dung chuyển khoản mới.
