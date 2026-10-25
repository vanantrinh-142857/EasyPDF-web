// ═══════════════════════════════════════════════════════════════════════════
// IFC Viewer 3D v2.8.3 (APK) — DDC NS · Engine: @thatopen/components 2.3 (Fragments)
// v2.8.3: (1) SỬA nút lưới — getter grid.visible của engine hỏng (đọc three.visible mà
//         setter add/remove khỏi scene) khiến nhấn lần 2 không hiện lại lưới; nay tự theo
//         dõi trạng thái. (2) SỬA bảng thuộc tính mất ở chế độ nhẹ — nay vẫn gói CẤU KIỆN
//         (tên/mã/thuộc tính cơ bản) + quan hệ, chỉ pset bị lược. (3) Màu lưới đổi theo theme.
// v2.8.2: SỬA chọn cụm bị mất khi bỏ kho thuộc tính — nay vẫn gói riêng các QUAN HỆ
//         (IFCRELAGGREGATES...) rất nhẹ nên chọn cụm hoạt động lại kể cả chế độ nhẹ nhất.
// v2.8.1: CHỐNG CHẾT TIẾN TRÌNH với file ~70MB+ — (1) hạ trần wasm 1.375GB để hết RAM
//         thành lỗi bắt được (vòng leo thang chạy được thay vì Android giết app);
//         (2) bỏ-thuộc-tính nay CẮT luôn pset/quantity khỏi luồng byte (~40-60%% file);
//         (3) đọc thuộc tính TRƯỚC khi dựng hình — 2 đỉnh RAM không chồng nhau;
//         (4) cờ "đang mở dở" sống sót qua crash → lần sau tự cảnh báo + mặc định nhẹ nhất;
//         (5) mức ① luôn dùng 6 cạnh/vòng tròn; (6) mặc định bỏ kho thuộc tính từ 60MB.
// v2.8:   SỬA LỖI CHẾT: hộp thoại "chọn cách mở" file ≥45MB bị overlay loading (z70)
//         đè lên (z61) và nuốt mọi cú chạm → app đứng im ở "Đang đọc file..." vĩnh viễn.
//         + Chế độ ① nay CẮT HẲN dòng bu lông/mối hàn khỏi luồng byte TRƯỚC khi wasm
//         phân tích (tape nhỏ đi, wasm khỏi parse) thay vì chỉ bỏ qua lúc dựng hình.
//         + Kho thuộc tính trên điện thoại nén gzip từng phân đoạn (giảm ~10 lần RAM)
//         và BỎ QUA thuộc tính của loại đã ẩn (bu lông/lỗ khoét — đông nhất file).
//         + Giao diện SÁNG mặc định, nút 🌙/☀️ đổi nhanh.
// v2.6.11: chế độ tiết kiệm RAM cho file khủng — thả bản JS của file ngay sau khi
//         wasm đọc xong + STREAM thuộc tính thẳng vào kho nén (không dựng object tổng),
//         tùy chọn bỏ hẳn kho thuộc tính; lỗi sớm tự rơi về đường nạp chuẩn.
// v2.6.10: hộp thoại file nặng gọn còn 2 lựa chọn, BỎ quét danh mục (từng làm
//         chết WebView với file 200MB); file ≥120MB khuyến cáo dùng gói .ifclite.
// v2.6.9: GÓI NHẸ .ifclite — PC xuất hình học dựng sẵn + thuộc tính nén,
//         điện thoại cũ mở file 200MB không cần parse IFC (RAM giảm nhiều lần).
// v2.6.8: mở file nặng theo MỨC trên điện thoại (đếm loại cấu kiện thật trong file,
//         chọn ẩn bu lông / top-2 / top-3 loại phụ đông nhất, thất bại tự leo thang).
// v2.6.7: chọn/tìm nổi viền vàng kiểu Tekla (bỏ làm tối, bỏ khung hộp bao);
//         PC luôn mở độ nét tối đa; zoom dí sát vật tới ~5mm (near plane 1cm).
// v2.6.4: 3 kiểu đo (2 điểm · điểm–cạnh · điểm–mặt phẳng, tự tô sáng mặt khi rê);
//         mặt cắt chọn được mặt phẳng cắt bất kỳ (chạm vào mặt trên mô hình) + đảo phía.
// v2.6.3: file ≥55MB tự ẩn bu lông & mối hàn ngay ở chế độ thường (tránh treo WebView do OOM
// khi dựng ~40k mesh cùng lúc) — vẫn giữ đủ dầm/cột/bản mã.
// v2.6.2: SỬA LỖI chế độ nhẹ nuốt mất cấu kiện — Tekla xuất dầm/cột/kèo dưới nhãn
// IFCDISCRETEACCESSORY, nay chế độ nhẹ chỉ ẩn bu lông + mối hàn (giữ nguyên bộ khung).
// v2.6.1: hiện rõ lý do lỗi, tự thử lại stream, phát hiện luồng đứt giữa chừng,
// đọc thẳng vào buffer đích (giảm ~50% RAM khâu đọc), chặn đường chết ở cầu base64 64MB.
// Cấu kiện lặp dùng chung hình học (InstancedMesh) → RAM thấp hơn nhiều lần
// so với kiến trúc web-ifc-three cũ (mỗi bản sao một khối hình riêng).
// ═══════════════════════════════════════════════════════════════════════════
import { THREE, OBC, OBF, WEBIFC } from './libs/obc/obc.js';

const IS_PC = !window.AndroidIFC; // bản web máy tính (không có cầu nối WebView)
const MT_ON = !!self.crossOriginIsolated; // server gửi COOP/COEP → SharedArrayBuffer → đa luồng

// Soi lỗi worker ra màn hình (worker chết im lặng là thủ phạm treo khó tìm nhất)
if (IS_PC && window.Worker) {
    const OrigWorker = window.Worker;
    window.Worker = class extends OrigWorker {
        constructor(...a) {
            super(...a);
            this.addEventListener('error', (e) => {
                console.error('Worker error:', e.message, e.filename, e.lineno);
                const f = (typeof toast === 'function') ? toast : ((m) => console.warn(m));
                f('⚠️ Worker lỗi: ' + (e.message || 'không rõ') + (e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno : ''), 8000);
            });
        }
    };
}

const $ = (id) => document.getElementById(id);

// ═══ NGÔN NGỮ (VI/EN) ═══════════════════════════════════════════════════════
const I18N = {
    vi: {
        appTitle: 'IFC Viewer 3D', open: '📄 Mở tệp IFC', scan: '📂 Quét file IFC trên máy',
        welcomeSub: 'Engine mới: cấu kiện lặp dùng chung hình học (InstancedMesh) — file lớn nhẹ RAM hơn nhiều lần',
        lite: '🔩 Chế độ nhẹ: ẩn bu lông & mối hàn ', liteSub: '(giữ nguyên dầm/cột/bản mã · đỡ RAM file lớn)', ready: 'Engine Fragments đã sẵn sàng ✓',
        props: 'ℹ️ Thuộc tính', hide: 'Ẩn', isolate: 'Cô lập', propsTitle: 'Thuộc tính',
        measureHint: 'Chạm 2 điểm trên mô hình để đo', reading: 'Đang đọc file...', processing: 'Đang xử lý mô hình...',
        parsing: (mb, lite) => `Đang phân tích mô hình${mb ? ` (${mb} MB)` : ''}${lite ? ' · chế độ nhẹ 🔩' : ''} — file lớn có thể mất vài phút, đừng thoát app...`,
        loaded: (n, f, lite) => `✅ ${n} cấu kiện · ${f} khối hình dùng chung${lite ? ' · đã ẩn bu lông & mối hàn' : ''}`,
        errOpen: 'Lỗi khi mở tệp: ', errOOM: 'hết bộ nhớ (RAM). Thử bật Chế độ nhẹ 🔩, đóng bớt app khác, hoặc chia nhỏ file.',
        errUnknown: 'không rõ nguyên nhân', missModel: 'Chưa trúng mô hình — chạm vào cấu kiện',
        isolating: 'Đang cô lập cấu kiện — bấm 👁️ để hiện lại tất cả', shownAll: 'Đã hiện lại mọi cấu kiện',
        general: 'Thông tin chung', type: 'Loại', name: 'Tên', readingProps: '⏳ Đang đọc thuộc tính...',
        indexing: '⏳ Đang lập chỉ mục thuộc tính (lần đầu, có thể hơi lâu)...',
        noProps: 'Cấu kiện không có thuộc tính kèm theo.', propsFail: 'Không đọc được thuộc tính của cấu kiện này.',
        single: 'ĐƠN', assembly: 'CỤM', modeSingle: 'Chọn: chi tiết đơn', modeAssembly: 'Chọn: cả cụm (assembly)',
        indexingAsm: '⏳ Lần đầu chọn cụm: đang lập chỉ mục quan hệ...', noAsm: 'Cấu kiện này không thuộc cụm nào — đã chọn chi tiết đơn',
        zoom: 'Tốc độ zoom', zoomHint: 'Kéo phải: zoom nhạy/nhanh hơn · kéo trái: chậm/chính xác hơn',
        res: 'Độ nét hiển thị', resHint: 'Mô hình lớn bị giật/lag → hạ xuống, GPU nhẹ hơn nhiều',
        resAuto: (p) => `Mô hình nặng — đã hạ độ nét còn ${p}% cho mượt. Chỉnh lại trong ⚙️`,
        memLow: 'RAM sắp đầy — đã hạ độ nét còn 70% để tránh bị thoát app',
        memCritical: 'RAM gần cạn! Đã hạ độ nét còn 50% — nên bật Chế độ nhẹ 🔩 rồi mở lại file',
        gridOn: 'Đã bật lưới nền', gridOff: 'Đã tắt lưới nền',
        vTop: 'Trên', vFront: 'Trước', vBack: 'Sau', vLeft: 'Trái', vRight: 'Phải',
        titleLang: 'Ngôn ngữ / Language', titleGrid: 'Bật/tắt lưới nền', titleSettings: 'Cài đặt',
        titleOpen: 'Mở tệp IFC', titleScan: 'Quét file IFC', titleFit: 'Thu toàn mô hình vào khung hình',
        titleViews: 'Hướng nhìn', titleMeasure: 'Đo khoảng cách', titleSection: 'Mặt cắt',
        titleSelmode: 'Chọn chi tiết đơn / cả cụm', titleShowall: 'Hiện lại mọi cấu kiện',
        titleSearch: 'Tìm kiếm cấu kiện', titleZoomIn: 'Zoom gần (giữ để zoom liên tục)', titleZoomOut: 'Zoom xa (giữ để zoom liên tục)',
        titleZoomMode: 'Chuyển chế độ zoom: Nhanh / Chuẩn xác',
        zoomModeFast: '⚡ Zoom nhanh — mỗi bước nhảy xa', zoomModePrecise: '🎯 Zoom chuẩn xác — mỗi bước nhích nhẹ',
        snapV: '📍 Đỉnh', snapE: '╱ Cạnh', snapM: '◐ Trung điểm', snapC: '⊙ Tâm', snapF: '✋ Tự do',
        measureHint2: 'Chọn kiểu bắt điểm rồi chạm 2 điểm để đo',
        modePP: '📏 2 điểm', modePL: '⟂ Điểm–Cạnh', modePF: '⟂ Điểm–Mặt', modeBC: '🔩 Tâm BL',
        litePC: '🔩 Chế độ nhẹ: ẩn mối hàn ', litePCSub: '(bản máy tính luôn hiện đủ bu lông)',
        loadedPC: (n, f, lite) => `✅ ${n} cấu kiện · ${f} khối hình dùng chung${lite ? ' · đã ẩn mối hàn' : ''}`,
        hintBC: 'Chạm vào BU LÔNG thứ nhất — app tự tìm trục và tâm bu lông',
        hintBC2: 'Chạm bu lông thứ hai — ra khoảng cách TÂM LỖ ↔ TÂM LỖ (vuông góc giữa 2 trục)',
        noBolt: 'Không nhận ra hình trụ bu lông — hãy chạm vào thân hoặc đầu bu lông',
        mtStuck: '⚠️ Quá lâu không phản hồi — engine đa luồng có thể trục trặc. Hãy đóng cửa sổ đen và chạy file "Chay-IFC-Viewer-DonLuong.bat".',
        hintPL: 'Chạm điểm thứ nhất (theo kiểu bắt điểm đã chọn)',
        hintPL2: 'Chạm vào CẠNH cần đo tới — tự bắt giao tuyến 2 mặt phẳng',
        hintPF: 'Chạm điểm thứ nhất (theo kiểu bắt điểm đã chọn)',
        hintPF2: 'Rê tay/chuột để tô sáng mặt phẳng, chạm để chọn',
        noEdge: 'Không bắt được cạnh — chạm gần một cạnh của chi tiết',
        noFace: 'Không bắt được mặt — chạm trực tiếp lên bề mặt mô hình',
        secPick: '⬚ Chọn mặt cắt', secSet: 'Đã đặt mặt cắt theo mặt vừa chọn — kéo thanh trượt để dời',
        hintSecPick: 'Rê để tô sáng mặt, chạm vào một mặt trên mô hình để đặt mặt phẳng cắt',
        titleSecFlip: 'Đảo phía giữ lại của mặt cắt', titleSecHoriz: 'Trở về mặt cắt ngang (theo cao độ)',
        zoomSel: '🔍 Zoom', orbitSel: 'Xoay/zoom quanh cấu kiện đang chọn',
        searchTitle: '🔍 Tìm cấu kiện', searchPh: 'Mỗi dòng một tên/mã cấu kiện…\nVD:\nDC-01\nPL-12x200',
        searchExact: 'Khớp chính xác tên', searchRun: '🔍 Tìm & làm nổi bật', searchClear: 'Hiện lại bình thường',
        searchIndexing: '⏳ Đang lập danh mục tên cấu kiện (lần đầu)...',
        searchNone: 'Không tìm thấy cấu kiện nào khớp',
        searchResult: (n, hit, total) => `✅ ${n} cấu kiện khớp · tìm thấy ${hit}/${total} tên`,
        searchMiss: 'Không thấy: ', searchCleared: 'Đã hiện lại màu bình thường',
    },
    en: {
        appTitle: 'IFC Viewer 3D', open: '📄 Open IFC file', scan: '📂 Scan IFC files on device',
        welcomeSub: 'New engine: repeated parts share geometry (InstancedMesh) — big files use far less RAM',
        lite: '🔩 Light mode: hide bolts & welds ', liteSub: '(keeps beams/columns/plates · saves RAM)', ready: 'Fragments engine ready ✓',
        props: 'ℹ️ Properties', hide: 'Hide', isolate: 'Isolate', propsTitle: 'Properties',
        measureHint: 'Tap 2 points on the model to measure', reading: 'Reading file...', processing: 'Processing model...',
        parsing: (mb, lite) => `Parsing model${mb ? ` (${mb} MB)` : ''}${lite ? ' · light mode 🔩' : ''} — large files may take minutes, keep the app open...`,
        loaded: (n, f, lite) => `✅ ${n} elements · ${f} shared geometries${lite ? ' · bolts & welds hidden' : ''}`,
        errOpen: 'Failed to open file: ', errOOM: 'out of memory (RAM). Try Light mode 🔩, close other apps, or split the file.',
        errUnknown: 'unknown error', missModel: 'No hit — tap on the model',
        isolating: 'Isolated — tap 👁️ to show all again', shownAll: 'All elements visible again',
        general: 'General', type: 'Type', name: 'Name', readingProps: '⏳ Reading properties...',
        indexing: '⏳ Indexing properties (first time, may take a while)...',
        noProps: 'This element has no attached properties.', propsFail: 'Could not read properties of this element.',
        single: 'PART', assembly: 'ASM', modeSingle: 'Select: single part', modeAssembly: 'Select: whole assembly',
        indexingAsm: '⏳ First assembly pick: indexing relations...', noAsm: 'This element belongs to no assembly — single part selected',
        zoom: 'Zoom speed', zoomHint: 'Right: faster/more sensitive · left: slower/more precise',
        res: 'Render sharpness', resHint: 'Big model stutters? Lower this — much lighter on the GPU',
        resAuto: (p) => `Heavy model — sharpness auto-lowered to ${p}% for smoothness. Adjust in ⚙️`,
        memLow: 'RAM running low — sharpness lowered to 70% to avoid a crash',
        memCritical: 'RAM almost full! Sharpness cut to 50% — enable Light mode 🔩 and reopen the file',
        gridOn: 'Grid on', gridOff: 'Grid off',
        vTop: 'Top', vFront: 'Front', vBack: 'Back', vLeft: 'Left', vRight: 'Right',
        titleLang: 'Language / Ngôn ngữ', titleGrid: 'Toggle grid', titleSettings: 'Settings',
        titleOpen: 'Open IFC file', titleScan: 'Scan IFC files', titleFit: 'Fit model to view',
        titleViews: 'View direction', titleMeasure: 'Measure distance', titleSection: 'Section cut',
        titleSelmode: 'Select single part / assembly', titleShowall: 'Show all elements',
        titleSearch: 'Find elements', titleZoomIn: 'Zoom in (hold to repeat)', titleZoomOut: 'Zoom out (hold to repeat)',
        titleZoomMode: 'Switch zoom mode: Fast / Precise',
        zoomModeFast: '⚡ Fast zoom — big steps', zoomModePrecise: '🎯 Precise zoom — fine steps',
        snapV: '📍 Vertex', snapE: '╱ Edge', snapM: '◐ Midpoint', snapC: '⊙ Center', snapF: '✋ Free',
        measureHint2: 'Pick a snap mode, then tap 2 points to measure',
        modePP: '📏 2 points', modePL: '⟂ Point–Edge', modePF: '⟂ Point–Plane', modeBC: '🔩 Bolt ctr',
        litePC: '🔩 Light mode: hide welds ', litePCSub: '(desktop build always shows bolts)',
        loadedPC: (n, f, lite) => `✅ ${n} elements · ${f} shared geometries${lite ? ' · welds hidden' : ''}`,
        hintBC: 'Tap the FIRST bolt — the app finds its axis and center automatically',
        hintBC2: 'Tap the second bolt — result is HOLE-CENTER to HOLE-CENTER distance (perpendicular between axes)',
        noBolt: 'Not a bolt-like cylinder — tap the bolt shank or head',
        mtStuck: '⚠️ No response for too long — multithreaded engine may be stuck. Close the black window and run "Chay-IFC-Viewer-DonLuong.bat".',
        hintPL: 'Tap the first point (using the selected snap mode)',
        hintPL2: 'Tap the EDGE to measure to — snaps to the intersection line of 2 planes',
        hintPF: 'Tap the first point (using the selected snap mode)',
        hintPF2: 'Hover/drag to highlight a plane, tap to select it',
        noEdge: 'No edge found — tap closer to an edge of the part',
        noFace: 'No face found — tap directly on the model surface',
        secPick: '⬚ Pick cut plane', secSet: 'Cut plane set from picked face — drag slider to move it',
        hintSecPick: 'Hover to highlight, tap a face on the model to set the cutting plane',
        titleSecFlip: 'Flip which side is kept', titleSecHoriz: 'Back to horizontal section (by elevation)',
        zoomSel: '🔍 Zoom', orbitSel: 'Orbit/zoom around selected element',
        searchTitle: '🔍 Find elements', searchPh: 'One element name/mark per line…\ne.g.\nDC-01\nPL-12x200',
        searchExact: 'Exact name match', searchRun: '🔍 Find & highlight', searchClear: 'Restore normal view',
        searchIndexing: '⏳ Indexing element names (first time)...',
        searchNone: 'No matching elements found',
        searchResult: (n, hit, total) => `✅ ${n} elements matched · ${hit}/${total} names found`,
        searchMiss: 'Not found: ', searchCleared: 'Normal colors restored',
    },
};
let LANG = 'vi';
try { LANG = localStorage.getItem('ifc_lang') || 'vi'; } catch (e) {}
// EasyPDF v2.89: khi nhúng, theo ngôn ngữ EasyPDF truyền qua ?lang= (chỉ vi/en)
try { const _l = new URLSearchParams(location.search).get('lang'); if (_l === 'vi' || _l === 'en') LANG = _l; } catch (e) {}
const t = (k, ...a) => { const v = (I18N[LANG] || I18N.vi)[k]; return (typeof v === 'function') ? v(...a) : (v ?? k); };

