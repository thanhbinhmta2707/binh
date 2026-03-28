// ===== PAGE: BÀI VIẾT =====
export function renderPostsPage(container) {
  container.innerHTML = `
    <div class="page-posts">
      <div class="posts-header">
        <h1 class="page-title">📖 Bài viết</h1>
        <p class="page-subtitle">Tất cả bài chia sẻ từ hành trình thực tế của mình</p>
      </div>
      <div class="search-wrap">
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="searchInput" class="search-input" placeholder="Tìm bài viết...">
        </div>
      </div>
      <div id="posts" class="grid"></div>
      <div id="emptyState" class="empty-state hidden">
        <div class="empty-icon">📭</div>
        <p>Không tìm thấy bài viết nào</p>
      </div>
    </div>
  `;
}
