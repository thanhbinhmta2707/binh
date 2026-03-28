// ===== PAGE: TRANG CHỦ =====
export function renderHomePage(container) {
  container.innerHTML = `
    <div class="page-home">

      <!-- Hero -->
      <div class="ph-hero">
        <div class="ph-hero-bg">
          <div class="ph-blob b1"></div>
          <div class="ph-blob b2"></div>
          <div class="ph-blob b3"></div>
          <div class="ph-grid"></div>
        </div>
        <div class="ph-hero-content">
          <div class="ph-badge">✨ Blog thực chiến số 1</div>
          <h1 class="ph-title">Kiếm tiền online<br><span class="ph-highlight">từ con số 0</span></h1>
          <p class="ph-sub">Mình là Bình — chia sẻ hành trình kiếm tiền online thật sự,<br>không vẽ vời, không che giấu.</p>
          <div class="ph-cta-row">
            <button class="ph-cta-main" onclick="window.navigateTo('posts')">
              📖 Xem bài viết
            </button>
            <button class="ph-cta-sec" onclick="window.navigateTo('finance')">
              📊 Kết quả tài chính
            </button>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="ph-stats">
        <div class="ph-stat-card">
          <div class="ph-stat-icon">📝</div>
          <div class="ph-stat-num" id="homePostCount">—</div>
          <div class="ph-stat-label">Bài viết</div>
        </div>
        <div class="ph-stat-card">
          <div class="ph-stat-icon">💰</div>
          <div class="ph-stat-num">100%</div>
          <div class="ph-stat-label">Thực chiến</div>
        </div>
        <div class="ph-stat-card">
          <div class="ph-stat-icon">🛠️</div>
          <div class="ph-stat-num">Free</div>
          <div class="ph-stat-label">Miễn phí</div>
        </div>
        <div class="ph-stat-card">
          <div class="ph-stat-icon">🤖</div>
          <div class="ph-stat-num">AI</div>
          <div class="ph-stat-label">Công cụ AI</div>
        </div>
      </div>

      <!-- About section -->
      <div class="ph-about">
        <div class="ph-about-avatar">🚀</div>
        <div class="ph-about-text">
          <h2>Xin chào, mình là <span class="ph-highlight">Bình</span> 👋</h2>
          <p>Mình bắt đầu từ 0 — không vốn, không kinh nghiệm, chỉ có một chiếc laptop và sự tò mò.</p>
          <p>Blog này là nơi mình ghi lại mọi thứ: từ những thất bại, những bài học xương máu cho đến những tháng thu nhập vượt kỳ vọng. Tất cả đều thật.</p>
          <p>Nếu bạn muốn kiếm tiền online <strong>thật sự</strong> — không phải mấy khoá học "bí kíp" — thì đây là nơi bạn cần ở lại.</p>
        </div>
      </div>

      <!-- Topics -->
      <div class="ph-topics">
        <h2 class="ph-section-title">Mình chia sẻ về</h2>
        <div class="ph-topics-grid">
          <div class="ph-topic-card" onclick="window.navigateTo('posts')">
            <div class="ph-topic-icon">📖</div>
            <h3>Case Study</h3>
            <p>Chiến dịch thật, con số thật, không che giấu</p>
          </div>
          <div class="ph-topic-card" onclick="window.navigateTo('posts')">
            <div class="ph-topic-icon">🤖</div>
            <h3>AI Tools</h3>
            <p>Công cụ AI nào đang giúp mình tiết kiệm thời gian</p>
          </div>
          <div class="ph-topic-card" onclick="window.navigateTo('posts')">
            <div class="ph-topic-icon">🔗</div>
            <h3>Affiliate</h3>
            <p>Kiếm hoa hồng thụ động từ giới thiệu sản phẩm</p>
          </div>
          <div class="ph-topic-card" onclick="window.navigateTo('finance')">
            <div class="ph-topic-icon">📊</div>
            <h3>Thu nhập</h3>
            <p>Báo cáo tài chính hàng tháng minh bạch</p>
          </div>
        </div>
      </div>

    </div>
  `;
}
