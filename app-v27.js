
try {
  const earlyStatusEl = document.querySelector("#onlineStatus");
  if (earlyStatusEl) earlyStatusEl.textContent = navigator.onLine ? "Online" : "Offline";
} catch (error) {
  console.warn("Early status update failed", error);
}

const STORAGE_KEY = "tinh-tien-tro-offline-v1";

const state = loadState();
let tempDefaultFees = [];
let tempInvoiceFees = [];
let currentInvoiceId = null;

const BANK_OPTIONS = [
  { bankId: "970436", bankName: "VCB", label: "Vietcombank (VCB)" },
  { bankId: "970422", bankName: "MBBank", label: "MB Bank (MBBank)" },
  { bankId: "970415", bankName: "VietinBank", label: "VietinBank" },
  { bankId: "970418", bankName: "BIDV", label: "BIDV" },
  { bankId: "970405", bankName: "Agribank", label: "Agribank" },
  { bankId: "970407", bankName: "Techcombank", label: "Techcombank" },
  { bankId: "970416", bankName: "ACB", label: "ACB" },
  { bankId: "970423", bankName: "TPBank", label: "TPBank" },
  { bankId: "970432", bankName: "VPBank", label: "VPBank" },
  { bankId: "970403", bankName: "Sacombank", label: "Sacombank" },
  { bankId: "970441", bankName: "VIB", label: "VIB" },
  { bankId: "970426", bankName: "MSB", label: "MSB" },
  { bankId: "970448", bankName: "OCB", label: "OCB" },
  { bankId: "970414", bankName: "OceanBank", label: "OceanBank" },
  { bankId: "970429", bankName: "SCB", label: "SCB" },
  { bankId: "970443", bankName: "SHB", label: "SHB" },
  { bankId: "970431", bankName: "Eximbank", label: "Eximbank" },
  { bankId: "970406", bankName: "DongABank", label: "DongA Bank" },
  { bankId: "970425", bankName: "ABBANK", label: "ABBANK" },
  { bankId: "970427", bankName: "VietABank", label: "VietABank" }
];

const DEFAULT_PAYMENT_CONFIG = {
  bankId: "970436",
  bankName: "VCB",
  accountNo: "1031514285",
  accountName: "NGUYEN BAO THANG"
};

function getPaymentConfig() {
  const saved = state.settings?.payment || {};
  return {
    bankId: String(saved.bankId || DEFAULT_getPaymentConfig().bankId).trim(),
    bankName: String(saved.bankName || DEFAULT_getPaymentConfig().bankName).trim(),
    accountNo: String(saved.accountNo || DEFAULT_getPaymentConfig().accountNo).trim(),
    accountName: String(saved.accountName || DEFAULT_getPaymentConfig().accountName).trim()
  };
}
function normalizeBankId(bankId) {
  const value = String(bankId || "").trim().toLowerCase();
  const aliases = {
    vietcombank: "970436",
    vcb: "970436",
    mbbank: "970422",
    mb: "970422",
    vietinbank: "970415",
    bidv: "970418",
    agribank: "970405",
    techcombank: "970407",
    tcb: "970407",
    acb: "970416",
    tpbank: "970423",
    vpbank: "970432",
    sacombank: "970403",
    vib: "970441",
    msb: "970426",
    ocb: "970448",
    oceanbank: "970414",
    scb: "970429",
    shb: "970443",
    eximbank: "970431",
    eib: "970431",
    dongabank: "970406",
    abb: "970425",
    abbank: "970425",
    vietabank: "970427"
  };
  return aliases[value] || String(bankId || "").trim();
}

function findBankOption(bankId) {
  const normalized = normalizeBankId(bankId);
  return BANK_OPTIONS.find((bank) => bank.bankId === normalized);
}

function renderBankSelect() {
  const select = $("#paymentBankSelect");
  if (!select) return;

  const current = normalizeBankId($("#paymentBankId")?.value || state.settings?.payment?.bankId || DEFAULT_PAYMENT_CONFIG.bankId);
  const matched = findBankOption(current);
  select.value = matched ? matched.bankId : "__custom__";
}

function applySelectedBankToPaymentFields() {
  const select = $("#paymentBankSelect");
  if (!select || select.value === "__custom__") return;

  const bank = BANK_OPTIONS.find((item) => item.bankId === select.value);
  if (!bank) return;

  const bankIdInput = $("#paymentBankId");
  const bankNameInput = $("#paymentBankName");
  if (bankIdInput) bankIdInput.value = bank.bankId;
  if (bankNameInput) bankNameInput.value = bank.bankName;
}



function setPaymentConfig(config) {
  state.settings ||= {};
  state.settings.payment = {
    bankId: String(config.bankId || "").trim() || DEFAULT_getPaymentConfig().bankId,
    bankName: String(config.bankName || "").trim() || DEFAULT_getPaymentConfig().bankName,
    accountNo: String(config.accountNo || "").trim() || DEFAULT_getPaymentConfig().accountNo,
    accountName: String(config.accountName || "").trim() || DEFAULT_getPaymentConfig().accountName
  };
  saveState();
}

function renderPaymentSettings() {
  const config = getPaymentConfig();

  const bankIdInput = $("#paymentBankId");
  const bankNameInput = $("#paymentBankName");
  const accountNoInput = $("#paymentAccountNo");
  const accountNameInput = $("#paymentAccountName");

  if (bankIdInput) bankIdInput.value = config.bankId;
  if (bankNameInput) bankNameInput.value = config.bankName;
  if (accountNoInput) accountNoInput.value = config.accountNo;
  if (accountNameInput) accountNameInput.value = config.accountName;

  renderBankSelect();

  const info = $("#paymentCurrentInfo");
  if (info) {
    info.textContent = `${config.bankName} • Mã ${config.bankId} • STK ${config.accountNo} • ${config.accountName}`;
  }
}

function savePaymentSettings() {
  applySelectedBankToPaymentFields();
  setPaymentConfig({
    bankId: $("#paymentBankId").value,
    bankName: $("#paymentBankName").value,
    accountNo: $("#paymentAccountNo").value,
    accountName: $("#paymentAccountName").value
  });
  renderPaymentSettings();
  alert("Đã lưu tài khoản thanh toán. QR hóa đơn mới sẽ dùng thông tin này.");
}

function resetPaymentSettings() {
  setPaymentConfig(DEFAULT_PAYMENT_CONFIG);
  renderPaymentSettings();
  alert("Đã khôi phục tài khoản thanh toán mặc định.");
}

function buildTransferContent(invoice) {
  const room = invoice?.roomSnapshot || {};
  const rawRoomNo = String(room.roomNumber || "").trim() || "1";
  const cleanRoomNo = rawRoomNo.replace(/^p/i, "");
  const [year = "", month = ""] = String(invoice?.month || "").split("-");
  const displayMonth = month && year ? `${month}-${year}` : monthLabel(invoice?.month || "").replace("/", "-");
  return `P${cleanRoomNo} ${displayMonth}`.trim();
}

function getVietQrUrl(invoice) {
  const amount = Math.round(Number(invoice?.total || 0));
  const addInfo = buildTransferContent(invoice);
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: getPaymentConfig().accountName
  });
  return `https://img.vietqr.io/image/${getPaymentConfig().bankId}-${getPaymentConfig().accountNo}-compact2.png?${params.toString()}`;
}

function loadImageAsync(src, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let done = false;

    const finish = (callback, value) => {
      if (done) return;
      done = true;
      callback(value);
    };

    const timer = setTimeout(() => {
      finish(reject, new Error("QR tải quá lâu"));
    }, timeoutMs);

    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timer);
      finish(resolve, img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(reject, new Error("Không tải được QR"));
    };
    img.src = src;
  });
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function blankState() {
  return {
    rooms: [],
    invoices: [],
    settings: {
      landlordName: "",
      createdAt: new Date().toISOString()
    }
  };
}

function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data || typeof data !== "object") return blankState();
    data.rooms ||= [];
    data.invoices ||= [];
    data.settings ||= {};
    return data;
  } catch {
    return blankState();
  }
}



function syncStateFromStorage() {
  const latest = loadState();
  state.rooms.splice(0, state.rooms.length, ...(latest.rooms || []));
  state.invoices.splice(0, state.invoices.length, ...(latest.invoices || []));
  state.settings = latest.settings || {};
}


function repairRoomsFromInvoices() {
  if (!state.invoices.length) return false;

  const existingRoomIds = new Set(state.rooms.map((room) => room.id));
  const latestByRoomId = new Map();

  [...state.invoices]
    .sort((a, b) => a.month.localeCompare(b.month))
    .forEach((invoice) => {
      const snapshot = invoice.roomSnapshot;
      if (!snapshot || !invoice.roomId) return;
      latestByRoomId.set(invoice.roomId, {
        ...snapshot,
        id: invoice.roomId
      });
    });

  let changed = false;

  latestByRoomId.forEach((room, roomId) => {
    if (existingRoomIds.has(roomId)) return;

    state.rooms.push({
      id: roomId,
      roomNumber: room.roomNumber || "",
      tenantName: room.tenantName || "Chưa nhập tên",
      tenantNote: room.tenantNote || "",
      roomRent: Number(room.roomRent || 0),
      electricRate: Number(room.electricRate || 0),
      waterRate: Number(room.waterRate || 0),
      fixedFee: Number(room.fixedFee || 0),
      defaultFees: Array.isArray(room.defaultFees) ? room.defaultFees : []
    });

    changed = true;
  });

  if (changed) {
    state.rooms.sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), "vi", { numeric: true }));
    saveState();
  }

  return changed;
}


