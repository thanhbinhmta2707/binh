import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, addDoc, getDocs,
  doc, getDoc, deleteDoc, updateDoc, query, orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDoqgh0UWzxJAMCrfH5yHQfflyCLt5iCos",
  authDomain: "binh-kiemtien.firebaseapp.com",
  projectId: "binh-kiemtien",
};

const app = initializeApp(firebaseConfig);
// Fix deprecation: dùng initializeFirestore + persistentLocalCache
const db  = initializeFirestore(app, {
  cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
const auth = getAuth(app);

// ===== CLOUDINARY =====
const CLOUD_NAME    = "dydftmhvg";
const UPLOAD_PRESET = "binh_upload";

// ===== ADMIN UID =====
const ADMIN_UID = "R8vTMWzECsOkgP8aX1CdNntISNI3";

// ===== STATE =====
let currentUser      = null;
let selectedFiles    = [];
let editingMediaUrls = [];
let detailSlideIndex = 0;
let detailMediaList  = [];
let currentPostId    = null;
let commentsUnsub    = null;
let replyToComment   = null; // { id, userName }

// ===== HEADER SCROLL =====
window.addEventListener("scroll", () => {
  document.getElementById("header").classList.toggle("scrolled", window.scrollY > 20);
});

// ===== UTILS =====
function isAdmin(user)    { return user && user.uid === ADMIN_UID; }
function isVideo(url)     { return /video/.test(url) || /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url); }
function getInitial(name) { return (name || "?").charAt(0).toUpperCase(); }
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
}
function escapeHtml(str) {
  return (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
                    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

// ===== AUTH STATE =====
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNavUI(user);
  if (currentPostId) updateCommentFormUI(user);
  renderPosts();
});

function updateNavUI(user) {
  const show = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = val ? (el.classList.contains("user-chip") ? "flex" : "inline-flex") : "none";
  };
  const admin = isAdmin(user);
  show("adminBtn",             admin);
  show("adminBtnMobile",       admin);
  show("logoutBtn",            !!user);
  show("logoutBtnMobile",      !!user);
  show("loginNavBtn",          !user);
  show("loginNavBtnMobile",    !user);
  show("registerNavBtnMobile", !user);

  const chip = document.getElementById("userChip");
  if (chip) {
    chip.style.display = user ? "flex" : "none";
    if (user) {
      const name  = user.displayName || user.email.split("@")[0];
      const short = name.length > 12 ? name.slice(0, 12) + "…" : name;
      document.getElementById("userChipName").textContent   = short;
      document.getElementById("userChipAvatar").textContent = getInitial(name);
    }
  }
}

function updateCommentFormUI(user) {
  const form   = document.getElementById("commentForm");
  const prompt = document.getElementById("commentLoginPrompt");
  if (!form || !prompt) return;
  if (user) {
    form.classList.remove("hidden");
    prompt.classList.add("hidden");
    const name = user.displayName || user.email.split("@")[0];
    document.getElementById("commentAvatar").textContent   = getInitial(name);
    document.getElementById("commentUserName").textContent = name;
  } else {
    form.classList.add("hidden");
    prompt.classList.remove("hidden");
    cancelReply();
  }
}

// ===== AUTH MODAL =====
window.showAuthModal  = (tab = "login") => {
  document.getElementById("authModal").classList.remove("hidden");
  switchTab(tab);
};
window.hideAuthModal  = () => document.getElementById("authModal").classList.add("hidden");
window.closeAuthModal = (e) => { if (e.target.id === "authModal") hideAuthModal(); };
window.switchTab      = (tab) => {
  const isLogin = tab === "login";
  document.getElementById("authLoginForm").classList.toggle("hidden", !isLogin);
  document.getElementById("authRegisterForm").classList.toggle("hidden", isLogin);
  document.getElementById("tabLogin").classList.toggle("active", isLogin);
  document.getElementById("tabRegister").classList.toggle("active", !isLogin);
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideAuthModal(); });