function applyLang() {
    $('btn-lang').textContent = LANG === 'vi' ? 'EN' : 'VI'; // nút hiện ngôn ngữ SẼ chuyển sang
    $('welcome-lang').textContent = LANG === 'vi' ? '🌐 EN' : '🌐 VI';
    $('welcome-open').textContent = t('open');
    $('welcome-scan').textContent = t('scan');
    document.querySelector('.welcome-sub').textContent = t('welcomeSub');
    const liteLabel = $('lite-mode-cb').parentElement;
    liteLabel.childNodes[2].textContent = ' ' + t(IS_PC ? 'litePC' : 'lite');
    liteLabel.querySelector('span').textContent = t(IS_PC ? 'litePCSub' : 'liteSub');
    $('chip-props').textContent = t('props');
    $('chip-zoomsel').textContent = t('zoomSel');
    $('chip-hide').textContent = t('hide');
    $('chip-isolate').textContent = t('isolate');
    $('measure-hint').textContent = t('measureHint2');
    $('snap-vertex').textContent = t('snapV');
    $('snap-edge').textContent = t('snapE');
    $('snap-mid').textContent = t('snapM');
    $('snap-center').textContent = t('snapC');
    $('snap-free').textContent = t('snapF');
    $('mode-pp').textContent = t('modePP');
    $('mode-pl').textContent = t('modePL');
    $('mode-pf').textContent = t('modePF');
    $('mode-bc').textContent = t('modeBC');
    $('sec-pick').textContent = t('secPick');
    $('sec-flip').title = t('titleSecFlip');
    $('sec-horiz').title = t('titleSecHoriz');
    if (typeof refreshMeasureHint === 'function') refreshMeasureHint();
    $('search-title').textContent = t('searchTitle');
    $('search-input').placeholder = t('searchPh');
    $('lbl-search-exact').textContent = t('searchExact');
    $('search-run').textContent = t('searchRun');
    $('search-clearbtn').textContent = t('searchClear');
    $('lbl-zoom').textContent = t('zoom');
    $('lbl-zoom-hint').textContent = t('zoomHint');
    $('lbl-res').textContent = t('res');
    $('lbl-res-hint').textContent = t('resHint');
    $('btn-selmode').textContent = t(selMode === 'assembly' ? 'assembly' : 'single');
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    const titles = { 'btn-lang':'titleLang', 'btn-grid':'titleGrid', 'btn-settings':'titleSettings',
        'file-btn-container':'titleOpen', 'scan-btn-container':'titleScan', 'btn-fit':'titleFit',
        'btn-views':'titleViews', 'btn-measure':'titleMeasure', 'btn-section':'titleSection',
        'btn-selmode':'titleSelmode', 'btn-showall':'titleShowall', 'btn-search':'titleSearch',
        'btn-zoom-in':'titleZoomIn', 'btn-zoom-out':'titleZoomOut', 'btn-zoom-mode':'titleZoomMode' };
    for (const [id, key] of Object.entries(titles)) { const el = $(id); if (el) el.title = t(key); }
}
const toastEl = $('toast');
let toastTimer = null;
function toast(msg, ms = 2600) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ─── Khởi tạo thế giới 3D ───────────────────────────────────────────────────
const container = $('viewer-container');
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);
const world = worlds.create();
world.scene = new OBC.SimpleScene(components);
// TỐI ƯU GPU (file lớn): tắt MSAA (khử răng cưa phần cứng — ngốn RAM GPU & băng thông
// gấp nhiều lần trên mobile), canvas đục (alpha:false — đỡ 1 lớp trộn màu khi ghép hình),
// bỏ stencil buffer không dùng. Đây là các nguyên nhân chính khiến WebView cạn RAM GPU
// → giao diện trắng xóa từng mảng + giật lag khi mở mô hình nặng.
world.renderer = new OBC.SimpleRenderer(components, container, {
    antialias: false,
    alpha: false,
    stencil: false,
    powerPreference: 'high-performance',
});
world.camera = new OBC.SimpleCamera(components);
components.init();
world.scene.setup(); // đèn ambient + directional mặc định
world.scene.three.background = new THREE.Color('#0f172a');
// ĐỘ NÉT HIỂN THỊ: trần DPR 2 (mắt khó phân biệt với 3, GPU đỡ 2,25 lần điểm ảnh),
// nhân thêm % người dùng chỉnh trong ⚙️ hoặc tự hạ khi mô hình nặng (autoAdaptResolution).
// PC: dùng nguyên DPR màn hình (nét tối đa); mobile giữ trần 2 cho đỡ GPU
const BASE_DPR = IS_PC ? (window.devicePixelRatio || 1) : Math.min(window.devicePixelRatio || 1, 2);
let resPct = 100;
function applyRes(pct) {
    resPct = Math.min(100, Math.max(50, pct));
    try {
        world.renderer.three.setPixelRatio(BASE_DPR * resPct / 100);
        world.renderer.resize();
    } catch (e) {}
    const v = $('res-val'), s = $('res-slider');
    if (v) v.textContent = resPct + '%';
    if (s) s.value = resPct;
}
const grids = components.get(OBC.Grids);
const grid = grids.create(world);
world.camera.controls.setLookAt(18, 14, 18, 0, 0, 0);

const fragments = components.get(OBC.FragmentsManager);
const ifcLoader = components.get(OBC.IfcLoader);
const hider = components.get(OBC.Hider);
const indexer = components.get(OBC.IfcRelationsIndexer);
const boxer = components.get(OBC.BoundingBoxer);
const caster = components.get(OBC.Raycasters).get(world);

// WASM nội bộ — không tải mạng (autoSetWasm sẽ gọi unpkg nếu không tắt)
await ifcLoader.setup({ autoSetWasm: false, wasm: { path: './libs/web-ifc/', absolute: true } });
ifcLoader.settings.webIfc = {
    COORDINATE_TO_ORIGIN: true,
    CIRCLE_SEGMENTS: 10,
    OPTIMIZE_PROFILES: true,          // gộp/tối giản hình học profile thép → parse nhanh + nhẹ RAM
    // KHÔNG nâng MEMORY_LIMIT: trần WASM 2GB mặc định chính là van an toàn — nâng lên 3GB
    // từng khiến tổng RAM tiến trình vượt ngưỡng và bị Android giết khi đang xoay mô hình.
};
// v2.8.1: trên điện thoại HẠ trần wasm xuống 1.375GB — khi mô hình đòi vượt mức này,
// wasm ném lỗi BẮT ĐƯỢC trong JS (vòng leo thang còn cơ hội tự thử chế độ nhẹ hơn)
// thay vì để tổng RAM phình tới lúc Android giết cả tiến trình không lời từ biệt.
// cleanUp() của engine tạo webIfc MỚI sau mỗi lần lỗi nên thử lại vẫn an toàn.
if (!IS_PC) ifcLoader.settings.webIfc.MEMORY_LIMIT = 1408 * 1048576;

// Highlighter: tự xử lý tap (autoHighlightOnClick tắt — xem ghi chú mobile bên dưới)
const highlighter = components.get(OBF.Highlighter);
highlighter.setup({
    world,
    autoHighlightOnClick: false,
    hoverEnabled: false, // di chuột không có trên mobile, tắt cho nhẹ
    selectionColor: new THREE.Color('#3b82f6'),
});
highlighter.zoomToSelection = false;

// ─── Trạng thái ─────────────────────────────────────────────────────────────
let currentModel = null;     // FragmentsGroup đang mở
let indexed = false;         // đã chạy IfcRelationsIndexer cho model hiện tại chưa
let selectedID = null;       // expressID đang chọn
let measureMode = false;
let sectionOn = false;
let modelBox = new THREE.Box3();
let isolated = false;        // đang ở chế độ cô lập (đã ẩn phần còn lại)
let isolatedBox = null;      // khung bao của cụm/chi tiết đang cô lập (THREE.Box3)
let lastAsmTop = null;       // top-assembly của lần chọn cụm gần nhất (tránh tô lại thừa)
let selMode = 'single';      // 'single' = chi tiết đơn | 'assembly' = cả cụm
let selecting = false;       // KHÓA chống chạm chồng: đang xử lý 1 lần chọn thì bỏ qua chạm mới
let indexingPromise = null;  // KHÓA chống lập chỉ mục quan hệ 2 lần cùng lúc (gây kẹt engine)
let currentSelMap = null;    // fragment-map của lựa chọn hiện tại (để Ẩn / Cô lập / Zoom) — KHÔNG tô màu
let selBox = null;           // THREE.LineSegments: khung bao đang hiển thị (thay cho tô màu)
try { selMode = localStorage.getItem('ifc_selmode') === 'assembly' ? 'assembly' : 'single'; } catch (e) {}

// ═══ NÚT NGÔN NGỮ / LƯỚI / CÀI ĐẶT / HƯỚNG NHÌN / CHẾ ĐỘ CHỌN ══════════════
$('btn-lang').onclick = () => {
    LANG = LANG === 'vi' ? 'en' : 'vi';
    try { localStorage.setItem('ifc_lang', LANG); } catch (e) {}
    applyLang();
};
$('welcome-lang').onclick = () => $('btn-lang').onclick();

// Zoom mượt hơn: zoom hướng về điểm chạm/con trỏ + không bay xuyên qua mục tiêu
try {
    world.camera.controls.dollyToCursor = true;
    world.camera.controls.infinityDolly = false;
    world.camera.controls.minDistance = 0.005; // cho phép dí sát vật tới ~5mm
    world.camera.three.near = 0.01;            // mặt cắt gần 1cm — sát mấy cũng không bị "khoét thủng"
    world.camera.three.updateProjectionMatrix();
} catch (e) {}

// v2.8.3: theo dõi trạng thái lưới TỰ TAY. Getter grid.visible của engine bị hỏng —
// nó đọc three.visible (mặc định true, không ai đổi) trong khi setter lại add/remove
// mesh khỏi scene → grid.visible LUÔN trả true → !grid.visible luôn = false → nhấn lần 2
// trở đi không hiện lại lưới. Chỉ GÁN grid.visible (setter add/remove chạy đúng), không đọc.
let gridOn = true;
$('btn-grid').onclick = () => {
    gridOn = !gridOn;
    grid.visible = gridOn;
    $('btn-grid').classList.toggle('on', gridOn);
    toast(t(gridOn ? 'gridOn' : 'gridOff'), 1400);
};

$('btn-settings').onclick = () => $('settings-pop').classList.toggle('show');

// ═══ GIAO DIỆN SÁNG / TỐI (mặc định: SÁNG) ══════════════════════════════════
let THEME = 'light';
try { THEME = localStorage.getItem('ifc_theme') || 'light'; } catch (e) {}
function applyTheme() {
    const light = THEME === 'light';
    document.body.classList.toggle('light', light);
    $('btn-theme').textContent = light ? '🌙' : '☀️';
    try { world.scene.three.background = new THREE.Color(light ? '#dfe6ef' : '#0f172a'); } catch (e) {}
    try { // lưới nền: đậm hơn trên nền sáng để vẫn nhìn thấy
        const c = light ? '#9aa8ba' : '#334155';
        const gm = grid.three && grid.three.material; // lưới là Mesh, màu nằm ở uniform uColor
        if (gm && gm.uniforms && gm.uniforms.uColor) gm.uniforms.uColor.value.set(c);
    } catch (e) {}
}
$('btn-theme').onclick = () => {
    THEME = (THEME === 'light') ? 'dark' : 'light';
    try { localStorage.setItem('ifc_theme', THEME); } catch (e) {}
    applyTheme();
};
applyTheme();
// Độ nhạy/tốc độ zoom: nhân hệ số dollySpeed của camera (pinch & cuộn chuột)
let zoomPct = 100;
try { zoomPct = parseInt(localStorage.getItem('ifc_zoom') || '100', 10) || 100; } catch (e) {}
function applyZoom(pct) {
    zoomPct = Math.min(300, Math.max(20, pct));
    world.camera.controls.dollySpeed = zoomPct / 100;
    $('zoom-val').textContent = zoomPct + '%';
    $('zoom-slider').value = zoomPct;
}
applyZoom(zoomPct);
$('zoom-slider').addEventListener('input', (e) => {
    applyZoom(parseInt(e.target.value, 10));
    try { localStorage.setItem('ifc_zoom', String(zoomPct)); } catch (err) {}
});

// Thanh chỉnh độ nét hiển thị: người dùng kéo → GHI NHỚ lựa chọn (tắt auto hạ nét)
let resSaved = null;
try { resSaved = localStorage.getItem('ifc_res'); } catch (e) {}
applyRes(resSaved ? (parseInt(resSaved, 10) || 100) : 100);
$('res-slider').addEventListener('input', (e) => {
    applyRes(parseInt(e.target.value, 10));
    resSaved = String(resPct);
    try { localStorage.setItem('ifc_res', resSaved); } catch (err) {}
});

// Tự hạ độ nét theo độ nặng mô hình (chỉ khi người dùng CHƯA tự chỉnh trong ⚙️).
// Số tam giác mới là thước đo tải GPU thật — không phải dung lượng file.
let heavyTris = 0; // tổng tam giác của mô hình hiện tại (bật/tắt độ phân giải động)
function autoAdaptResolution(model) {
    let tris = 0;
    try {
        for (const frag of model.items) {
            const g = frag.mesh.geometry;
            const per = g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
            tris += per * (frag.mesh.count || 1);
        }
    } catch (e) {}
    heavyTris = tris;
    if (IS_PC) { applyRes(100); return; } // PC: luôn mở ở độ nét cao nhất (GPU dư sức)
    if (resSaved) return; // tôn trọng lựa chọn tay của người dùng
    const pct = tris > 2e6 ? 60 : tris > 1e6 ? 75 : 100;
    applyRes(pct);
    if (pct < 100) toast(t('resAuto', pct), 4500);
}

// ĐỘ PHÂN GIẢI ĐỘNG: lúc ngón tay đang xoay/kéo mô hình nặng, hạ tạm độ nét xuống ~60%
// (GPU đỡ ~2,7 lần điểm ảnh đúng vào lúc tải nặng nhất), buông tay là nét lại ngay.
// Kỹ thuật chuẩn của game engine — cắt được đỉnh tiêu thụ RAM GPU khi thao tác liên tục.
let interacting = false;
function setRenderScale(mult) {
    try {
        world.renderer.three.setPixelRatio(BASE_DPR * resPct / 100 * mult);
        world.renderer.resize();
    } catch (e) {}
}
try {
    const cc = world.camera.controls;
    cc.addEventListener('controlstart', () => {
        if (!IS_PC && !interacting && heavyTris > 5e5) { interacting = true; setRenderScale(0.62); }
    });
    const restoreScale = () => { if (interacting) { interacting = false; setRenderScale(1); } };
    cc.addEventListener('controlend', restoreScale);
    cc.addEventListener('rest', restoreScale);
} catch (e) {}

// CẢNH BÁO RAM TỪ ANDROID: wrapper gọi hàm này khi hệ thống báo sắp cạn bộ nhớ
// (onTrimMemory) → hạ độ nét NGAY để né bị giết tiến trình, kèm hướng dẫn.
window.__onMemoryPressure = (level) => {
    if (level >= 15) {          // TRIM_MEMORY_RUNNING_CRITICAL
        applyRes(50);
        toast(t('memCritical'), 5500);
    } else if (level >= 10 && resPct > 70) { // TRIM_MEMORY_RUNNING_LOW
        applyRes(70);
        toast(t('memLow'), 4500);
    }
};

$('btn-views').onclick = () => { if (currentModel) $('views-pop').classList.toggle('show'); };
const VIEW_DIRS = { iso: [1, 0.75, 1], top: [0.0001, 1, 0.0001], front: [0, 0.12, 1], back: [0, 0.12, -1], left: [-1, 0.12, 0], right: [1, 0.12, 0] };
// Khung bao đang điều khiển camera: khi cô lập → chỉ cụm/chi tiết đó, ngược lại → cả mô hình
function activeBox() { return (isolated && isolatedBox) ? isolatedBox : modelBox; }
function setView(name) {
    if (!currentModel) return;
    const s = activeBox().getBoundingSphere(new THREE.Sphere());
    if (!isFinite(s.radius) || s.radius <= 0) return;
    const d = Math.max(s.radius * 2.2, 1);
    const v = new THREE.Vector3(...(VIEW_DIRS[name] || VIEW_DIRS.iso)).normalize().multiplyScalar(d);
    world.camera.controls.setLookAt(s.center.x + v.x, s.center.y + v.y, s.center.z + v.z,
        s.center.x, s.center.y, s.center.z, true);
}
for (const chip of document.querySelectorAll('.view-chip')) {
    chip.onclick = () => { setView(chip.dataset.view); $('views-pop').classList.remove('show'); };
}

$('btn-selmode').onclick = () => {
    selMode = selMode === 'single' ? 'assembly' : 'single';
    try { localStorage.setItem('ifc_selmode', selMode); } catch (e) {}
    $('btn-selmode').textContent = t(selMode === 'assembly' ? 'assembly' : 'single');
    $('btn-selmode').classList.toggle('on', selMode === 'assembly');
    toast(t(selMode === 'assembly' ? 'modeAssembly' : 'modeSingle'), 1600);
};

// ═══ NÉN THUỘC TÍNH (chìa khóa sống còn cho file lớn) ═══════════════════════
// Engine giữ TOÀN BỘ thuộc tính IFC dưới dạng object JS khổng lồ — đo thực nghiệm
// ~7KB heap cho MỖI cấu kiện, file lớn đội hàng GB RAM → Android giết app khi đang
// xoay. Giải pháp: nén cả kho thành MỘT chuỗi JSON phẳng + bảng offset (chuỗi ASCII
// trong V8 chỉ tốn 1 byte/ký tự, không bị GC quét từng object). Tra cứu cấu kiện nào
// thì parse riêng lát cắt của nó. Ba hàm engine dùng được thay tương đương 1-1.
let propPack = null;
// v2.8: trên điện thoại, mỗi phân đoạn sau khi đầy được NÉN GZIP (CompressionStream)
// → kho 150–250MB chuỗi co còn ~10–25MB. Tra cứu thì giải nén đúng 1 phân đoạn (8MB,
// ~vài chục ms) và cache 2 phân đoạn gần nhất. PC giữ chuỗi thường (RAM dư dả, còn
// phục vụ xuất .ifclite vốn join thẳng segs).
const PP_GZ = !!window.AndroidIFC && typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
const PP_SEG = PP_GZ ? 8 * 1048576 : 24 * 1048576;
class SegWriter {
    constructor() { this.segs = []; this.buf = []; this.len = 0; this.jobs = []; }
    push(str) {
        const loc = [this.segs.length, this.len, str.length];
        this.buf.push(str); this.len += str.length;
        if (this.len >= PP_SEG) this.flush();
        return loc;
    }
    flush() {
        if (!this.len) return;
        const i = this.segs.length, s = this.buf.join('');
        this.segs.push(s); this.buf.length = 0; this.len = 0;
        if (PP_GZ) this.jobs.push(gzMaybe(new TextEncoder().encode(s))
            .then((z) => { if (z.gz) this.segs[i] = z.bytes; })
            .catch(() => {})); // nén hỏng → giữ chuỗi thường, không mất dữ liệu
    }
    async done() { this.flush(); if (this.jobs.length) await Promise.all(this.jobs); this.jobs.length = 0; return this.segs; }
}
const segCache = new Map(); // segIdx → chuỗi đã giải nén (giữ tối đa 2)
async function ppSeg(i) {
    if (!propPack) return null;
    const s = propPack.segs[i];
    if (typeof s === 'string') return s;
    if (!s) return null;
    let hit = segCache.get(i);
    if (hit) return hit;
    const txt = new TextDecoder().decode(await gunzip(s));
    if (segCache.size >= 2) segCache.delete(segCache.keys().next().value);
    segCache.set(i, txt);
    return txt;
}
async function ppRead(o) {
    if (!o || !propPack) return null;
    const s = await ppSeg(o[0]);
    return s ? JSON.parse(s.slice(o[1], o[1] + o[2])) : null;
}
async function packProperties(model) {
    const props = model.getLocalProperties();
    if (!props) return;
    const index = new Map(), byType = new Map(), names = [];
    const sw = new SegWriter();
    for (const key in props) {
        const e = props[key];
        if (!e) continue;
        const id = parseInt(key, 10);
        index.set(id, sw.push(JSON.stringify(e)));
        if (e.type != null) {
            let arr = byType.get(e.type);
            if (!arr) byType.set(e.type, arr = []);
            arr.push(id);
        }
        // Gom sẵn tên/mã cho tìm kiếm — khỏi phải duyệt lại cả kho lần nữa
        const nm = (e.Name && e.Name.value != null) ? String(e.Name.value).toLowerCase() : '';
        const tg = (e.Tag && e.Tag.value != null) ? String(e.Tag.value).toLowerCase() : '';
        if (nm || tg) names.push({ id, nm, tg });
    }
    propPack = { segs: await sw.done(), index, byType, names };
    wirePropPack(model);
}