function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix = "id") {
  if (crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString("vi-VN") + " đ";
}

function safeNumber(value) {
  return Number(value ?? 0);
}

function parseMoneyValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  // Cho phép người dùng nhập 1,000,000 hoặc 1.000.000
  const cleaned = raw.replace(/[^0-9-]/g, "");
  return Number(cleaned || 0);
}

function formatInputMoney(value) {
  const number = parseMoneyValue(value);
  if (!number) return "";
  return number.toLocaleString("en-US");
}

function setMoneyInputValue(selector, value) {
  const el = $(selector);
  if (!el) return;
  el.value = Number(value || 0) ? Number(value || 0).toLocaleString("en-US") : "";
}

function numberValue(selector) {
  const el = $(selector);
  if (!el) return 0;
  return el.classList.contains("money-input")
    ? parseMoneyValue(el.value)
    : Number(el.value || 0);
}


function setupOneMoneyInput(input) {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = formatInputMoney(input.value);
  });
  input.addEventListener("blur", () => {
    input.value = formatInputMoney(input.value);
  });
}


function setupMoneyInputs() {
  $$(".money-input").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = formatInputMoney(input.value);
    });

    input.addEventListener("blur", () => {
      input.value = formatInputMoney(input.value);
    });
  });
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(yyyyMM) {
  if (!yyyyMM) return "";
  const [y, m] = yyyyMM.split("-");
  return `${m}/${y}`;
}

function monthOptionLabel(yyyyMM) {
  if (!yyyyMM) return "";
  const [year, month] = yyyyMM.split("-");
  return `Tháng ${month}/${year}`;
}

function getMonthSelectYears() {
  const nowYear = new Date().getFullYear();
  const years = new Set([nowYear - 1, nowYear, nowYear + 1, nowYear + 2, nowYear + 3]);

  state.invoices.forEach((invoice) => {
    if (!invoice.month) return;
    const year = Number(String(invoice.month).slice(0, 4));
    if (year) {
      years.add(year - 1);
      years.add(year);
      years.add(year + 1);
    }
  });

  const suggested = typeof getSuggestedNextMonth === "function" ? getSuggestedNextMonth() : currentMonth();
  const suggestedYear = Number(String(suggested).slice(0, 4));
  if (suggestedYear) {
    years.add(suggestedYear - 1);
    years.add(suggestedYear);
    years.add(suggestedYear + 1);
  }

  return [...years].sort((a, b) => a - b);
}

function fillMonthSelect(selector, selectedValue = "", allowBlank = false) {
  const select = $(selector);
  if (!select) return;

  const currentSelected = selectedValue || select.value || "";
  const years = getMonthSelectYears();
  select.innerHTML = "";
  select.classList.add("month-select");

  if (allowBlank) {
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Tất cả tháng";
    select.appendChild(blank);
  }

  years.forEach((year) => {
    for (let month = 1; month <= 12; month++) {
      const value = `${year}-${String(month).padStart(2, "0")}`;
      const option = document.createElement("option");
      option.value = value;
      option.textContent = monthOptionLabel(value);
      select.appendChild(option);
    }
  });

  if (currentSelected && [...select.options].some((option) => option.value === currentSelected)) {
    select.value = currentSelected;
  } else if (!allowBlank) {
    const fallback = selector === "#monthlyMonth" ? getSuggestedNextMonth() : currentMonth();
    select.value = [...select.options].some((option) => option.value === fallback)
      ? fallback
      : select.options[0]?.value || "";
  }
}

function refreshMonthSelectOptions() {
  fillMonthSelect("#invoiceMonth", $("#invoiceMonth")?.value || currentMonth(), false);
  fillMonthSelect("#monthlyMonth", $("#monthlyMonth")?.value || getSuggestedNextMonth(), false);
  fillMonthSelect("#historyMonth", $("#historyMonth")?.value || "", true);
}



function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function resetInvoiceForm() {
  currentInvoiceId = null;
  const room = state.rooms[0] || null;
  refreshInvoiceRoomSelect();
  if (room) {
    $("#invoiceRoomSelect").value = room.id;
  }
  fillMonthSelect("#invoiceMonth", currentMonth(), false);
  tempInvoiceFees = room ? getNonWifiDefaultFees(room).map((x) => ({ ...x, id: uid("fee") })) : [];
  updateInvoiceWifiUI(room, false);
  $("#electricOld").value = "";
  $("#electricNew").value = "";
  $("#waterOld").value = "";
  $("#waterNew").value = "";
  $("#invoiceNote").value = "";
  $("#invoiceStatus").textContent = "";
  renderInvoiceFees();
  renderInvoicePreview();
}


function setButtonBusy(button, isBusy, busyText = "Đang tạo...") {
  if (!button) return;
  if (isBusy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    delete button.dataset.originalText;
  }
}

function renderQrPayment(invoice) {
  const card = $("#qrPaymentCard");
  const img = $("#qrPaymentImage");
  if (!card || !img || !invoice) return;

  img.src = getVietQrUrl(invoice);
  $("#qrBankName").textContent = getPaymentConfig().bankName;
  $("#qrAccountNo").textContent = getPaymentConfig().accountNo;
  $("#qrAccountName").textContent = getPaymentConfig().accountName;
  $("#qrAmount").textContent = money(invoice.total);
  $("#qrAddInfo").textContent = buildTransferContent(invoice);
  card.style.display = "block";
}

function clearQrPayment() {
  const card = $("#qrPaymentCard");
  const img = $("#qrPaymentImage");
  if (img) img.removeAttribute("src");
  if (card) card.style.display = "none";
}

function showSavedInvoiceImage(dataUrl, fileName = "hoa-don-tien-tro.png", invoice = null) {
  const img = $("#savedInvoiceImageOutput");
  const link = $("#savedDownloadImageLink");
  const empty = $("#savedImageEmpty");
  const card = $("#savedImageCard");

  if (!img || !link || !empty || !card) return;

  img.src = dataUrl;
  link.href = dataUrl;
  link.download = fileName;
  empty.style.display = "none";
  card.style.display = "block";
  if (invoice) renderQrPayment(invoice);
  switchScreen("imageScreen");
}

function clearSavedInvoiceImage() {
  const img = $("#savedInvoiceImageOutput");
  const empty = $("#savedImageEmpty");
  const card = $("#savedImageCard");
  if (img) img.removeAttribute("src");
  if (empty) empty.style.display = "block";
  if (card) card.style.display = "none";
  clearQrPayment();
}


function switchScreen(screenId) {
  $$(".screen").forEach((screen) => screen.classList.remove("active"));
  $(`#${screenId}`).classList.add("active");

  $$(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === screenId);
  });

  if (screenId === "monthlyScreen") {
    refreshMonthlyScreen();
    setTimeout(refreshMonthlyScreen, 50);
  }

  if (screenId === "invoiceScreen") {
    resetInvoiceForm();
  }

  if (screenId === "historyScreen") {
    refreshHistoryFilters();
    renderHistory();
  }

  if (screenId === "paymentScreen") {
    renderPaymentSettings();
  }
}

function setupTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchScreen(tab.dataset.screen));
  });
}

