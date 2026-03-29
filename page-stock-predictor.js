// ===== PAGE: DỰ BÁO GIÁ CHỨNG KHOÁN (Admin only) =====
export function renderStockPredictorPage(container) {
  container.innerHTML = `
    <div class="page-stock">
      <div class="stock-page-header">
        <div>
          <h1 class="page-title">📈 Dự báo giá chứng khoán</h1>
          <p class="page-subtitle">Nhập dữ liệu OHLC từ Excel · Phân tích kỹ thuật · Dự báo 1 tháng tới</p>
        </div>
        <button class="btn-add-stock" onclick="showAddStockModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Thêm mã chứng khoán
        </button>
      </div>

      <!-- Stock list -->
      <div id="stockList" class="stock-list">
        <div class="stock-empty">
          <div style="font-size:48px;margin-bottom:16px">📊</div>
          <p>Chưa có mã nào. Bấm <strong>"Thêm mã chứng khoán"</strong> để bắt đầu.</p>
        </div>
      </div>
    </div>

    <!-- ===== ADD STOCK MODAL ===== -->
    <div id="addStockModal" class="modal-overlay hidden" onclick="closeAddStockModal(event)">
      <div class="modal-card stock-modal-card">
        <button class="modal-close" onclick="closeAddStockModal()">×</button>
        <h2 class="stock-modal-title">📈 Thêm mã chứng khoán</h2>

        <div class="form-group">
          <label>Tên mã chứng khoán</label>
          <input id="stockSymbolInput" class="form-input" placeholder="VD: MBB, VNM, FPT...">
        </div>

        <div class="form-group">
          <label>Upload file Excel (.xlsx) — Cột: Date, O, H, L, C</label>
          <div class="file-drop stock-file-drop" id="stockFileDrop" onclick="document.getElementById('stockFileInput').click()">
            <div class="file-drop-icon">📂</div>
            <p>Kéo thả hoặc <strong>bấm chọn file Excel</strong></p>
            <small>Định dạng: hàng đầu = tên cột (Date, O, H, L, C)</small>
          </div>
          <input type="file" id="stockFileInput" accept=".xlsx,.xls" style="display:none">
          <div id="stockFileStatus" class="stock-file-status hidden"></div>
        </div>

        <div class="form-actions">
          <button class="btn-submit" id="btnLoadStock" onclick="loadStockData()" disabled>
            📊 Tải & xem biểu đồ
          </button>
        </div>
      </div>
    </div>

    <!-- ===== CANDLESTICK VIEWER MODAL ===== -->
    <div id="stockViewerModal" class="modal-overlay hidden" onclick="closeStockViewer(event)">
      <div class="modal-card stock-viewer-card">
        <button class="modal-close" onclick="closeStockViewer()">×</button>
        <div class="stock-viewer-header">
          <div>
            <h2 id="stockViewerTitle">Biểu đồ giá</h2>
            <p id="stockViewerSubtitle" class="stock-viewer-sub"></p>
          </div>
          <div class="stock-viewer-actions">
            <button class="btn-predict" id="btnPredict" onclick="runPrediction()">
              🤖 DỰ ĐOÁN 1 THÁNG
            </button>
            <button class="btn-save-stock" id="btnSaveStock" onclick="saveCurrentStock()" style="display:none">
              💾 Lưu mã này
            </button>
          </div>
        </div>
        <div class="stock-viewer-legend" id="stockLegend">
          <span class="leg-item"><span class="leg-dot" style="background:#22c55e"></span>Tăng</span>
          <span class="leg-item"><span class="leg-dot" style="background:#ef4444"></span>Giảm</span>
          <span class="leg-item leg-predict"><span class="leg-dot" style="background:#f59e0b;border:2px dashed #f59e0b"></span>Dự đoán</span>
        </div>
        <div class="stock-chart-container">
          <canvas id="stockCandleChart"></canvas>
        </div>
        <div id="predictStatus" class="predict-status hidden"></div>
        <div id="predictSummary" class="predict-summary hidden"></div>
      </div>
    </div>
  `;

  renderStockList();
  setupStockFileInput();
}