// Nối model vào kho propPack (dùng cả khi nén tại chỗ lẫn khi mở gói .ifclite)
function wirePropPack(model) {
    segCache.clear(); // kho mới → bỏ cache phân đoạn của mô hình cũ
    // Thả object khổng lồ, thay bằng 3 hàm đọc từ chuỗi nén (giữ nguyên giao kèo engine)
    model.setLocalProperties(null);
    Object.defineProperty(model, 'hasProperties', { configurable: true, get: () => true });
    model.getProperties = async (id) => {
        const k = (typeof id === 'string') ? parseInt(id, 10) : id;
        const o = propPack && propPack.index.get(k);
        return ppRead(o);
    };
    model.getAllPropertiesOfType = async (type) => { // IfcRelationsIndexer gọi hàm này khi lập chỉ mục cụm
        if (!propPack) return null;
        const ids = propPack.byType.get(type);
        if (!ids || !ids.length) return null;
        const out = {};
        for (const id of ids) {
            const o = propPack.index.get(id);
            if (o) out[id] = await ppRead(o); // ppRead nay bất đồng bộ (giải nén phân đoạn khi cần)
        }
        return out;
    };
}

// ═══ GÓI NHẸ .ifclite — PC gánh phần nặng, điện thoại chỉ hiển thị ═══════════
// PC mở IFC (đa luồng, RAM lớn) → XUẤT hình học đã dựng (.frag) + kho thuộc tính
// đã nén (propPack) vào MỘT file .ifclite. Điện thoại mở .ifclite: KHÔNG parse IFC,
// KHÔNG JSON.parse kho thuộc tính — nạp thẳng, RAM chỉ còn phần hiển thị.
// Container v1: 'IFCL1\n' + u32 lenHeader + headerJSON + frag + meta + text.
const IFCLITE_MAGIC = 'IFCL1\n';

async function gzMaybe(u8) { // nén nếu trình duyệt có CompressionStream
    if (typeof CompressionStream === 'undefined') return { bytes: u8, gz: false };
    const buf = await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
    return { bytes: new Uint8Array(buf), gz: true };
}
async function gunzip(u8) {
    if (typeof DecompressionStream === 'undefined')
        throw new Error(LANG === 'vi' ? 'WebView quá cũ (thiếu DecompressionStream) — hãy cập nhật "Android System WebView" trong CH Play rồi mở lại.' : 'WebView too old (no DecompressionStream) — update "Android System WebView" from Play Store.');
    const buf = await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    return new Uint8Array(buf);
}

// PC: xuất mô hình ĐANG MỞ (kể cả đã ẩn theo mức) thành .ifclite
async function exportIfcLite() {
    if (!currentModel) return;
    const btn = $('btn-export-lite');
    try {
        btn.disabled = true;
        toast(LANG === 'vi' ? '⏳ Đang đóng gói bản nhẹ...' : '⏳ Packing lite bundle...', 3500);
        await new Promise(r => setTimeout(r, 60));
        const enc = new TextEncoder();
        const frag = fragments.export(currentModel);
        // Kho thuộc tính: dump thẳng propPack (không dựng lại JSON khổng lồ)
        let metaObj = { index: [], byType: [], names: [] }, textStr = '';
        if (propPack) {
            const base = []; let acc = 0;
            for (const s of propPack.segs) { base.push(acc); acc += s.length; }
            for (const [id, o] of propPack.index) metaObj.index.push([id, base[o[0]] + o[1], o[2]]);
            for (const [ty2, ids] of propPack.byType) metaObj.byType.push([ty2, ids]);
            for (const r of propPack.names) metaObj.names.push([r.id, r.nm, r.tg]);
            textStr = propPack.segs.join('');
        }
        const [fragZ, metaZ, textZ] = await Promise.all([
            gzMaybe(frag), gzMaybe(enc.encode(JSON.stringify(metaObj))), gzMaybe(enc.encode(textStr)),
        ]);
        const name = ($('file-name').textContent || 'model').replace(/\.(ifc|ifclite)$/i, '');
        const header = enc.encode(JSON.stringify({
            v: 1, name,
            sizes: { frag: fragZ.bytes.length, meta: metaZ.bytes.length, text: textZ.bytes.length },
            gz: { frag: fragZ.gz, meta: metaZ.gz, text: textZ.gz },
        }));
        const u32 = new Uint8Array(4); new DataView(u32.buffer).setUint32(0, header.length, true);
        const blob = new Blob([enc.encode(IFCLITE_MAGIC), u32, header, fragZ.bytes, metaZ.bytes, textZ.bytes]);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + '.ifclite';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 30000);
        const mbOut = (blob.size / 1048576).toFixed(1);
        toast((LANG === 'vi' ? '✅ Đã xuất ' : '✅ Exported ') + name + '.ifclite (' + mbOut + ' MB) — ' +
              (LANG === 'vi' ? 'chép sang điện thoại và mở bằng nút Mở tệp' : 'copy to phone, open via Open file'), 6500);
    } catch (e) {
        console.warn('exportLite:', e);
        toast('⚠️ ' + (e.message || e), 5000);
    } finally { btn.disabled = false; }
}

// Đọc container .ifclite → { fragBytes, meta, text, name }
async function parseIfcLite(buffer) {
    const u8 = new Uint8Array(buffer);
    const dec = new TextDecoder();
    const hLen = new DataView(buffer, 6, 4).getUint32(0, true);
    const hdr = JSON.parse(dec.decode(u8.subarray(10, 10 + hLen)));
    let p = 10 + hLen;
    const take = (n) => { const out = u8.subarray(p, p + n); p += n; return out; };
    let frag = take(hdr.sizes.frag), meta = take(hdr.sizes.meta), text = take(hdr.sizes.text);
    if (hdr.gz.frag) frag = await gunzip(frag);
    if (hdr.gz.meta) meta = await gunzip(meta);
    if (hdr.gz.text) text = await gunzip(text);
    return { frag, meta: JSON.parse(dec.decode(meta)), text: dec.decode(text), name: hdr.name };
}

// ═══ ĐƯỜNG NẠP TIẾT KIỆM RAM (file KHỦNG trên điện thoại) ════════════════════
// Hai quả bom RAM của đường nạp chuẩn với file 200MB:
//   (1) bản sao JS của file bị giữ SUỐT quá trình dựng hình (dù wasm đã có bản riêng)
//   (2) kho thuộc tính bị dựng thành MỘT object JS khổng lồ (vài trăm MB) rồi mới nén
// Đường này tự ghép các bước public của engine: thả bản JS ngay sau khi wasm đọc xong,
// và thuộc tính thì STREAM từng entity thẳng vào propPack (object rác được GC tức thì).
// Nếu lỗi mà file chưa bị thả → tự rơi về đường nạp chuẩn, không mất gì.
const IFC_SPATIAL = [103090709, 4097777520, 4031249490, 3124254112, 3856911033]; // PROJECT/SITE/BUILDING/STOREY/SPACE
// v2.8.1: các loại QUAN HỆ mà bộ lập chỉ mục cần để CHỌN CỤM (IFCRELAGGREGATES là
// then chốt: IfcElementAssembly → các chi tiết con). Chúng NHẸ (vài KB/quan hệ) nên
// giữ lại được cả khi đã bỏ kho thuộc tính nặng. Không có chúng, "chọn cụm" chết.
const IFC_REL_TYPES = [160246688, 3242617779, 3268803585, 781010003, 2655215786, 919958153, 1307041759, 4186316022, 307848117, 1204542856, 2857406711, 2565941209, 2495723537, 982818633, 279856033];
const IFC_GEOM_TYPES = new Set([1123145078,574549367,1675464909,2059837836,3798115385,32440307,3125803723,3207858831,2740243338,2624227202,4240577450,3615266464,3724593414,220341763,477187591,1878645084,1300840506,3303107099,1607154358,1878645084,846575682,1351298697,2417041796,3049322572,3331915920,1416205885,776857604,3285139300,3958052878,2827736869,2732653382,673634403,3448662350,4142052618,2924175390,803316827,2556980723,1809719519,2205249479,807026263,3737207727,1660063152,2347385850,2705031697,3732776249,2485617015,2611217952,1704287377,2937912522,2770003689,1281925730,1484403080,3448662350,4142052618,3800577675,4006246654,3590301190,1383045692,2775532180,2047409740,370225590,3593883385,2665983363,4124623270,812098782,3649129432,987898635,1105321065,3510044353,1635779807,2603310189,3406155212,1310608509,4261334040,2736907675,3649129432,1136057603,1260505505,4182860854,2713105998,2898889636,59481748,3749851601,3486308946,3150382593,1062206242,3264961684,15328376,1485152156,370225590,1981873012,2859738748,45288368,2614616156,2732653382,775493141,2147822146,2601014836,2629017746,1186437898,2367409068,1213902940,3632507154,3900360178,476780140,1472233963,2804161546,3008276851,738692330,374418227,315944413,3905492369,3570813810,2571569899,178912537,2294589976,1437953363,2133299955,572779678,3092502836,388784114,2624227202,1425443689,3057273783,2347385850,1682466193,2519244187,2839578677,3958567839,2513912981,2830218821,427810014]); // entity hình học — exporter gốc cũng bỏ qua

// Stream toàn bộ thuộc tính → propPack (không dựng object tổng). Trả Map expressID→GlobalId.
async function streamPackProps(w, skip) { // v2.8.1: chạy TRƯỚC khi dựng hình (đỉnh RAM thấp hơn) — caller tự wirePropPack sau
    const index = new Map(), byType = new Map(), names = [];
    const sw = new SegWriter();
    const gids = new Map();
    let since = 0;
    const types = new Set(w.GetIfcEntityList(0));
    for (const ty2 of IFC_SPATIAL) types.add(ty2);
    for (const ty2 of types) {
        if (IFC_GEOM_TYPES.has(ty2)) continue;
        // v2.8: loại đã ẨN (bu lông, mối hàn, lỗ khoét, space) — đông nhất file — thì
        // bỏ luôn thuộc tính: đỡ hàng chục nghìn lần GetLine + JSON, kho nhẹ đi hẳn.
        if (skip && skip.has(ty2) && !IFC_SPATIAL.includes(ty2)) continue;
        const rec = IFC_SPATIAL.includes(ty2);
        let ids;
        try { ids = w.GetLineIDsWithType(0, ty2); } catch (e) { continue; }
        const n = ids.size();
        for (let k = 0; k < n; k++) {
            const id = ids.get(k);
            try {
                const y = w.GetLine(0, id, rec, false);
                index.set(y.expressID, sw.push(JSON.stringify(y)));
                if (y.type != null) {
                    let arr = byType.get(y.type);
                    if (!arr) byType.set(y.type, arr = []);
                    arr.push(y.expressID);
                }
                const nm = (y.Name && y.Name.value != null) ? String(y.Name.value).toLowerCase() : '';
                const tg = (y.Tag && y.Tag.value != null) ? String(y.Tag.value).toLowerCase() : '';
                if (nm || tg) names.push({ id: y.expressID, nm, tg });
                if (y.GlobalId) gids.set(y.expressID, y.GlobalId.value || y.GlobalId);
            } catch (e) {}
            if (++since >= 4000) { since = 0; await new Promise(r => setTimeout(r)); } // nhả luồng UI
        }
    }
    propPack = { segs: await sw.done(), index, byType, names };
    return gids; // caller gọi wirePropPack(group) sau khi có group
}

// v2.8.1: đóng gói CHỈ quan hệ (nhẹ) — dùng khi đã bỏ kho thuộc tính, để CHỌN CỤM
// vẫn hoạt động. Không có tên/mã (property panel trống) nhưng cụm thì gom được.
async function streamPackRelations(w) {
    const index = new Map(), byType = new Map();
    const sw = new SegWriter();
    let since = 0;
    for (const ty of IFC_REL_TYPES) {
        let ids;
        try { ids = w.GetLineIDsWithType(0, ty); } catch (e) { continue; }
        const n = ids.size();
        for (let k = 0; k < n; k++) {
            const id = ids.get(k);
            try {
                const y = w.GetLine(0, id, false, false);
                index.set(y.expressID, sw.push(JSON.stringify(y)));
                let arr = byType.get(y.type); if (!arr) byType.set(y.type, arr = []);
                arr.push(y.expressID);
            } catch (e) {}
            if (++since >= 4000) { since = 0; await new Promise(r => setTimeout(r)); }
        }
    }
    propPack = { segs: await sw.done(), index, byType, names: [] };
}

// Nạp kiểu tiết kiệm: holder.buf là Uint8Array; được THẢ ngay khi wasm đọc xong.
async function loadIfcHuge(holder, fname, noProps, stripNames) {
  try {
    try { ifcLoader.onIfcStartedLoading.trigger(); } catch (e) {}
    // v2.8: cắt dòng bu lông/mối hàn TẠI CHỖ trong buffer (con trỏ ghi luôn ≤ con trỏ
    // đọc nên không cần cấp phát thêm 1 byte nào) → wasm nhận file đã gọn.
    if (stripNames && stripNames.length && holder.buf) {
        const st = new IfcLineStripper(stripNames);
        const src = holder.buf;
        const STEP2 = 4 * 1048576;
        let wpos = 0;
        for (let off = 0; off < src.length; off += STEP2) {
            const piece = st.feed(src.subarray(off, Math.min(off + STEP2, src.length)));
            if (piece.length) { src.set(piece, wpos); wpos += piece.length; }
            await new Promise(r => setTimeout(r)); // nhả luồng UI giữa các khúc
        }
        const tail = st.finish();
        if (tail.length) { src.set(tail, wpos); wpos += tail.length; }
        holder.buf = src.subarray(0, wpos);
    }
    await ifcLoader.readIfcFile(holder.buf);
    holder.buf = null; // ★ thả bản JS của file — tiết kiệm đúng bằng dung lượng file
    await new Promise(r => setTimeout(r, 50)); // nhường GC
    // v2.8.1: đọc THUỘC TÍNH trước (wasm mới chỉ giữ tape, chưa có hình học) rồi mới
    // dựng hình — hai đỉnh RAM không còn chồng lên nhau.
    // v2.8.3: LUÔN gói bằng streamPackProps. Ở chế độ nhẹ, PSET đã bị cắt khỏi byte stream
    // (STRIP_PROPS) nên pack chỉ còn CẤU KIỆN (tên/mã/thuộc tính trực tiếp) + QUAN HỆ →
    // bảng thuộc tính hiện thông tin cơ bản + chọn cụm chạy, chỉ thiếu pset. (v2.8.2 chỉ gói
    // quan hệ nên panel trống trơn — đó là lỗi.)
    try { $('loading-text').textContent = noProps
        ? ((LANG === 'vi') ? '🔗 Đang đọc cấu kiện & liên kết...' : '🔗 Reading elements & links...')
        : ((LANG === 'vi') ? '📇 Đang đọc kho thuộc tính (nén)...' : '📇 Reading property store (compressed)...'); } catch (e) {}
    const gids = await streamPackProps(ifcLoader.webIfc, ifcLoader.settings.excludedCategories);
    try { $('loading-text').textContent = t('parsing', '', true); } catch (e) {}
    const group = await ifcLoader.getAllGeometries();
    group.name = fname;
    wirePropPack(group);
    fragments.groups.set(group.uuid, group);
    for (const item of group.items) { fragments.list.set(item.id, item); item.mesh.uuid = item.id; item.group = group; }
    fragments.onFragmentsLoaded.trigger(group);
    fragments.coordinate([group]);
    if (gids) for (const [id, gid] of gids) group.globalToExpressIDs.set(gid, id);
    return group;
  } finally {
    try { ifcLoader.cleanUp(); } catch (e) {} // thả heap wasm — CẢ khi lỗi
  }
}


// ═══ CẮT BU LÔNG/MỐI HÀN NGAY TRONG DÒNG BYTE (v2.8 — trước khi wasm phân tích) ══
// Trước đây chế độ ① chỉ BỎ QUA khâu dựng hình — file vẫn nạp NGUYÊN VẸN vào tape wasm.
// Nay cắt hẳn các câu lệnh "#id= IFCMECHANICALFASTENER(...);" / "#id= IFCFASTENER(...);"
// ngay khi đọc: tape nhỏ đi đúng phần cắt, wasm không tốn công phân tích chúng.
// Chỉ cắt DÒNG SẢN PHẨM — hình học chúng tham chiếu thành mồ côi nên không bao giờ được
// dựng tam giác; tham chiếu treo trong các dòng quan hệ vô hại vì không resolve tới.
// Máy trạng thái hiểu chuỗi '...' (dấu ; trong tên không đánh lừa được) và chú thích /* */.
const STRIP_FASTENERS = ['IFCMECHANICALFASTENER', 'IFCFASTENER'];
// v2.8.1: khi người dùng BỎ kho thuộc tính, cắt luôn toàn bộ pset/quantity khỏi luồng
// byte — nhóm này thường chiếm 40–60%% dung lượng file Tekla. An toàn tuyệt đối về
// tham chiếu: sản phẩm KHÔNG trỏ xuôi tới pset (liên kết nằm ở IFCRELDEFINESBYPROPERTIES
// — cũng bị cắt), nên không sinh ra bất kỳ tham chiếu treo nào.
const STRIP_PROPS = ['IFCPROPERTYSET', 'IFCPROPERTYSINGLEVALUE', 'IFCPROPERTYENUMERATEDVALUE',
    'IFCPROPERTYLISTVALUE', 'IFCPROPERTYBOUNDEDVALUE', 'IFCPROPERTYTABLEVALUE', 'IFCCOMPLEXPROPERTY',
    'IFCELEMENTQUANTITY', 'IFCQUANTITYLENGTH', 'IFCQUANTITYAREA', 'IFCQUANTITYVOLUME',
    'IFCQUANTITYWEIGHT', 'IFCQUANTITYCOUNT', 'IFCQUANTITYTIME', 'IFCPHYSICALCOMPLEXQUANTITY',
    'IFCRELDEFINESBYPROPERTIES'];
class IfcLineStripper {
    constructor(names) {
        this.names = names.map((s) => s.toUpperCase());
        this.mode = 0;   // 0 = đầu câu (gom để phân loại) · 1 = chép · 2 = cắt
        this.pend = [];  // byte đầu câu đang chờ phân loại
        this.q = false;  // trong chuỗi '...'
        this.cm = false; // trong chú thích /* ... */
        this.prev = 0;   // byte liền trước (bền qua ranh giới khúc — bắt được '/*' và '*/' bị cắt đôi)
        this.out = new Uint8Array(1 << 20);
        this.dropped = 0;
    }
    _grow(n) { if (n > this.out.length) this.out = new Uint8Array(Math.max(n, this.out.length * 2)); }
    _classify() { // pend = "...#123= TÊN(" → true nếu TÊN thuộc danh sách cắt
        const p = this.pend;
        let i = p.length - 2;                    // bỏ '(' cuối
        while (i >= 0 && (p[i] === 32 || p[i] === 9)) i--;
        const e = i;
        while (i >= 0) { const c = p[i]; if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 95) i--; else break; }
        if (e <= i) return false;
        return this.names.includes(String.fromCharCode.apply(null, p.slice(i + 1, e + 1)).toUpperCase());
    }
    feed(u8) {
        const n = u8.length;
        this._grow(this.pend.length + n);
        let w = 0;
        const out = this.out;
        for (let r = 0; r < n; r++) {
            const c = u8[r];
            if (this.cm) { // trong chú thích: chép/gom y nguyên, chỉ canh '*/'
                if (this.prev === 42 && c === 47) this.cm = false;
                if (this.mode === 1) out[w++] = c; else if (this.mode === 0) this.pend.push(c);
                this.prev = c;
                continue;
            }
            if (this.q) { if (c === 39) this.q = false; }
            else if (c === 39) this.q = true;
            else if (this.prev === 47 && c === 42) this.cm = true;
            this.prev = c;
            if (this.mode === 0) {
                this.pend.push(c);
                if (!this.q && !this.cm && c === 40) {            // gặp '(' — đủ dữ kiện
                    if (this._classify()) { this.mode = 2; this.dropped++; this.pend.length = 0; }
                    else { for (let k = 0; k < this.pend.length; k++) out[w++] = this.pend[k]; this.pend.length = 0; this.mode = 1; }
                } else if (!this.q && c === 59) {                 // ';' trước '(' (ISO-10303-21; DATA; ...) → chép
                    for (let k = 0; k < this.pend.length; k++) out[w++] = this.pend[k];
                    this.pend.length = 0;                          // mode giữ 0 — câu mới
                } else if (this.pend.length > 4096) {              // van an toàn: đầu câu dài bất thường → chép
                    for (let k = 0; k < this.pend.length; k++) out[w++] = this.pend[k];
                    this.pend.length = 0; this.mode = 1;
                }
            } else if (this.mode === 1) {
                out[w++] = c;
                if (!this.q && c === 59) this.mode = 0;
            } else { // mode 2 — đang cắt
                if (!this.q && c === 59) { this.mode = 0; out[w++] = 10; } // giữ 1 xuống dòng cho sạch
            }
        }
        return out.subarray(0, w);
    }
    finish() { // file kết thúc giữa câu chưa phân loại → trả nốt phần đang gom
        if (this.mode === 0 && this.pend.length) { const b = Uint8Array.from(this.pend); this.pend.length = 0; return b; }
        return new Uint8Array(0);
    }
}