function renderDefaultFees() {
  const wrap = $("#defaultFeesList");
  wrap.innerHTML = "";

  if (!tempDefaultFees.length) {
    wrap.innerHTML = `<p class="empty">Chưa có phí mặc định.</p>`;
    return;
  }

  tempDefaultFees.forEach((fee, index) => {
    const row = document.createElement("div");
    row.className = "fee-item";
    row.innerHTML = `
      <div class="name">${escapeHtml(fee.name)}</div>
      <div class="amount">${money(fee.amount)}</div>
      <button class="danger small" type="button">Xóa</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      tempDefaultFees.splice(index, 1);
      renderDefaultFees();
    });
    wrap.appendChild(row);
  });
}

function addDefaultFee() {
  const name = $("#defaultFeeName").value.trim();
  const amount = numberValue("#defaultFeeAmount");

  if (!name) {
    alert("Nhập tên phí trước nha.");
    return;
  }

  tempDefaultFees.push({ id: uid("fee"), name, amount });
  $("#defaultFeeName").value = "";
  $("#defaultFeeAmount").value = "";
  renderDefaultFees();
}

function resetRoomForm() {
  $("#roomEditId").value = "";
  $("#roomNumber").value = "";
  $("#tenantName").value = "";
  $("#tenantNote").value = "";
  $("#roomRent").value = "";
  $("#electricRate").value = "";
  $("#waterRate").value = "";
  $("#fixedFee").value = "";
  if ($("#wifiFee")) $("#wifiFee").value = "";
  $("#saveRoomBtn").textContent = "Lưu phòng";
  tempDefaultFees = [];
  renderDefaultFees();
}

function saveRoom() {
  const id = $("#roomEditId").value || uid("room");
  const roomNumber = $("#roomNumber").value.trim();
  const tenantName = $("#tenantName").value.trim();

  if (!roomNumber) {
    alert("Nhập số phòng trước nha.");
    return;
  }

  if (!tenantName) {
    alert("Nhập tên chủ phòng / người thuê trước nha.");
    return;
  }

  const room = {
    id,
    roomNumber,
    tenantName,
    tenantNote: $("#tenantNote").value.trim(),
    roomRent: numberValue("#roomRent"),
    electricRate: numberValue("#electricRate"),
    waterRate: numberValue("#waterRate"),
    fixedFee: numberValue("#fixedFee"),
    wifiFee: numberValue("#wifiFee"),
    defaultFees: tempDefaultFees.filter((x) => !isWifiFee(x)).map((x) => ({ ...x }))
  };

  const index = state.rooms.findIndex((r) => r.id === id);
  if (index >= 0) state.rooms[index] = room;
  else state.rooms.push(room);

  state.rooms.sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), "vi", { numeric: true }));
  saveState();
  resetRoomForm();
  renderRooms();
  refreshInvoiceRoomSelect();
  refreshHistoryFilters();
}

function editRoom(id) {
  const room = state.rooms.find((r) => r.id === id);
  if (!room) return;

  $("#roomEditId").value = room.id;
  $("#roomNumber").value = room.roomNumber;
  $("#tenantName").value = room.tenantName;
  $("#tenantNote").value = room.tenantNote || "";
  setMoneyInputValue("#roomRent", room.roomRent);
  setMoneyInputValue("#electricRate", room.electricRate);
  setMoneyInputValue("#waterRate", room.waterRate);
  setMoneyInputValue("#fixedFee", room.fixedFee);
  if ($("#wifiFee")) setMoneyInputValue("#wifiFee", getRoomWifiFee(room));
  tempDefaultFees = getNonWifiDefaultFees(room).map((x) => ({ ...x }));
  $("#saveRoomBtn").textContent = "Cập nhật phòng";
  renderDefaultFees();
  switchScreen("roomsScreen");
}

function deleteRoom(id) {
  const room = state.rooms.find((r) => r.id === id);
  if (!room) return;

  const relatedInvoices = state.invoices.filter((x) => x.roomId === id).length;
  const msg = relatedInvoices
    ? `Xóa phòng ${room.roomNumber}? Phòng này đang có ${relatedInvoices} hóa đơn đã lưu. Hóa đơn vẫn được giữ trong lịch sử.`
    : `Xóa phòng ${room.roomNumber}?`;

  if (!confirm(msg)) return;

  state.rooms = state.rooms.filter((r) => r.id !== id);
  saveState();
  renderRooms();
  refreshInvoiceRoomSelect();
  refreshHistoryFilters();
}

function renderRooms() {
  repairRoomsFromInvoices();
  const wrap = $("#roomsList");
  const empty = $("#emptyRooms");
  $("#roomCount").textContent = `${state.rooms.length} phòng`;

  wrap.innerHTML = "";
  empty.style.display = state.rooms.length ? "none" : "block";

  state.rooms.forEach((room) => {
    const card = document.createElement("div");
    card.className = "room-card";
    const feeParts = [];
    if (getRoomWifiFee(room) > 0) feeParts.push(`Wifi: ${money(getRoomWifiFee(room))}`);
    feeParts.push(...getNonWifiDefaultFees(room).map((f) => `${escapeHtml(f.name)}: ${money(f.amount)}`));
    const fees = feeParts.join(" • ");

    card.innerHTML = `
      <div class="room-title">
        <strong>Phòng ${escapeHtml(room.roomNumber)}</strong>
        <span class="pill" style="color:#0f172a;background:#e2e8f0;border:0">${money(room.roomRent)}</span>
      </div>
      <div class="room-meta">
        Người thuê: <b>${escapeHtml(room.tenantName)}</b><br>
        Điện: ${money(room.electricRate)}/số • Nước: ${money(room.waterRate)}/khối • Phí cố định: ${money(room.fixedFee)}<br>
        ${room.tenantNote ? `Ghi chú: ${escapeHtml(room.tenantNote)}<br>` : ""}
        ${fees ? `Phí mặc định: ${fees}` : "Chưa có phí mặc định khác."}
      </div>
      <div class="room-actions">
        <button class="secondary small edit">Sửa</button>
        <button class="ghost small make-invoice">Lập hóa đơn</button>
        <button class="danger small delete">Xóa</button>
      </div>
    `;

    card.querySelector(".edit").addEventListener("click", () => editRoom(room.id));
    card.querySelector(".delete").addEventListener("click", () => deleteRoom(room.id));
    card.querySelector(".make-invoice").addEventListener("click", () => {
      switchScreen("invoiceScreen");
      $("#invoiceRoomSelect").value = room.id;
      loadInvoiceFormForRoomAndMonth();
    });

    wrap.appendChild(card);
  });
}

function refreshInvoiceRoomSelect() {
  const select = $("#invoiceRoomSelect");
  select.innerHTML = "";

  if (!state.rooms.length) {
    select.innerHTML = `<option value="">Chưa có phòng</option>`;
    renderInvoiceFees();
    return;
  }

  state.rooms.forEach((room) => {
    const opt = document.createElement("option");
    opt.value = room.id;
    opt.textContent = `Phòng ${room.roomNumber} - ${room.tenantName}`;
    select.appendChild(opt);
  });
}

function getSelectedRoom() {
  const id = $("#invoiceRoomSelect").value;
  return state.rooms.find((r) => r.id === id) || state.rooms[0] || null;
}

function getPreviousInvoice(roomId, month) {
  return state.invoices
    .filter((x) => x.roomId === roomId && x.month < month)
    .sort((a, b) => b.month.localeCompare(a.month))[0];
}

function findInvoice(roomId, month) {
  return state.invoices.find((x) => x.roomId === roomId && x.month === month);
}

function renderInvoiceFees() {
  const wrap = $("#invoiceFeesList");
  wrap.innerHTML = "";

  if (!tempInvoiceFees.length) {
    wrap.innerHTML = `<p class="empty">Chưa có phí khác.</p>`;
    return;
  }

  tempInvoiceFees.forEach((fee, index) => {
    const row = document.createElement("div");
    row.className = "fee-item";
    row.innerHTML = `
      <div class="name">${escapeHtml(fee.name)}</div>
      <div class="amount">${money(fee.amount)}</div>
      <button class="danger small" type="button">Xóa</button>
    `;
    row.querySelector("button").addEventListener("click", () => {
      tempInvoiceFees.splice(index, 1);
      renderInvoiceFees();
      renderInvoicePreview();
    });
    wrap.appendChild(row);
  });
}

function addInvoiceFee() {
  const name = $("#invoiceFeeName").value.trim();
  const amount = numberValue("#invoiceFeeAmount");

  if (!name) {
    alert("Nhập tên phí trước nha.");
    return;
  }

  tempInvoiceFees.push({ id: uid("fee"), name, amount });
  $("#invoiceFeeName").value = "";
  $("#invoiceFeeAmount").value = "";
  renderInvoiceFees();
  renderInvoicePreview();
}

function loadInvoiceFormForRoomAndMonth() {
  refreshMonthSelectOptions();
  const room = getSelectedRoom();
  const month = $("#invoiceMonth").value || currentMonth();
  fillMonthSelect("#invoiceMonth", month, false);

  currentInvoiceId = null;
  tempInvoiceFees = [];
  $("#electricOld").value = "";
  $("#electricNew").value = "";
  $("#waterOld").value = "";
  $("#waterNew").value = "";
  $("#invoiceNote").value = "";

  if (!room) {
    updateInvoiceWifiUI(null, false);
    renderInvoiceFees();
    renderInvoicePreview();
    return;
  }

  const savedInvoice = findInvoice(room.id, month);
  if (savedInvoice) {
    currentInvoiceId = savedInvoice.id;
    $("#electricOld").value = savedInvoice.electricOld ?? "";
    $("#electricNew").value = savedInvoice.electricNew ?? "";
    $("#waterOld").value = savedInvoice.waterOld ?? "";
    $("#waterNew").value = savedInvoice.waterNew ?? "";
    $("#invoiceNote").value = savedInvoice.note || "";
    tempInvoiceFees = getInvoiceNonWifiFees(savedInvoice).map((x) => ({ ...x }));
    updateInvoiceWifiUI(room, detectInvoiceWifiIncluded(savedInvoice, room));
    $("#invoiceStatus").textContent = "Đang sửa hóa đơn đã lưu";
  } else {
    const previous = getPreviousInvoice(room.id, month);
    if (previous) {
      $("#electricOld").value = previous.electricNew ?? "";
      $("#waterOld").value = previous.waterNew ?? "";
    }
    tempInvoiceFees = getNonWifiDefaultFees(room).map((x) => ({ ...x, id: uid("fee") }));
    updateInvoiceWifiUI(room, false);
    $("#invoiceStatus").textContent = "Hóa đơn mới";
  }

  renderInvoiceFees();
  renderInvoicePreview();
}

function buildInvoiceData() {
  const room = getSelectedRoom();
  const month = $("#invoiceMonth").value || currentMonth();

  if (!room) return null;

  const electricOld = numberValue("#electricOld");
  const electricNew = numberValue("#electricNew");
  const waterOld = numberValue("#waterOld");
  const waterNew = numberValue("#waterNew");

  const electricUsed = Math.max(0, electricNew - electricOld);
  const waterUsed = Math.max(0, waterNew - waterOld);

  const roomRent = Number(room.roomRent || 0);
  const electricAmount = electricUsed * Number(room.electricRate || 0);
  const waterAmount = waterUsed * Number(room.waterRate || 0);
  const fixedFee = Number(room.fixedFee || 0);
  const wifiIncluded = Boolean($("#invoiceHasWifi")?.checked);
  const extraFees = buildFinalExtraFees(room, tempInvoiceFees.map((x) => ({ ...x, amount: Number(x.amount || 0) })), wifiIncluded);
  const extraTotal = extraFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const total = roomRent + electricAmount + waterAmount + fixedFee + extraTotal;

  return {
    id: currentInvoiceId || uid("invoice"),
    roomId: room.id,
    roomSnapshot: { ...room },
    month,
    electricOld,
    electricNew,
    electricUsed,
    electricRate: Number(room.electricRate || 0),
    electricAmount,
    waterOld,
    waterNew,
    waterUsed,
    waterRate: Number(room.waterRate || 0),
    waterAmount,
    roomRent,
    fixedFee,
    extraFees,
    wifiIncluded,
    extraTotal,
    total,
    note: $("#invoiceNote").value.trim(),
    updatedAt: new Date().toISOString()
  };
}

function invoiceHTML(invoice) {
  if (!invoice) {
    return `<div class="invoice-paper"><p class="empty">Chưa có phòng. Hãy thêm phòng trước.</p></div>`;
  }

  const room = invoice.roomSnapshot || {};
  const rows = [
    {
      name: "Tiền phòng",
      desc: `Phòng ${escapeHtml(room.roomNumber || "")}`,
      amount: invoice.roomRent
    },
    {
      name: "Tiền điện",
      desc: `${invoice.electricNew} - ${invoice.electricOld} = ${invoice.electricUsed} số × ${money(invoice.electricRate)}`,
      amount: invoice.electricAmount
    },
    {
      name: "Tiền nước",
      desc: `${invoice.waterNew} - ${invoice.waterOld} = ${invoice.waterUsed} khối × ${money(invoice.waterRate)}`,
      amount: invoice.waterAmount
    }
  ];

  if (invoice.fixedFee) {
    rows.push({
      name: "Phí cố định",
      desc: "Rác / vệ sinh / phí chung",
      amount: invoice.fixedFee
    });
  }

  (invoice.extraFees || []).forEach((fee) => {
    rows.push({
      name: fee.name,
      desc: "Phí khác",
      amount: fee.amount
    });
  });

  return `
    <div class="invoice-paper">
      <div class="invoice-header">
        <h2>Hóa đơn tiền trọ</h2>
        <p>App Tính Trọ 416 Phan Huy Ích</p>
        <p>Tháng ${escapeHtml(monthLabel(invoice.month))}</p>
      </div>

      <div class="invoice-info">
        <div><b>Phòng:</b> ${escapeHtml(room.roomNumber || "")}</div>
        <div><b>Người thuê:</b> ${escapeHtml(room.tenantName || "")}</div>
        <div><b>Ngày lập:</b> ${new Date().toLocaleDateString("vi-VN")}</div>
        <div><b>Ghi chú phòng:</b> ${escapeHtml(room.tenantNote || "-")}</div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Khoản thu</th>
            <th>Chi tiết</th>
            <th class="money">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.name)}</td>
              <td>${row.desc}</td>
              <td class="money">${money(row.amount)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="2">Tổng cộng</td>
            <td class="money">${money(invoice.total)}</td>
          </tr>
        </tbody>
      </table>

      ${invoice.note ? `<p class="invoice-note"><b>Ghi chú:</b> ${escapeHtml(invoice.note)}</p>` : ""}

      <div class="invoice-reminder">VUI LÒNG THANH TOÁN ĐÚNG HẠN</div>
      <div class="payment-note">Lưu ý: chụp màn hình đã gửi sau khi thanh toán</div>

      <p class="creator-line">Created by ThangVoDich</p>
    </div>
  `;
}

function renderInvoicePreview() {
  const invoice = buildInvoiceData();
  $("#invoicePreview").innerHTML = invoiceHTML(invoice);
}



function isRealInvoiceObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.roomId &&
    value.roomSnapshot &&
    value.month
  );
}


function persistInvoice(invoice, options = {}) {
  const {
    updateInvoicePreview = true,
    updateMonthlyToNextMonth = true,
    showStatus = true
  } = options;

  const saved = upsertInvoice(invoice);
  saveState();

  if (showStatus && $("#invoiceStatus")) {
    $("#invoiceStatus").textContent = "Đã lưu";
  }

  if (updateInvoicePreview) {
    renderInvoicePreview();
  }

  refreshMonthSelectOptions();
  renderHistory();

  if ($("#monthlyMonth") && updateMonthlyToNextMonth) {
    fillMonthSelect("#monthlyMonth", addMonthsToYYYYMM(invoice.month, 1), false);
    renderMonthlyRooms();
  }

  return saved;
}

async function saveAndShowInvoiceImage(invoiceOverride = null) {
  const button = $("#makeImageBtn");

  try {
    setButtonBusy(button, true, "Đang tạo hóa đơn...");

    const invoice = isRealInvoiceObject(invoiceOverride) ? invoiceOverride : buildInvoiceData();

    if (!invoice) {
      alert("Chưa có hóa đơn để tạo hình.");
      return;
    }

    if (invoice.electricNew < invoice.electricOld) {
      alert("Số điện kỳ này nhỏ hơn kỳ trước. Kiểm tra lại nha.");
      return;
    }

    if (invoice.waterNew < invoice.waterOld) {
      alert("Số nước kỳ này nhỏ hơn kỳ trước. Kiểm tra lại nha.");
      return;
    }

    const saved = persistInvoice(invoice, {
      updateInvoicePreview: true,
      updateMonthlyToNextMonth: true,
      showStatus: true
    });

    await showInvoiceImage(saved);
    resetInvoiceForm();
    alert("Đã lưu hóa đơn gốc, tạo hình xong. Tab Tháng mới đã có dữ liệu kỳ trước cho tháng kế tiếp.");
  } catch (error) {
    console.error("Lỗi tạo hóa đơn:", error);
    alert("Không tạo được hóa đơn. Thử lại hoặc kiểm tra thông tin thanh toán trong tab Thanh toán.");
  } finally {
    setButtonBusy(button, false);
  }
}

function saveInvoice() {
  const invoice = buildInvoiceData();

  if (!invoice) {
    alert("Chưa có phòng để lập hóa đơn.");
    return;
  }

  if (invoice.electricNew < invoice.electricOld) {
    alert("Số điện kỳ này nhỏ hơn kỳ trước. Kiểm tra lại nha.");
    return;
  }

  if (invoice.waterNew < invoice.waterOld) {
    alert("Số nước kỳ này nhỏ hơn kỳ trước. Kiểm tra lại nha.");
    return;
  }

  const saved = persistInvoice(invoice, {
    updateInvoicePreview: true,
    updateMonthlyToNextMonth: true,
    showStatus: true
  });

  currentInvoiceId = saved.id;
  resetInvoiceForm();
  alert("Đã lưu hóa đơn và reset form.");
}

function printInvoice(invoiceOverride = null) {
  const invoice = invoiceOverride || buildInvoiceData();

  if (!invoice) {
    alert("Chưa có hóa đơn để in.");
    return;
  }

  $("#printArea").innerHTML = invoiceHTML(invoice);
  window.print();
}

function refreshHistoryFilters() {
  const select = $("#historyRoomSelect");
  const current = select.value;
  select.innerHTML = `<option value="">Tất cả phòng</option>`;

  state.rooms.forEach((room) => {
    const opt = document.createElement("option");
    opt.value = room.id;
    opt.textContent = `Phòng ${room.roomNumber}`;
    select.appendChild(opt);
  });

  if (current) select.value = current;
}

function renderHistory() {
  refreshMonthSelectOptions();
  const wrap = $("#historyList");
  const empty = $("#emptyHistory");
  const roomId = $("#historyRoomSelect").value;
  const month = $("#historyMonth").value;

  let invoices = [...state.invoices];
  if (roomId) invoices = invoices.filter((x) => x.roomId === roomId);
  if (month) invoices = invoices.filter((x) => x.month === month);

  wrap.innerHTML = "";
  empty.style.display = invoices.length ? "none" : "block";

  invoices.forEach((invoice) => {
    const room = invoice.roomSnapshot || {};
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-title">
        <strong>Phòng ${escapeHtml(room.roomNumber || "")} - ${monthLabel(invoice.month)}</strong>
        <span class="pill" style="color:#0f172a;background:#e2e8f0;border:0">${money(invoice.total)}</span>
      </div>
      <div class="history-meta">
        Người thuê: <b>${escapeHtml(room.tenantName || "")}</b><br>
        Điện: ${invoice.electricUsed} số • Nước: ${invoice.waterUsed} khối • Cập nhật: ${new Date(invoice.updatedAt).toLocaleString("vi-VN")}
      </div>
      <div class="history-actions">
        <button class="secondary small edit">Sửa</button>
        <button class="ghost small print">Tạo hình</button>
        <button class="danger small delete">Xóa hóa đơn</button>
      </div>
    `;

    card.querySelector(".edit").addEventListener("click", () => {
      switchScreen("invoiceScreen");
      refreshInvoiceRoomSelect();
      $("#invoiceRoomSelect").value = invoice.roomId;
      $("#invoiceMonth").value = invoice.month;
      loadInvoiceFormForRoomAndMonth();
    });

    card.querySelector(".print").addEventListener("click", () => showInvoiceImage(invoice));

    card.querySelector(".delete").addEventListener("click", () => {
      if (!confirm(`Xóa hóa đơn phòng ${room.roomNumber || ""} tháng ${monthLabel(invoice.month)}?`)) return;
      state.invoices = state.invoices.filter((x) => x.id !== invoice.id);
      saveState();
      renderHistory();
      loadInvoiceFormForRoomAndMonth();
    });

    wrap.appendChild(card);
  });
}