// ===== LOGIN =====
window.login = async () => {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return showToast("Vui lòng điền đầy đủ", "error");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast("✅ Đăng nhập thành công!");
    hideAuthModal();
  } catch (err) {
    const msg =
      err.code === "auth/invalid-credential" ? "Sai email hoặc mật khẩu" :
      err.code === "auth/user-not-found"      ? "Tài khoản không tồn tại" :
      err.code === "auth/wrong-password"      ? "Sai mật khẩu" : "Đăng nhập thất bại";
    showToast(msg, "error");
  }
};

// ===== REGISTER =====
window.register = async () => {
  const name     = document.getElementById("regName").value.trim();
  const email    = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  if (!name)               return showToast("Vui lòng nhập tên hiển thị", "error");
  if (!email)              return showToast("Vui lòng nhập email", "error");
  if (password.length < 6) return showToast("Mật khẩu ít nhất 6 ký tự", "error");
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    showToast(`🎉 Chào mừng ${name}! Đăng ký thành công.`);
    hideAuthModal();
  } catch (err) {
    const msg =
      err.code === "auth/email-already-in-use" ? "Email này đã được đăng ký" :
      err.code === "auth/invalid-email"         ? "Email không hợp lệ" :
      err.code === "auth/weak-password"         ? "Mật khẩu quá yếu" : "Đăng ký thất bại";
    showToast(msg, "error");
  }
};

// ===== LOGOUT =====
window.logout = async () => {
  await signOut(auth);
  showToast("Đã đăng xuất");
  goHome();
};

// ===== MOBILE NAV =====
window.toggleMobileNav = () => document.getElementById("mobileNav").classList.toggle("open");
window.closeMobileNav  = () => document.getElementById("mobileNav").classList.remove("open");

// ===== FILE HANDLING =====
const fileInput = document.getElementById("file");
const fileDrop  = document.getElementById("fileDrop");

fileInput.addEventListener("change", (e) => {
  handleNewFiles(Array.from(e.target.files));
  fileInput.value = "";
});
fileDrop.addEventListener("dragover",  (e) => { e.preventDefault(); fileDrop.classList.add("dragover"); });
fileDrop.addEventListener("dragleave", ()  => fileDrop.classList.remove("dragover"));
fileDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  fileDrop.classList.remove("dragover");
  handleNewFiles(Array.from(e.dataTransfer.files));
});

function handleNewFiles(files) {
  files.forEach(f => {
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return;
    selectedFiles.push({ file: f, previewUrl: URL.createObjectURL(f) });
  });
  renderFilePreview();
}

function renderFilePreview() {
  const container = document.getElementById("filePreview");
  container.innerHTML = "";
  editingMediaUrls.forEach((url, i) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";
    wrap.innerHTML = isVideo(url) ? `<video src="${url}" muted></video>` : `<img src="${url}">`;
    const btn = document.createElement("button");
    btn.className = "preview-remove"; btn.innerHTML = "×";
    btn.onclick = () => { editingMediaUrls.splice(i, 1); renderFilePreview(); };
    wrap.appendChild(btn); container.appendChild(wrap);
  });
  selectedFiles.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "preview-item";
    wrap.innerHTML = item.file.type.startsWith("video/")
      ? `<video src="${item.previewUrl}" muted></video>`
      : `<img src="${item.previewUrl}">`;
    const btn = document.createElement("button");
    btn.className = "preview-remove"; btn.innerHTML = "×";
    btn.onclick = () => { selectedFiles.splice(i, 1); renderFilePreview(); };
    wrap.appendChild(btn); container.appendChild(wrap);
  });
}

