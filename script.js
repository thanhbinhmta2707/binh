// IMPORT FIREBASE (v9 chuẩn)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy, getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDoqgh0UWzxJAMCrfH5yHQfflyCLt5iCos",
  authDomain: "binh-kiemtien.firebaseapp.com",
  projectId: "binh-kiemtien",
};

// INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// LOAD POSTS
async function renderPosts() {
  const container = document.getElementById("posts");
  container.innerHTML = "Đang tải...";

  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const post = docSnap.data();

    container.innerHTML += `
      <div class="card">
        <h3 onclick="openPost('${docSnap.id}')">${post.title}</h3>
        <p>${post.content.substring(0, 80)}...</p>
        <small>${new Date(post.createdAt).toLocaleString()}</small>
      </div>
    `;
  });
}
// LOGIN
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Đăng nhập thành công");
    showAdmin();
  } catch (e) {
    alert("Sai tài khoản");
  }
};
// LOGOUT
window.logout = function () {
  signOut(auth);
  alert("Đã đăng xuất");
};
// ADD POST
window.addPost = async function () {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;

  if (!title || !content) {
    alert("Nhập đầy đủ");
    return;
  }

  await addDoc(collection(db, "posts"), {
    title,
    content,
    createdAt: Date.now()
  });

  alert("Đã đăng!");
  renderPosts();
};

// OPEN POST
window.openPost = async function (id) {
  const docRef = doc(db, "posts", id);
  const docSnap = await getDoc(docRef);

  const post = docSnap.data();

  document.getElementById("home").classList.add("hidden");
  document.getElementById("postDetail").classList.remove("hidden");

  document.getElementById("detailTitle").innerText = post.title;
  document.getElementById("detailContent").innerText = post.content;
};

// NAV
window.showHome = function () {
  document.getElementById("home").classList.remove("hidden");
  document.getElementById("postDetail").classList.add("hidden");
  document.getElementById("admin").classList.add("hidden");
};

window.showAdmin = function () {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("postDetail").classList.add("hidden");
  document.getElementById("admin").classList.remove("hidden");
};

// INIT
renderPosts();