// ===== STATE =====
let stockRawData    = [];  // [{date,o,h,l,c}]
let stockSymbol     = "";
let predictedData   = [];
let stockChartInst  = null;
let savedStocks     = [];  // [{symbol, data, predicted, savedAt}]

function loadSavedStocks() {
  try { savedStocks = JSON.parse(localStorage.getItem("binhblog_stocks") || "[]"); }
  catch { savedStocks = []; }
}
function persistStocks() {
  localStorage.setItem("binhblog_stocks", JSON.stringify(savedStocks));
}

// ===== RENDER STOCK LIST =====
function renderStockList() {
  loadSavedStocks();
  const container = document.getElementById("stockList");
  if (!container) return;

  if (savedStocks.length === 0) {
    container.innerHTML = `
      <div class="stock-empty">
        <div style="font-size:48px;margin-bottom:16px">📊</div>
        <p>Chưa có mã nào. Bấm <strong>"Thêm mã chứng khoán"</strong> để bắt đầu.</p>
      </div>`;
    return;
  }

  container.innerHTML = savedStocks.map((s, i) => `
    <div class="stock-card">
      <div class="stock-card-left">
        <div class="stock-card-symbol">${s.symbol}</div>
        <div class="stock-card-meta">
          ${s.data.length} phiên · Lưu ${new Date(s.savedAt).toLocaleDateString("vi-VN")}
          ${s.predicted ? ' · <span style="color:var(--gold)">✅ Có dự đoán</span>' : ''}
        </div>
      </div>
      <div class="stock-card-actions">
        <button class="stock-card-btn view" onclick="viewSavedStock(${i})">📊 Xem biểu đồ</button>
        <button class="stock-card-btn del"  onclick="deleteSavedStock(${i})">🗑</button>
      </div>
    </div>
  `).join("");
}

// ===== MODAL OPEN/CLOSE =====
window.showAddStockModal = () => {
  stockRawData = []; stockSymbol = ""; predictedData = [];
  document.getElementById("stockSymbolInput").value = "";
  document.getElementById("stockFileStatus").classList.add("hidden");
  document.getElementById("btnLoadStock").disabled = true;
  document.getElementById("addStockModal").classList.remove("hidden");
};
window.closeAddStockModal = (e) => {
  if (!e || e.target.id === "addStockModal") {
    document.getElementById("addStockModal").classList.add("hidden");
  }
};
window.closeStockViewer = (e) => {
  if (!e || e.target.id === "stockViewerModal") {
    document.getElementById("stockViewerModal").classList.add("hidden");
    if (stockChartInst) { stockChartInst.destroy(); stockChartInst = null; }
  }
};

