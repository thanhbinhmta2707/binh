import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  doc, getDoc, deleteDoc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDoqgh0UWzxJAMCrfH5yHQfflyCLt5iCos",
  authDomain: "binh-kiemtien.firebaseapp.com",
  projectId: "binh-kiemtien",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ===== CLOUDINARY =====
const CLOUD_NAME = "dydftmhvg";
const UPLOAD_PRESET = "binh_upload";

// ===== STATE =====
let currentUser = null;
let selectedFiles = [];   // { file, previewUrl }
let editingMediaUrls = []; // existing media urls when editing
let detailSlideIndex = 0;
let detailMediaList = [];

// ===== HEADER SCROLL =====
window.addEventListener("scroll", () => {
  const h = document.getElementById("header");
  if (window.scrollY > 20) h.classList.add("scrolled");
  else h.classList.remove("scrolled");
});

// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const show = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.style.display = val ? "inline-flex" : "none";
  };
  show("adminBtn", user); show("adminBtnMobile", user);
  show("logoutBtn", user); show("logoutBtnMobile", user);

  const loginSection = document.getElementById("login");
  if (loginSection) {
    loginSection.style.display = user ? "none" : "flex";
    // if logged in and on login section, go home
    if (user && !loginSection.classList.contains("hidden")) {
      loginSection.classList.add("hidden");
    }
  }
  renderPosts();
});

// ===== LOGIN =====
window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return showToast("Vui lòng điền đầy đủ", "error");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast("Đăng nhập thành công ✅");
    document.getElementById("login").classList.add("hidden");
  } catch {
    showToast("Sai tài khoản hoặc mật khẩu", "error");
  }
};

window.logout = () => {
  signOut(auth);
  goHome();
};

// ===== MOBILE NAV =====
window.toggleMobileNav = () => {
  document.getElementById("mobileNav").classList.toggle("open");
};
window.closeMobileNav = () => {
  document.getElementById("mobileNav").classList.remove("open");
};

// ===== FILE HANDLING =====
const fileInput = document.getElementById("file");
const fileDrop = document.getElementById("fileDrop");

fileInput.addEventListener("change", (e) => {
  handleNewFiles(Array.from(e.target.files));
  fileInput.value = "";
});

// Drag & drop
fileDrop.addEventListener("dragover", (e) => { e.preventDefault(); fileDrop.classList.add("dragover"); });
fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("dragover"));
fileDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  fileDrop.classList.remove("dragover");
  handleNewFiles(Array.from(e.dataTransfer.files));
});

function handleNewFiles(files) {
  files.forEach(file => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    const url = URL.createObjectURL(file);
    selectedFiles.push({ file, previewUrl: url });
  });
  renderFilePreview();
}

function renderFilePreview() {
  const container = document.getElementById("filePreview");
  container.innerHTML = "";

  // Show existing media (when editing)
  editingMediaUrls.forEach((url, i) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";
    const isVideo = url.includes("video") || /\.(mp4|mov|webm)(\?|$)/i.test(url);
    wrap.innerHTML = isVideo
      ? `<video src="${url}" muted></video>`
      : `<img src="${url}">`;
    const btn = document.createElement("button");
    btn.className = "preview-remove";
    btn.innerHTML = "×";
    btn.onclick = () => { editingMediaUrls.splice(i, 1); renderFilePreview(); };
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });

  // Show new files
  selectedFiles.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";
    const isVideo = item.file.type.startsWith("video/");
    wrap.innerHTML = isVideo
      ? `<video src="${item.previewUrl}" muted></video>`
      : `<img src="${item.previewUrl}">`;
    const btn = document.createElement("button");
    btn.className = "preview-remove";
    btn.innerHTML = "×";
    btn.onclick = () => { selectedFiles.splice(i, 1); renderFilePreview(); };
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });
}

// ===== UPLOAD CLOUDINARY =====
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const type = file.type.startsWith("video/") ? "video" : "image";
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  return data.secure_url;
}

