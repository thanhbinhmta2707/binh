// ===== PAGE: KẾT QUẢ TÀI CHÍNH =====
export function renderFinancePage(container) {
  container.innerHTML = `
    <div class="page-finance">
      <div class="finance-header">
        <h1 class="page-title">📊 Kết quả tài chính</h1>
        <p class="page-subtitle">Báo cáo thu nhập thực tế — minh bạch, không che giấu</p>
      </div>

      <!-- Summary cards -->
      <div class="finance-summary">
        <div class="finance-card fc-green">
          <div class="fc-label">Thu nhập tháng này</div>
          <div class="fc-value">15,200,000đ</div>
          <div class="fc-change up">▲ +23% so với tháng trước</div>
        </div>
        <div class="finance-card fc-blue">
          <div class="fc-label">Tổng năm 2025</div>
          <div class="fc-value">142,500,000đ</div>
          <div class="fc-change up">▲ Mục tiêu: 200tr</div>
        </div>
        <div class="finance-card fc-purple">
          <div class="fc-label">Nguồn chính</div>
          <div class="fc-value">Affiliate</div>
          <div class="fc-change">60% tổng thu nhập</div>
        </div>
      </div>

      <!-- Chart area -->
      <div class="finance-chart-wrap">
        <div class="chart-title-row">
          <h2>Thu nhập theo tháng (2025)</h2>
          <div class="chart-legend">
            <span class="legend-dot" style="background:var(--accent)"></span> Affiliate
            <span class="legend-dot" style="background:var(--accent2)"></span> Blog/Ads
            <span class="legend-dot" style="background:var(--accent3)"></span> Khác
          </div>
        </div>
        <canvas id="financeChart" class="finance-canvas"></canvas>
      </div>

      <!-- Source breakdown -->
      <div class="finance-breakdown">
        <h2>Phân bổ nguồn thu</h2>
        <div class="breakdown-list">
          <div class="breakdown-item">
            <div class="breakdown-info">
              <span class="breakdown-icon">🔗</span>
              <span class="breakdown-name">Affiliate Marketing</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar" style="width:60%;background:var(--accent)"></div>
            </div>
            <span class="breakdown-pct">60%</span>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-info">
              <span class="breakdown-icon">📝</span>
              <span class="breakdown-name">Blog / Ads</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar" style="width:25%;background:var(--accent2)"></div>
            </div>
            <span class="breakdown-pct">25%</span>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-info">
              <span class="breakdown-icon">🤖</span>
              <span class="breakdown-name">AI Tools / SaaS</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar" style="width:10%;background:var(--accent3)"></div>
            </div>
            <span class="breakdown-pct">10%</span>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-info">
              <span class="breakdown-icon">💼</span>
              <span class="breakdown-name">Khác</span>
            </div>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar" style="width:5%;background:#f59e0b"></div>
            </div>
            <span class="breakdown-pct">5%</span>
          </div>
        </div>
      </div>

      <p class="finance-note">* Số liệu được cập nhật cuối mỗi tháng. Đơn vị: VNĐ.</p>
    </div>
  `;

  // Vẽ biểu đồ sau khi DOM đã sẵn
  setTimeout(() => drawChart(), 100);
}

function drawChart() {
  const canvas = document.getElementById("financeChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Dữ liệu mẫu — bạn có thể thay bằng data thật từ Firestore
  const months    = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
  const affiliate = [4200,5100,6300,7800,8200,9100,10500,11200,10800,12300,13800,15200].map(v => v * 1000);
  const blogAds   = [800,1200,1500,2100,2400,2800,3200,3500,3100,3800,4200,5000].map(v => v * 1000);
  const others    = [300,400,500,600,700,800,900,1000,900,1100,1200,1500].map(v => v * 1000);

  // Chart.js via CDN — load dynamically nếu chưa có
  if (window.Chart) {
    buildChart(ctx, months, affiliate, blogAds, others);
  } else {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.onload = () => buildChart(ctx, months, affiliate, blogAds, others);
    document.head.appendChild(s);
  }
}

function buildChart(ctx, months, affiliate, blogAds, others) {
  // destroy nếu đã tồn tại
  if (ctx.canvas._chart) ctx.canvas._chart.destroy();

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const gridColor  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#94a3b8" : "#64748b";

  const chart = new window.Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Affiliate",
          data: affiliate,
          backgroundColor: "rgba(59,130,246,0.75)",
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: "Blog/Ads",
          data: blogAds,
          backgroundColor: "rgba(6,182,212,0.7)",
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: "Khác",
          data: others,
          backgroundColor: "rgba(139,92,246,0.65)",
          borderRadius: 6,
          borderSkipped: false,
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
            label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.raw/1000000).toFixed(1)}tr đ`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: gridColor },
          ticks: { color: labelColor }
        },
        y: {
          stacked: true,
          grid: { color: gridColor },
          ticks: {
            color: labelColor,
            callback: (v) => (v / 1000000).toFixed(0) + "tr"
          }
        }
      }
    }
  });

  ctx.canvas._chart = chart;
}