// ═══ NẠP TỪ Ổ ĐĨA — KHÔNG BẢN SAO JS (APK v2.7+) ═════════════════════════════
const DISK_OK = !!(window.AndroidIFC && typeof AndroidIFC.readFileChunkB64 === 'function');

async function openIfcFromDisk(f, fname, noProps, stripNames) {
    const A = window.AndroidIFC;
    let CH = 4 * 1048576;
    try { if (A.maxChunk) CH = Math.min(CH, A.maxChunk() || CH); } catch (e) {}
    let total = f.size;
    try { total = Number(A.fileSize(f.uri)) || f.size; } catch (e) {}

    // v2.8: khi cắt bu lông, số byte TRẢ CHO ENGINE ít hơn số byte ĐỌC TỪ FILE →
    // offset engine yêu cầu không còn trùng offset file. Tách 2 con trỏ: readTo (đọc
    // file, tuần tự) và served (đã trả engine). Engine đọc tuần tự; nếu có ngày nó
    // yêu cầu lệch, guard bên dưới báo lỗi rõ ràng thay vì trả dữ liệu sai.
    const strip = (stripNames && stripNames.length) ? new IfcLineStripper(stripNames) : null;
    let scratch = new Uint8Array(CH);
    const EMPTY = new Uint8Array(0);
    let readTo = 0, failAt = -1, failMsg = '', served = 0, ended = false, carry = null;

    const readChunk = () => { // đọc khúc file KẾ TIẾP qua cầu nối → view trên scratch
        if (total && readTo >= total) return EMPTY;
        const want = total ? Math.min(CH, total - readTo) : CH;
        let b64;
        try { b64 = A.readFileChunkB64(f.uri, String(readTo), want); }
        catch (e) { failAt = readTo; failMsg = String(e); return EMPTY; }
        if (!b64) { if (total && readTo < total) { failAt = readTo; failMsg = 'cầu nối trả rỗng'; } return EMPTY; }
        let bin;
        try { bin = atob(b64); } catch (e) { failAt = readTo; failMsg = 'base64 hỏng'; return EMPTY; }
        const n = bin.length;
        if (n > scratch.length) scratch = new Uint8Array(n);
        const out = scratch;
        for (let i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
        readTo += n;
        return out.subarray(0, n);
    };

    const cb = (offset, size) => {
        if (offset !== served) { failAt = offset; failMsg = 'engine đọc không tuần tự (' + offset + ' ≠ ' + served + ')'; return EMPTY; }
        for (;;) {
            let outb;
            if (carry) { outb = carry; carry = null; }
            else if (ended) { return EMPTY; }
            else {
                const raw = readChunk();
                if (!raw.length) {
                    ended = true;
                    outb = strip ? strip.finish() : EMPTY;
                    if (!outb.length) return EMPTY;
                } else {
                    outb = strip ? strip.feed(raw) : raw;
                    if (!outb.length) continue; // cả khúc bị cắt sạch (vùng toàn bu lông) → đọc tiếp
                }
            }
            if (size > 0 && outb.length > size) { carry = outb.subarray(size); outb = outb.subarray(0, size); }
            served += outb.length;
            return outb;
        }
    };

    try { ifcLoader.onIfcStartedLoading.trigger(); } catch (e) {}
    const w = ifcLoader.webIfc;
    const ws = ifcLoader.settings.wasm;
    w.SetWasmPath(ws.path, ws.absolute);
    await w.Init(ifcLoader.settings.customLocateFileHandler || undefined);
    if (ws.logLevel) w.SetLogLevel(ws.logLevel);

    let group = null;
    try {
        const id = w.OpenModelFromCallback(cb, { ...ifcLoader.settings.webIfc, TAPE_SIZE: CH });
        scratch = null;
        try { A.closeStream && A.closeStream(); } catch (e) {}
        if (failAt >= 0) throw new Error('đọc đứt tại ' + formatBytes(failAt) + '/' + formatBytes(total) + ' (' + failMsg + ')');
        if (id !== 0) throw new Error('model id = ' + id);
        if (total && readTo < total - 4096) throw new Error('mới đọc ' + formatBytes(readTo) + '/' + formatBytes(total));

        // v2.8.3: thuộc tính TRƯỚC (chỉ có tape trong wasm) → hình học SAU. Chế độ nhẹ:
        // pset đã cắt khỏi bytes nên streamPackProps chỉ gói cấu kiện + quan hệ (panel + cụm sống).
        try { $('loading-text').textContent = noProps
            ? ((LANG === 'vi') ? '🔗 Đang đọc cấu kiện & liên kết...' : '🔗 Reading elements & links...')
            : ((LANG === 'vi') ? '📇 Đang đọc kho thuộc tính (nén)...' : '📇 Reading property store (compressed)...'); } catch (e) {}
        const gids = await streamPackProps(w, ifcLoader.settings.excludedCategories);
        try { $('loading-text').textContent = t('parsing', '', true); } catch (e) {}
        group = await ifcLoader.getAllGeometries();
        group.name = fname;
        wirePropPack(group);
        fragments.groups.set(group.uuid, group);
        for (const item of group.items) { fragments.list.set(item.id, item); item.mesh.uuid = item.id; item.group = group; }
        fragments.onFragmentsLoaded.trigger(group);
        fragments.coordinate([group]);
        if (gids) for (const [eid, gid] of gids) group.globalToExpressIDs.set(gid, eid);
        return group;
    } finally {
        scratch = null;
        try { A.closeStream && A.closeStream(); } catch (e) {}
        try { ifcLoader.cleanUp(); } catch (e) {}
        await new Promise(r => setTimeout(r, 250));
    }
}

function diskHead(uri, n) {
    try {
        const b64 = AndroidIFC.readFileChunkB64(uri, '0', n);
        if (!b64) return '';
        const bin = atob(b64);
        let s = '';
        for (let i = 0; i < bin.length; i++) s += bin[i];
        return s;
    } catch (e) { return ''; }
}

// ═══ MỞ FILE NẶNG (điện thoại) ═══════════════════════════════════════════════
// File ≥45MB: hỏi ngay (KHÔNG quét file — từng gây chết WebView với file 200MB vì
// giải mã chuỗi lớn trên luồng UI khi RAM đã căng). Chỉ 2 lựa chọn:
// Mở đầy đủ / Ẩn bu lông & mối hàn (cặp đã kiểm chứng giúp mở được file lớn).
// Mở đầy đủ thất bại (lỗi bắt được) → tự thử lại với chế độ ẩn.
const DEV_GB = (navigator.deviceMemory || 4);
const HEAVY_MB = DEV_GB <= 3 ? 25 : 45;
const HUGE_MB  = DEV_GB <= 3 ? 60 : 120;

function applyHeavyLevel(lv) {
    ifcLoader.settings.excludedCategories.clear();
    ifcLoader.settings.excludedCategories.add(WEBIFC.IFCOPENINGELEMENT);
    ifcLoader.settings.excludedCategories.add(WEBIFC.IFCSPACE);
    if (lv > 0) {
        ifcLoader.settings.excludedCategories.add(WEBIFC.IFCMECHANICALFASTENER);
        ifcLoader.settings.excludedCategories.add(WEBIFC.IFCFASTENER);
    }
    ifcLoader.settings.webIfc.CIRCLE_SEGMENTS = lv > 0 ? 6 : 10; // v2.8.1: mức ① luôn dùng 6 cạnh/vòng tròn — lỗ khoét & ống nhẹ hẳn
}

// Hộp thoại chọn cách mở — trả Promise<0|1>
function chooseHeavyLevel(mb, crashedBefore) {
    return new Promise((resolve) => {
        const iVi = (LANG === 'vi');
        $('heavy-title').textContent = iVi ? '⚙️ File ' + mb.toFixed(0) + ' MB — chọn cách mở' : '⚙️ ' + mb.toFixed(0) + ' MB file — choose how to open';
        let sub = iVi
            ? 'File lớn dễ làm điện thoại cạn RAM. Chế độ ① CẮT HẲN dữ liệu bu lông & mối hàn ngay khi đọc file — nhẹ hơn nhiều lần, dầm, cột, bản mã luôn giữ đủ. Nếu mở đầy đủ thất bại, app tự thử lại với chế độ ①.'
            : 'Large files can exhaust phone RAM. Mode ① STRIPS bolt & weld data right at read time — much lighter, all framing and plates are kept. If full open fails, the app auto-retries with mode ①.';
        if (mb >= HUGE_MB) {
            sub += iVi
                ? '\n\n⚠️ File cỡ này điện thoại RẤT khó mở trực tiếp. Cách chắc ăn: mở trên BẢN MÁY TÍNH rồi bấm "💾 Xuất bản nhẹ (.ifclite)" — điện thoại mở gói đó nhẹ hơn nhiều lần.'
                : '\n\n⚠️ Files this size are VERY hard to open directly on a phone. Best path: open on the PC build and export a ".ifclite" lite bundle — the phone opens it many times lighter.';
        }
        if (crashedBefore) {
            sub += iVi
                ? '\n\n🛟 LẦN TRƯỚC app bị thoát giữa chừng với chính file này. Hãy chọn ① và GIỮ dấu tích "Bỏ kho thuộc tính" — mở được rồi thì lần sau thử bỏ tích để có thuộc tính.'
                : '\n\n🛟 LAST TIME the app was killed mid-parse on this very file. Pick ① and KEEP "Drop property store" ticked — once it opens, retry unticked to get properties.';
        }
        $('heavy-sub').textContent = sub;
        $('heavy-0').textContent = iVi ? '🔓 Mở ĐẦY ĐỦ (có thể treo máy)' : '🔓 Open FULL (may freeze)';
        $('heavy-1').textContent = iVi ? '① Ẩn bu lông & mối hàn — chế độ tiết kiệm RAM (khuyên dùng)' : '① Hide bolts & welds — RAM-saver mode (recommended)';
        $('lbl-heavy-noprops').textContent = iVi
            ? 'Bỏ kho thuộc tính (nhẹ RAM nhất — không tra tên/mã; VẪN chọn được cụm)'
            : 'Drop property store (lightest — no name lookup; assembly select still works)';
        $('heavy-noprops').checked = !!crashedBefore || mb >= 60; // v2.8.1: mặc định bỏ kho thuộc tính sớm hơn (60MB) — mở được rồi mới thử lại có thuộc tính
        $('heavy-panel').classList.add('show');
        $('heavy-backdrop').classList.add('show');
        const done = (lv) => {
            $('heavy-panel').classList.remove('show');
            $('heavy-backdrop').classList.remove('show');
            $('heavy-0').onclick = null; $('heavy-1').onclick = null;
            resolve({ lv, noProps: $('heavy-noprops').checked });
        };
        $('heavy-0').onclick = () => done(0);
        $('heavy-1').onclick = () => done(1);
    });
}

// ═══ MỞ FILE ═════════════════════════════════════════════════════════════════
// Nhận File HOẶC ArrayBuffer (kèm tên hiển thị) — giữ nguyên giao kèo với khối quét file.
async function loadIfcFile(file, displayName) {
    const isDisk   = !!(file && file.__disk);
    const isBuffer = (file instanceof ArrayBuffer);
    const fname = displayName || (isDisk ? file.name : (isBuffer ? 'Mô hình IFC' : file.name));
    $('welcome').classList.add('hidden');
    $('file-name').textContent = fname;
    const loading = $('loading');
    const loadingText = $('loading-text');
    loadingText.textContent = t('reading');
    loading.classList.add('show');

    try {
        const diskSrc = isDisk ? file : null;
        let buffer = isDisk ? null : (isBuffer ? file : await file.arrayBuffer());
        file = null;

        const mb = (isDisk ? diskSrc.size : buffer.byteLength) / 1048576;
        const lite = $('lite-mode-cb').checked;
        // v2.8.1: cờ "đang mở dở" ghi vào localStorage TRƯỚC khi phân tích. Nếu Android
        // giết app giữa chừng (không có lỗi nào bắt được), cờ còn nguyên → lần mở sau
        // cùng file này sẽ cảnh báo và mặc định chế độ nhẹ nhất.
        let crashedBefore = false;
        try { crashedBefore = !IS_PC && localStorage.getItem('ifc_inflight') === fname; } catch (e) {}
        try { if (!IS_PC) localStorage.setItem('ifc_inflight', fname); } catch (e) {}

        // ── GÓI NHẸ .ifclite? (6 byte đầu = 'IFCL1\n') — nạp thẳng, khỏi parse IFC ──
        const head6 = isDisk
            ? diskHead(diskSrc.uri, 6)
            : new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(6, buffer.byteLength)));
        if (isDisk && head6 === IFCLITE_MAGIC) {
            buffer = await fetchLocalFile(diskSrc);
        }
        let model;
        let liteBundle = false;
        let skipPack = false;
        let liteEffective = false;
        let heavyAsked = false, heavyLevel = 0;
        if (head6 === IFCLITE_MAGIC) {
            liteBundle = true;
            loadingText.textContent = (LANG === 'vi')
                ? '📦 Đang mở gói nhẹ ' + mb.toFixed(0) + ' MB (không cần phân tích IFC)...'
                : '📦 Opening lite bundle ' + mb.toFixed(0) + ' MB (no IFC parsing)...';
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            disposeCurrentModel();
            const pk = await parseIfcLite(buffer);
            buffer = null;
            model = fragments.load(pk.frag, { coordinate: true, name: pk.name || fname });
            // Khôi phục kho thuộc tính đã nén — KHÔNG JSON.parse chuỗi khổng lồ
            const index = new Map(), byType = new Map();
            for (const [id, pos, len] of pk.meta.index) index.set(id, [0, pos, len]);
            for (const [ty2, ids] of pk.meta.byType) byType.set(ty2, ids);
            const names = pk.meta.names.map(([id, nm, tg]) => ({ id, nm, tg }));
            propPack = { segs: [pk.text], index, byType, names };
            wirePropPack(model);
        } else {
        // ── FILE NẶNG trên điện thoại: hỏi ngay (không quét file — an toàn RAM) ──
        heavyAsked = false;
        heavyLevel = 0; // 0 đầy đủ · 1 ẩn bu lông & mối hàn (đường tiết kiệm RAM)
        let hugeNoProps = false;
        if (!IS_PC && mb >= HEAVY_MB) {
            heavyAsked = true;
            // ★ SỬA LỖI CHẾT (v2.8): overlay loading (z-index 70) nằm ĐÈ lên hộp thoại
            // (z61 cũ) và nuốt mọi cú chạm → không thể bấm chọn, app đứng im vĩnh viễn
            // ở "Đang đọc file...". Tắt overlay khi hỏi, bật lại sau khi chọn xong.
            loading.classList.remove('show');
            const pick = await chooseHeavyLevel(mb, crashedBefore);
            loading.classList.add('show');
            loadingText.textContent = t('reading');
            heavyLevel = pick.lv;
            hugeNoProps = pick.noProps;
        }

        // Đặt loại trừ: theo mức đã chọn, hoặc theo chế độ nhẹ như cũ
        if (heavyAsked && heavyLevel > 0) {
            applyHeavyLevel(heavyLevel);
        } else {
            ifcLoader.settings.excludedCategories.clear();
            // LUÔN loại 2 loại "hình học vô hình": lỗ khoét (opening) và không gian phòng (space).
            // Chúng không hiển thị nhưng vẫn bị parse thành lưới tam giác → tốn thời gian + RAM vô ích.
            ifcLoader.settings.excludedCategories.add(WEBIFC.IFCOPENINGELEMENT);
            ifcLoader.settings.excludedCategories.add(WEBIFC.IFCSPACE);
            if (lite) {
                // TUYỆT ĐỐI KHÔNG ẩn IFCDISCRETEACCESSORY: Tekla nhét DẦM, CỘT, KÈO, BẢN MÃ vào loại này.
                // PC: chế độ nhẹ CHỈ ẩn mối hàn — bu lông luôn hiện. Điện thoại: ẩn cả bu lông + mối hàn.
                ifcLoader.settings.excludedCategories.add(WEBIFC.IFCFASTENER);
                if (!IS_PC) ifcLoader.settings.excludedCategories.add(WEBIFC.IFCMECHANICALFASTENER);
            }
            ifcLoader.settings.webIfc.CIRCLE_SEGMENTS = lite ? 8 : 10;
        }
        liteEffective = lite || heavyLevel > 0;
        loadingText.textContent = t('parsing', mb >= 1 ? mb.toFixed(0) : '', liteEffective);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // Dọn mô hình cũ
        disposeCurrentModel();

        const holder = { buf: buffer ? new Uint8Array(buffer) : null };
        buffer = null;
        const useDisk = isDisk && !holder.buf;
        let hugeTried = false; // đường tiết kiệm lỗi sớm (file còn nguyên) → rơi về đường chuẩn
        // Vòng leo thang: mở thất bại (lỗi bắt được) → tự thử mức kế tiếp
        for (;;) {
            const parseWatch = setTimeout(async () => {
                let diag = t('mtStuck');
                try {
                    if (IS_PC && MT_ON) {
                        const r = await fetch('./libs/web-ifc/web-ifc-mt.js', { method: 'HEAD', cache: 'no-store' });
                        if (!r.ok) diag = '⚠️ THIẾU file libs/web-ifc/web-ifc-mt.js (HTTP ' + r.status + ') — anh đang chạy lẫn file bản cũ. Hãy XÓA HẲN thư mục cũ, giải nén lại bản mới rồi chạy lại.';
                    }
                } catch (e) {}
                loadingText.textContent = diag;
            }, 45000);
            try {
                if (useDisk) {
                    const npDisk = hugeNoProps || mb >= HUGE_MB;
                    const stripD = [...(heavyLevel > 0 ? STRIP_FASTENERS : []), ...(npDisk ? STRIP_PROPS : [])];
                    model = await openIfcFromDisk(diskSrc, fname, npDisk, stripD.length ? stripD : null);
                    skipPack = true;
                } else if (!IS_PC && heavyLevel === 1 && !hugeTried) {
                    const stripH = [...STRIP_FASTENERS, ...(hugeNoProps ? STRIP_PROPS : [])];
                    model = await loadIfcHuge(holder, fname, hugeNoProps, stripH); // đường tiết kiệm RAM
                    skipPack = true;
                } else {
                    model = await ifcLoader.load(holder.buf, true, fname);
                }
                break;
            } catch (err) {
                console.warn('load lỗi ở mức', heavyLevel, ':', err);
                try { ifcLoader.cleanUp(); } catch (e2) {}
                await new Promise(r => setTimeout(r, 250));
                if (!IS_PC && heavyLevel === 1 && !hugeTried && holder.buf) {
                    // đường tiết kiệm hỏng NGAY từ đầu (API lệch?) — file còn nguyên → dùng đường chuẩn
                    hugeTried = true;
                    console.warn('rơi về đường nạp chuẩn');
                    continue;
                }
                if (!IS_PC && heavyLevel < 1) {
                    heavyLevel = 1;
                    applyHeavyLevel(1);
                    const msg = (LANG === 'vi')
                        ? '⚠️ Mở đầy đủ thất bại — tự thử lại: ẩn bu lông & mối hàn'
                        : '⚠️ Full open failed — auto-retrying with bolts & welds hidden';
                    toast(msg, 5200);
                    loadingText.textContent = msg;
                    await new Promise(r => setTimeout(r, 350));
                    continue;
                }
                throw err;
            } finally { clearTimeout(parseWatch); }
        }
        holder.buf = null; // thả bản JS (đường tiết kiệm đã tự thả từ sớm)
        } // hết nhánh IFC thường (else của .ifclite)
        currentModel = model;
        indexed = false;
        world.scene.three.add(model);
        for (const frag of model.items) world.meshes.add(frag.mesh); // đăng ký cho raycaster
        // Mô hình tĩnh: tính ma trận thế giới MỘT LẦN rồi đóng băng — three.js khỏi
        // recompose hàng nghìn Object3D mỗi khung hình (model nhiều khối hình đỡ hẳn CPU).
        model.updateMatrixWorld(true);
        model.traverse((o) => { o.matrixAutoUpdate = false; });
        if (!liteBundle && !skipPack) await packProperties(model); // (.ifclite & đường tiết kiệm đã tự lo)
        // LƯU Ý: KHÔNG thả bản CPU của thuộc tính normal (từng thử) — Raycaster của
        // three r160 đọc normal.array khi tính giao cắt, thả đi là mất chọn cấu kiện.
        autoAdaptResolution(model); // mô hình nặng → tự hạ độ nét cho mượt (trừ khi đã chỉnh tay)

        // Khung bao mô hình → fit camera + dải mặt cắt
        boxer.reset();
        boxer.add(model);
        modelBox = boxer.get().clone();
        boxer.reset();
        fitView(true);
        $('zoom-btns').classList.add('show');

        try { if (!IS_PC) localStorage.removeItem('ifc_inflight'); } catch (e) {} // mở trọn vẹn → xóa cờ
        loading.classList.remove('show');
        const nFrag = model.items.length;
        const nItems = model.data ? model.data.size : 0;
        toast(t(IS_PC ? 'loadedPC' : 'loaded', nItems.toLocaleString(LANG), nFrag.toLocaleString(LANG), liteEffective), 3800);
    } catch (err) {
        try { if (!IS_PC) localStorage.removeItem('ifc_inflight'); } catch (e2) {} // lỗi ĐƯỢC BẮT → app còn sống → xóa cờ
        console.error(err);
        let msg = (err && err.message) ? String(err.message).slice(0, 140) : t('errUnknown');
        if (/memory|allocat|abort|out of/i.test(msg)) {
            msg = t('errOOM');
        }
        loadingText.textContent = t('errOpen') + msg;
        setTimeout(() => loading.classList.remove('show'), 6000);
        if (!currentModel) $('welcome').classList.remove('hidden');
    }
}