function exportBackup() {
  const data = {
    app: "tinh-tien-tro-offline",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-tinh-tien-tro-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importBackup(file) {
  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    const data = imported.data || imported;

    if (!data.rooms || !data.invoices) {
      alert("File backup không đúng định dạng.");
      return;
    }

    if (!confirm("Import backup sẽ thay dữ liệu hiện tại trên máy này. Tiếp tục?")) return;

    state.rooms = data.rooms || [];
    state.invoices = data.invoices || [];
    state.settings = data.settings || {};

    repairRoomsFromInvoices();
    saveState();
    resetRoomForm();
    renderAll();
    alert("Import xong.");
  } catch (error) {
    alert("Không đọc được file backup.");
  } finally {
    $("#importBackupFile").value = "";
  }
}

function clearAllData() {
  const ok = confirm("Xóa toàn bộ phòng và hóa đơn trên máy này?");
  if (!ok) return;

  const ok2 = confirm("Chắc chắn xóa hết? Không hoàn tác được nếu chưa export backup.");
  if (!ok2) return;

  localStorage.removeItem(STORAGE_KEY);
  const fresh = blankState();
  state.rooms = fresh.rooms;
  state.invoices = fresh.invoices;
  state.settings = fresh.settings;
  resetRoomForm();
  clearSavedInvoiceImage();
  renderAll();
}

function updateOnlineStatus() {
  const status = $("#onlineStatus");
  if (!status) return;
  status.textContent = navigator.onLine ? "Online" : "Offline";
}


function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text ?? "").split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? line + " " + words[i] : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}


