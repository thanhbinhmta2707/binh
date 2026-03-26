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

// ===== CLOUDINARY CONFIG =====
const CLOUD_NAME = "dydftmhvg";
const UPLOAD_PRESET = "binh_upload";

// ===== AUTH =====
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  document.getElementById("adminBtn").style.display = user ? "inline-block" : "none";
  document.getElementById("logoutBtn").style.display = user ? "inline-block" : "none";
  document.getElementById("login").style.display = user ? "none" : "block";
});

// ===== LOGIN =====
window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Đăng nhập thành công");
  } catch {
    alert("Sai tài khoản");
  }
};

window.logout = () => signOut(auth);

// ===== UPLOAD CLOUDINARY =====
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

// ===== RENDER =====
async function renderPosts(keyword = "") {
  const container = document.getElementById("posts");
  container.innerHTML = "Loading...";

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();

    if (!p.title.toLowerCase().includes(keyword.toLowerCase())) return;

    container.innerHTML += `
      <div class="card">
        <h3 onclick="openPost('${docSnap.id}')">${p.title}</h3>
        <p>${p.content.substring(0,100)}...</p>
        ${p.media ? renderMedia(p.media) : ""}
        ${currentUser ? `
          <button onclick="deletePost('${docSnap.id}')">Xoá</button>
        ` : ""}
      </div>
    `;
  });
}

// ===== MEDIA =====
function renderMedia(url) {
  if (url.includes("video")) {
    return `<video src="${url}" controls></video>`;
  }
  return `<img src="${url}">`;
}

// ===== ADD POST =====
window.addPost = async () => {
  if (!currentUser) return alert("Login trước");

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const file = document.getElementById("file").files[0];

  let media = "";
  if (file) media = await uploadFile(file);

  await addDoc(collection(db, "posts"), {
    title,
    content,
    media,
    createdAt: Date.now()
  });

  alert("Đã đăng!");
  renderPosts();
};

// ===== DELETE =====
window.deletePost = async (id) => {
  await deleteDoc(doc(db, "posts", id));
  renderPosts();
};

// ===== OPEN POST =====
window.openPost = (id) => {
  location.search = "?post=" + id;
};

// ===== LOAD DETAIL =====
async function loadPost() {
  const id = new URLSearchParams(location.search).get("post");
  if (!id) return;

  const docSnap = await getDoc(doc(db, "posts", id));
  const p = docSnap.data();

  document.getElementById("home").classList.add("hidden");
  document.getElementById("postDetail").classList.remove("hidden");

  document.getElementById("detailTitle").innerText = p.title;
  document.getElementById("detailContent").innerHTML = `
    <p>${p.content}</p>
    ${p.media ? renderMedia(p.media) : ""}
  `;
  document.getElementById("detailDate").innerText =
    new Date(p.createdAt).toLocaleString();
}

// ===== NAV =====
window.goHome = () => location.href = location.pathname;

window.showAdmin = () => {
  if (!currentUser) return alert("Chưa login");
  document.getElementById("home").classList.add("hidden");
  document.getElementById("admin").classList.remove("hidden");
};

// ===== SEARCH =====
document.getElementById("searchInput").oninput = (e) =>
  renderPosts(e.target.value);

// ===== INIT =====
renderPosts();
loadPost();