function disposeCurrentModel() {
    clearSelection();
    clearAllMeasurements();
    clearSearchHL();
    for (const g of edgeGeoCache.values()) { try { g.dispose(); } catch (e) {} }
    edgeGeoCache.clear();
    isolated = false;
    isolatedBox = null;
    nameIndex = null;
    dimmedByFrag = null;
    $('search-result').textContent = '';
    if (sectionOn) toggleSection(false);
    if (!currentModel) return;
    try {
        // VÁ RÒ RỈ: indexer giữ bản đồ quan hệ của mô hình cũ theo uuid mãi mãi —
        // đổi file nhiều lần là RAM chồng chất. Xóa thủ công trước khi hủy mô hình.
        try { delete indexer.relationMaps[currentModel.uuid]; } catch (e) {}
        propPack = null; // thả kho thuộc tính nén của mô hình cũ
        segCache.clear();
        for (const frag of currentModel.items) world.meshes.delete(frag.mesh);
        world.scene.three.remove(currentModel);
        fragments.disposeGroup(currentModel);
    } catch (e) { console.warn('dispose:', e); }
    currentModel = null;
    indexed = false;
}

// ═══ CAMERA ═════════════════════════════════════════════════════════════════
function fitView(instant) {
    if (!currentModel) return;
    const box = activeBox();
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    if (!isFinite(sphere.radius) || sphere.radius <= 0) return;
    if (isolated && isolatedBox) {
        // khi cô lập: lề rộng hơn chút + khóa tâm quay vào chi tiết → xoay/zoom như vật độc lập
        sphere.radius = Math.max(sphere.radius * 1.1, 0.2);
        try { world.camera.controls.setOrbitPoint(sphere.center.x, sphere.center.y, sphere.center.z); } catch (e) {}
    }
    world.camera.controls.fitToSphere(sphere, !instant);
}
$('btn-fit').onclick = () => fitView(false);

// ═══ NÚT ZOOM TINH CHỈNH — 2 CHẾ ĐỘ: NHANH ⚡ / CHUẨN XÁC 🎯 ════════════════
// Mỗi bước chỉ tiến một phần quãng đường tới mục tiêu → tiệm cận dần, KHÔNG bay
// xuyên qua điểm cần xem. Chế độ NHANH bước lớn + lặp dày; CHUẨN XÁC bước nhỏ + lặp thưa.
const ZOOM_PROFILE = {
    fast:    { in: 0.34, out: 0.42, ms: 90 },   // nhảy xa, tới nơi nhanh
    precise: { in: 0.07, out: 0.09, ms: 150 },  // nhích từng chút, soi chi tiết
};
let zoomFast = false;
try { zoomFast = localStorage.getItem('ifc_zoomfast') === '1'; } catch (e) {}
function applyZoomMode() {
    const btn = $('btn-zoom-mode');
    btn.textContent = zoomFast ? '⚡' : '🎯';
    btn.classList.toggle('fast', zoomFast);
}
applyZoomMode();
$('btn-zoom-mode').onclick = () => {
    zoomFast = !zoomFast;
    try { localStorage.setItem('ifc_zoomfast', zoomFast ? '1' : '0'); } catch (e) {}
    applyZoomMode();
    toast(t(zoomFast ? 'zoomModeFast' : 'zoomModePrecise'), 1800);
    if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
};

function holdRepeat(el, fn) {
    let iv = null;
    const stop = () => { if (iv) { clearInterval(iv); iv = null; } };
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        fn(); stop(); iv = setInterval(fn, ZOOM_PROFILE[zoomFast ? 'fast' : 'precise'].ms);
    }, true);
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, stop, true);
}
holdRepeat($('btn-zoom-in'), () => {
    if (!currentModel) return;
    const c = world.camera.controls, p = ZOOM_PROFILE[zoomFast ? 'fast' : 'precise'];
    c.dolly(Math.max(c.distance * p.in, 0.01), true);
});
holdRepeat($('btn-zoom-out'), () => {
    if (!currentModel) return;
    const c = world.camera.controls, p = ZOOM_PROFILE[zoomFast ? 'fast' : 'precise'];
    c.dolly(-Math.max(c.distance * p.out, 0.01), true);
});

// ═══ CHỌN CẤU KIỆN (tap) ════════════════════════════════════════════════════
// LƯU Ý MOBILE: raycaster của engine chỉ cập nhật vị trí qua sự kiện 'pointermove',
// mà một cú chạm sạch trên cảm ứng KHÔNG sinh pointermove → sẽ bắn tia ở vị trí cũ.
// Shim: phát pointermove "giả" đúng tọa độ chạm ngay trước khi bắn tia.
function syncPointer(e) {
    world.renderer.three.domElement.dispatchEvent(new PointerEvent('pointermove', {
        clientX: e.clientX, clientY: e.clientY, bubbles: true,
    }));
}
let pd = null;
container.addEventListener('pointerdown', (e) => {
    // Ngón thứ 2+ chạm xuống (pinch/xoay 2 ngón): CHỈ đếm thêm, KHÔNG ghi đè pd.
    // Trước đây pd bị ghi đè → cú pinch nhanh (2 ngón chạm-nhả gọn) lọt qua bộ lọc
    // "moved > 9 || dt > 450" và bị nhận nhầm thành tap chọn cấu kiện.
    // Chốt an toàn: pd cũ quá 1,5s tức pointerup/cancel của nó đã bị nuốt → coi như chạm mới.
    if (pd && performance.now() - pd.t < 1500) { pd.n++; return; }
    pd = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, n: 1 };
    $('views-pop').classList.remove('show');
    $('settings-pop').classList.remove('show');
}, true);
// WebView chiếm quyền cử chỉ (pinch-zoom hệ thống, cuộn...) sẽ phát pointercancel
// thay vì pointerup → phải xóa pd, không thì trạng thái chạm kẹt vĩnh viễn.
container.addEventListener('pointercancel', () => { pd = null; }, true);
container.addEventListener('pointerup', async (e) => {
    if (!pd || e.pointerId !== pd.id) { return; }
    const moved = Math.hypot(e.clientX - pd.x, e.clientY - pd.y);
    const dt = performance.now() - pd.t;
    const multi = pd.n > 1; // có lúc nào 2 ngón cùng chạm không?
    pd = null;
    if (multi || moved > 9 || dt > 450) return; // là kéo/xoay/pinch, không phải tap
    // KHÓA: nếu lần chọn trước CHƯA xử lý xong (file lớn còn đang tô màu/đọc thuộc tính),
    // bỏ qua cú chạm này. Không có khóa thì 2 lần chọn chồng nhau, đụng độ chỉ mục/màu của
    // engine → trạng thái hỏng và "không chọn được gì nữa". Đây là nguyên nhân chính.
    if (selecting) return;
    selecting = true;
    try {
        syncPointer(e);
        if (facePick) { await pickFaceTap(); }        // đang chọn MẶT (đo điểm–mặt / đặt mặt cắt)
        else if (measureMode) { await addMeasurePoint(); }
        else { await tapSelect(); }
    } finally {
        selecting = false; // mở khóa → lần chạm SAU chọn được bình thường
    }
}, true);

async function ensureIndexed(msgKey) {
    if (indexed || !currentModel) return;
    if (indexingPromise) { await indexingPromise; return; } // đã có lần index đang chạy → đợi chung, KHÔNG chạy lại
    toast(t(msgKey || 'indexing'), 5000);
    indexingPromise = (async () => {
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await indexer.process(currentModel);
        indexed = true;
    })();
    try { await indexingPromise; } finally { indexingPromise = null; }
}

// Đi lên cụm cha cao nhất (IfcElementAssembly...) rồi gom toàn bộ con cháu
function topAssemblyOf(id) {
    let top = id;
    for (let k = 0; k < 5; k++) {
        const par = indexer.getEntityRelations(currentModel, top, 'Decomposes');
        if (par && par.length) top = par[0]; else break;
    }
    return top;
}
function collectDescendants(rootID) {
    const out = new Set([rootID]);
    const queue = [rootID];
    while (queue.length) {
        const cur = queue.pop();
        const kids = indexer.getEntityRelations(currentModel, cur, 'IsDecomposedBy') || [];
        for (const k of kids) if (!out.has(k)) { out.add(k); queue.push(k); }
        if (out.size > 5000) break; // chốt an toàn
    }
    return [...out];
}

// ═══ KHUNG BAO LỰA CHỌN (thay cho tô màu — nhẹ tênh dù cụm cả nghìn chi tiết) ══
// Trước đây chọn cụm phải ghi instanceColor của HÀNG NGHÌN chi tiết trên nhiều khối
// hình → mỗi khối nạp lại buffer màu lên GPU → "đơ". Giờ chỉ vẽ 12 cạnh của khung bao
// (AABB) quanh lựa chọn: tốn vài đường line, KHÔNG đụng tới màu/GPU buffer của mô hình.
let selSphere = null;
function makeBoxOutline(box, colorHex) {
    const mn = box.min, mx = box.max;
    const v = [
        [mn.x, mn.y, mn.z], [mx.x, mn.y, mn.z], [mx.x, mx.y, mn.z], [mn.x, mx.y, mn.z],
        [mn.x, mn.y, mx.z], [mx.x, mn.y, mx.z], [mx.x, mx.y, mx.z], [mn.x, mx.y, mx.z],
    ];
    const E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    const pts = [];
    for (const [a, b] of E) pts.push(new THREE.Vector3(...v[a]), new THREE.Vector3(...v[b]));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(colorHex), depthTest: false, transparent: true });
    const seg = new THREE.LineSegments(geo, mat);
    seg.renderOrder = 997;       // vẽ sau cùng → luôn thấy viền dù nằm sau khối khác
    seg.frustumCulled = false;
    return seg;
}
function disposeSelBox() {
    if (selBox) {
        world.scene.three.remove(selBox);
        try { selBox.geometry?.dispose(); selBox.material?.dispose(); } catch (e) {}
        selBox = null;
    }
    if (selHL) { world.scene.three.remove(selHL); selHL = null; } // viền vàng lựa chọn
}
let selHL = null; // THREE.Group: viền vàng của lựa chọn hiện tại (kiểu Tekla)
// Viền vàng quanh lựa chọn (thay khung hộp bao) + khóa tâm quay vào đó
function showSelectionBox(map) {
    disposeSelBox();
    selSphere = null;
    if (!map || !Object.keys(map).length) return;
    try {
        // Viền vàng theo ĐÚNG HÌNH DÁNG từng chi tiết trong lựa chọn (như Tekla)
        const ids = new Set();
        for (const key in map) for (const id of map[key]) ids.add(id);
        const { group } = buildOutlineGroup(ids);
        if (group.children.length) { selHL = group; world.scene.three.add(group); }
        // Vẫn tính khung bao (CPU) để khóa tâm quay + nút Zoom tới lựa chọn
        boxer.reset();
        boxer.addFragmentIdMap(map);   // chỉ tính AABB trên CPU — không nạp gì lên GPU
        const box = boxer.get().clone();
        boxer.reset();
        if (!isFinite(box.min.x) || box.isEmpty()) return;
        const sp = box.getBoundingSphere(new THREE.Sphere());
        if (isFinite(sp.radius) && sp.radius > 0) {
            selSphere = sp;
            world.camera.controls.setOrbitPoint(sp.center.x, sp.center.y, sp.center.z);
        }
    } catch (e) { console.warn('selbox:', e); }
}

async function tapSelect() {
    if (!currentModel) return;
    try {
        // Bắn tia LẤY chi tiết bị chạm — KHÔNG tô màu (caster này chính là raycaster engine dùng)
        const hit = caster.castRay();
        if (!hit || !hit.object) { clearSelection(); return; }
        const frag = hit.object.fragment;
        if (!frag || hit.instanceId == null) { clearSelection(); return; }
        let id = frag.getItemID(hit.instanceId);
        if (id == null) { clearSelection(); return; }

        let map; // fragment-map của lựa chọn (phục vụ Ẩn / Cô lập / Zoom)
        // Chế độ CỤM: nâng lựa chọn lên cả tổ hợp chứa chi tiết vừa chạm
        if (selMode === 'assembly') {
            await ensureIndexed('indexingAsm');
            const top = topAssemblyOf(id);
            if (top !== id) {
                // Chạm lại đúng cụm đang chọn → khỏi dựng lại khung
                if (top === lastAsmTop && selectedID === top && currentSelMap) return;
                map = currentModel.getFragmentMap(collectDescendants(top));
                id = top;
                lastAsmTop = top;
            } else {
                lastAsmTop = null;
                map = currentModel.getFragmentMap([id]);
                toast(t('noAsm'), 2200);
            }
        } else {
            lastAsmTop = null;
            map = currentModel.getFragmentMap([id]);
        }

        currentSelMap = (map && Object.keys(map).length) ? map : null;
        selectedID = id;
        showSelectionBox(currentSelMap); // khung bao thay cho tô màu

        const attrs = await currentModel.getProperties(id).catch(() => null);
        const typeName = (attrs && OBC.IfcCategoryMap[attrs.type]) || '';
        const name = (attrs && attrs.Name && attrs.Name.value) || typeName || ('#' + id);
        $('sel-name').textContent = name;
        $('sel-chip').classList.add('show');
    } catch (e) { console.warn('select:', e); }
}
$('chip-zoomsel').onclick = () => {
    if (!selSphere) return;
    const sp = selSphere.clone();
    sp.radius = Math.max(sp.radius * 1.15, 0.25); // chừa lề, không dí sát quá
    world.camera.controls.fitToSphere(sp, true);
};

function clearSelection() {
    selectedID = null;
    selSphere = null;
    lastAsmTop = null;
    currentSelMap = null;
    disposeSelBox();                          // gỡ khung bao lựa chọn
    try { highlighter.clear('select'); } catch (e) {} // an toàn: phòng khi còn sót màu cũ
    // Tâm quay: nếu đang cô lập → giữ khóa vào chi tiết cô lập (xoay như vật độc lập);
    // ngược lại → trả về mục tiêu camera hiện tại (hết "khóa" vào cấu kiện cũ).
    try {
        if (isolated && isolatedBox) {
            const c = isolatedBox.getCenter(new THREE.Vector3());
            world.camera.controls.setOrbitPoint(c.x, c.y, c.z);
        } else {
            const tg = new THREE.Vector3();
            world.camera.controls.getTarget(tg);
            world.camera.controls.setOrbitPoint(tg.x, tg.y, tg.z);
        }
    } catch (e) {}
    $('sel-chip').classList.remove('show');
    $('prop-panel').classList.remove('show');
}
$('chip-clear').onclick = clearSelection;

// ─── Ẩn / Cô lập / Hiện tất cả ───
$('chip-hide').onclick = () => {
    const map = currentSelMap;
    if (!map || !Object.keys(map).length) return;
    hider.set(false, map);
    clearSelection();
};
$('chip-isolate').onclick = () => {
    const map = currentSelMap;
    if (!map || !Object.keys(map).length) return;
    // Tính khung bao cụm TRƯỚC khi xóa chọn, để vẫn quay/zoom quanh nó
    let box = null;
    try {
        boxer.reset();
        boxer.addFragmentIdMap(map);
        box = boxer.get().clone();
        boxer.reset();
    } catch (e) { console.warn('isolate-box:', e); }

    hider.isolate(map);
    isolated = true;
    isolatedBox = (box && isFinite(box.min.x)) ? box : null;

    clearSelection(); // gỡ khung bao + reset trạng thái chọn

    // Coi chi tiết cô lập như một vật độc lập: đưa vào giữa khung hình + khóa tâm quay
    // vào nó. Từ giờ 🎯 fit, các hướng nhìn, xoay & zoom đều xoay quanh riêng nó.
    fitView(false);
    if (sectionOn) applySection($('section-slider').value); // mặt cắt bám theo dải cao độ mới
    toast(t('isolating'));
};
$('btn-showall').onclick = () => {
    hider.set(true);
    isolated = false;
    isolatedBox = null;
    clearSearchDim(false);
    fitView(false); // quay lại nhìn toàn mô hình
    if (sectionOn) applySection($('section-slider').value); // trả mặt cắt về dải cả mô hình
    toast(t('shownAll'));
};

