# Easy PDF 2.89 (bản web)

Trình xem/sửa PDF, Word, Excel, PowerPoint, ảnh và mô hình IFC 3D. Chạy hoàn toàn trên trình duyệt, không tải tài liệu lên máy chủ.

## Đưa lên GitHub Pages
1. Tạo repository mới (hoặc dùng repo đang có), đưa **toàn bộ nội dung thư mục này** vào gốc repo (kể cả file ẩn `.nojekyll` và thư mục `ifc/`).
2. Vào **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, chọn nhánh `main`, thư mục `/ (root)`.
3. Chờ 1–2 phút, mở `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

## Cấu trúc
- `index.html` — ứng dụng (đã ghép từ các module)
- `mammoth.js`, `xlsx.js`, `html2canvas.js` — thư viện nạp khi mở Word/Excel/ảnh
- `ifc/` — trình xem IFC 3D (nạp khi mở tệp .ifc)
- `.nojekyll` — bắt buộc, để GitHub không xử lý lại thư mục

Giữ nguyên tên và vị trí các tệp; không đổi chữ hoa/thường.