// ===== CLOUDINARY UPLOAD =====
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const type = file.type.startsWith("video/") ? "video" : "image";
  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`, {
    method: "POST", body: formData
  });
  return (await res.json()).secure_url;
}

// ===== RENDER POSTS =====
async function renderPosts(keyword = "") {
  const container = document.getElementById("posts");
  const empty     = document.getElementById("emptyState");
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:32px;margin-bottom:12px">⏳</div>Đang tải...</div>`;

  try {
    const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
    const all  = [];
    snap.forEach(d => all.push({ id: d.id, ...d.data() }));
    const filtered = all.filter(p => p.title.toLowerCase().includes(keyword.toLowerCase()));

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
          <div class="card-media">
            <div class="card-slider" id="cs-${p.id}">
              ${mediaList.map(url => isVideo(url)
                ? `<video class="card-slide-video" src="${url}" muted loop playsinline></video>`
                : `<img class="card-slide" src="${url}" alt="" loading="lazy">`
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
          <h3 class="card-title">${escapeHtml(p.title)}</h3>
          <p class="card-excerpt">${escapeHtml(p.content.substring(0, 120))}${p.content.length > 120 ? "…" : ""}</p>
          <div class="card-footer">
            <span class="card-date">${date}</span>
            <div class="card-actions" onclick="event.stopPropagation()">
              ${isAdmin(currentUser) ? `
                <button class="card-btn edit"   onclick="editPost('${p.id}')">✏️ Sửa</button>
                <button class="card-btn delete" onclick="confirmDelete('${p.id}')">🗑 Xoá</button>
              ` : ""}
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("renderPosts error:", err);
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">Không thể tải bài viết. Vui lòng thử lại.</div>`;
  }
}

const cardSlideIndexes = {};
window.cardSlide = (id, dir) => {
  const slider = document.getElementById(`cs-${id}`);
  if (!slider) return;
  const total = slider.children.length;
  cardSlideIndexes[id] = ((cardSlideIndexes[id] || 0) + dir + total) % total;
  slider.style.transform = `translateX(-${cardSlideIndexes[id] * 100}%)`;
};

// ===== ADD / EDIT POST =====
window.addPost = async () => {
  if (!isAdmin(currentUser)) return showToast("Không có quyền admin", "error");
  const title   = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  if (!title) return showToast("Vui lòng nhập tiêu đề", "error");

  const btn = document.getElementById("submitBtn");
  document.getElementById("submitText").classList.add("hidden");
  document.getElementById("submitLoading").classList.remove("hidden");
  btn.disabled = true;

  try {
    const newUrls  = await Promise.all(selectedFiles.map(f => uploadFile(f.file)));
    const allMedia = [...editingMediaUrls, ...newUrls];
    const editId   = document.getElementById("editPostId").value;

    if (editId) {
      await updateDoc(doc(db, "posts", editId), { title, content, media: allMedia });
      showToast("✅ Đã cập nhật bài viết!");
    } else {
      await addDoc(collection(db, "posts"), { title, content, media: allMedia, createdAt: Date.now() });
      showToast("🚀 Đăng bài thành công!");
    }
    resetForm(); goHome();
  } catch (err) {
    showToast("Lỗi: " + err.message, "error");
  } finally {
    btn.disabled = false;
    document.getElementById("submitText").classList.remove("hidden");
    document.getElementById("submitLoading").classList.add("hidden");
  }
};

function resetForm() {
  document.getElementById("title").value      = "";
  document.getElementById("content").value    = "";
  document.getElementById("editPostId").value = "";
  document.getElementById("adminFormTitle").textContent = "✏️ Đăng bài mới";
  document.getElementById("submitText").textContent     = "🚀 Đăng bài";
  selectedFiles = []; editingMediaUrls = [];
  renderFilePreview();
}

window.editPost = async (id) => {
  if (!isAdmin(currentUser)) return;
  const snap = await getDoc(doc(db, "posts", id));
  if (!snap.exists()) return showToast("Không tìm thấy bài viết", "error");
  const p = snap.data();
  document.getElementById("editPostId").value           = id;
  document.getElementById("title").value                = p.title;
  document.getElementById("content").value              = p.content;
  document.getElementById("adminFormTitle").textContent = "✏️ Chỉnh sửa bài viết";
  document.getElementById("submitText").textContent     = "💾 Lưu thay đổi";
  editingMediaUrls = Array.isArray(p.media) ? [...p.media] : (p.media ? [p.media] : []);
  selectedFiles = [];
  renderFilePreview();
  showAdminSection();
};

window.confirmDelete = async (id) => {
  if (!confirm("Xác nhận xoá bài viết này?")) return;
  await deleteDoc(doc(db, "posts", id));
  showToast("🗑 Đã xoá bài viết");
  renderPosts();
};

// ===== REPLY — mở inline box ngay dưới comment cha =====
window.startReply = (parentCommentId, targetUserName) => {
  if (!currentUser) return showAuthModal("login");

  // Đóng tất cả reply box đang mở
  document.querySelectorAll(".inline-reply-box").forEach(el => el.remove());
  replyToComment = { id: parentCommentId, userName: targetUserName };

  const parentEl = document.getElementById(`cmt-${parentCommentId}`);
  if (!parentEl) return;

  const myName    = currentUser.displayName || currentUser.email.split("@")[0];
  const myInitial = getInitial(myName);

  const box = document.createElement("div");
  box.className = "inline-reply-box";
  box.id = `reply-box-${parentCommentId}`;
  box.innerHTML = `
    <div class="inline-reply-inner">
      <div class="comment-item-avatar" style="width:28px;height:28px;font-size:11px;flex-shrink:0;margin-top:2px">${myInitial}</div>
      <div style="flex:1">
        <textarea class="inline-reply-textarea" id="reply-text-${parentCommentId}"
          placeholder="Trả lời @${escapeHtml(targetUserName)}..." rows="2"></textarea>
        <div class="inline-reply-footer">
          <button class="btn-reply-cancel" onclick="cancelReply()">Huỷ</button>
          <button class="btn-reply-send"   onclick="submitReply('${parentCommentId}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Gửi
          </button>
        </div>
      </div>
    </div>
  `;

  // Chèn reply box vào TRƯỚC replies-wrap (hoặc cuối comment nếu chưa có)
  const repliesWrap = parentEl.querySelector(".replies-wrap");
  if (repliesWrap) {
    parentEl.insertBefore(box, repliesWrap);
  } else {
    parentEl.appendChild(box);
  }

  setTimeout(() => document.getElementById(`reply-text-${parentCommentId}`)?.focus(), 50);
};

window.cancelReply = () => {
  replyToComment = null;
  document.querySelectorAll(".inline-reply-box").forEach(el => el.remove());
};

// ===== SUBMIT REPLY =====
window.submitReply = async (parentCommentId) => {
  if (!currentUser) return showAuthModal("login");
  const ta   = document.getElementById(`reply-text-${parentCommentId}`);
  const text = ta ? ta.value.trim() : "";
  if (!text) return showToast("Vui lòng nhập nội dung", "error");
  if (!currentPostId) return;

  const btn = document.querySelector(`#reply-box-${parentCommentId} .btn-reply-send`);
  if (btn) btn.disabled = true;

  try {
    const name = currentUser.displayName || currentUser.email.split("@")[0];
    await addDoc(collection(db, "posts", currentPostId, "comments"), {
      text,
      userName:  name,
      userId:    currentUser.uid,
      isAdmin:   isAdmin(currentUser),
      createdAt: Date.now(),
      parentId:  parentCommentId,
      replyTo:   { id: parentCommentId, userName: replyToComment?.userName || "" }
    });
    cancelReply();
    showToast("💬 Đã gửi trả lời!");
  } catch (err) {
    console.error("submitReply error:", err);
    showToast("Lỗi gửi trả lời. Thử lại!", "error");
    if (btn) btn.disabled = false;
  }
};

// ===== SUBMIT TOP-LEVEL COMMENT =====
window.submitComment = async () => {
  if (!currentUser) return showAuthModal("login");
  const text = document.getElementById("commentText").value.trim();
  if (!text) return showToast("Vui lòng nhập nội dung", "error");
  if (!currentPostId) return;

  const btn = document.querySelector(".btn-comment-submit");
  btn.disabled = true;
  try {
    const name = currentUser.displayName || currentUser.email.split("@")[0];
    await addDoc(collection(db, "posts", currentPostId, "comments"), {
      text,
      userName:  name,
      userId:    currentUser.uid,
      isAdmin:   isAdmin(currentUser),
      createdAt: Date.now(),
      parentId:  null,
      replyTo:   null
    });
    document.getElementById("commentText").value = "";
    showToast("💬 Đã gửi bình luận!");
  } catch (err) {
    console.error("submitComment error:", err);
    showToast("Lỗi gửi bình luận. Thử lại!", "error");
  } finally {
    btn.disabled = false;
  }
};

// ===== SUBSCRIBE COMMENTS (realtime) =====
function subscribeComments(postId) {
  if (commentsUnsub) { commentsUnsub(); commentsUnsub = null; }

  const list  = document.getElementById("commentList");
  const badge = document.getElementById("commentCount");
  if (!list) return;
  list.innerHTML = `<div class="comment-empty">⏳ Đang tải bình luận...</div>`;

  const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));

  commentsUnsub = onSnapshot(q,
    (snap) => {
      const all = [];
      snap.forEach(d => all.push({ id: d.id, ...d.data() }));
      if (badge) badge.textContent = all.length;
      renderThreadedComments(all, list);
    },
    (err) => {
      console.error("onSnapshot error:", err);
      getDocs(q).then(snap => {
        const all = [];
        snap.forEach(d => all.push({ id: d.id, ...d.data() }));
        if (badge) badge.textContent = all.length;
        renderThreadedComments(all, list);
      }).catch(() => {
        list.innerHTML = `<div class="comment-empty">Không thể tải bình luận.</div>`;
      });
    }
  );
}