// ═══ THUỘC TÍNH ═════════════════════════════════════════════════════════════
$('chip-props').onclick = async () => {
    if (selectedID == null || !currentModel) return;
    const body = $('prop-body');
    $('prop-title').textContent = $('sel-name').textContent;
    body.innerHTML = '<div class="flp-empty">' + t('readingProps') + '</div>';
    $('prop-panel').classList.add('show');
    try {
        const rows = [];
        const attrs = await currentModel.getProperties(selectedID);
        if (attrs) {
            const typeName = OBC.IfcCategoryMap[attrs.type] || attrs.type;
            rows.push({ pset: t('general'), items: [
                [t('type'), typeName],
                [t('name'), attrs.Name?.value],
                ['GlobalId', attrs.GlobalId?.value],
                ['Tag', attrs.Tag?.value],
                ['ObjectType', attrs.ObjectType?.value],
                ['ExpressID', selectedID],
            ]});
        }
        // Pset qua quan hệ IsDefinedBy — lập chỉ mục lười (chỉ chạy khi cần lần đầu)
        if (!indexed) {
            body.innerHTML = '<div class="flp-empty">' + t('indexing') + '</div>';
            await ensureIndexed();
        }
        const psetIDs = indexer.getEntityRelations(currentModel, selectedID, 'IsDefinedBy') || [];
        for (const pid of psetIDs) {
            const def = await currentModel.getProperties(pid).catch(() => null);
            if (!def) continue;
            const items = [];
            if (Array.isArray(def.HasProperties)) {
                for (const h of def.HasProperties) {
                    if (!h || h.value == null) continue;
                    const p = await currentModel.getProperties(h.value).catch(() => null);
                    if (p) items.push([p.Name?.value, fmtVal(p.NominalValue)]);
                }
            }
            if (Array.isArray(def.Quantities)) {
                for (const h of def.Quantities) {
                    if (!h || h.value == null) continue;
                    const q = await currentModel.getProperties(h.value).catch(() => null);
                    if (!q) continue;
                    const v = q.LengthValue ?? q.AreaValue ?? q.VolumeValue ?? q.WeightValue ?? q.CountValue;
                    items.push([q.Name?.value, fmtVal(v)]);
                }
            }
            if (items.length) rows.push({ pset: def.Name?.value || 'Pset', items });
        }
        renderProps(rows);
    } catch (e) {
        console.warn('props:', e);
        body.innerHTML = '<div class="flp-empty">' + t('propsFail') + '</div>';
    }
};
function fmtVal(v) {
    if (v == null) return undefined;
    if (typeof v === 'object' && 'value' in v) v = v.value;
    if (typeof v === 'number') return Math.round(v * 1000) / 1000;
    return v;
}
function renderProps(rows) {
    const body = $('prop-body');
    body.innerHTML = '';
    for (const g of rows) {
        const items = g.items.filter(([k, v]) => v !== undefined && v !== null && v !== '');
        if (!items.length) continue;
        const h = document.createElement('div');
        h.className = 'pset-name'; h.textContent = g.pset;
        body.appendChild(h);
        for (const [k, v] of items) {
            const r = document.createElement('div');
            r.className = 'prop-row';
            r.innerHTML = `<span class="k"></span><span class="v"></span>`;
            r.children[0].textContent = k ?? '';
            r.children[1].textContent = String(v);
            body.appendChild(r);
        }
    }
    if (!body.children.length) body.innerHTML = '<div class="flp-empty">' + t('noProps') + '</div>';
}
$('prop-close').onclick = () => $('prop-panel').classList.remove('show');

// ═══ ĐO KHOẢNG CÁCH (2 điểm) ════════════════════════════════════════════════
const measureGroup = new THREE.Group();
world.scene.three.add(measureGroup);
let pendingPt = null;          // {p, marker} — điểm đầu của phép đo đang dở
const measurements = [];       // {m1, m2, line, label} — các phép đo đã xong (phục vụ hoàn tác)
const measureLabels = [];      // {el, p1, p2} — nhãn bám theo khung hình
const SNAP_PX = 34;            // bán kính bắt điểm quanh chỗ chạm (pixel màn hình)
let snapMode = 'vertex';       // vertex | edge | mid | center | free
let measureType = 'pp';        // pp = 2 điểm | pl = điểm–cạnh (giao tuyến 2 mặt) | pf = điểm–mặt phẳng
let lastSnapEdge = null;       // 2 đầu mút (hệ CỤC BỘ) của cạnh vừa bắt được — phục vụ đo điểm–cạnh

// Dấu ✕ bắt điểm: sprite luôn hướng về camera, kích thước CỐ ĐỊNH trên màn hình
// (sizeAttenuation:false) → tâm chữ X nằm đúng điểm bắt, nhìn rõ vị trí hơn chấm tròn.
let xTexture = null;
function getXTexture() {
    if (xTexture) return xTexture;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.lineCap = 'round';
    // viền tối cho nổi trên nền sáng
    g.strokeStyle = 'rgba(15,23,42,0.92)'; g.lineWidth = 15;
    g.beginPath(); g.moveTo(14, 14); g.lineTo(50, 50); g.moveTo(50, 14); g.lineTo(14, 50); g.stroke();
    // chữ X vàng cam
    g.strokeStyle = '#f59e0b'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(14, 14); g.lineTo(50, 50); g.moveTo(50, 14); g.lineTo(14, 50); g.stroke();
    xTexture = new THREE.CanvasTexture(c);
    return xTexture;
}
function markerAt(p) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({
        map: getXTexture(), depthTest: false, transparent: true, sizeAttenuation: false,
    }));
    m.position.copy(p);
    m.scale.setScalar(0.052); // ~22px trên màn hình, không đổi theo khoảng cách
    m.renderOrder = 999;
    measureGroup.add(m);
    return m;
}

// ─── ENGINE BẮT ĐIỂM ─────────────────────────────────────────────────────────
// Ma trận thế giới của ĐÚNG instance bị chạm (mesh dùng chung hình học)
function instMatrix(hit) {
    const obj = hit.object;
    const mat = new THREE.Matrix4().copy(obj.matrixWorld);
    if (obj.isInstancedMesh && hit.instanceId != null) {
        const im = new THREE.Matrix4();
        obj.getMatrixAt(hit.instanceId, im);
        mat.multiply(im);
    }
    return mat;
}

// ⊙ Tâm: tâm khung bao của chi tiết bị chạm (chạm bu lông → ra đúng tâm bu lông/lỗ)
function instanceCenter(hit) {
    const geom = hit.object.geometry;
    if (!geom) return null;
    if (!geom.boundingBox) geom.computeBoundingBox();
    return geom.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(instMatrix(hit));
}

// Bắt theo hình học: quét TOÀN BỘ đỉnh của chi tiết trong bán kính SNAP_PX quanh
// chỗ chạm (bản cũ chỉ xét 3 đỉnh của 1 tam giác trúng tia → gần như không bắt được).
//   'vertex' → đỉnh gần nhất | 'edge' → điểm gần nhất TRÊN cạnh | 'mid' → trung điểm cạnh
function snapGeometry(hit, mode) {
    try {
        const geom = hit.object.geometry;
        const pos = geom && geom.attributes.position;
        if (!pos) return null;
        const mat = instMatrix(hit);
        const inv = mat.clone().invert();
        const localHit = hit.point.clone().applyMatrix4(inv);

        // Đổi bán kính px → mét tại khoảng cách chạm, rồi về hệ cục bộ của hình học
        const cam = world.camera.three;
        const rect = world.renderer.three.domElement.getBoundingClientRect();
        let worldPerPx;
        if (cam.isPerspectiveCamera) {
            const dist = cam.position.distanceTo(hit.point);
            worldPerPx = 2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) / rect.height;
        } else {
            worldPerPx = (cam.top - cam.bottom) / (cam.zoom || 1) / rect.height;
        }
        const rLocal = SNAP_PX * worldPerPx / (mat.getMaxScaleOnAxis() || 1);
        const r2 = rLocal * rLocal;

        // Quét đỉnh gần điểm chạm (1 lượt tuyến tính — vài chục nghìn đỉnh vẫn tức thì)
        const arr = pos.array, n = pos.count;
        const near = [];
        for (let i = 0; i < n; i++) {
            const dx = arr[3 * i] - localHit.x, dy = arr[3 * i + 1] - localHit.y, dz = arr[3 * i + 2] - localHit.z;
            if (dx * dx + dy * dy + dz * dz < r2) { near.push(i); if (near.length > 6000) break; }
        }
        // luôn kèm 3 đỉnh của tam giác trúng tia (đề phòng vùng quét trống)
        if (hit.face) for (const vi of [hit.face.a, hit.face.b, hit.face.c]) near.push(vi);
        if (!near.length) return null;
        const vAt = (i) => new THREE.Vector3(arr[3 * i], arr[3 * i + 1], arr[3 * i + 2]);

        if (mode === 'vertex') {
            let best = null, bd = Infinity;
            for (const i of near) {
                const v = vAt(i);
                const d2 = v.distanceToSquared(localHit);
                if (d2 < bd) { bd = d2; best = v; }
            }
            return (best && bd < r2 * 2.5) ? best.applyMatrix4(mat) : null;
        }

        // 'edge' / 'mid': xét mọi tam giác chứa ÍT NHẤT 1 đỉnh gần → các cạnh của chúng
        const nearSet = new Set(near);
        const idx = geom.index ? geom.index.array : null;
        const triCount = Math.floor((idx ? idx.length : n) / 3);
        const seen = new Set();
        let best = null, bd = Infinity, bestEA = -1, bestEB = -1;
        const seg = new THREE.Line3();
        const tmp = new THREE.Vector3();
        const consider = (a, b) => {
            const key = a < b ? a + ':' + b : b + ':' + a;
            if (seen.has(key)) return;
            seen.add(key);
            const va = vAt(a), vb = vAt(b);
            if (va.distanceToSquared(vb) < 1e-12) return; // cạnh suy biến
            let cand;
            if (mode === 'mid') cand = va.add(vb).multiplyScalar(0.5);
            else { seg.set(va, vb); cand = seg.closestPointToPoint(localHit, true, tmp).clone(); }
            const d2 = cand.distanceToSquared(localHit);
            if (d2 < bd) { bd = d2; best = cand; bestEA = a; bestEB = b; }
        };
        for (let ti = 0; ti < triCount; ti++) {
            const a = idx ? idx[3 * ti] : 3 * ti, b = idx ? idx[3 * ti + 1] : 3 * ti + 1, c = idx ? idx[3 * ti + 2] : 3 * ti + 2;
            if (nearSet.has(a) || nearSet.has(b) || nearSet.has(c)) { consider(a, b); consider(b, c); consider(c, a); }
        }
        if (best && bd < r2 * 2.5) {
            if (mode === 'edge' && bestEA >= 0) lastSnapEdge = [vAt(bestEA).applyMatrix4(mat), vAt(bestEB).applyMatrix4(mat)];
            return best.applyMatrix4(mat);
        }
        return null;
    } catch (e) { console.warn('snap:', e); return null; }
}

// Bắt CẠNH (giao tuyến 2 mặt phẳng): trả về điểm bắt + 2 đầu mút cạnh (hệ thế giới)
function snapEdge(hit) {
    lastSnapEdge = null;
    const p = snapGeometry(hit, 'edge');
    if (!p || !lastSnapEdge) return null;
    return { p, a: lastSnapEdge[0], b: lastSnapEdge[1] };
}

function applySnap(hit) {
    if (snapMode === 'free') return hit.point.clone();
    if (snapMode === 'center') return instanceCenter(hit) || hit.point.clone();
    return snapGeometry(hit, snapMode) || hit.point.clone();
}

// Nút chọn kiểu bắt điểm
for (const chip of document.querySelectorAll('.snap-chip[data-snap]')) {
    chip.onclick = () => {
        snapMode = chip.dataset.snap;
        for (const c of document.querySelectorAll('.snap-chip[data-snap]')) c.classList.toggle('on', c === chip);
        if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
    };
}

// Tọa độ theo hệ IFC gốc của mô hình: nghịch đảo ma trận quy chiếu (coordinationMatrix)
// rồi đổi trục three.js (Y lên) về IFC (Z lên): X=x, Y=−z, Z=y.
function ifcCoords(p) {
    const q = p.clone();
    try { q.applyMatrix4(new THREE.Matrix4().copy(currentModel.coordinationMatrix).invert()); } catch (e) {}
    return { x: q.x, y: -q.z, z: q.y };
}
const fmtM = (v) => (Math.round(v * 1000) / 1000).toLocaleString(LANG === 'vi' ? 'vi' : 'en', { minimumFractionDigits: 3 });
function showCoords(p, pPrev) {
    const c = ifcCoords(p);
    let html = `X ${fmtM(c.x)} · Y ${fmtM(c.y)} · Z ${fmtM(c.z)} m`;
    if (pPrev) {
        const a = ifcCoords(pPrev);
        html += `<span style="color:#fbbf24;">ΔX ${fmtM(c.x - a.x)} · ΔY ${fmtM(c.y - a.y)} · ΔZ ${fmtM(c.z - a.z)}</span>`;
    }
    const bar = $('coord-bar');
    bar.innerHTML = '<span>' + html.replace('<span', '</span><span') + '</span>';
    bar.classList.add('show');
}

// ═══ ĐO TÂM BU LÔNG (🔩) ═════════════════════════════════════════════════════
// Nguyên lý: bu lông/đai ốc/vòng đệm là khối TRÒN XOAY quanh trục. Lấy toàn bộ đỉnh
// của chi tiết bị chạm, phân tích trục chính (PCA): 2 phương hướng kính có phương sai
// BẰNG NHAU, phương trục thì khác hẳn → trục = vectơ riêng có trị riêng tách biệt nhất.
// Khoảng cách vuông góc giữa 2 trục bu lông song song = ĐÚNG khoảng cách tâm lỗ ↔ tâm lỗ
// trên mặt bích (không phụ thuộc chạm vào đầu, thân hay đai ốc).
let pendingAxis = null; // { c: tâm, d: phương trục, line: đường trục đã vẽ }

// Trị riêng + vectơ riêng của ma trận đối xứng 3×3 (phép quay Jacobi — ~10 vòng là hội tụ)
function eigenSym3(A) {
    const a = [[A[0][0], A[0][1], A[0][2]], [A[1][0], A[1][1], A[1][2]], [A[2][0], A[2][1], A[2][2]]];
    let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let sweep = 0; sweep < 24; sweep++) {
        let off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]);
        if (off < 1e-14) break;
        for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
            if (Math.abs(a[p][q]) < 1e-15) continue;
            const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
            const tt = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
            const c = 1 / Math.sqrt(tt * tt + 1), s2 = tt * c;
            for (let k = 0; k < 3; k++) {
                const akp = a[k][p], akq = a[k][q];
                a[k][p] = c * akp - s2 * akq; a[k][q] = s2 * akp + c * akq;
            }
            for (let k = 0; k < 3; k++) {
                const apk = a[p][k], aqk = a[q][k];
                a[p][k] = c * apk - s2 * aqk; a[q][k] = s2 * apk + c * aqk;
                const vkp = V[k][p], vkq = V[k][q];
                V[k][p] = c * vkp - s2 * vkq; V[k][q] = s2 * vkp + c * vkq;
            }
        }
    }
    return { vals: [a[0][0], a[1][1], a[2][2]], vecs: V }; // vecs[k][i] = thành phần k của vectơ riêng i
}

// Tìm trục hình trụ của chi tiết bị chạm. Trả về { c, d } (hệ thế giới) hoặc null nếu không "tròn xoay".
function boltAxis(hit) {
    try {
        if (!hit || !hit.object?.geometry?.attributes?.position) return null;
        const pos = hit.object.geometry.attributes.position, arr = pos.array, n = pos.count;
        if (n < 12) return null;
        const step = Math.max(1, Math.floor(n / 4000)); // lấy mẫu tối đa ~4000 đỉnh cho nhẹ
        let cx = 0, cy = 0, cz = 0, m = 0;
        for (let i = 0; i < n; i += step) { cx += arr[3 * i]; cy += arr[3 * i + 1]; cz += arr[3 * i + 2]; m++; }
        cx /= m; cy /= m; cz /= m;
        const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let i = 0; i < n; i += step) {
            const x = arr[3 * i] - cx, y = arr[3 * i + 1] - cy, z = arr[3 * i + 2] - cz;
            C[0][0] += x * x; C[0][1] += x * y; C[0][2] += x * z;
            C[1][1] += y * y; C[1][2] += y * z; C[2][2] += z * z;
        }
        C[1][0] = C[0][1]; C[2][0] = C[0][2]; C[2][1] = C[1][2];
        const { vals, vecs } = eigenSym3(C);
        // Trục = trị riêng TÁCH BIỆT nhất; 2 trị còn lại (hướng kính) phải xấp xỉ nhau
        let axis = -1, bestSep = -1;
        for (let i = 0; i < 3; i++) {
            const [o1, o2] = [vals[(i + 1) % 3], vals[(i + 2) % 3]];
            const pairClose = Math.abs(o1 - o2) / (Math.max(o1, o2) + 1e-20); // 2 hướng kính lệch nhau bao nhiêu
            const sep = Math.abs(vals[i] - (o1 + o2) / 2) / (Math.max(...vals) + 1e-20);
            if (pairClose < 0.30 && sep > bestSep) { bestSep = sep; axis = i; }
        }
        if (axis < 0 || bestSep < 0.05) return null; // không tròn xoay (bản mã, dầm...) → từ chối
        const dL = new THREE.Vector3(vecs[0][axis], vecs[1][axis], vecs[2][axis]).normalize();
        // Đưa sang hệ thế giới
        const mat = instMatrix(hit);
        const c = new THREE.Vector3(cx, cy, cz).applyMatrix4(mat);
        const nm = new THREE.Matrix3().getNormalMatrix(mat);
        const d = dL.applyMatrix3(nm).normalize();
        // Nửa chiều dài chi tiết dọc trục (vẽ đường trục cho đẹp)
        if (!hit.object.geometry.boundingSphere) hit.object.geometry.computeBoundingSphere();
        const half = (hit.object.geometry.boundingSphere?.radius || 0.05) * (mat.getMaxScaleOnAxis() || 1);
        return { c, d, half };
    } catch (e) { console.warn('boltAxis:', e); return null; }
}

// Vẽ đường trục bu lông (xanh lơ, xuyên thấu) — dài hơn thân bu lông 60% mỗi phía
function boltAxisLine(ax) {
    const L = ax.half * 1.6 + 0.02;
    const g = new THREE.BufferGeometry().setFromPoints([
        ax.c.clone().sub(ax.d.clone().multiplyScalar(L)),
        ax.c.clone().add(ax.d.clone().multiplyScalar(L)),
    ]);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x38bdf8, depthTest: false, transparent: true, opacity: 0.95 }));
    l.renderOrder = 997;
    measureGroup.add(l);
    return l;
}

// Gợi ý theo kiểu đo + bước hiện tại (điểm 1 đã chọn hay chưa)
function refreshMeasureHint() {
    let k = 'measureHint2';
    if (measureType === 'pl') k = pendingPt ? 'hintPL2' : 'hintPL';
    else if (measureType === 'pf') k = pendingPt ? 'hintPF2' : 'hintPF';
    else if (measureType === 'bc') k = pendingPt ? 'hintBC2' : 'hintBC';
    $('measure-hint').textContent = t(k);
}

// Hoàn tất 1 phép đo từ pendingPt → p2 (đường + nhãn khoảng cách); extras = hình phụ trợ đã nằm trong measureGroup
function finishMeasure(p2, extras) {
    const a = pendingPt; pendingPt = null;
    showCoords(p2, a.p);
    const m2 = markerAt(p2);
    const lineGeom = new THREE.BufferGeometry().setFromPoints([a.p, p2]);
    const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0xf59e0b, depthTest: false }));
    line.renderOrder = 998;
    measureGroup.add(line);
    const el = document.createElement('div');
    el.className = 'measure-label';
    const mm = a.p.distanceTo(p2) * 1000;
    el.textContent = mm >= 10000 ? (mm / 1000).toFixed(3) + ' m' : Math.round(mm).toLocaleString('vi') + ' mm';
    document.body.appendChild(el);
    const label = { el, p1: a.p.clone(), p2: p2.clone() };
    measureLabels.push(label);
    measurements.push({ m1: a.marker, m2, line, label, extras: extras || [] });
    refreshMeasureHint();
}

// Đường kéo dài của cạnh (xanh dương) — phủ hết cạnh + chân vuông góc, dư 15% mỗi đầu
function edgeExtLine(a, b, foot) {
    const dir = b.clone().sub(a); const len = dir.length() || 1; dir.normalize();
    const tf = dir.dot(foot.clone().sub(a));
    const lo = Math.min(0, tf) - len * 0.15, hi = Math.max(len, tf) + len * 0.15;
    const g = new THREE.BufferGeometry().setFromPoints([
        a.clone().add(dir.clone().multiplyScalar(lo)), a.clone().add(dir.clone().multiplyScalar(hi)),
    ]);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x38bdf8, depthTest: false, transparent: true, opacity: 0.9 }));
    l.renderOrder = 997;
    measureGroup.add(l);
    return l;
}

// Ô vuông nhỏ tại chân vuông góc trên mặt phẳng (thể hiện mặt được đo tới)
function footQuad(center, n, refDist) {
    const s = Math.min(0.3, Math.max(0.03, Math.abs(refDist) * 0.15));
    const u = Math.abs(n.x) > 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const x = u.clone().cross(n).normalize().multiplyScalar(s);
    const y = n.clone().cross(x).normalize().multiplyScalar(s);
    const g = new THREE.BufferGeometry().setFromPoints([
        center.clone().add(x).add(y), center.clone().sub(x).add(y),
        center.clone().sub(x).sub(y), center.clone().add(x).sub(y),
    ]);
    const l = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0x38bdf8, depthTest: false }));
    l.renderOrder = 997;
    measureGroup.add(l);
    return l;
}

