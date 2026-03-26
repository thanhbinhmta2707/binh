// ===== IMPORT FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
  getFirestore, collection, addDoc, getDocs, 
  doc, getDoc, query, orderBy 
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

// ===== INIT =====
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

// ===== AUTH STATE =====
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  const adminBtn = document.getElementById("adminBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    document.getElementById("login").classList.add("hidden");
    adminBtn.style.display = "inline-block";
    logoutBtn.style.display = "inline-block";
  } else {
    document.getElementById("login").classList.remove("hidden");
    adminBtn.style.display = "none";
    logoutBtn.style.display = "none";
  }
});

// ===== LOGIN =====
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Đăng nhập thành công");
  } catch {
    alert("Sai tài khoản");
  }
};


// ===== LOGOUT =====
window.logout = async function () {
  await signOut(auth);
  alert("Đã đăng xuất");
};

// ===== LOAD POSTS =====
async function renderPosts(keyword = "") {
  const container = document.getElementById("posts");
  container.innerHTML = "⏳ Đang tải...";

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const post = docSnap.data();

    if (!post.title.toLowerCase().includes(keyword.toLowerCase())) return;

    container.innerHTML += `
      <div class="card">
        <h3 onclick="openPost('${docSnap.id}')">${post.title}</h3>
        <p>${post.content.substring(0, 100)}...</p>
        <small>${new Date(post.createdAt).toLocaleString()}</small>
      </div>
    `;
  });
}

// ===== SEARCH =====
document.getElementById("searchInput").addEventListener("input", (e) => {
  renderPosts(e.target.value);
});

// ===== ADD POST =====
window.addPost = async function () {
  if (!currentUser) {
  alert("Bạn phải đăng nhập");
  return;
}

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;

  if (!title || !content) return alert("Nhập đầy đủ");

  await addDoc(collection(db, "posts"), {
    title,
    content,
    createdAt: Date.now()
  });

  alert("Đã đăng!");
  renderPosts();

  document.getElementById("title").value = "";
document.getElementById("content").value = "";
};

// ===== OPEN POST (ROUTING) =====
window.openPost = function (id) {
  window.location.search = "?post=" + id;
};

// ===== LOAD POST FROM URL =====
async function loadPost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("post");

  if (!id) return;

  const docSnap = await getDoc(doc(db, "posts", id));
  const post = docSnap.data();

  document.getElementById("home").classList.add("hidden");
  document.getElementById("postDetail").classList.remove("hidden");

  detailTitle.innerText = post.title;
  detailContent.innerText = post.content;
  detailDate.innerText = new Date(post.createdAt).toLocaleString();
}

// ===== NAV =====
window.goHome = function () {
  window.location.href = window.location.origin + window.location.pathname;
};
window.showAdmin = function () {
  if (!currentUser) {
    alert("Bạn chưa đăng nhập");
    return;
  }

  document.getElementById("home").classList.add("hidden");
  document.getElementById("postDetail").classList.add("hidden");
  document.getElementById("admin").classList.remove("hidden");
};
// ===== INIT =====
renderPosts();
loadPost();