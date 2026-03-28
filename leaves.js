// ===== HIỆU ỨNG RỤNG LÁ =====
export function triggerLeafEffect() {
  // Chỉ chạy nếu người dùng bật hiệu ứng
  let settings = {};
  try { settings = JSON.parse(localStorage.getItem("binhblog_settings") || "{}"); } catch {}
  if (settings.leaves === false) return;

  const container = document.createElement("div");
  container.id = "leafContainer";
  container.style.cssText = `
    position:fixed; inset:0; pointer-events:none; z-index:9990; overflow:hidden;
  `;
  document.body.appendChild(container);

  const symbols = ["🍀","🌸","🍁","🌺","⭐","💫","✨","🌼","🍃","💰","🚀"];
  const total   = 60;
  const leaves  = [];

  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      const leaf = document.createElement("div");
      const sym  = symbols[Math.floor(Math.random() * symbols.length)];
      const size = 18 + Math.random() * 24;
      const startX = Math.random() * 100;        // vw
      const dur    = 4 + Math.random() * 5;      // giây rơi
      const delay  = Math.random() * 0.5;        // delay nhỏ

      leaf.textContent = sym;
      leaf.style.cssText = `
        position: absolute;
        font-size: ${size}px;
        left: ${startX}vw;
        top: -60px;
        opacity: 0;
        animation: leafFall ${dur}s ${delay}s ease-in forwards;
        --swing: ${(Math.random() - 0.5) * 200}px;
        --rot: ${Math.random() * 720 - 360}deg;
        will-change: transform, opacity;
        user-select: none;
      `;
      container.appendChild(leaf);
      leaves.push(leaf);
    }, i * 80);
  }

  // Inject keyframes nếu chưa có
  if (!document.getElementById("leafStyles")) {
    const style = document.createElement("style");
    style.id = "leafStyles";
    style.textContent = `
      @keyframes leafFall {
        0%   { transform: translateY(0)   translateX(0)         rotate(0deg);       opacity: 0; }
        10%  {                                                                       opacity: 1; }
        85%  {                                                                       opacity: 1; }
        100% { transform: translateY(105vh) translateX(var(--swing)) rotate(var(--rot)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Dọn dẹp sau 10 giây
  setTimeout(() => {
    container.style.transition = "opacity 1s";
    container.style.opacity    = "0";
    setTimeout(() => container.remove(), 1200);
  }, 10000);
}