async function addMeasurePoint() {
    if (!currentModel) return;
    const hit = caster.castRay();
    if (!hit) { toast(t('missModel')); return; }
    if (navigator.vibrate) try { navigator.vibrate(18); } catch (e) {}

    // ── Điểm THỨ NHẤT ──
    if (!pendingPt) {
        if (measureType === 'bc') {
            // 🔩 Bu lông thứ nhất: tìm trục, neo điểm = hình chiếu chỗ chạm lên trục
            const ax = boltAxis(hit);
            if (!ax) { toast(t('noBolt')); return; }
            const anchor = ax.c.clone().add(ax.d.clone().multiplyScalar(ax.d.dot(hit.point.clone().sub(ax.c))));
            pendingAxis = { ...ax, line: boltAxisLine(ax) };
            pendingPt = { p: anchor, marker: markerAt(anchor) };
            showCoords(anchor, null);
            refreshMeasureHint();
            return;
        }
        const p = applySnap(hit);
        pendingPt = { p, marker: markerAt(p) };
        showCoords(p, null);
        if (measureType === 'pf') { facePick = 'measure'; clearFaceHL(); } // bước 2: chuyển sang chọn MẶT
        refreshMeasureHint();
        return;
    }

    // ── Bước thứ hai ──
    if (measureType === 'bc') {
        // 🔩 Bu lông thứ hai: điểm đo = chân vuông góc từ tâm 1 xuống trục 2
        // (2 trục song song → khoảng cách này ≡ khoảng cách tâm lỗ ↔ tâm lỗ trên mặt bích)
        const ax2 = boltAxis(hit);
        if (!ax2) { toast(t('noBolt')); return; }
        const p2 = ax2.c.clone().add(ax2.d.clone().multiplyScalar(ax2.d.dot(pendingPt.p.clone().sub(ax2.c))));
        const line2 = boltAxisLine(ax2);
        const extras = [line2];
        if (pendingAxis) { extras.push(pendingAxis.line); pendingAxis = null; }
        finishMeasure(p2, extras);
        return;
    }
    if (measureType === 'pl') {
        // Điểm → CẠNH: bắt cạnh (giao tuyến 2 mặt), đo vuông góc tới ĐƯỜNG THẲNG chứa cạnh
        const edge = snapEdge(hit);
        if (!edge) { toast(t('noEdge')); return; }
        const dir = edge.b.clone().sub(edge.a).normalize();
        const foot = edge.a.clone().add(dir.clone().multiplyScalar(dir.dot(pendingPt.p.clone().sub(edge.a))));
        const ext = edgeExtLine(edge.a, edge.b, foot);
        finishMeasure(foot, [ext]);
        return;
    }
    // measureType === 'pp' — đo 2 điểm như cũ
    const p = applySnap(hit);
    finishMeasure(p);
}

// ↩️ Hoàn tác: bỏ điểm đang chờ trước, không thì bỏ phép đo gần nhất
function undoMeasure() {
    if (pendingPt) {
        measureGroup.remove(pendingPt.marker);
        pendingPt.marker.material?.dispose();
        pendingPt = null;
        if (pendingAxis) { // đang chờ bu lông thứ hai → xóa đường trục 1
            measureGroup.remove(pendingAxis.line);
            pendingAxis.line.geometry.dispose(); pendingAxis.line.material.dispose();
            pendingAxis = null;
        }
        if (facePick === 'measure') { facePick = null; clearFaceHL(); } // đang chờ chọn mặt → hủy luôn
        $('coord-bar').classList.remove('show');
        refreshMeasureHint();
        return;
    }
    const m = measurements.pop();
    if (!m) return;
    for (const o of [m.m1, m.m2, m.line, ...(m.extras || [])]) {
        measureGroup.remove(o);
        o.geometry?.dispose(); o.material?.dispose();
    }
    m.label.el.remove();
    const i = measureLabels.indexOf(m.label);
    if (i >= 0) measureLabels.splice(i, 1);
    $('coord-bar').classList.remove('show');
}
$('snap-undo').onclick = undoMeasure;
$('snap-clear').onclick = () => clearAllMeasurements();

function clearAllMeasurements() {
    pendingPt = null;
    measurements.length = 0;
    while (measureGroup.children.length) {
        const c = measureGroup.children.pop();
        c.geometry?.dispose(); c.material?.dispose();
        measureGroup.remove(c);
    }
    for (const l of measureLabels) l.el.remove();
    measureLabels.length = 0;
    $('coord-bar').classList.remove('show');
}

$('btn-measure').onclick = () => {
    measureMode = !measureMode;
    $('btn-measure').classList.toggle('on', measureMode);
    $('measure-hint').classList.toggle('show', measureMode);
    $('snap-bar').classList.toggle('show', measureMode);
    $('mode-bar').classList.toggle('show', measureMode);
    if (!measureMode) {
        clearAllMeasurements();
        pendingAxis = null; // đường trục đã nằm trong measureGroup — clearAll dọn sạch
        if (facePick === 'measure') facePick = null;
        clearFaceHL();
        $('coord-bar').classList.remove('show');
    } else { clearSelection(); refreshMeasureHint(); }
};

// Chọn KIỂU ĐO: 2 điểm / điểm–cạnh / điểm–mặt phẳng
for (const chip of document.querySelectorAll('#mode-bar .snap-chip[data-mmode]')) {
    chip.onclick = () => {
        measureType = chip.dataset.mmode;
        for (const c of document.querySelectorAll('#mode-bar .snap-chip[data-mmode]')) c.classList.toggle('on', c === chip);
        // đổi kiểu giữa chừng → bỏ điểm đang chờ + thoát chế độ chọn mặt (nếu có)
        if (pendingPt) { measureGroup.remove(pendingPt.marker); pendingPt.marker.material?.dispose(); pendingPt = null; }
        if (pendingAxis) { measureGroup.remove(pendingAxis.line); pendingAxis.line.geometry.dispose(); pendingAxis.line.material.dispose(); pendingAxis = null; }
        if (facePick === 'measure') facePick = null;
        clearFaceHL();
        $('coord-bar').classList.remove('show');
        refreshMeasureHint();
        if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) {}
    };
}

// Cập nhật vị trí nhãn đo theo mỗi khung hình
function updateLabels() {
    if (measureLabels.length) {
        const cam = world.camera.three;
        const rect = world.renderer.three.domElement.getBoundingClientRect();
        for (const l of measureLabels) {
            const mid = l.p1.clone().lerp(l.p2, 0.5).project(cam);
            const vis = mid.z < 1;
            l.el.style.display = vis ? '' : 'none';
            if (vis) {
                l.el.style.left = ((mid.x + 1) / 2 * rect.width) + 'px';
                l.el.style.top = ((1 - mid.y) / 2 * rect.height) + 'px';
            }
        }
    }
    requestAnimationFrame(updateLabels);
}
requestAnimationFrame(updateLabels);

// ═══ CHỌN MẶT PHẲNG (rê để tô sáng, chạm để chốt) ═══════════════════════════
// Dùng chung cho 2 việc: đo điểm–mặt (facePick='measure') và đặt mặt cắt (facePick='section').
let facePick = null;      // null | 'measure' | 'section'
let faceHL = null;        // mesh tô sáng mặt đang rê tới
let hoverPlane = null;    // {n: pháp tuyến thế giới, p: điểm trên mặt} của mặt đang tô sáng
let lastFaceHit = null;   // hit gần nhất khi rê (để dựng lại vùng tô khi chốt)
const faceMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthTest: false,
});

function clearFaceHL() {
    if (faceHL) { world.scene.three.remove(faceHL); faceHL.geometry.dispose(); faceHL = null; }
    hoverPlane = null; lastFaceHit = null;
}

// Mặt phẳng (hệ thế giới) của tam giác bị chạm
function faceWorldPlane(hit) {
    if (!hit || !hit.face) return null;
    const nm = new THREE.Matrix3().getNormalMatrix(instMatrix(hit));
    return { n: hit.face.normal.clone().applyMatrix3(nm).normalize(), p: hit.point.clone() };
}

// Gom MỌI tam giác đồng phẳng (cùng pháp tuyến + cùng mặt) trong hình học của chi tiết
// bị chạm → mesh tô sáng. Quét tuyến tính 1 lượt, dung sai 0,6mm để không "ăn" sang
// bản mã/mặt bích song song cách vài mm.
function buildFacePatch(hit) {
    try {
        if (!hit || !hit.face) return null;
        const geom = hit.object.geometry, pos = geom.attributes.position;
        if (!pos) return null;
        const idx = geom.index ? geom.index.array : null;
        const triCount = Math.floor((idx ? idx.length : pos.count) / 3);
        const mat = instMatrix(hit);
        const inv = mat.clone().invert();
        const nL = hit.face.normal; // pháp tuyến hệ CỤC BỘ (three.js trả sẵn)
        const pL = hit.point.clone().applyMatrix4(inv);
        const d = -nL.dot(pL);
        const tol = 6e-4 / (mat.getMaxScaleOnAxis() || 1); // ~0,6mm
        const arr = pos.array;
        const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
        const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nn = new THREE.Vector3();
        const out = [];
        for (let ti = 0; ti < triCount; ti++) {
            const a = idx ? idx[3 * ti] : 3 * ti, b = idx ? idx[3 * ti + 1] : 3 * ti + 1, c = idx ? idx[3 * ti + 2] : 3 * ti + 2;
            va.set(arr[3 * a], arr[3 * a + 1], arr[3 * a + 2]);
            if (Math.abs(nL.dot(va) + d) > tol) continue;       // đỉnh 1 lệch mặt → loại sớm
            vb.set(arr[3 * b], arr[3 * b + 1], arr[3 * b + 2]);
            vc.set(arr[3 * c], arr[3 * c + 1], arr[3 * c + 2]);
            if (Math.abs(nL.dot(vb) + d) > tol || Math.abs(nL.dot(vc) + d) > tol) continue;
            nn.copy(e1.copy(vb).sub(va).cross(e2.copy(vc).sub(va)));
            if (nn.lengthSq() < 1e-16) continue;
            if (nn.normalize().dot(nL) < 0.999) continue;       // cùng hướng pháp tuyến
            out.push(va.x, va.y, va.z, vb.x, vb.y, vb.z, vc.x, vc.y, vc.z);
            if (out.length > 9 * 25000) break;                  // chốt an toàn bộ nhớ
        }
        if (!out.length) return null;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
        g.applyMatrix4(mat);
        const m = new THREE.Mesh(g, faceMat);
        m.renderOrder = 996;
        return m;
    } catch (e) { console.warn('facePatch:', e); return null; }
}

// Rê tay/chuột trong chế độ chọn mặt → tự bắt & tô sáng mặt dưới con trỏ
let hoverStamp = 0, inHover = false;
container.addEventListener('pointermove', (e) => {
    if (!facePick || inHover) return;
    const now = performance.now();
    if (now - hoverStamp < 90) return; // tiết chế: bắn tia + quét tam giác ~11 lần/giây là đủ mượt
    hoverStamp = now;
    inHover = true;
    try {
        syncPointer(e);
        const hit = caster.castRay();
        clearFaceHL();
        if (hit && hit.face) {
            lastFaceHit = hit;
            hoverPlane = faceWorldPlane(hit);
            const patch = buildFacePatch(hit);
            if (patch) { faceHL = patch; world.scene.three.add(patch); }
        }
    } catch (err) { console.warn('hover:', err); }
    finally { inHover = false; }
}, true);

// Chạm để CHỐT mặt: kết thúc phép đo điểm–mặt hoặc đặt mặt phẳng cắt
async function pickFaceTap() {
    const hit = caster.castRay();
    const useHit = (hit && hit.face) ? hit : lastFaceHit;
    const plane = (hit && hit.face) ? faceWorldPlane(hit) : hoverPlane;
    if (!plane) { toast(t('noFace')); return; }
    if (navigator.vibrate) try { navigator.vibrate(18); } catch (e) {}

    if (facePick === 'section') {
        facePick = null;
        clearFaceHL();
        $('sec-pick').classList.remove('on');
        setSectionFromPlane(plane);
        return;
    }
    // facePick === 'measure': khoảng cách VUÔNG GÓC từ điểm 1 tới mặt phẳng
    if (!pendingPt) { facePick = null; clearFaceHL(); return; }
    const dist = plane.n.dot(pendingPt.p.clone().sub(plane.p));
    const foot = pendingPt.p.clone().sub(plane.n.clone().multiplyScalar(dist));
    const extras = [footQuad(foot, plane.n, dist)];
    const patch = useHit ? buildFacePatch(useHit) : null;
    if (patch) { // giữ lại vùng tô mặt (mờ hơn) trong kết quả đo
        patch.material = faceMat.clone();
        patch.material.opacity = 0.18;
        measureGroup.add(patch);
        extras.push(patch);
    }
    facePick = null;
    clearFaceHL();
    finishMeasure(foot, extras);
}

// ═══ MẶT CẮT (clipping toàn cục — ngang theo cao độ HOẶC theo mặt phẳng tự chọn) ═══
const sectionPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const sectionNormal = new THREE.Vector3(0, -1, 0); // (0,-1,0) = cắt ngang, giữ phần dưới
function toggleSection(on) {
    sectionOn = on;
    $('btn-section').classList.toggle('on', on);
    $('section-ui').classList.toggle('show', on);
    world.renderer.three.clippingPlanes = on ? [sectionPlane] : [];
    if (on) applySection($('section-slider').value);
    else if (facePick === 'section') { facePick = null; clearFaceHL(); $('sec-pick').classList.remove('on'); }
}
function applySection(v1000) {
    const t = v1000 / 1000;
    // Dùng activeBox(): khi đang CÔ LẬP một cụm, thanh trượt quét đúng dải của cụm đó.
    // Tổng quát cho mọi pháp tuyến: chiếu 8 góc khung bao lên pháp tuyến → [dmin, dmax],
    // thanh trượt quét mặt cắt dọc theo pháp tuyến trong dải đó (t=1 → hiện toàn bộ).
    const b = activeBox();
    let dmin = Infinity, dmax = -Infinity;
    const c = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
        c.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
        const dd = sectionNormal.dot(c);
        if (dd < dmin) dmin = dd;
        if (dd > dmax) dmax = dd;
    }
    sectionPlane.normal.copy(sectionNormal);
    sectionPlane.constant = -dmax + t * (dmax - dmin) + 0.001; // giữ phần có n·p + c ≥ 0
    $('section-val').textContent = Math.round(t * 100) + '%';
}
// Đặt mặt cắt theo mặt vừa chạm: pháp tuyến = −pháp tuyến mặt (giữ lại phần thân
// chi tiết phía sau mặt), vị trí ban đầu đặt ĐÚNG tại mặt đã chọn.
function setSectionFromPlane(plane) {
    sectionNormal.copy(plane.n).negate();
    if (!sectionOn) toggleSection(true);
    const b = activeBox();
    let dmin = Infinity, dmax = -Infinity;
    const c = new THREE.Vector3();
    for (let i = 0; i < 8; i++) {
        c.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
        const dd = sectionNormal.dot(c);
        if (dd < dmin) dmin = dd;
        if (dd > dmax) dmax = dd;
    }
    const d0 = sectionNormal.dot(plane.p);
    const tv = (dmax - dmin) > 1e-9 ? (dmax - d0) / (dmax - dmin) : 1;
    $('section-slider').value = Math.round(Math.min(1, Math.max(0, tv)) * 1000);
    applySection($('section-slider').value);
    toast(t('secSet'));
}
$('btn-section').onclick = () => {
    if (!currentModel) return;
    toggleSection(!sectionOn);
};
$('section-slider').addEventListener('input', (e) => applySection(e.target.value));
// ⬚ Chọn mặt cắt: bật/tắt chế độ rê-chọn mặt trên mô hình
$('sec-pick').onclick = () => {
    if (!currentModel) return;
    if (facePick === 'section') { facePick = null; clearFaceHL(); $('sec-pick').classList.remove('on'); return; }
    facePick = 'section';
    $('sec-pick').classList.add('on');
    clearFaceHL();
    toast(t('hintSecPick'), 3500);
};
// ⇅ Đảo phía giữ lại (giữ nguyên vị trí mặt cắt: t' = 1 − t)
$('sec-flip').onclick = () => {
    sectionNormal.negate();
    $('section-slider').value = 1000 - (parseInt($('section-slider').value, 10) || 0);
    applySection($('section-slider').value);
};
// ↕ Trở về mặt cắt ngang theo cao độ
$('sec-horiz').onclick = () => {
    sectionNormal.set(0, -1, 0);
    applySection($('section-slider').value);
};

// ═══ MỞ FILE: nút & input ═══════════════════════════════════════════════════
$('file-btn-container').onclick = () => $('file-input').click();
$('file-input').onchange = (e) => {
    const f = e.target.files[0];
    if (f) loadIfcFile(f);
    e.target.value = '';
};

// ═══ KHỐI QUÉT FILE (giữ nguyên từ v1 — cầu nối AndroidIFC + PC + fallback) ═══
// ═══ QUÉT FILE IFC ═══════════════════════════════════════════════════════
// 3 tầng tự chọn theo môi trường:
//   1) Android WebView wrapper: cầu nối native window.AndroidIFC quét toàn bộ máy
//   2) Chrome/Edge PC: chọn 1 thư mục → quét đệ quy file .ifc bên trong
//   3) Trình duyệt mobile thường: chọn nhiều file .ifc một lần
let scannedFiles = []; // {name, size, source: 'file'|'handle'|'native', file?|handle?|uri?}
const flPanel = document.getElementById('file-list-panel');
const flBackdrop = document.getElementById('flp-backdrop');

function formatBytes(b) {
    if (!b && b !== 0) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(0) + ' KB';
    if (b < 1073741824) return (b/1048576).toFixed(1) + ' MB';
    return (b/1073741824).toFixed(2) + ' GB';
}

async function scanIFC() {
    // Mở bảng NGAY với trạng thái đang quét → người dùng có phản hồi tức thì
    scannedFiles = [];
    flPanel.classList.add('show'); flBackdrop.classList.add('show');
    document.getElementById('flp-count').textContent = '';
    document.getElementById('flp-hint').textContent = '';
    document.getElementById('file-list').innerHTML = '<div class="flp-empty">⏳ Đang quét bộ nhớ điện thoại...</div>';
    await new Promise(r => setTimeout(r, 60)); // cho UI kịp vẽ trước khi gọi quét (gọi đồng bộ, có thể mất vài giây)

    // ── Tầng 1: cầu nối Android WebView (quét thật bộ nhớ điện thoại) ──
    if (window.AndroidIFC && typeof AndroidIFC.scanIfcFiles === 'function') {
        try {
            const parsed = JSON.parse(AndroidIFC.scanIfcFiles() || '[]');
            if (parsed && parsed.needPermission) { renderNeedPermission(); return; }
            scannedFiles = (Array.isArray(parsed) ? parsed : []).map(f => ({ name: f.name, size: f.size, source: 'native', uri: f.uri }));
            showFileList('Quét từ bộ nhớ điện thoại');
            return;
        } catch (err) { console.warn('AndroidIFC.scanIfcFiles lỗi:', err); }
    }
    closeFileList(); // các tầng dưới dùng hộp thoại chọn của hệ thống
    // ── Tầng 2: PC Chrome/Edge — chọn thư mục rồi quét đệ quy ──
    if (window.showDirectoryPicker) {
        try {
            const dir = await window.showDirectoryPicker();
            scannedFiles = [];
            await collectIfcFromDir(dir, '');
            showFileList('Quét trong thư mục: ' + dir.name);
            return;
        } catch (err) {
            if (err && err.name === 'AbortError') return; // người dùng bấm Hủy
            console.warn('showDirectoryPicker lỗi:', err);
        }
    }
    // ── Tầng 2.5: PC khác (Firefox...) — chọn thư mục qua input webkitdirectory ──
    const dirInput = document.getElementById('dir-input');
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch && 'webkitdirectory' in dirInput) { dirInput.click(); return; }

    // ── Tầng 3: fallback — chọn nhiều file .ifc một lần ──
    document.getElementById('multi-input').click();
}