// ===== RENDER THREADED COMMENTS (Facebook style) =====
function renderThreadedComments(allComments, list) {
  if (allComments.length === 0) {
    list.innerHTML = `<div class="comment-empty">Chưa có bình luận nào. Hãy là người đầu tiên! 👇</div>`;
    return;
  }

  // Phân tầng: top-level và replies map theo parentId
  const topLevel  = allComments.filter(c => !c.parentId);
  const repliesMap = {};
  allComments.filter(c => c.parentId).forEach(c => {
    if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
    repliesMap[c.parentId].push(c);
  });

  list.innerHTML = "";
  topLevel.forEach(c => {
    const el = buildCommentEl(c, false);
    list.appendChild(el);

    // Container cho replies — luôn tạo để reply box có chỗ chèn vào
    const repliesWrap = document.createElement("div");
    repliesWrap.className = "replies-wrap";
    repliesWrap.id = `replies-${c.id}`;

    const children = repliesMap[c.id] || [];
    children.forEach(r => repliesWrap.appendChild(buildCommentEl(r, true)));

    el.appendChild(repliesWrap);
  });
}

function buildCommentEl(c, isReply) {
  const canDelete = currentUser && (currentUser.uid === c.userId || isAdmin(currentUser));
  const item = document.createElement("div");
  item.className = isReply ? "comment-item comment-reply-item" : "comment-item";
  item.id = `cmt-${c.id}`;

  // Nút "Trả lời": reply item trả lời vào comment cha (parentId), không tạo chuỗi vô tận
  const replyParentId   = isReply ? c.parentId : c.id;
  const replyTargetName = escapeHtml(c.userName);

  item.innerHTML = `
    <div class="comment-item-avatar${c.isAdmin ? " admin-avatar" : ""}"
         style="${isReply ? "width:30px;height:30px;font-size:12px;" : ""}">
      ${getInitial(c.userName)}
    </div>
    <div class="comment-item-body">
      <div class="comment-bubble">
        <div class="comment-bubble-header">
          <span class="comment-item-name${c.isAdmin ? " admin-name" : ""}">${escapeHtml(c.userName)}</span>
          ${c.isAdmin ? `<span class="admin-badge">ADMIN</span>` : ""}
        </div>
        ${isReply && c.replyTo?.userName
          ? `<span class="reply-mention">@${escapeHtml(c.replyTo.userName)}</span> `
          : ""}
        <span class="comment-item-text">${escapeHtml(c.text)}</span>
      </div>
      <div class="comment-actions-row">
        <span class="comment-item-date">${timeAgo(c.createdAt)}</span>
        ${currentUser
          ? `<button class="reply-btn" onclick="startReply('${replyParentId}','${replyTargetName}')">Trả lời</button>`
          : ""}
        ${canDelete
          ? `<button class="comment-delete-btn" onclick="deleteComment('${c.id}')">Xoá</button>`
          : ""}
      </div>
    </div>
  `;
  return item;
}