// ===== FILE INPUT =====
function setupStockFileInput() {
  const inp  = document.getElementById("stockFileInput");
  const drop = document.getElementById("stockFileDrop");
  if (!inp || !drop) return;

  inp.addEventListener("change", (e) => {
    if (e.target.files[0]) parseExcelFile(e.target.files[0]);
  });
  drop.addEventListener("dragover",  (e) => { e.preventDefault(); drop.classList.add("dragover"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault(); drop.classList.remove("dragover");
    if (e.dataTransfer.files[0]) parseExcelFile(e.dataTransfer.files[0]);
  });
}

// ===== PARSE EXCEL =====
async function parseExcelFile(file) {
  const status = document.getElementById("stockFileStatus");
  status.textContent = "⏳ Đang đọc file...";
  status.className   = "stock-file-status";

  // Load SheetJS
  if (!window.XLSX) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src    = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  try {
    const buf  = await file.arrayBuffer();
    const wb   = window.XLSX.read(buf, { type: "array", cellDates: true });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

    if (rows.length < 3) throw new Error("File quá ít dữ liệu");

    // Find header row
    let headerRow = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const r = rows[i].map(c => String(c||"").toUpperCase());
      if (r.some(c => c.includes("O") || c.includes("OPEN") || c.includes("H") || c.includes("HIGH"))) {
        headerRow = i; break;
      }
    }
    if (headerRow < 0) headerRow = 0;

    const headers = rows[headerRow].map(c => String(c||"").trim().toUpperCase());
    const colIdx  = {};

    // Map columns: Date, O, H, L, C
    headers.forEach((h, i) => {
      if (!colIdx.date && (h.includes("DATE") || h.includes("NGÀY") || h.includes("NGÀ"))) colIdx.date = i;
      if (!colIdx.o && (h === "O" || h.includes("OPEN") || h.includes("MỞ")))   colIdx.o = i;
      if (!colIdx.h && (h === "H" || h.includes("HIGH") || h.includes("CAO")))  colIdx.h = i;
      if (!colIdx.l && (h === "L" || h.includes("LOW")  || h.includes("THẤP"))) colIdx.l = i;
      if (!colIdx.c && (h === "C" || h.includes("CLOSE")|| h.includes("ĐÓNG"))) colIdx.c = i;
    });

    // Fallback: if no date, use first col; O/H/L/C by position
    if (colIdx.date === undefined) colIdx.date = 0;
    if (colIdx.o    === undefined) colIdx.o    = 1;
    if (colIdx.h    === undefined) colIdx.h    = 2;
    if (colIdx.l    === undefined) colIdx.l    = 3;
    if (colIdx.c    === undefined) colIdx.c    = 4;

    const parsed = [];
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i];
      const o = parseFloat(String(r[colIdx.o]||"").replace(/,/g,""));
      const h = parseFloat(String(r[colIdx.h]||"").replace(/,/g,""));
      const l = parseFloat(String(r[colIdx.l]||"").replace(/,/g,""));
      const c = parseFloat(String(r[colIdx.c]||"").replace(/,/g,""));
      if (isNaN(o)||isNaN(h)||isNaN(l)||isNaN(c)) continue;

      let dateStr = String(r[colIdx.date]||"").trim();
      // Try parse
      let dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        // Try DD/MM/YYYY
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length === 3) dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      const label = isNaN(dateObj.getTime()) ? dateStr : dateObj.toLocaleDateString("vi-VN");

      parsed.push({ date: label, dateObj, o, h, l, c });
    }

    if (parsed.length === 0) throw new Error("Không đọc được dữ liệu OHLC");

    // Sort by date
    parsed.sort((a, b) => {
      if (a.dateObj && b.dateObj && !isNaN(a.dateObj) && !isNaN(b.dateObj))
        return a.dateObj - b.dateObj;
      return 0;
    });

    stockRawData = parsed;
    status.textContent = `✅ Đọc được ${parsed.length} phiên giao dịch`;
    status.classList.add("ok");

    const sym = document.getElementById("stockSymbolInput").value.trim();
    if (sym) document.getElementById("btnLoadStock").disabled = false;

  } catch (err) {
    status.textContent = `❌ Lỗi: ${err.message}`;
    status.classList.add("error");
  }
}

// Sync enable button when symbol typed
document.addEventListener("input", (e) => {
  if (e.target.id === "stockSymbolInput") {
    const ok = e.target.value.trim().length > 0 && stockRawData.length > 0;
    const btn = document.getElementById("btnLoadStock");
    if (btn) btn.disabled = !ok;
  }
});

// ===== LOAD & SHOW CHART =====
window.loadStockData = async () => {
  stockSymbol   = document.getElementById("stockSymbolInput").value.trim().toUpperCase();
  predictedData = [];
  closeAddStockModal();

  document.getElementById("stockViewerTitle").textContent   = `${stockSymbol} — Biểu đồ giá`;
  document.getElementById("stockViewerSubtitle").textContent = `${stockRawData.length} phiên · Chưa dự đoán`;
  document.getElementById("predictStatus").classList.add("hidden");
  document.getElementById("predictSummary").classList.add("hidden");
  document.getElementById("btnSaveStock").style.display = "none";
  document.getElementById("stockViewerModal").classList.remove("hidden");

  await ensureChartJs();
  drawCandleChart(stockRawData, []);
};