function drawWrappedCenteredText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let y = startY;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) ctx.fillText(line, centerX, y);
  return y;
}

function drawMoney(ctx, text, xRight, y) {
  ctx.textAlign = "right";
  ctx.fillText(text, xRight, y);
  ctx.textAlign = "left";
}

function buildInvoiceRows(invoice) {
  const room = invoice.roomSnapshot || {};
  const rows = [
    {
      name: "Tiền phòng",
      detail: `Phòng ${room.roomNumber || ""}`,
      amount: invoice.roomRent
    },
    {
      name: "Tiền điện",
      detail: `${safeNumber(invoice.electricNew)} - ${safeNumber(invoice.electricOld)} = ${safeNumber(invoice.electricUsed)} số × ${money(invoice.electricRate)}`,
      amount: invoice.electricAmount
    },
    {
      name: "Tiền nước",
      detail: `${safeNumber(invoice.waterNew)} - ${safeNumber(invoice.waterOld)} = ${safeNumber(invoice.waterUsed)} khối × ${money(invoice.waterRate)}`,
      amount: invoice.waterAmount
    }
  ];

  if (invoice.fixedFee) {
    rows.push({
      name: "Phí cố định",
      detail: "Rác / vệ sinh / phí chung",
      amount: invoice.fixedFee
    });
  }

  (invoice.extraFees || []).forEach((fee) => {
    rows.push({
      name: fee.name,
      detail: "Phí khác",
      amount: fee.amount
    });
  });

  return rows;
}

async function createInvoiceImageDataUrl(invoice) {
  const room = invoice.roomSnapshot || {};
  const rows = buildInvoiceRows(invoice);

  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 1080;
  const rowHeight = 62;
  const height = 390 + rows.length * rowHeight + (invoice.note ? 70 : 0) + 920;

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const margin = 56;
  const right = width - margin;
  const primary = "#0f172a";
  const muted = "#475569";
  const line = "#cbd5e1";

  ctx.fillStyle = primary;
  ctx.textAlign = "center";
  ctx.font = "700 18px Arial";
  ctx.fillText("App Tính Trọ 416 Phan Huy Ích", width / 2, 36);

  ctx.font = "900 42px Arial";
  ctx.fillText("HÓA ĐƠN TIỀN TRỌ", width / 2, 86);

  ctx.font = "500 26px Arial";
  ctx.fillText(`Tháng ${monthLabel(invoice.month)}`, width / 2, 124);

  ctx.strokeStyle = primary;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(margin, 152);
  ctx.lineTo(right, 152);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = primary;
  ctx.font = "800 26px Arial";
  ctx.fillText(`Phòng:`, margin, 205);
  ctx.font = "500 26px Arial";
  ctx.fillText(`${room.roomNumber || ""}`, margin + 95, 205);

  ctx.font = "800 26px Arial";
  ctx.fillText(`Người thuê:`, 560, 205);
  ctx.font = "500 26px Arial";
  ctx.fillText(`${room.tenantName || ""}`, 720, 205);

  ctx.font = "800 26px Arial";
  ctx.fillText(`Ngày lập:`, margin, 255);
  ctx.font = "500 26px Arial";
  ctx.fillText(`${new Date().toLocaleDateString("vi-VN")}`, margin + 125, 255);

  ctx.font = "800 26px Arial";
  ctx.fillText(`Ghi chú phòng:`, 560, 255);
  ctx.font = "500 26px Arial";
  ctx.fillText(`${room.tenantNote || "-"}`, 755, 255);

  const tableTop = 300;
  const col1 = margin;
  const col2 = 300;
  const col3 = 760;
  const tableRight = right;

  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(col1, tableTop, tableRight - col1, 58);

  ctx.strokeRect(col1, tableTop, tableRight - col1, 58 + rows.length * rowHeight + 70);
  ctx.beginPath();
  ctx.moveTo(col2, tableTop);
  ctx.lineTo(col2, tableTop + 58 + rows.length * rowHeight);
  ctx.moveTo(col3, tableTop);
  ctx.lineTo(col3, tableTop + 58 + rows.length * rowHeight + 70);
  ctx.stroke();

  ctx.fillStyle = primary;
  ctx.font = "800 26px Arial";
  ctx.fillText("Khoản thu", col1 + 18, tableTop + 38);
  ctx.fillText("Chi tiết", col2 + 18, tableTop + 38);
  drawMoney(ctx, "Thành tiền", tableRight - 18, tableTop + 38);

  let y = tableTop + 58;
  ctx.font = "500 25px Arial";
  rows.forEach((row) => {
    ctx.strokeStyle = line;
    ctx.beginPath();
    ctx.moveTo(col1, y);
    ctx.lineTo(tableRight, y);
    ctx.stroke();

    ctx.fillStyle = primary;
    ctx.fillText(row.name, col1 + 18, y + 40);
    ctx.fillText(row.detail, col2 + 18, y + 40);
    drawMoney(ctx, money(row.amount), tableRight - 18, y + 40);
    y += rowHeight;
  });

  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(col1, y);
  ctx.lineTo(tableRight, y);
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(col1, y, tableRight - col1, 70);
  ctx.strokeStyle = line;
  ctx.strokeRect(col1, y, tableRight - col1, 70);

  ctx.fillStyle = primary;
  ctx.font = "900 28px Arial";
  ctx.fillText("Tổng cộng", col1 + 18, y + 45);
  drawMoney(ctx, money(invoice.total), tableRight - 18, y + 45);

  y += 105;

  if (invoice.note) {
    ctx.fillStyle = muted;
    ctx.font = "500 22px Arial";
    y = drawWrappedText(ctx, `Ghi chú: ${invoice.note}`, margin, y, width - margin * 2, 30) + 20;
  }

  // reminder box
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.fillRect(margin, y + 10, width - margin * 2, 90);
  ctx.strokeRect(margin, y + 10, width - margin * 2, 90);

  ctx.fillStyle = primary;
  ctx.font = "900 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("VUI LÒNG THANH TOÁN ĐÚNG HẠN", width / 2, y + 50);
  ctx.fillText("QUÉT QR ĐỂ THANH TOÁN", width / 2, y + 84);

  // payment card
  const paymentTop = y + 128;
  const paymentHeight = 700;
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.fillRect(margin, paymentTop, width - margin * 2, paymentHeight);
  ctx.strokeRect(margin, paymentTop, width - margin * 2, paymentHeight);

  const qrSize = 300;
  const qrLeft = (width - qrSize) / 2;
  const qrTop = paymentTop + 24;

  try {
    const qrImg = await loadImageAsync(getVietQrUrl(invoice));
    ctx.drawImage(qrImg, qrLeft, qrTop, qrSize, qrSize);
  } catch (error) {
    console.warn("Không tải được QR khi xuất ảnh, vẫn tạo hóa đơn bình thường.", error);
    ctx.strokeStyle = line;
    ctx.strokeRect(qrLeft, qrTop, qrSize, qrSize);
    ctx.fillStyle = muted;
    ctx.font = "700 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("KHÔNG TẢI ĐƯỢC QR", width / 2, qrTop + 145);
    ctx.font = "500 20px Arial";
    ctx.fillText("Vẫn có thể dùng thông tin chuyển khoản bên dưới", width / 2, qrTop + 180);
  }

  const infoStartY = qrTop + qrSize + 58;
  ctx.fillStyle = primary;
  ctx.textAlign = "center";
  ctx.font = "700 24px Arial";
  ctx.fillText(`Ngân hàng: ${getPaymentConfig().bankName}`, width / 2, infoStartY);
  ctx.fillText(`Số tài khoản: ${getPaymentConfig().accountNo}`, width / 2, infoStartY + 40);
  ctx.fillText(`Chủ tài khoản: ${getPaymentConfig().accountName}`, width / 2, infoStartY + 80);
  ctx.fillText(`Số tiền: ${money(invoice.total)}`, width / 2, infoStartY + 120);

  ctx.font = "700 20px Arial";
  drawWrappedCenteredText(ctx, `Nội dung: ${buildTransferContent(invoice)}`, width / 2, infoStartY + 156, width - 180, 28);
  ctx.fillStyle = muted;
  ctx.font = "700 18px Arial";
  drawWrappedCenteredText(ctx, "Lưu ý: chụp màn hình đã gửi sau khi thanh toán", width / 2, infoStartY + 216, width - 180, 26);

  ctx.fillStyle = muted;
  ctx.textAlign = "center";
  ctx.font = "500 18px Arial";
  ctx.fillText("Created by ThangVoDich", width / 2, paymentTop + paymentHeight - 28);

  return canvas.toDataURL("image/png");
}

