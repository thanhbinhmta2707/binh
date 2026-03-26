// ===== IMPORT =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
  getFirestore, collection, addDoc, getDocs,
  doc, getDoc, deleteDoc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ===== CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDoqgh0UWzxJAMCrfH5yHQfflyCLt5iCos",
  authDomain: "binh-kiemtien.firebaseapp.com",
  projectId: "binh-kiemtien",
storageBucket: "binh-kiemtien.appspot.com" //
};

// ===== INIT =====
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

let currentUser = null;
const adminBtn = document.getElementById("adminBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginSection = document.getElementById("login");

// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    adminBtn.style.display = "inline-block";
    logoutBtn.style.display = "inline-block";
    loginSection.style.display = "none";
  } else {
    adminBtn.style.display = "none";
    logoutBtn.style.display = "none";
    loginSection.style.display = "block";
  }
});

// ===== LOGIN =====
window.login = async () => {
  const emailVal = document.getElementById("email").value;
  const passVal = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, emailVal, passVal);
    alert("Đăng nhập thành công");
    showAdmin();
  } catch {
    alert("Sai tài khoản");
  }
};

// ===== LOGOUT =====
window.logout = async () => {
  await signOut(auth);
};

// ===== UPLOAD FILE =====
async function uploadFile(file) {
  const storageRef = ref(storage, "uploads/" + Date.now() + file.name);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ===== RENDER =====
async function renderPosts(keyword = "") {
  posts.innerHTML = "Loading...";

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  posts.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();

    if (!p.title.toLowerCase().includes(keyword.toLowerCase())) return;

    posts.innerHTML += `
      <div class="card">
        <h3 onclick="openPost('${docSnap.id}')">${p.title}</h3>
        <p>${p.content.substring(0,100)}...</p>

        ${p.media ? renderMedia(p.media) : ""}

        ${currentUser ? `
          <button onclick="editPost('${docSnap.id}','${p.title}','${p.content}')">Sửa</button>
          <button onclick="deletePost('${docSnap.id}')">Xoá</button>
        ` : ""}
      </div>
    `;
  });
}

// ===== MEDIA =====
function renderMedia(url) {
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return `<video src="${url}" controls></video>`;
  }
  return `<img src="${url}">`;
}

// ===== ADD =====
window.addPost = async () => {
  if (!currentUser) return alert("Login trước");

  const t = document.getElementById("title").value;
  const c = document.getElementById("content").value;
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  let media = "";

  if (file) {
    // 🔥 CHECK TYPE
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Chỉ upload ảnh hoặc video");
      return;
    }

    try {
      media = await uploadFile(file);
    } catch (e) {
      console.error(e);
      alert("Upload lỗi!");
      return;
    }
  }

  await addDoc(collection(db, "posts"), {
    title: t,
    content: c,
    media,
    createdAt: Date.now()
  });

  alert("Đăng thành công");

  // reset form
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  fileInput.value = "";

  renderPosts();
};

// ===== DELETE =====
window.deletePost = async (id) => {
  if (!confirm("Xoá bài?")) return;
  await deleteDoc(doc(db, "posts", id));
  renderPosts();
};

// ===== EDIT =====
window.editPost = async (id, oldT, oldC) => {
  const t = prompt("Tiêu đề", oldT);
  const c = prompt("Nội dung", oldC);

  if (!t || !c) return;

  await updateDoc(doc(db, "posts", id), {
    title: t,
    content: c
  });

  renderPosts();
};

// ===== OPEN =====
window.openPost = (id) => {
  location.search = "?post=" + id;
};

// ===== LOAD DETAIL =====
async function loadPost() {
  const id = new URLSearchParams(location.search).get("post");
  if (!id) return;

  const docSnap = await getDoc(doc(db, "posts", id));
  const p = docSnap.data();

  home.classList.add("hidden");
  postDetail.classList.remove("hidden");

  detailTitle.innerText = p.title;
  detailContent.innerHTML = `
    <p>${p.content}</p>
    ${p.media ? renderMedia(p.media) : ""}
  `;
  detailDate.innerText = new Date(p.createdAt).toLocaleString();
}

// ===== NAV =====
window.goHome = () => location.href = location.pathname;

window.showAdmin = () => {
  if (!currentUser) return alert("Chưa login");
  home.classList.add("hidden");
  admin.classList.remove("hidden");
};

// ===== SEARCH =====
searchInput.oninput = (e) => renderPosts(e.target.value);

// ===== INIT =====
renderPosts();
loadPost();
