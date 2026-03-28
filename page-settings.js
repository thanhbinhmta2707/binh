// ===== PAGE: CÀI ĐẶT =====
export function renderSettingsPage(container) {
  const saved = getSavedSettings();

  container.innerHTML = `
    <div class="page-settings">
      <div class="settings-header">
        <h1 class="page-title">⚙️ Cài đặt</h1>
        <p class="page-subtitle">Tuỳ chỉnh giao diện theo sở thích của bạn</p>
      </div>

      <!-- Theme -->
      <div class="settings-section">
        <h2 class="settings-section-title">
          <span>🎨</span> Giao diện
        </h2>
        <div class="settings-row">
          <div class="settings-label">
            <strong>Chế độ sáng / tối</strong>
            <span>Chọn màu nền phù hợp với bạn</span>
          </div>
          <div class="theme-toggle-group">
            <button class="theme-opt ${saved.theme === 'dark'  ? 'active' : ''}" onclick="applyTheme('dark')"  id="themeOptDark">
              🌙 Tối
            </button>
            <button class="theme-opt ${saved.theme === 'light' ? 'active' : ''}" onclick="applyTheme('light')" id="themeOptLight">
              ☀️ Sáng
            </button>
            <button class="theme-opt ${saved.theme === 'ocean' ? 'active' : ''}" onclick="applyTheme('ocean')" id="themeOptOcean">
              🌊 Ocean
            </button>
            <button class="theme-opt ${saved.theme === 'forest' ? 'active' : ''}" onclick="applyTheme('forest')" id="themeOptForest">
              🌿 Forest
            </button>
          </div>
        </div>

        <!-- Colour preview -->
        <div class="color-preview" id="colorPreview"></div>
      </div>

      <!-- Effects -->
      <div class="settings-section">
        <h2 class="settings-section-title">
          <span>✨</span> Hiệu ứng
        </h2>

        <div class="settings-row">
          <div class="settings-label">
            <strong>Hiệu ứng hạt nền</strong>
            <span>Các hạt nhỏ chuyển động trên nền</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="effectParticles" ${saved.particles ? 'checked' : ''}
              onchange="applyEffect('particles', this.checked)">
            <span class="toggle-track"></span>
          </label>
        </div>

        <div class="settings-row">
          <div class="settings-label">
            <strong>Hiệu ứng blob nền</strong>
            <span>Các vùng màu mờ chuyển động</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="effectBlobs" ${saved.blobs !== false ? 'checked' : ''}
              onchange="applyEffect('blobs', this.checked)">
            <span class="toggle-track"></span>
          </label>
        </div>

        <div class="settings-row">
          <div class="settings-label">
            <strong>Hiệu ứng rụng lá khi đăng nhập</strong>
            <span>Hoa rơi trong 10 giây đầu sau khi đăng nhập</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="effectLeaves" ${saved.leaves !== false ? 'checked' : ''}
              onchange="applyEffect('leaves', this.checked)">
            <span class="toggle-track"></span>
          </label>
        </div>

        <div class="settings-row">
          <div class="settings-label">
            <strong>Hoạt ảnh thẻ bài viết</strong>
            <span>Thẻ bài viết có hiệu ứng xuất hiện</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="effectCards" ${saved.cardAnim !== false ? 'checked' : ''}
              onchange="applyEffect('cardAnim', this.checked)">
            <span class="toggle-track"></span>
          </label>
        </div>
      </div>

      <!-- Font size -->
      <div class="settings-section">
        <h2 class="settings-section-title"><span>🔤</span> Kích thước chữ</h2>
        <div class="settings-row">
          <div class="settings-label">
            <strong>Cỡ chữ nội dung</strong>
            <span id="fontSizeLabel">${saved.fontSize || 16}px</span>
          </div>
          <input type="range" id="fontSizeRange" class="range-input"
            min="14" max="22" step="1" value="${saved.fontSize || 16}"
            oninput="applyFontSize(this.value)">
        </div>
      </div>

      <button class="btn-reset-settings" onclick="resetSettings()">🔄 Khôi phục mặc định</button>
    </div>
  `;

  updateColorPreview(saved.theme || 'dark');
}