// ===== VIEW SAVED STOCK =====
window.viewSavedStock = async (idx) => {
  loadSavedStocks();
  const s     = savedStocks[idx];
  stockSymbol = s.symbol;
  stockRawData   = s.data || [];
  predictedData  = s.predicted || [];

  document.getElementById("stockViewerTitle").textContent    = `${s.symbol} — Biểu đồ giá`;
  document.getElementById("stockViewerSubtitle").textContent = `${stockRawData.length} phiên${predictedData.length ? ` · Dự đoán ${predictedData.length} phiên` : ''}`;
  document.getElementById("predictStatus").classList.add("hidden");
  document.getElementById("predictSummary").classList.add("hidden");
  document.getElementById("btnSaveStock").style.display = "none";
  document.getElementById("stockViewerModal").classList.remove("hidden");

  await ensureChartJs();
  drawCandleChart(stockRawData, predictedData);
};

window.deleteSavedStock = (idx) => {
  if (!confirm("Xoá mã này?")) return;
  loadSavedStocks();
  savedStocks.splice(idx, 1);
  persistStocks();
  renderStockList();
};

// ===== CHART.JS LOADER =====
async function ensureChartJs() {
  if (window.Chart) return;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src    = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

// ===== DRAW CANDLESTICK (custom via Chart.js bar chart trick) =====
function drawCandleChart(historical, predicted) {
  const canvas = document.getElementById("stockCandleChart");
  if (!canvas) return;
  if (stockChartInst) { stockChartInst.destroy(); stockChartInst = null; }

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const gridC  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const textC  = isDark ? "#94a3b8" : "#475569";

  // Build labels & datasets
  const allData   = [...historical, ...predicted.map(d => ({...d, _pred: true}))];
  const labels    = allData.map(d => d.date);
  const maxPerRow = Math.min(allData.length, 60);

  // Candle body (open→close) using floating bar
  const bodies = allData.map(d => {
    const isUp = d.c >= d.o;
    return {
      x: d.date,
      y: [Math.min(d.o,d.c), Math.max(d.o,d.c)],
      color: d._pred ? (isUp ? "rgba(245,158,11,0.85)" : "rgba(251,146,60,0.85)")
                     : (isUp ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)")
    };
  });

  // Wicks (high→low)
  const wicks = allData.map(d => {
    const isUp = d.c >= d.o;
    return {
      x: d.date,
      y: [d.l, d.h],
      color: d._pred ? "rgba(245,158,11,0.6)" : (isUp ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)")
    };
  });

  // Custom bar colour plugin
  const colorPlugin = {
    id: "dynamicColor",
    beforeDatasetsDraw(chart) {
      chart.data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        meta.data.forEach((bar, i) => {
          const item = di === 0 ? bodies[i] : wicks[i];
          if (item) bar.options.backgroundColor = item.color;
        });
      });
    }
  };

  stockChartInst = new window.Chart(canvas, {
    type: "bar",
    plugins: [colorPlugin],
    data: {
      labels,
      datasets: [
        {
          label: "Giá (Body)",
          data: bodies.map(b => b.y),
          backgroundColor: bodies.map(b => b.color),
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: 2,
          barPercentage: 0.5,
        },
        {
          label: "Bóng nến",
          data: wicks.map(w => w.y),
          backgroundColor: wicks.map(w => w.color),
          borderColor: "transparent",
          borderWidth: 0,
          barPercentage: 0.12,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0].label,
            label: (ctx) => {
              const d = allData[ctx.dataIndex];
              if (!d) return "";
              return [
                ` O: ${d.o.toFixed(2)}`,
                ` H: ${d.h.toFixed(2)}`,
                ` L: ${d.l.toFixed(2)}`,
                ` C: ${d.c.toFixed(2)}`,
                d._pred ? " 🔮 Dự đoán" : ""
              ].filter(Boolean);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textC, maxRotation: 45, maxTicksLimit: 20 },
          grid:  { color: gridC }
        },
        y: {
          ticks: { color: textC },
          grid:  { color: gridC }
        }
      }
    }
  });
}