async function showInvoiceImage(invoiceOverride = null) {
  const invoice = isRealInvoiceObject(invoiceOverride) ? invoiceOverride : buildInvoiceData();

  if (!invoice || !invoice.roomSnapshot || !invoice.month) {
    alert("Chưa có hóa đơn hợp lệ để tạo hình. Hãy chọn phòng/tháng và nhập số điện nước trước nha.");
    return;
  }

  const dataUrl = await createInvoiceImageDataUrl(invoice);
  const room = invoice.roomSnapshot || {};
  const safeRoom = String(room.roomNumber || "phong").replace(/[^a-zA-Z0-9_-]+/g, "-");
  const fileName = `hoa-don-phong-${safeRoom}-${invoice.month}.png`;

  showSavedInvoiceImage(dataUrl, fileName, invoice);
}

function closeInvoiceImage() {
  const oldCard = $("#imageOutputCard");
  const oldImg = $("#invoiceImageOutput");
  if (oldCard) oldCard.style.display = "none";
  if (oldImg) oldImg.removeAttribute("src");
}




function addMonthsToYYYYMM(yyyyMM, delta) {
  if (!yyyyMM) return currentMonth();
  const [year, month] = yyyyMM.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getLatestInvoiceMonth() {
  if (!state.invoices.length) return currentMonth();
  return [...state.invoices].sort((a, b) => b.month.localeCompare(a.month))[0].month;
}

function getSuggestedNextMonth() {
  return addMonthsToYYYYMM(getLatestInvoiceMonth(), 1);
}

function suggestMonthlyMonth() {
  fillMonthSelect("#monthlyMonth", getSuggestedNextMonth(), false);
  renderMonthlyRooms();
}


function getMonthlyRooms(month = $("#monthlyMonth")?.value || currentMonth()) {
  repairRoomsFromInvoices();

  return [...state.rooms]
    .filter((room) => {
      const hasSavedThisMonth = Boolean(findInvoice(room.id, month));
      const hasPreviousInvoice = Boolean(getPreviousInvoice(room.id, month));
      return hasSavedThisMonth || hasPreviousInvoice;
    })
    .sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), "vi", { numeric: true }));
}

function getRoomDefaultExtraFees(room) {
  return getNonWifiDefaultFees(room).map((fee) => ({
    ...fee,
    id: fee.id || uid("fee"),
    amount: Number(fee.amount || 0)
  }));
}


function isWifiFee(fee) {
  return String(fee?.name || "").trim().toLowerCase() === "wifi";
}

function getRoomWifiFee(room) {
  const direct = Number(room?.wifiFee || 0);
  if (direct > 0) return direct;

  const legacyWifi = (room?.defaultFees || []).find((fee) => isWifiFee(fee));
  return Number(legacyWifi?.amount || 0);
}

function getNonWifiDefaultFees(room) {
  return (room?.defaultFees || []).filter((fee) => !isWifiFee(fee));
}

function getInvoiceNonWifiFees(invoice) {
  return (invoice?.extraFees || []).filter((fee) => !isWifiFee(fee));
}

function detectInvoiceWifiIncluded(invoice, room) {
  if (!invoice) return false;
  if (typeof invoice.wifiIncluded === "boolean") return invoice.wifiIncluded;
  return (invoice.extraFees || []).some((fee) => isWifiFee(fee)) && getRoomWifiFee(room || invoice.roomSnapshot || {}) > 0;
}

function buildFinalExtraFees(room, extraFees, wifiIncluded) {
  const cleaned = (extraFees || []).filter((fee) => !isWifiFee(fee) && String(fee.name || "").trim()).map((fee) => ({
    ...fee,
    name: String(fee.name || "").trim(),
    amount: Number(fee.amount || 0)
  }));

  const wifiFee = getRoomWifiFee(room);
  if (wifiIncluded && wifiFee > 0) {
    cleaned.unshift({
      id: uid("fee"),
      name: "Wifi",
      amount: wifiFee
    });
  }

  return cleaned;
}

function updateInvoiceWifiUI(room, checked = false) {
  const checkbox = $("#invoiceHasWifi");
  const label = $("#invoiceWifiLabel");
  const hint = $("#invoiceWifiHint");
  if (!checkbox || !label || !hint) return;

  const wifiFee = getRoomWifiFee(room);
  checkbox.checked = Boolean(checked) && wifiFee > 0;
  checkbox.disabled = wifiFee <= 0;
  label.textContent = wifiFee > 0 ? `Có wifi (${money(wifiFee)})` : "Không có phí wifi trong phòng";
  hint.textContent = wifiFee > 0
    ? "Nếu tích, phí wifi sẽ được đưa vào hóa đơn."
    : "Muốn dùng mục này, hãy thêm phí Wifi trong Phòng hoặc chỉnh wifiFee.";
}


function buildInvoiceFromRoom(room, month, electricOld, electricNew, waterOld, waterNew, extraFees, note = "", existingId = null, wifiIncluded = false) {
  const electricUsed = Math.max(0, Number(electricNew || 0) - Number(electricOld || 0));
  const waterUsed = Math.max(0, Number(waterNew || 0) - Number(waterOld || 0));

  const roomRent = Number(room.roomRent || 0);
  const electricRate = Number(room.electricRate || 0);
  const waterRate = Number(room.waterRate || 0);
  const fixedFee = Number(room.fixedFee || 0);
  const cleanedExtraFees = buildFinalExtraFees(room, extraFees, wifiIncluded);

  const electricAmount = electricUsed * electricRate;
  const waterAmount = waterUsed * waterRate;
  const extraTotal = cleanedExtraFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
  const total = roomRent + electricAmount + waterAmount + fixedFee + extraTotal;

  return {
    id: existingId || uid("invoice"),
    roomId: room.id,
    roomSnapshot: { ...room },
    month,
    electricOld: Number(electricOld || 0),
    electricNew: Number(electricNew || 0),
    electricUsed,
    electricRate,
    electricAmount,
    waterOld: Number(waterOld || 0),
    waterNew: Number(waterNew || 0),
    waterUsed,
    waterRate,
    waterAmount,
    roomRent,
    fixedFee,
    extraFees: cleanedExtraFees,
    wifiIncluded: Boolean(wifiIncluded),
    extraTotal,
    total,
    note,
    updatedAt: new Date().toISOString()
  };
}

function refreshMonthlyScreen() {
  syncStateFromStorage();
  repairRoomsFromInvoices();
  refreshMonthSelectOptions();
  const monthInput = $("#monthlyMonth");
  if (!monthInput.value) fillMonthSelect("#monthlyMonth", getSuggestedNextMonth(), false);
  renderMonthlyRooms();
}