// ===== SETTINGS LOGIC =====

const THEMES = {
  dark:   { '--bg':'#060b18', '--surface':'#0d1526', '--accent':'#3b82f6', '--accent2':'#06b6d4', '--accent3':'#8b5cf6' },
  light:  { '--bg':'#f8fafc', '--surface':'#ffffff',  '--accent':'#2563eb', '--accent2':'#0891b2', '--accent3':'#7c3aed',
             '--text':'#1e293b', '--text-muted':'#64748b', '--text-dim':'#475569', '--border':'rgba(0,0,0,0.1)', '--border-hover':'rgba(37,99,235,0.4)' },
  ocean:  { '--bg':'#020c18', '--surface':'#071929', '--accent':'#0ea5e9', '--accent2':'#06b6d4', '--accent3':'#0284c7' },
  forest: { '--bg':'#051208', '--surface':'#0a1f0f', '--accent':'#22c55e', '--accent2':'#16a34a', '--accent3':'#15803d' },
};

export function getSavedSettings() {
  try { return JSON.parse(localStorage.getItem("binhblog_settings") || "{}"); }
  catch { return {}; }
}

export function saveSettings(key, value) {
  const s = getSavedSettings();
  s[key] = value;
  localStorage.setItem("binhblog_settings", JSON.stringify(s));
}

export function applyAllSettings() {
  const s = getSavedSettings();
  if (s.theme)    applyTheme(s.theme, false);
  if (s.fontSize) document.documentElement.style.setProperty('--body-font-size', s.fontSize + 'px');
  if (s.blobs === false) document.querySelectorAll('.ph-blob,.blob').forEach(b => b.style.display = 'none');
  if (!s.cardAnim)       document.documentElement.classList.add('no-card-anim');
}

window.applyTheme = (theme, save = true) => {
  const vars = THEMES[theme];
  if (!vars) return;
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  document.documentElement.setAttribute('data-theme', theme);
  if (save) saveSettings('theme', theme);

  // Update button states if settings page is open
  ['dark','light','ocean','forest'].forEach(t => {
    const btn = document.getElementById(`themeOpt${t.charAt(0).toUpperCase()+t.slice(1)}`);
    if (btn) btn.classList.toggle('active', t === theme);
  });
  updateColorPreview(theme);
};

window.applyEffect = (key, value) => {
  saveSettings(key, value);
  if (key === 'blobs') {
    document.querySelectorAll('.ph-blob,.blob').forEach(b => b.style.display = value ? '' : 'none');
  }
  if (key === 'cardAnim') {
    document.documentElement.classList.toggle('no-card-anim', !value);
  }
};

window.applyFontSize = (size) => {
  document.documentElement.style.setProperty('--body-font-size', size + 'px');
  const lbl = document.getElementById('fontSizeLabel');
  if (lbl) lbl.textContent = size + 'px';
  saveSettings('fontSize', parseInt(size));
};

window.resetSettings = () => {
  localStorage.removeItem('binhblog_settings');
  applyTheme('dark', false);
  document.documentElement.style.setProperty('--body-font-size', '16px');
  document.documentElement.removeAttribute('data-theme');
  // Re-render settings page
  const container = document.getElementById('mainContent');
  if (container) renderSettingsPage(container);
};

function updateColorPreview(theme) {
  const el = document.getElementById('colorPreview');
  if (!el) return;
  const palettes = {
    dark:   ['#060b18','#0d1526','#3b82f6','#06b6d4','#8b5cf6'],
    light:  ['#f8fafc','#ffffff','#2563eb','#0891b2','#7c3aed'],
    ocean:  ['#020c18','#071929','#0ea5e9','#06b6d4','#0284c7'],
    forest: ['#051208','#0a1f0f','#22c55e','#16a34a','#15803d'],
  };
  const cols = palettes[theme] || palettes.dark;
  el.innerHTML = cols.map(c =>
    `<div class="color-swatch" style="background:${c}" title="${c}"></div>`
  ).join('');
}