// ===== RENDER POSTS =====
async function renderPosts(keyword = "") {
  const container = document.getElementById("posts");
  const empty = document.getElementById("emptyState");
  container.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
      <div style="font-size:32px;margin-bottom:12px">⏳</div>Đang tải...
    </div>`;

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const all = [];
  snap.forEach(d => all.push({ id: d.id, ...d.data() }));
  const filtered = all.filter(p => p.title.toLowerCase().includes(keyword.toLowerCase()));

  // Update hero count
  const countEl = document.getElementById("postCount");
  if (countEl) countEl.textContent = all.length;

  container.innerHTML = "";
  empty.classList.toggle("hidden", filtered.length > 0);

  filtered.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${idx * 0.06}s`;

    const mediaList = Array.isArray(p.media) ? p.media : (p.media ? [p.media] : []);
    const date = new Date(p.createdAt).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" });

    card.innerHTML = `
      ${mediaList.length > 0 ? `
        <div class="card-media" id="cm-${p.id}">
          <div class="card-slider" id="cs-${p.id}">
            ${mediaList.map(url => isVideo(url)
              ? `<video class="card-slide-video" src="${url}" muted loop playsinline></video>`
              : `<img class="card-slide" src="${url}" alt="media" loading="lazy">`
            ).join("")}
          </div>
          ${mediaList.length > 1 ? `
            <button class="card-slider-prev" onclick="event.stopPropagation();cardSlide('${p.id}',-1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="card-slider-next" onclick="event.stopPropagation();cardSlide('${p.id}',1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <div class="card-media-count">📷 ${mediaList.length}</div>
          ` : ""}
        </div>
      ` : ""}
      <div class="card-body" onclick="openPost('${p.id}')">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-excerpt">${p.content.substring(0, 120)}${p.content.length > 120 ? "..." : ""}</p>
        <div class="card-footer">
          <span class="card-date">${date}</span>
          <div class="card-actions" onclick="event.stopPropagation()">
            ${currentUser ? `
              <button class="card-btn edit" onclick="editPost('${p.id}')">✏️ Sửa</button>
              <button class="card-btn delete" onclick="confirmDelete('${p.id}')">🗑 Xoá</button>
            ` : ""}
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Card slide (thumbnail)
const cardSlideIndexes = {};
window.cardSlide = (id, dir) => {
  const slider = document.getElementById(`cs-${id}`);
  if (!slider) return;
  const total = slider.children.length;
  if (!cardSlideIndexes[id]) cardSlideIndexes[id] = 0;
  cardSlideIndexes[id] = (cardSlideIndexes[id] + dir + total) % total;
  slider.style.transform = `translateX(-${cardSlideIndexes[id] * 100}%)`;
};

// ===== ADD / EDIT POST =====
window.addPost = async () => {
  if (!currentUser) return showToast("Vui lòng đăng nhập", "error");

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  if (!title) return showToast("Vui lòng nhập tiêu đề", "error");

  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const submitLoading = document.getElementById("submitLoading");

  submitBtn.disabled = true;
  submitText.classList.add("hidden");
  submitLoading.classList.remove("hidden");

  try {
    // Upload new files
    const newUrls = await Promise.all(selectedFiles.map(f => uploadFile(f.file)));
    const allMedia = [...editingMediaUrls, ...newUrls];

    const editId = document.getElementById("editPostId").value;

    if (editId) {
      await updateDoc(doc(db, "posts", editId), { title, content, media: allMedia });
      showToast("✅ Đã cập nhật bài viết!");
    } else {
      await addDoc(collection(db, "posts"), {
        title, content,
        media: allMedia,
        createdAt: Date.now()
      });
      showToast("🚀 Đã đăng bài thành công!");
    }

    resetForm();
    goHome();
  } catch (err) {
    console.error(err);
    showToast("Có lỗi xảy ra: " + err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitText.classList.remove("hidden");
    submitLoading.classList.add("hidden");
  }
};

function resetForm() {
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("editPostId").value = "";
  document.getElementById("adminFormTitle").textContent = "✏️ Đăng bài mới";
  document.getElementById("submitText").textContent = "🚀 Đăng bài";
  selectedFiles = [];
  editingMediaUrls = [];
  renderFilePreview();
}

// ===== EDIT POST =====
window.editPost = async (id) => {
  if (!currentUser) return;

  const docSnap = await getDoc(doc(db, "posts", id));
  if (!docSnap.exists()) return showToast("Không tìm thấy bài viết", "error");

  const p = docSnap.data();

  document.getElementById("editPostId").value = id;
  document.getElementById("title").value = p.title;
  document.getElementById("content").value = p.content;
  document.getElementById("adminFormTitle").textContent = "✏️ Chỉnh sửa bài viết";
  document.getElementById("submitText").textContent = "💾 Lưu thay đổi";

  // Load existing media
  editingMediaUrls = Array.isArray(p.media) ? [...p.media] : (p.media ? [p.media] : []);
  selectedFiles = [];
  renderFilePreview();

  showAdminSection();
};

// ===== DELETE =====
window.confirmDelete = async (id) => {
  if (!confirm("Xác nhận xoá bài viết này?")) return;
  await deleteDoc(doc(db, "posts", id));
  showToast("🗑 Đã xoá bài viết");
  renderPosts();
};

// ===== OPEN POST =====
window.openPost = (id) => { location.search = "?post=" + id; };

// ===== LOAD POST DETAIL =====
async function loadPost() {
  const id = new URLSearchParams(location.search).get("post");
  if (!id) return;

  try {
    const docSnap = await getDoc(doc(db, "posts", id));
    if (!docSnap.exists()) { goHome(); return; }

    const p = docSnap.data();

    document.getElementById("home").classList.add("hidden");
    document.getElementById("heroSection").classList.add("hidden");
    document.getElementById("postDetail").classList.remove("hidden");

    document.getElementById("detailTitle").innerText = p.title;
    document.getElementById("detailContent").innerText = p.content;
    document.getElementById("detailDate").innerText =
      new Date(p.createdAt).toLocaleString("vi-VN");

    // Media
    detailMediaList = Array.isArray(p.media) ? p.media : (p.media ? [p.media] : []);
    detailSlideIndex = 0;

    const sliderWrap = document.getElementById("detailMedia");
    const slider = document.getElementById("detailSlider");
    const dots = document.getElementById("sliderDots");
    const prevBtn = document.querySelector(".slider-prev");
    const nextBtn = document.querySelector(".slider-next");

    if (detailMediaList.length > 0) {
      sliderWrap.classList.remove("hidden");
      slider.innerHTML = detailMediaList.map(url =>
        isVideo(url)
          ? `<video class="media-slide-video" src="${url}" controls playsinline></video>`
          : `<img class="media-slide" src="${url}" alt="media" loading="lazy">`
      ).join("");

      // Dots
      dots.innerHTML = detailMediaList.map((_, i) =>
        `<button class="dot ${i===0?"active":""}" onclick="goToSlide(${i})"></button>`
      ).join("");

      // Hide nav if only 1
      if (detailMediaList.length <= 1) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        dots.style.display = "none";
      } else {
        prevBtn.style.display = "";
        nextBtn.style.display = "";
        dots.style.display = "";
      }
    } else {
      sliderWrap.classList.add("hidden");
    }
  } catch (err) {
    console.error(err);
  }
}

// Slider controls
window.slideMedia = (dir) => {
  if (detailMediaList.length === 0) return;
  detailSlideIndex = (detailSlideIndex + dir + detailMediaList.length) % detailMediaList.length;
  updateDetailSlider();
};

window.goToSlide = (i) => {
  detailSlideIndex = i;
  updateDetailSlider();
};

function updateDetailSlider() {
  const slider = document.getElementById("detailSlider");
  slider.style.transform = `translateX(-${detailSlideIndex * 100}%)`;
  // update dots
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === detailSlideIndex));
}

// ===== NAV =====
window.goHome = () => {
  location.href = location.pathname;
};

function showAdminSection() {
  hideAllSections();
  document.getElementById("admin").classList.remove("hidden");
}

window.showAdmin = () => {
  if (!currentUser) return showToast("Vui lòng đăng nhập trước", "error");
  resetForm();
  showAdminSection();
};

function hideAllSections() {
  ["home", "postDetail", "admin", "heroSection"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

// ===== SEARCH =====
document.getElementById("searchInput").oninput = (e) => renderPosts(e.target.value);

// ===== TOAST =====
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3200);
}

// ===== UTIL =====
function isVideo(url) {
  return /video/.test(url) || /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);
}

// ===== INIT =====
renderPosts();
loadPost();