// Android 11+: hiện hướng dẫn cấp quyền với nút bấm rõ ràng
function renderNeedPermission() {
    document.getElementById('flp-count').textContent = '';
    document.getElementById('flp-hint').textContent = 'Chỉ cần cấp quyền một lần duy nhất';
    const list = document.getElementById('file-list');
    list.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'flp-empty';
    wrap.innerHTML = 'Để quét file trên máy, hãy cấp quyền<br><b>\u201CCho phép truy cập tất cả tệp\u201D</b> cho IFC Viewer.<br><br>';
    const btn = document.createElement('button');
    btn.className = 'welcome-btn primary';
    btn.textContent = '🔓 Mở Cài đặt cấp quyền';
    btn.onclick = () => {
        try { AndroidIFC.openPermissionSettings(); } catch (e) {}
        const tip = document.createElement('div');
        tip.style.cssText = 'margin-top:10px; font-size:11px; color:#64748b;';
        tip.textContent = 'Bật quyền xong, quay lại đây và bấm nút 🔄 để quét.';
        wrap.appendChild(tip);
    };
    wrap.appendChild(btn);
    list.appendChild(wrap);
}

document.getElementById('dir-input').onchange = (e) => {
    const files = Array.from(e.target.files).filter(f => /\.(ifc|ifclite)$/i.test(f.name));
    scannedFiles = files.map(f => ({ name: f.webkitRelativePath || f.name, size: f.size, source: 'file', file: f }));
    showFileList('Quét trong thư mục đã chọn');
    e.target.value = '';
};

async function collectIfcFromDir(dirHandle, path) {
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && /\.(ifc|ifclite)$/i.test(entry.name)) {
            try {
                const f = await entry.getFile();
                scannedFiles.push({ name: (path ? path + '/' : '') + entry.name, size: f.size, source: 'handle', handle: entry });
            } catch (e) {}
        } else if (entry.kind === 'directory') {
            try { await collectIfcFromDir(entry, (path ? path + '/' : '') + entry.name); } catch (e) {}
        }
    }
}

document.getElementById('multi-input').onchange = (e) => {
    const all = Array.from(e.target.files);
    const files = all.filter(f => /\.(ifc|ifclite)$/i.test(f.name));
    if (!files.length) {
        if (all.length) alert('File đã chọn không phải .ifc / .ifclite');
        e.target.value = '';
        return;
    }
    if (files.length === 1) { loadIfcFile(files[0]); e.target.value = ''; return; } // chỉ 1 file → mở luôn
    scannedFiles = files.map(f => ({ name: f.name, size: f.size, source: 'file', file: f }));
    showFileList('Các file đã chọn — chạm để mở');
    e.target.value = '';
};

function showFileList(hint) {
    const list = document.getElementById('file-list');
    document.getElementById('flp-count').textContent = scannedFiles.length ? `(${scannedFiles.length})` : '';
    document.getElementById('flp-hint').textContent = hint || '';
    if (!scannedFiles.length) {
        list.innerHTML = '<div class="flp-empty">Không tìm thấy file .ifc nào.<br>Hãy thử quét lại hoặc chọn thư mục/file khác.</div>';
    } else {
        list.innerHTML = '';
        scannedFiles.forEach((f, i) => {
            const row = document.createElement('div');
            row.className = 'file-item';
            row.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div class="fi-info"><div class="fi-name"></div><div class="fi-meta">${formatBytes(f.size)}</div></div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
            row.querySelector('.fi-name').textContent = f.name; // textContent → an toàn với tên file lạ
            row.onclick = () => openScannedFile(i);
            list.appendChild(row);
        });
    }
    flPanel.classList.add('show');
    flBackdrop.classList.add('show');
}

function closeFileList() { flPanel.classList.remove('show'); flBackdrop.classList.remove('show'); }

async function openScannedFile(i) {
    const f = scannedFiles[i];
    if (!f) return;
    closeFileList();
    try {
        if (f.source === 'file') { loadIfcFile(f.file); return; }
        if (f.source === 'handle') { loadIfcFile(await f.handle.getFile()); return; }
        if (f.source === 'native') {
            // Hiện spinner ngay vì đọc file lớn có thể mất vài giây
            document.getElementById('loading-text').textContent = 'Đang đọc file từ bộ nhớ...';
            document.getElementById('loading').classList.add('show');
            await new Promise(r => setTimeout(r, 30)); // cho UI kịp vẽ spinner
            const fname = f.name.split('/').pop();
            if (DISK_OK) {
                await loadIfcFile({ __disk: true, uri: f.uri, size: f.size, name: fname }, fname);
                return;
            }
            // Cách 1 (chính): stream qua route ảo của WebView — không giới hạn dung lượng.
            // v2.6.1: KIỂM ĐẾM đủ byte (bắt lỗi luồng bị cắt giữa chừng — hay gặp với file lớn
            // khi RAM căng) và TỰ THỬ LẠI 1 lần nếu chỉ là trục trặc thoáng qua.
            let streamErr = null;
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const ab = await fetchLocalFile(f);
                    loadIfcFile(ab, fname); // truyền thẳng ArrayBuffer — không bọc File (đỡ 1 bản sao RAM)
                    return;
                } catch (e1) {
                    streamErr = e1;
                    console.warn('Stream lần ' + attempt + ' thất bại:', e1);
                    if (attempt === 1) await new Promise(r => setTimeout(r, 350));
                }
            }
            // Cách 2 (dự phòng): cầu nối base64.
            // • readFileChunkB64 (APK v2.7+): đọc từng khúc 8MB → KHÔNG giới hạn dung lượng.
            // • readFileBase64 (bản cũ): phía Java CHẶN CỨNG 64MB — file lớn hơn nó trả chuỗi RỖNG.
            //   Đây chính là gốc rễ vụ "file trên ~70MB không mở được": lỗi thật của kênh stream
            //   bị nuốt vào console, còn cầu dự phòng thì đầu hàng trong im lặng.
            const hasChunk = window.AndroidIFC && typeof AndroidIFC.readFileChunkB64 === 'function';
            if (!hasChunk && f.size > 64 * 1048576) {
                throw new Error('kênh stream lỗi [' + errStr(streamErr) + '] — cầu dự phòng base64 của bản APK này chỉ nhận tối đa 64 MB nên không đọc được file ' + formatBytes(f.size));
            }
            document.getElementById('loading-text').textContent = 'Kênh stream lỗi — đang đọc dự phòng qua cầu nối...';
            const bytes = hasChunk ? await readNativeChunked(f) : readNativeB64Once(f);
            loadIfcFile(bytes.buffer, fname);
            return;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('loading').classList.remove('show');
        document.getElementById('loading-text').textContent = 'Đang xử lý mô hình...';
        alert('Không mở được file: ' + f.name + '\nLý do: ' + errStr(err));
    }
}

// Đổi lỗi bất kỳ thành chuỗi ngắn gọn để đưa vào thông báo — hết cảnh lỗi bị nuốt trong console
function errStr(e) { return e ? String((e && e.message) || e).slice(0, 220) : 'không rõ'; }

// Đọc file qua route stream ảo — hiện tiến độ %, kiểm đủ byte, ghi thẳng vào buffer đích
async function fetchLocalFile(f) {
    const resp = await fetch('https://appassets.local/__localfile__?path=' + encodeURIComponent(f.uri), { cache: 'no-store' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const total = parseInt(resp.headers.get('Content-Length'), 10) || f.size || 0;
    let buf = null, got = 0, lastUi = 0;
    const progress = () => {
        const now = performance.now();
        if (now - lastUi > 200) {
            lastUi = now;
            const pct = total ? Math.min(99, Math.round(got / total * 100)) : 0;
            document.getElementById('loading-text').textContent =
                `Đang đọc file: ${formatBytes(got)}${total ? ' / ' + formatBytes(total) + ' (' + pct + '%)' : ''}`;
        }
    };
    if (resp.body && resp.body.getReader) {
        const reader = resp.body.getReader();
        if (total > 0) {
            // Biết trước dung lượng → cấp phát 1 lần, ghi thẳng: RAM đỉnh = 1 bản file.
            // (Bản cũ gom danh sách chunk rồi mới ghép → đỉnh ~2 bản, file lớn dễ sập ngay khâu đọc.)
            buf = new Uint8Array(total);
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (got + value.byteLength > total) throw new Error('luồng trả thừa byte so với Content-Length');
                buf.set(value, got); got += value.byteLength;
                progress();
            }
        } else {
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value); got += value.byteLength;
                progress();
            }
            buf = new Uint8Array(got); let off = 0;
            for (let ci = 0; ci < chunks.length; ci++) { buf.set(chunks[ci], off); off += chunks[ci].byteLength; chunks[ci] = null; }
            chunks.length = 0;
        }
    } else {
        buf = new Uint8Array(await resp.arrayBuffer());
        got = buf.byteLength;
    }
    if (!got) throw new Error('đọc được 0 byte');
    // Luồng bị cắt giữa chừng (WebView hủy stream khi cạn RAM / kẹt I/O) → dữ liệu cụt.
    // Bản cũ vẫn đưa dữ liệu cụt cho engine → lỗi parse khó hiểu. Nay bắt đúng bệnh tại đây.
    if (total && got !== total) throw new Error('luồng bị đứt: mới nhận ' + formatBytes(got) + ' / ' + formatBytes(total));
    const ab = buf.buffer; buf = null;
    return ab;
}

// Dự phòng cho APK v2.7+: đọc từng khúc 8MB qua cầu nối chunk (Java mỗi lần chỉ giữ 1 khúc)
async function readNativeChunked(f) {
    const CH = 8 * 1048576;
    const out = new Uint8Array(f.size);
    let off = 0;
    while (off < f.size) {
        const b64 = AndroidIFC.readFileChunkB64(f.uri, String(off), CH); // offset dạng chuỗi: JS→Java không truyền được long
        if (!b64) throw new Error('cầu nối chunk trả về rỗng tại vị trí ' + formatBytes(off));
        const bin = atob(b64);
        for (let j = 0; j < bin.length; j++) out[off + j] = bin.charCodeAt(j);
        off += bin.length;
        document.getElementById('loading-text').textContent = 'Đọc dự phòng: ' + formatBytes(off) + ' / ' + formatBytes(f.size);
        await new Promise(r => setTimeout(r, 0)); // nhả main thread cho UI kịp vẽ tiến độ
    }
    return out;
}

// Dự phòng bản cũ (chỉ file ≤ 64MB): cầu base64 một phát
function readNativeB64Once(f) {
    const b64 = AndroidIFC.readFileBase64(f.uri);
    if (!b64) throw new Error('cầu nối base64 trả về rỗng (file quá 64MB hoặc không đọc được đường dẫn)');
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
    return bytes;
}

// ── Gắn sự kiện cho nút quét & màn hình chờ ──
document.getElementById('welcome-open').onclick = () => document.getElementById('file-input').click();
document.getElementById('welcome-scan').onclick = () => scanIFC();
document.getElementById('scan-btn-container').onclick = () => {
    // Nếu đã từng quét → mở lại danh sách cũ ngay; chưa có thì quét mới
    if (scannedFiles.length) showFileList(document.getElementById('flp-hint').textContent);
    else scanIFC();
};
document.getElementById('flp-rescan').onclick = (e) => { e.stopPropagation(); scanIFC(); };
document.getElementById('flp-close').onclick = () => closeFileList();
flBackdrop.onclick = () => closeFileList();



// ═══ TÌM KIẾM CẤU KIỆN (theo tên/mã, mỗi dòng một tên) ═══════════════════════
// Khớp theo Name và Tag của IFC (mã cấu kiện DC-01, PL-12... thường nằm ở đây).
// Khi tìm: làm mờ mọi cấu kiện KHÔNG khớp (đổi instanceColor về màu gần nền),
// cấu kiện khớp giữ nguyên màu → nổi bật, và camera tự bay tới nhóm tìm thấy.
let nameIndex = null;        // [{id, nm, tg}] — chỉ các id có hình học
let dimmedByFrag = null;     // Map(frag → [ids đã làm mờ]) để khôi phục đúng

function buildNameIndexSync() {
    const gset = new Set();
    for (const f of currentModel.items) for (const id of f.ids) gset.add(id);
    nameIndex = [];
    if (propPack) { // đường chính: danh sách tên đã gom sẵn lúc nén thuộc tính
        for (const row of propPack.names) if (gset.has(row.id)) nameIndex.push(row);
        return;
    }
    const props = currentModel.getLocalProperties() || {}; // dự phòng nếu chưa nén
    for (const key in props) {
        const id = parseInt(key, 10);
        if (!gset.has(id)) continue;
        const e = props[key];
        if (!e) continue;
        const nm = (e.Name && e.Name.value != null) ? String(e.Name.value).toLowerCase() : '';
        const tg = (e.Tag && e.Tag.value != null) ? String(e.Tag.value).toLowerCase() : '';
        if (nm || tg) nameIndex.push({ id, nm, tg });
    }
}

function clearSearchDim(notify) {
    if (dimmedByFrag && currentModel) {
        for (const [frag, ids] of dimmedByFrag) {
            try { frag.resetColor(ids); } catch (e) {}
        }
    }
    dimmedByFrag = null;
    clearSearchHL();
    $('search-result').textContent = '';
    if (notify) toast(t('searchCleared'), 1600);
}

// ─── VIỀN VÀNG PHÁT SÁNG cho cấu kiện khớp tìm kiếm ─────────────────────────
// EdgesGeometry chỉ dựng 1 lần cho mỗi KHỐI HÌNH dùng chung (nghìn bu lông giống
// nhau = 1 geometry), mỗi chi tiết khớp là 1 LineSegments đặt theo ma trận instance.
const edgeGeoCache = new Map(); // geometry.uuid → EdgesGeometry
let searchHL = null;            // THREE.Group chứa toàn bộ viền vàng
const searchHLMat = new THREE.LineBasicMaterial({
    color: 0xffd60a, depthTest: false, transparent: true, opacity: 0.95,
});
const SEARCH_HL_MAX = 1500; // trần số viền (nghìn bu lông khớp → chỉ viền 1500 cái đầu, vẫn đủ nổi)

function edgesFor(geom) {
    let g = edgeGeoCache.get(geom.uuid);
    if (!g) { g = new THREE.EdgesGeometry(geom, 25); edgeGeoCache.set(geom.uuid, g); }
    return g;
}
function clearSearchHL() {
    if (!searchHL) return;
    world.scene.three.remove(searchHL);
    searchHL = null; // geometry nằm trong cache dùng chung — không dispose ở đây
}
// Dựng nhóm viền vàng cho một tập expressID bất kỳ (dùng chung cho TÌM KIẾM và CHỌN LỰA)
function buildOutlineGroup(idSet) {
    const group = new THREE.Group();
    const im = new THREE.Matrix4();
    let n = 0;
    try {
        for (const frag of currentModel.items) {
            if (n >= SEARCH_HL_MAX) break;
            const mesh = frag.mesh;
            if (!mesh?.geometry) continue;
            let eg = null; // dựng lười — fragment không có chi tiết khớp thì khỏi tốn công
            for (const id of idSet) {
                const insts = frag.itemToInstances?.get?.(id);
                if (!insts) continue;
                if (!eg) eg = edgesFor(mesh.geometry);
                for (const idx of insts) {
                    mesh.getMatrixAt(idx, im);
                    const seg = new THREE.LineSegments(eg, searchHLMat);
                    seg.matrixAutoUpdate = false;
                    seg.matrix.copy(mesh.matrixWorld).multiply(im);
                    seg.renderOrder = 995;
                    seg.frustumCulled = false;
                    group.add(seg);
                    if (++n >= SEARCH_HL_MAX) break;
                }
                if (n >= SEARCH_HL_MAX) break;
            }
        }
    } catch (e) { console.warn('outline:', e); }
    return { group, count: n };
}
function buildSearchHL(found) {
    clearSearchHL();
    const { group, count } = buildOutlineGroup(found);
    if (group.children.length) { searchHL = group; world.scene.three.add(group); }
    return count;
}

async function runSearch() {
    if (!currentModel) return;
    const lines = $('search-input').value.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!lines.length) return;
    const exact = $('search-exact').checked;
    if (!nameIndex) {
        toast(t('searchIndexing'), 4000);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        try { buildNameIndexSync(); } catch (e) { console.warn('index:', e); nameIndex = []; }
    }
    const found = new Set();
    const hitLines = new Set();
    for (const e of nameIndex) {
        for (const q of lines) {
            const ok = exact ? (e.nm === q || e.tg === q)
                             : ((e.nm && e.nm.includes(q)) || (e.tg && e.tg.includes(q)));
            if (ok) { found.add(e.id); hitLines.add(q); break; }
        }
    }
    clearSearchDim(false); // gỡ kết quả cũ trước
    if (!found.size) {
        $('search-result').textContent = '✗ ' + t('searchNone');
        return;
    }
    // Kiểu Tekla: mô hình GIỮ NGUYÊN MÀU, cấu kiện khớp nổi bật bằng viền vàng
    // phát sáng xuyên thấu (không làm tối phần còn lại nữa).
    buildSearchHL(found);
    // Bay camera tới nhóm cấu kiện tìm thấy
    try {
        const map = currentModel.getFragmentMap([...found]);
        boxer.reset();
        boxer.addFragmentIdMap(map);
        const sp = boxer.get().getBoundingSphere(new THREE.Sphere());
        boxer.reset();
        if (isFinite(sp.radius) && sp.radius > 0) {
            sp.radius = Math.max(sp.radius * 1.2, 0.3);
            world.camera.controls.fitToSphere(sp, true);
        }
    } catch (e) {}
    const missing = lines.filter(q => !hitLines.has(q));
    let msg = t('searchResult', found.size.toLocaleString(LANG), hitLines.size, lines.length);
    if (missing.length) msg += '\n✗ ' + t('searchMiss') + missing.join(', ');
    $('search-result').textContent = msg;
    toast(t('searchResult', found.size.toLocaleString(LANG), hitLines.size, lines.length), 3200);
    closeSearch(); // đóng panel để nhìn mô hình ngay
}

function openSearch() {
    if (!currentModel) return;
    $('search-panel').classList.add('show');
    $('search-backdrop').classList.add('show');
}
function closeSearch() {
    $('search-panel').classList.remove('show');
    $('search-backdrop').classList.remove('show');
}
$('btn-search').onclick = openSearch;
$('search-close').onclick = closeSearch;
$('search-backdrop').onclick = closeSearch;
$('search-run').onclick = () => runSearch();
$('btn-export-lite').onclick = () => exportIfcLite();
if (!IS_PC) $('btn-export-lite').style.display = 'none';
$('search-clearbtn').onclick = () => { clearSearchDim(true); };

// ─── Sẵn sàng ───
$('welcome-open').disabled = false;
$('welcome-scan').disabled = false;
applyLang();
$('btn-selmode').classList.toggle('on', selMode === 'assembly');
$('welcome-status').textContent = t('ready') + (IS_PC
    ? (MT_ON ? ' · ⚡ Đa luồng: BẬT (' + (navigator.hardwareConcurrency || '?') + ' nhân CPU)' : ' · 🐢 Đơn luồng')
    : '');


// ═══ EasyPDF v2.89: CHẠY NHÚNG TRONG EASYPDF ════════════════════════════════
// Trang được EasyPDF mở trong <iframe src="ifc/index.html?embed=1">. Khối này chạy SAU khi
// engine đã sẵn sàng (sau các lệnh await cấp cao ở trên), nên báo "ready" là an toàn.
// Giao tiếp chỉ bằng postMessage cùng nguồn gốc; không dùng chung biến với EasyPDF.
const EMBED = (() => { try { return new URLSearchParams(location.search).get('embed') === '1' && window.parent !== window; } catch (e) { return false; } })();
if (EMBED) {
    document.body.classList.add('embed');
    const toParent = (msg) => { try { window.parent.postMessage(msg, location.origin); } catch (e) {} };
    $('ddc-back').addEventListener('click', () => toParent({ type: 'easypdf-ifc-close' }));
    window.addEventListener('message', async (ev) => {
        if (ev.origin !== location.origin || ev.source !== window.parent) return;
        const d = ev.data || {};
        if (d.type !== 'easypdf-ifc-open' || !d.file) return;
        try { await loadIfcFile(d.file, d.name || d.file.name); }
        catch (e) { console.error('EasyPDF → IFC:', e); }
    });
    toParent({ type: 'easypdf-ifc-ready' });
}
