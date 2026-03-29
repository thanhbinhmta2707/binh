// ===== PAGE: BÀI VIẾT =====
export function renderPostsPage(container) {
  container.innerHTML = `
    <div class="page-posts">
      <div class="posts-header">
        <h1 class="page-title">📖 Bài viết</h1>
        <p class="page-subtitle">Tất cả bài phân tích chứng khoán từ hành trình thực tế</p>
      </div>
      <div class="search-wrap">
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="searchInput" class="search-input" placeholder="Tìm bài viết...">
        </div>
      </div>

      <!-- Two-column layout: posts + right sidebar -->
      <div class="posts-layout">
        <div class="posts-col">
          <div id="posts" class="grid"></div>
          <div id="emptyState" class="empty-state hidden">
            <div class="empty-icon">📭</div>
            <p>Không tìm thấy bài viết nào</p>
          </div>
        </div>

        <!-- RIGHT SIDEBAR: Company Reports -->
        <aside class="reports-sidebar">
          <div class="reports-sidebar-header">
            <span>📋</span> Báo cáo doanh nghiệp
          </div>
          <div class="reports-list">

            <a class="report-item" href="https://www.hsx.vn/Modules/Listed/Web/FinancialReport" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://www.hsx.vn/favicon.ico" alt="HSX" onerror="this.src='https://placehold.co/32x32/1e40af/fff?text=HX'">
              </div>
              <div class="report-info">
                <div class="report-name">HOSE – Sở GDCK TP.HCM</div>
                <div class="report-desc">Báo cáo tài chính niêm yết</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://hnx.vn/vi-vn/cong-bo-thong-tin/bao-cao-tai-chinh.html" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://hnx.vn/favicon.ico" alt="HNX" onerror="this.src='https://placehold.co/32x32/0891b2/fff?text=HN'">
              </div>
              <div class="report-info">
                <div class="report-name">HNX – Sở GDCK Hà Nội</div>
                <div class="report-desc">Công bố thông tin & BCTC</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://cafef.vn/bao-cao-tai-chinh.chn" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://cafef.vn/favicon.ico" alt="CafeF" onerror="this.src='https://placehold.co/32x32/ef4444/fff?text=CF'">
              </div>
              <div class="report-info">
                <div class="report-name">CafeF – BCTC</div>
                <div class="report-desc">Báo cáo tài chính doanh nghiệp</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://vietstock.vn/bao-cao-tai-chinh/" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://vietstock.vn/favicon.ico" alt="Vietstock" onerror="this.src='https://placehold.co/32x32/22c55e/fff?text=VS'">
              </div>
              <div class="report-info">
                <div class="report-name">Vietstock – BCTC</div>
                <div class="report-desc">Phân tích & báo cáo tài chính</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://finance.vietcombank.com.vn" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://www.vietcombank.com.vn/favicon.ico" alt="VCB" onerror="this.src='https://placehold.co/32x32/16a34a/fff?text=VC'">
              </div>
              <div class="report-info">
                <div class="report-name">Vietcombank – Báo cáo</div>
                <div class="report-desc">BCTC ngân hàng VCB</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://www.vingroup.net/bao-cao-thuong-nien" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://www.vingroup.net/favicon.ico" alt="Vingroup" onerror="this.src='https://placehold.co/32x32/7c3aed/fff?text=VG'">
              </div>
              <div class="report-info">
                <div class="report-name">Vingroup – Báo cáo thường niên</div>
                <div class="report-desc">Tập đoàn Vingroup VIC</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://www.fpt.com.vn/vi/nha-dau-tu/bao-cao-tai-chinh" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://www.fpt.com.vn/favicon.ico" alt="FPT" onerror="this.src='https://placehold.co/32x32/f59e0b/000?text=FP'">
              </div>
              <div class="report-info">
                <div class="report-name">FPT Corp – BCTC</div>
                <div class="report-desc">Báo cáo tài chính FPT</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://www.hpg.com.vn/nha-dau-tu/bao-cao-thuong-nien" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://www.hpg.com.vn/favicon.ico" alt="HPG" onerror="this.src='https://placehold.co/32x32/dc2626/fff?text=HP'">
              </div>
              <div class="report-info">
                <div class="report-name">Hoà Phát – Báo cáo</div>
                <div class="report-desc">Tập đoàn Hoà Phát HPG</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://www.mbs.com.vn/bao-cao-phan-tich" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://www.mbs.com.vn/favicon.ico" alt="MBS" onerror="this.src='https://placehold.co/32x32/0ea5e9/fff?text=MB'">
              </div>
              <div class="report-info">
                <div class="report-name">MBS – Báo cáo phân tích</div>
                <div class="report-desc">Công ty CK MB Securities</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

            <a class="report-item" href="https://ssi.com.vn/bao-cao-phan-tich" target="_blank" rel="noopener">
              <div class="report-favicon">
                <img src="https://ssi.com.vn/favicon.ico" alt="SSI" onerror="this.src='https://placehold.co/32x32/6366f1/fff?text=SS'">
              </div>
              <div class="report-info">
                <div class="report-name">SSI Research – Phân tích</div>
                <div class="report-desc">Báo cáo phân tích SSI</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>

          </div>
          <div class="reports-footer">
            Cập nhật theo quý · Nguồn công khai
          </div>
        </aside>
      </div>
    </div>
  `;
}