function getMonthlyBaseData(room, month) {
  const savedInvoice = findInvoice(room.id, month);
  const previousInvoice = getPreviousInvoice(room.id, month);

  if (savedInvoice) {
    return {
      savedInvoice,
      previousInvoice,
      electricOld: Number(savedInvoice.electricOld || 0),
      waterOld: Number(savedInvoice.waterOld || 0),
      electricNew: Number(savedInvoice.electricNew || 0),
      waterNew: Number(savedInvoice.waterNew || 0),
      extraFees: getInvoiceNonWifiFees(savedInvoice).map((x) => ({ ...x })),
      wifiIncluded: detectInvoiceWifiIncluded(savedInvoice, room),
      note: savedInvoice.note || ""
    };
  }

  return {
    savedInvoice: null,
    previousInvoice,
    electricOld: Number(previousInvoice?.electricNew || 0),
    waterOld: Number(previousInvoice?.waterNew || 0),
    electricNew: "",
    waterNew: "",
    extraFees: getRoomDefaultExtraFees(room),
    wifiIncluded: false,
    note: ""
  };
}

function renderMonthlyRooms() {
  syncStateFromStorage();
  repairRoomsFromInvoices();
  refreshMonthSelectOptions();

  const list = $("#monthlyRoomsList");
  const empty = $("#emptyMonthlyRooms");
  const debug = $("#monthlyDebug");
  const monthInput = $("#monthlyMonth");
  if (!monthInput.value) monthInput.value = getSuggestedNextMonth();

  const month = monthInput.value || currentMonth();
  const rooms = getMonthlyRooms(month);

  list.innerHTML = "";
  empty.style.display = rooms.length ? "none" : "block";
  if (debug) debug.textContent = rooms.length ? `Đang có ${rooms.length} phòng có dữ liệu kỳ trước • ${state.invoices.length} hóa đơn đã lưu` : `Chưa có phòng nào có dữ liệu kỳ trước cho ${monthLabel(month)} • ${state.invoices.length} hóa đơn đã lưu`;

  rooms.forEach((room) => {
    const base = getMonthlyBaseData(room, month);
    const defaultFeeTotal = (base.extraFees || []).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    const card = document.createElement("div");
    card.className = "monthly-card";
    card.dataset.roomId = room.id;
    card.dataset.electricOld = String(base.electricOld);
    card.dataset.waterOld = String(base.waterOld);
    card.dataset.extraFees = JSON.stringify(base.extraFees || []);
    card.dataset.note = base.note || "";
    card.dataset.savedId = base.savedInvoice?.id || "";
    card.dataset.wifiIncluded = String(Boolean(base.wifiIncluded));

    card.innerHTML = `
      <div class="monthly-card-head">
        <div>
          <strong>Phòng ${escapeHtml(room.roomNumber)}</strong>
          <div class="room-meta">Người thuê: <b>${escapeHtml(room.tenantName)}</b>${room.tenantNote ? ` • ${escapeHtml(room.tenantNote)}` : ""}</div>
        </div>
        <span class="pill" style="color:#0f172a;background:#e2e8f0;border:0">${base.savedInvoice ? "Đã có hóa đơn" : "Hóa đơn mới"}</span>
      </div>

      <div class="monthly-source">
        ${base.savedInvoice
          ? `Đang sửa hóa đơn tháng ${monthLabel(month)}.`
          : (base.previousInvoice
            ? `Kỳ trước lấy từ hóa đơn tháng ${monthLabel(base.previousInvoice.month)}.`
            : "Chưa có hóa đơn cũ, kỳ trước tạm để 0.")}
      </div>

      <div class="monthly-grid">
        <div class="monthly-field">
          <label>Điện kỳ trước</label>
          <div class="monthly-readonly">${base.electricOld}</div>
        </div>
        <div class="monthly-field">
          <label>Điện tháng này</label>
          <input class="monthly-electric-new" type="number" min="0" inputmode="decimal" placeholder="Nhập số mới" value="${base.electricNew}">
        </div>
        <div class="monthly-field">
          <label>Nước kỳ trước</label>
          <div class="monthly-readonly">${base.waterOld}</div>
        </div>
        <div class="monthly-field">
          <label>Nước tháng này</label>
          <input class="monthly-water-new" type="number" min="0" inputmode="decimal" placeholder="Nhập số mới" value="${base.waterNew}">
        </div>
      </div>

      <div class="monthly-warning">Số tháng này nhỏ hơn kỳ trước, kiểm tra lại nha.</div>

      <div class="monthly-wifi-box">
        <label class="check-line">
          <input class="monthly-has-wifi" type="checkbox" ${base.wifiIncluded ? "checked" : ""} ${getRoomWifiFee(room) > 0 ? "" : "disabled"}>
          <span>${getRoomWifiFee(room) > 0 ? `Có wifi (${money(getRoomWifiFee(room))})` : "Không có phí wifi trong phòng"}</span>
        </label>
      </div>


      <div class="monthly-fees-box">
        <div class="monthly-fees-title">Phí khác tháng này</div>
        <div class="monthly-fee-list"></div>
        <div class="monthly-fee-add">
          <input class="monthly-extra-fee-name" type="text" placeholder="Tên phí, VD: Wifi">
          <input class="monthly-extra-fee-amount money-input" type="text" inputmode="numeric" placeholder="Số tiền">
          <button class="secondary small monthly-add-fee" type="button">Thêm phí</button>
        </div>
      </div>

      <div class="monthly-total-box">
        <div>
          <div class="muted">Tiền phòng ${money(room.roomRent)} • Phí cố định ${money(room.fixedFee)} • Phí khác ${money(defaultFeeTotal)}</div>
          <div class="muted monthly-usage"></div>
        </div>
        <div class="monthly-total">0 đ</div>
      </div>

      <div class="room-actions single-action">
        <button class="primary small monthly-save-image">Tạo hình & lưu</button>
      </div>
    `;

    card.querySelector(".monthly-electric-new").addEventListener("input", () => updateMonthlyRowTotal(card));
    card.querySelector(".monthly-water-new").addEventListener("input", () => updateMonthlyRowTotal(card));
    card.querySelector(".monthly-has-wifi").addEventListener("change", () => updateMonthlyRowTotal(card));
    card.querySelector(".monthly-save-image").addEventListener("click", () => saveMonthlyAndShowImage(card));
    card.querySelector(".monthly-add-fee").addEventListener("click", () => addMonthlyExtraFee(card));
    setupOneMoneyInput(card.querySelector(".monthly-extra-fee-amount"));

    list.appendChild(card);
    renderMonthlyExtraFees(card);
    updateMonthlyRowTotal(card);
  });
}


function getMonthlyExtraFeesFromCard(card) {
  try {
    return JSON.parse(card.dataset.extraFees || "[]").map((fee) => ({
      ...fee,
      amount: Number(fee.amount || 0)
    }));
  } catch {
    return [];
  }
}

function setMonthlyExtraFeesToCard(card, fees) {
  card.dataset.extraFees = JSON.stringify((fees || []).map((fee) => ({
    id: fee.id || uid("fee"),
    name: fee.name || "",
    amount: Number(fee.amount || 0)
  })));
}

function renderMonthlyExtraFees(card) {
  const list = card.querySelector(".monthly-fee-list");
  if (!list) return;

  const fees = getMonthlyExtraFeesFromCard(card);
  list.innerHTML = "";

  if (!fees.length) {
    list.innerHTML = `<p class="empty">Chưa có phí khác cho tháng này.</p>`;
    return;
  }

  fees.forEach((fee, index) => {
    const row = document.createElement("div");
    row.className = "monthly-fee-row";
    row.innerHTML = `
      <div class="monthly-fee-name">${escapeHtml(fee.name)}</div>
      <div class="monthly-fee-amount">${money(fee.amount)}</div>
      <button class="danger small" type="button">Xóa</button>
    `;

    row.querySelector("button").addEventListener("click", () => {
      const currentFees = getMonthlyExtraFeesFromCard(card);
      currentFees.splice(index, 1);
      setMonthlyExtraFeesToCard(card, currentFees);
      renderMonthlyExtraFees(card);
      updateMonthlyRowTotal(card);
    });

    list.appendChild(row);
  });
}

function addMonthlyExtraFee(card) {
  const nameInput = card.querySelector(".monthly-extra-fee-name");
  const amountInput = card.querySelector(".monthly-extra-fee-amount");
  const name = nameInput.value.trim();
  const amount = parseMoneyValue(amountInput.value);

  if (!name) {
    alert("Nhập tên phí trước nha.");
    return;
  }

  const fees = getMonthlyExtraFeesFromCard(card);
  fees.push({
    id: uid("fee"),
    name,
    amount
  });

  setMonthlyExtraFeesToCard(card, fees);
  nameInput.value = "";
  amountInput.value = "";
  renderMonthlyExtraFees(card);
  updateMonthlyRowTotal(card);
}