// ===== PREDICTION ALGORITHM (Kết hợp EMA + RSI + Linear Regression) =====
window.runPrediction = async () => {
  if (stockRawData.length < 10) {
    alert("Cần ít nhất 10 phiên dữ liệu để dự đoán"); return;
  }

  const status = document.getElementById("predictStatus");
  const sumEl  = document.getElementById("predictSummary");
  status.textContent = "🤖 Đang phân tích dữ liệu...";
  status.className   = "predict-status";
  sumEl.classList.add("hidden");

  await sleep(50);

  // 1. Tính chỉ số kỹ thuật
  const closes = stockRawData.map(d => d.c);
  const highs  = stockRawData.map(d => d.h);
  const lows   = stockRawData.map(d => d.l);
  const opens  = stockRawData.map(d => d.o);
  const n      = closes.length;

  // EMA 5, EMA 10, EMA 20
  const ema5  = calcEMA(closes, 5);
  const ema10 = calcEMA(closes, 10);
  const ema20 = calcEMA(closes, Math.min(20, n));

  // RSI 14
  const rsi = calcRSI(closes, Math.min(14, n - 1));

  // ATR 14 (Average True Range) — độ biến động
  const atr = calcATR(highs, lows, closes, Math.min(14, n - 1));

  // Linear Regression Slope on close prices (last 20 or all)
  const window_ = Math.min(20, n);
  const lrSlope = linearRegressionSlope(closes.slice(-window_));

  // Momentum: (close_now - close_5ago) / close_5ago
  const momentum = n >= 6 ? (closes[n-1] - closes[n-6]) / closes[n-6] : 0;

  // Trend signal: EMA crossover
  const lastEma5  = ema5[ema5.length - 1];
  const lastEma10 = ema10[ema10.length - 1];
  const lastRsi   = rsi[rsi.length - 1];
  const lastAtr   = atr[atr.length - 1];
  const lastClose = closes[n - 1];

  // Composite trend factor
  let trendFactor = lrSlope / lastClose;  // % change per day from regression
  if (lastEma5 > lastEma10) trendFactor *= 1.1;
  else                       trendFactor *= 0.9;
  if (lastRsi > 70)          trendFactor *= 0.85; // overbought → slow down
  if (lastRsi < 30)          trendFactor *= 1.1;  // oversold → bounce
  trendFactor += momentum * 0.05;

  // Volatility = ATR / lastClose
  const vol = lastAtr / lastClose;

  // Generate 22 future trading days
  const DAYS = 22;
  const predicted = [];
  let prevC = lastClose;
  let prevO = opens[n - 1];
  let prevH = highs[n - 1];
  let prevL = lows[n - 1];

  // Carry forward date
  const lastDate = stockRawData[n-1].dateObj || new Date();
  const isValidDate = lastDate instanceof Date && !isNaN(lastDate);

  for (let i = 0; i < DAYS; i++) {
    // Random walk component with trend bias
    const rand  = (Math.random() - 0.48) * vol;    // slight upward bias on 0.48
    const delta = trendFactor + rand;

    const c = prevC * (1 + delta);
    const o = prevC * (1 + (Math.random() - 0.5) * vol * 0.4);
    const swing = Math.abs(c - o) + prevC * vol * (0.5 + Math.random() * 0.5);
    const h = Math.max(o, c) + swing * 0.4;
    const l = Math.min(o, c) - swing * 0.4;

    // Date: skip weekends
    let futureDate = null;
    if (isValidDate) {
      futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i + 1);
      while (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
        futureDate.setDate(futureDate.getDate() + 1);
      }
    }

    predicted.push({
      date: futureDate ? futureDate.toLocaleDateString("vi-VN") : `T+${i+1}`,
      dateObj: futureDate,
      o: +o.toFixed(2), h: +h.toFixed(2), l: +l.toFixed(2), c: +c.toFixed(2)
    });

    prevC = c; prevO = o;
  }

  predictedData = predicted;

  status.textContent = "✅ Dự đoán hoàn tất!";
  status.classList.add("ok");

  const firstPred = predicted[0].c;
  const lastPred  = predicted[predicted.length - 1].c;
  const chg       = ((lastPred - lastClose) / lastClose * 100).toFixed(2);
  const dir       = lastPred >= lastClose ? "▲ Tăng" : "▼ Giảm";
  const dirColor  = lastPred >= lastClose ? "#22c55e" : "#ef4444";

  sumEl.innerHTML = `
    <div class="predict-summary-grid">
      <div class="ps-item">
        <div class="ps-label">Giá hiện tại</div>
        <div class="ps-val">${lastClose.toFixed(2)}</div>
      </div>
      <div class="ps-item">
        <div class="ps-label">Dự đoán cuối tháng</div>
        <div class="ps-val">${lastPred.toFixed(2)}</div>
      </div>
      <div class="ps-item">
        <div class="ps-label">Thay đổi dự kiến</div>
        <div class="ps-val" style="color:${dirColor}">${dir} ${Math.abs(chg)}%</div>
      </div>
      <div class="ps-item">
        <div class="ps-label">Chỉ số RSI hiện tại</div>
        <div class="ps-val" style="color:${lastRsi>70?'#ef4444':lastRsi<30?'#22c55e':'var(--text)'}">${lastRsi.toFixed(1)}</div>
      </div>
    </div>
    <div class="ps-note">⚠️ Đây là dự báo mô hình thống kê, không phải khuyến nghị đầu tư. Luôn tự nghiên cứu thêm.</div>
  `;
  sumEl.classList.remove("hidden");
  document.getElementById("btnSaveStock").style.display = "inline-flex";
  document.getElementById("stockViewerSubtitle").textContent = `${stockRawData.length} phiên lịch sử · Dự đoán ${DAYS} phiên tới`;

  drawCandleChart(stockRawData, predictedData);
};