window.deleteComment = async (commentId) => {
  if (!currentUser || !currentPostId) return;
  if (!confirm("Xoá bình luận này?")) return;
  try {
    await deleteDoc(doc(db, "posts", currentPostId, "comments", commentId));
    showToast("🗑 Đã xoá bình luận");
  } catch {
    showToast("Lỗi xoá bình luận", "error");
  }
};

// ===== OPEN / LOAD POST =====
window.openPost = (id) => { location.search = "?post=" + id; };

async function loadPost() {
  const id = new URLSearchParams(location.search).get("post");
  if (!id) return;
  currentPostId = id;

  try {
    const snap = await getDoc(doc(db, "posts", id));
    if (!snap.exists()) { goHome(); return; }
    const p = snap.data();

    document.getElementById("home").classList.add("hidden");
    document.getElementById("heroSection").classList.add("hidden");
    document.getElementById("postDetail").classList.remove("hidden");

    document.getElementById("detailTitle").innerText   = p.title;
    document.getElementById("detailContent").innerText = p.content;
    document.getElementById("detailDate").innerText    = new Date(p.createdAt).toLocaleString("vi-VN");

    detailMediaList  = Array.isArray(p.media) ? p.media : (p.media ? [p.media] : []);
    detailSlideIndex = 0;

    const sliderWrap = document.getElementById("detailMedia");
    const slider     = document.getElementById("detailSlider");
    const dots       = document.getElementById("sliderDots");
    const prevBtn    = document.querySelector(".slider-prev");
    const nextBtn    = document.querySelector(".slider-next");

    if (detailMediaList.length > 0) {
      sliderWrap.classList.remove("hidden");
      slider.innerHTML = detailMediaList.map(url =>
        isVideo(url)
          ? `<video class="media-slide-video" src="${url}" controls playsinline></video>`
          : `<img class="media-slide" src="${url}" alt="" loading="lazy">`
      ).join("");
      dots.innerHTML = detailMediaList.map((_, i) =>
        `<button class="dot ${i===0?"active":""}" onclick="goToSlide(${i})"></button>`
      ).join("");
      const multi = detailMediaList.length > 1;
      prevBtn.style.display = multi ? "" : "none";
      nextBtn.style.display = multi ? "" : "none";
      dots.style.display    = multi ? "" : "none";
    } else {
      sliderWrap.classList.add("hidden");
    }

    updateCommentFormUI(currentUser);
    subscribeComments(id);
  } catch (err) {
    console.error("loadPost error:", err);
  }
}

window.slideMedia = (dir) => {
  if (!detailMediaList.length) return;
  detailSlideIndex = (detailSlideIndex + dir + detailMediaList.length) % detailMediaList.length;
  updateDetailSlider();
};
window.goToSlide = (i) => { detailSlideIndex = i; updateDetailSlider(); };
function updateDetailSlider() {
  document.getElementById("detailSlider").style.transform = `translateX(-${detailSlideIndex * 100}%)`;
  document.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === detailSlideIndex));
}

// ===== NAV =====
window.goHome = () => {
  if (commentsUnsub) { commentsUnsub(); commentsUnsub = null; }
  location.href = location.pathname;
};

function showAdminSection() {
  ["home","postDetail","admin","heroSection"].forEach(id => document.getElementById(id)?.classList.add("hidden"));
  document.getElementById("admin").classList.remove("hidden");
}
window.showAdmin = () => {
  if (!isAdmin(currentUser)) return showToast("Bạn không có quyền admin", "error");
  resetForm();
  showAdminSection();
};

// ===== SEARCH =====
document.getElementById("searchInput").oninput = (e) => renderPosts(e.target.value);

// ===== TOAST =====
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className   = `toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), 3200);
}

// ===== INIT =====
renderPosts();
loadPost();