function buildMonthlyInvoiceFromCard(card, requireInput = true) {
  const month = $("#monthlyMonth").value || currentMonth();
  const room = state.rooms.find((x) => x.id === card.dataset.roomId);
  if (!room) return null;

  const electricOld = Number(card.dataset.electricOld || 0);
  const waterOld = Number(card.dataset.waterOld || 0);
  const electricRaw = card.querySelector(".monthly-electric-new").value;
  const waterRaw = card.querySelector(".monthly-water-new").value;

  if (requireInput && (electricRaw === "" || waterRaw === "")) {
    alert(`Phòng ${room.roomNumber}: nhập đủ số điện và số nước tháng này trước nha.`);
    return null;
  }

  const electricNew = electricRaw === "" ? electricOld : Number(electricRaw);
  const waterNew = waterRaw === "" ? waterOld : Number(waterRaw);

  if (electricNew < electricOld || waterNew < waterOld) {
    alert(`Phòng ${room.roomNumber}: số tháng này nhỏ hơn kỳ trước, kiểm tra lại nha.`);
    return null;
  }

  const extraFees = getMonthlyExtraFeesFromCard(card);

  const wifiIncluded = Boolean(card.querySelector(".monthly-has-wifi")?.checked);
  const existing = findInvoice(room.id, month);
  const existingId = existing?.id || card.dataset.savedId || null;
  const note = existing?.note || card.dataset.note || "";

  return buildInvoiceFromRoom(room, month, electricOld, electricNew, waterOld, waterNew, extraFees, note, existingId, wifiIncluded);
}

function updateMonthlyRowTotal(card) {
  const room = state.rooms.find((x) => x.id === card.dataset.roomId);
  if (!room) return;

  const electricOld = Number(card.dataset.electricOld || 0);
  const waterOld = Number(card.dataset.waterOld || 0);
  const electricRaw = card.querySelector(".monthly-electric-new").value;
  const waterRaw = card.querySelector(".monthly-water-new").value;
  const electricNew = electricRaw === "" ? electricOld : Number(electricRaw);
  const waterNew = waterRaw === "" ? waterOld : Number(waterRaw);

  const extraFees = getMonthlyExtraFeesFromCard(card);

  const warning = card.querySelector(".monthly-warning");
  const invalid = electricNew < electricOld || waterNew < waterOld;
  warning.style.display = invalid ? "block" : "none";

  const wifiIncluded = Boolean(card.querySelector(".monthly-has-wifi")?.checked);
  const invoice = buildInvoiceFromRoom(room, $("#monthlyMonth").value || currentMonth(), electricOld, electricNew, waterOld, waterNew, extraFees, "", card.dataset.savedId || null, wifiIncluded);

  card.querySelector(".monthly-total").textContent = money(invoice.total);
  card.querySelector(".monthly-usage").textContent = `Điện dùng: ${invoice.electricUsed} số = ${money(invoice.electricAmount)} • Nước dùng: ${invoice.waterUsed} khối = ${money(invoice.waterAmount)}`;
}

function upsertInvoice(invoice) {
  const index = state.invoices.findIndex((x) => x.roomId === invoice.roomId && x.month === invoice.month);
  if (index >= 0) {
    invoice.id = state.invoices[index].id;
    state.invoices[index] = invoice;
  } else {
    state.invoices.push(invoice);
  }

  state.invoices.sort((a, b) => b.month.localeCompare(a.month) || String(a.roomSnapshot?.roomNumber || "").localeCompare(String(b.roomSnapshot?.roomNumber || ""), "vi", { numeric: true }));
  return invoice;
}


async function saveMonthlyAndShowImage(card) {
  const button = card?.querySelector(".monthly-create-image");
  try {
    setButtonBusy(button, true, "Đang tạo...");
    const invoice = buildMonthlyInvoiceFromCard(card, true);
    if (!invoice) return null;

    const saved = persistInvoice(invoice, {
      updateInvoicePreview: false,
      updateMonthlyToNextMonth: false,
      showStatus: true
    });

    currentInvoiceId = saved.id;
    await showInvoiceImage(saved);

    if ($("#monthlyMonth")) {
      fillMonthSelect("#monthlyMonth", addMonthsToYYYYMM(saved.month, 1), false);
      renderMonthlyRooms();
    }

    alert(`Đã tạo hình và lưu hóa đơn phòng ${saved.roomSnapshot?.roomNumber || ""}. Phí khác tháng này và wifi (nếu tích) đã lên ảnh hóa đơn.`);
    return saved;
  } catch (error) {
    console.error("Lỗi tạo hóa đơn tháng mới:", error);
    alert("Không tạo được hóa đơn tháng mới. Thử lại hoặc kiểm tra thông tin thanh toán.");
    return null;
  } finally {
    setButtonBusy(button, false);
  }
}

function saveMonthlyOne(card, showAlert = false) {
  const invoice = buildMonthlyInvoiceFromCard(card, true);
  if (!invoice) return null;

  const saved = upsertInvoice(invoice);
  saveState();

  if (showAlert) alert(`Đã lưu hóa đơn phòng ${invoice.roomSnapshot?.roomNumber || ""} tháng ${monthLabel(invoice.month)}.`);
  renderMonthlyRooms();
  renderHistory();
  loadInvoiceFormForRoomAndMonth();

  return saved;
}

function saveMonthlyAll() {
  const cards = Array.from(document.querySelectorAll(".monthly-card"));
  let savedCount = 0;
  let skippedCount = 0;

  for (const card of cards) {
    const electricRaw = card.querySelector(".monthly-electric-new").value;
    const waterRaw = card.querySelector(".monthly-water-new").value;

    if (electricRaw === "" && waterRaw === "") {
      skippedCount++;
      continue;
    }

    const invoice = buildMonthlyInvoiceFromCard(card, true);
    if (!invoice) return;

    upsertInvoice(invoice);
    savedCount++;
  }

  if (!savedCount) {
    alert("Chưa nhập phòng nào. Nhập số điện/nước tháng này rồi lưu nha.");
    return;
  }

  saveState();
  renderMonthlyRooms();
  renderHistory();
  loadInvoiceFormForRoomAndMonth();
  alert(`Đã lưu ${savedCount} hóa đơn.${skippedCount ? ` Bỏ qua ${skippedCount} phòng chưa nhập.` : ""}`);
}


function setupEvents() {
  setupTabs();
  setupMoneyInputs();

  $("#addDefaultFeeBtn").addEventListener("click", addDefaultFee);
  $("#saveRoomBtn").addEventListener("click", saveRoom);
  $("#resetRoomFormBtn").addEventListener("click", resetRoomForm);

  refreshMonthSelectOptions();
  fillMonthSelect("#invoiceMonth", currentMonth(), false);
  fillMonthSelect("#monthlyMonth", getSuggestedNextMonth(), false);
  $("#monthlyMonth").addEventListener("change", renderMonthlyRooms);
  $("#suggestNextMonthBtn").addEventListener("click", suggestMonthlyMonth);
  $("#reloadMonthlyBtn").addEventListener("click", renderMonthlyRooms);

  $("#invoiceRoomSelect").addEventListener("change", loadInvoiceFormForRoomAndMonth);
  $("#invoiceMonth").addEventListener("change", loadInvoiceFormForRoomAndMonth);
  const invoiceWifiCheckbox = $("#invoiceHasWifi");
  if (invoiceWifiCheckbox) invoiceWifiCheckbox.addEventListener("change", renderInvoicePreview);

  ["#electricOld", "#electricNew", "#waterOld", "#waterNew", "#invoiceNote"].forEach((selector) => {
    $(selector).addEventListener("input", renderInvoicePreview);
  });

  $("#addInvoiceFeeBtn").addEventListener("click", addInvoiceFee);
  $("#makeImageBtn").addEventListener("click", () => saveAndShowInvoiceImage().catch(console.error));
  const oldCloseImageBtn = $("#closeImageBtn");
  if (oldCloseImageBtn) oldCloseImageBtn.addEventListener("click", closeInvoiceImage);

  $("#historyRoomSelect").addEventListener("change", renderHistory);
  $("#historyMonth").addEventListener("change", renderHistory);

  $("#exportBackupBtn").addEventListener("click", exportBackup);
  $("#importBackupFile").addEventListener("change", (event) => importBackup(event.target.files?.[0]));
  $("#clearAllDataBtn").addEventListener("click", clearAllData);
  const closeImageBtn = $("#closeImageFromTabBtn");
  if (closeImageBtn) closeImageBtn.addEventListener("click", clearSavedInvoiceImage);

  const bankSelect = $("#paymentBankSelect");
  if (bankSelect) bankSelect.addEventListener("change", applySelectedBankToPaymentFields);

  const savePaymentBtn = $("#savePaymentSettingsBtn");
  if (savePaymentBtn) savePaymentBtn.addEventListener("click", savePaymentSettings);

  const resetPaymentBtn = $("#resetPaymentSettingsBtn");
  if (resetPaymentBtn) resetPaymentBtn.addEventListener("click", resetPaymentSettings);

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
}

function renderAll() {
  repairRoomsFromInvoices();
  refreshMonthSelectOptions();
  renderDefaultFees();
  renderRooms();
  refreshInvoiceRoomSelect();
  loadInvoiceFormForRoomAndMonth();
  refreshHistoryFilters();
  renderHistory();
  renderPaymentSettings();
  updateOnlineStatus();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

try {
  setupEvents();
  renderAll();
} catch (error) {
  console.error("App startup error:", error);
  updateOnlineStatus();
  const status = $("#onlineStatus");
  if (status) status.textContent = "Online";
}