// ===== SAVE CURRENT STOCK =====
window.saveCurrentStock = () => {
  if (!stockSymbol || !stockRawData.length) return;
  loadSavedStocks();

  // Upsert
  const idx = savedStocks.findIndex(s => s.symbol === stockSymbol);
  const entry = { symbol: stockSymbol, data: stockRawData, predicted: predictedData, savedAt: Date.now() };
  if (idx >= 0) savedStocks[idx] = entry;
  else          savedStocks.unshift(entry);

  persistStocks();
  renderStockList();
  document.getElementById("btnSaveStock").style.display = "none";
  document.getElementById("predictStatus").textContent  = "💾 Đã lưu!";
};

// ===== MATH HELPERS =====
function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i-1] * (1-k));
  }
  return ema;
}

function calcRSI(data, period) {
  const rsi = new Array(period).fill(50);
  for (let i = period; i < data.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j] - data[j-1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}

function calcATR(highs, lows, closes, period) {
  const tr = [highs[0] - lows[0]];
  for (let i = 1; i < highs.length; i++) {
    tr.push(Math.max(highs[i]-lows[i], Math.abs(highs[i]-closes[i-1]), Math.abs(lows[i]-closes[i-1])));
  }
  const atr = [tr[0]];
  for (let i = 1; i < tr.length; i++) {
    atr.push((atr[i-1] * (period-1) + tr[i]) / period);
  }
  return atr;
}

function linearRegressionSlope(data) {
  const n = data.length;
  let sumX=0, sumY=0, sumXY=0, sumX2=0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += data[i]; sumXY += i*data[i]; sumX2 += i*i;
  }
  return (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
