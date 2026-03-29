import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc,
  query, orderBy, onSnapshot, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { renderHomePage    } from "./page-home.js";
import { renderPostsPage   } from "./page-posts.js";
import { renderFinancePage } from "./page-finance.js";
import { renderSettingsPage, applyAllSettings } from "./page-settings.js";
import { renderStockPredictorPage } from "./page-stock-predictor.js";
import { triggerLeafEffect } from "./leaves.js";

// ===== FIREBASE =====
const firebaseConfig = {
  apiKey:    "AIzaSyDoqgh0UWzxJAMCrfH5yHQfflyCLt5iCos",
  authDomain:"binh-kiemtien.firebaseapp.com",
  projectId: "binh-kiemtien",
};
const app  = initializeApp(firebaseConfig);
const db   = initializeFirestore(app, {
  cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
const auth = getAuth(app);

const CLOUD_NAME    = "dydftmhvg";
const UPLOAD_PRESET = "binh_upload";
const ADMIN_UID     = "R8vTMWzECsOkgP8aX1CdNntISNI3";

// ===== STATE =====
let currentUser      = null;
let currentPage      = "home";
let currentPostId    = null;
let selectedFiles    = [];
let editingMediaUrls = [];
let detailSlideIndex = 0;
let detailMediaList  = [];
let commentsUnsub    = null;
let replyToComment   = null;
let wasLoggedIn      = false;

applyAllSettings();

// ===== UTILS =====
function isAdmin(u)   { return u && u.uid === ADMIN_UID; }
function isVideo(url) { return /video/.test(url) || /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url); }
function getInitial(n){ return (n||"?").charAt(0).toUpperCase(); }
function timeAgo(ts) {
  const d=Date.now()-ts, m=Math.floor(d/60000);
  if(m<1) return "Vừa xong";
  if(m<60) return `${m} phút trước`;
  const h=Math.floor(m/60);
  if(h<24) return `${h} giờ trước`;
  const dy=Math.floor(h/24);
  if(dy<30) return `${dy} ngày trước`;
  return new Date(ts).toLocaleDateString("vi-VN");
}
function escapeHtml(s) {
  return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
               .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function showToast(msg, type="success") {
  const t=document.getElementById("toast");
  t.textContent=msg; t.className=`toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.add("hidden"),3200);
}

// ===== HEADER SCROLL =====
window.addEventListener("scroll",()=>{
  document.getElementById("header").classList.toggle("scrolled",window.scrollY>20);
});

// ===== AUTH STATE =====
onAuthStateChanged(auth,(user)=>{
  const justLoggedIn = !wasLoggedIn && !!user;
  wasLoggedIn = !!user;
  currentUser = user;
  updateNavUI(user);
  updateSidebarUser(user);

  if(justLoggedIn){
    showToast(`✅ Chào mừng ${user.displayName||user.email.split("@")[0]}!`);
    triggerLeafEffect();
  }
  if(currentPage==="posts") loadAndRenderPosts();
  if(currentPostId) updateCommentFormUI(user);
});

function updateNavUI(user){
  const show=(id,val,mode="inline-flex")=>{
    const el=document.getElementById(id);
    if(!el) return;
    if(id==="userChip") el.style.display=val?"flex":"none";
    else el.style.display=val?mode:"none";
  };
  const admin=isAdmin(user);
  show("adminBtn",admin);
  show("logoutBtn",!!user);
  show("loginNavBtn",!user);
  show("userChip",!!user);
  if(user){
    const name=user.displayName||user.email.split("@")[0];
    const short=name.length>12?name.slice(0,12)+"…":name;
    document.getElementById("userChipName").textContent=short;
    document.getElementById("userChipAvatar").textContent=getInitial(name);
  }
  // Show stock predictor nav only for admin
  const sn=document.getElementById("nav-stock");
  if(sn) sn.style.display=admin?"flex":"none";
}

function updateSidebarUser(user){
  const name=user?(user.displayName||user.email.split("@")[0]):"Khách";
  const role=user?(isAdmin(user)?"👑 Admin":"👤 Thành viên"):"Chưa đăng nhập";
  document.getElementById("sidebarUserName").textContent=name;
  document.getElementById("sidebarUserRole").textContent=role;
  document.getElementById("sidebarAvatar").textContent=user?getInitial(name):"👤";
}

// ===== SIDEBAR =====
let sidebarOpen=false;
window.toggleSidebar=()=>{
  if(window.innerWidth>=1024){
    document.getElementById("sidebar").classList.toggle("collapsed");
    document.getElementById("mainContent").classList.toggle("expanded");
  } else {
    sidebarOpen=!sidebarOpen;
    document.getElementById("sidebar").classList.toggle("open",sidebarOpen);
    document.getElementById("sidebarOverlay").classList.toggle("visible",sidebarOpen);
  }
};
window.closeSidebar=()=>{
  sidebarOpen=false;
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("visible");
};

// ===== ROUTER =====
window.navigateTo=(page)=>{
  currentPage=page;
  closeSidebar();
  document.getElementById("postDetail").classList.add("hidden");
  document.getElementById("admin").classList.add("hidden");
  if(document.getElementById("paymentModal")) document.getElementById("paymentModal").classList.add("hidden");
  currentPostId=null;
  if(commentsUnsub){commentsUnsub();commentsUnsub=null;}

  ["home","posts","finance","settings","stock"].forEach(p=>{
    document.getElementById(`nav-${p}`)?.classList.toggle("active",p===page);
  });

  const main=document.getElementById("mainContent");
  switch(page){
    case "home":    renderHomePage(main); updateHomePostCount(); break;
    case "posts":   renderPostsPage(main); loadAndRenderPosts(); break;
    case "finance": renderFinancePage(main); break;
    case "settings":renderSettingsPage(main); break;
    case "stock":
      if(!isAdmin(currentUser)){showToast("Chỉ admin mới xem được","error");return;}
      renderStockPredictorPage(main); break;
  }
  window.scrollTo(0,0);
};

async function updateHomePostCount(){
  try{
    const snap=await getDocs(collection(db,"posts"));
    const el=document.getElementById("homePostCount");
    if(el) el.textContent=snap.size;
  }catch{}
}

// ===== AUTH MODAL =====
window.showAuthModal =(tab="login")=>{
  document.getElementById("authModal").classList.remove("hidden");
  switchTab(tab);
};
window.hideAuthModal =()=>document.getElementById("authModal").classList.add("hidden");
window.closeAuthModal=(e)=>{if(e.target.id==="authModal")hideAuthModal();};
window.switchTab=(tab)=>{
  const isL=tab==="login";
  document.getElementById("authLoginForm").classList.toggle("hidden",!isL);
  document.getElementById("authRegisterForm").classList.toggle("hidden",isL);
  document.getElementById("tabLogin").classList.toggle("active",isL);
  document.getElementById("tabRegister").classList.toggle("active",!isL);
};
document.addEventListener("keydown",(e)=>{if(e.key==="Escape"){hideAuthModal(); closePaymentModal();}});

window.login=async()=>{
  const email=document.getElementById("email").value.trim();
  const pw=document.getElementById("password").value;
  if(!email||!pw) return showToast("Vui lòng điền đầy đủ","error");
  try{
    await signInWithEmailAndPassword(auth,email,pw);
    hideAuthModal();
  }catch(err){
    const m=err.code==="auth/invalid-credential"?"Sai email hoặc mật khẩu":
            err.code==="auth/user-not-found"?"Tài khoản không tồn tại":"Đăng nhập thất bại";
    showToast(m,"error");
  }
};

window.register=async()=>{
  const name=document.getElementById("regName").value.trim();
  const email=document.getElementById("regEmail").value.trim();
  const pw=document.getElementById("regPassword").value;
  if(!name) return showToast("Vui lòng nhập tên","error");
  if(!email) return showToast("Vui lòng nhập email","error");
  if(pw.length<6) return showToast("Mật khẩu ít nhất 6 ký tự","error");
  try{
    const cred=await createUserWithEmailAndPassword(auth,email,pw);
    await updateProfile(cred.user,{displayName:name});
    hideAuthModal();
  }catch(err){
    const m=err.code==="auth/email-already-in-use"?"Email đã được đăng ký":
            err.code==="auth/weak-password"?"Mật khẩu quá yếu":"Đăng ký thất bại";
    showToast(m,"error");
  }
};

window.logout=async()=>{
  await signOut(auth);
  wasLoggedIn=false;
  showToast("Đã đăng xuất");
  navigateTo("home");
};

// ===== LOAD POSTS =====
async function loadAndRenderPosts(keyword=""){
  const container=document.getElementById("posts");
  const empty=document.getElementById("emptyState");
  if(!container) return;

  container.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:30px;margin-bottom:10px">⏳</div>Đang tải...</div>`;

  try{
    const snap=await getDocs(query(collection(db,"posts"),orderBy("createdAt","desc")));
    const all=[];
    snap.forEach(d=>all.push({id:d.id,...d.data()}));
    const filtered=all.filter(p=>p.title.toLowerCase().includes(keyword.toLowerCase()));

    container.innerHTML="";
    if(empty) empty.classList.toggle("hidden",filtered.length>0);

    filtered.forEach((p,idx)=>{
      const card=document.createElement("div");
      card.className="card";
      card.style.animationDelay=`${idx*0.06}s`;
      const media=Array.isArray(p.media)?p.media:(p.media?[p.media]:[]);
      const date=new Date(p.createdAt).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});
      card.innerHTML=`
        ${media.length?`
          <div class="card-media">
            <div class="card-slider" id="cs-${p.id}">
              ${media.map(u=>isVideo(u)
                ?`<video class="card-slide-video" src="${u}" muted loop playsinline></video>`
                :`<img class="card-slide" src="${u}" alt="" loading="lazy">`
              ).join("")}
            </div>
            ${media.length>1?`
              <button class="card-slider-prev" onclick="event.stopPropagation();cardSlide('${p.id}',-1)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button class="card-slider-next" onclick="event.stopPropagation();cardSlide('${p.id}',1)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <div class="card-media-count">📷 ${media.length}</div>`:""}
          </div>`:""}
        <div class="card-body" onclick="openPost('${p.id}')">
          <h3 class="card-title">${escapeHtml(p.title)}</h3>
          <p class="card-excerpt">${escapeHtml(p.content.substring(0,120))}${p.content.length>120?"…":""}</p>
          <div class="card-footer">
            <span class="card-date">${date}</span>
            <div class="card-actions" onclick="event.stopPropagation()">
              ${isAdmin(currentUser)?`
                <button class="card-btn edit"   onclick="editPost('${p.id}')">✏️ Sửa</button>
                <button class="card-btn delete" onclick="confirmDelete('${p.id}')">🗑 Xoá</button>`:""}
            </div>
          </div>
        </div>`;
      container.appendChild(card);
    });

    const si=document.getElementById("searchInput");
    if(si) si.oninput=(e)=>loadAndRenderPosts(e.target.value);
  }catch(err){
    console.error(err);
    container.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">Không thể tải bài viết.</div>`;
  }
}

const cardSlideIdxs={};
window.cardSlide=(id,dir)=>{
  const s=document.getElementById(`cs-${id}`);
  if(!s) return;
  const total=s.children.length;
  cardSlideIdxs[id]=((cardSlideIdxs[id]||0)+dir+total)%total;
  s.style.transform=`translateX(-${cardSlideIdxs[id]*100}%)`;
};

// ===== OPEN POST =====
window.openPost=async(id)=>{
  currentPostId=id;
  try{
    const snap=await getDoc(doc(db,"posts",id));
    if(!snap.exists()) return showToast("Bài viết không tồn tại","error");
    const p=snap.data();

    document.getElementById("postDetail").classList.remove("hidden");
    window.scrollTo(0,0);

    document.getElementById("detailTitle").innerText=p.title;
    document.getElementById("detailContent").innerText=p.content;
    document.getElementById("detailDate").innerText=new Date(p.createdAt).toLocaleString("vi-VN");

    // Stock ticker from title (e.g. "Phân tích MBB")
    const tickerMatch=p.title.match(/\b([A-Z]{2,5})\b/);
    const ticker=tickerMatch?tickerMatch[1]:"";
    document.getElementById("postPayBtn").setAttribute("data-ticker",ticker);
    document.getElementById("postPayBtn").setAttribute("data-postid",id);

    // Reactions
    loadReactions(id);

    detailMediaList=Array.isArray(p.media)?p.media:(p.media?[p.media]:[]);
    detailSlideIndex=0;

    const wrap=document.getElementById("detailMedia");
    const slider=document.getElementById("detailSlider");
    const dots=document.getElementById("sliderDots");
    const prev=document.querySelector(".slider-prev");
    const next=document.querySelector(".slider-next");

    if(detailMediaList.length>0){
      wrap.classList.remove("hidden");
      slider.innerHTML=detailMediaList.map(u=>isVideo(u)
        ?`<video class="media-slide-video" src="${u}" controls playsinline></video>`
        :`<img class="media-slide" src="${u}" alt="" loading="lazy">`
      ).join("");
      dots.innerHTML=detailMediaList.map((_,i)=>
        `<button class="dot ${i===0?"active":""}" onclick="goToSlide(${i})"></button>`
      ).join("");
      const multi=detailMediaList.length>1;
      prev.style.display=multi?"":"none";
      next.style.display=multi?"":"none";
      dots.style.display=multi?"":"none";
    } else {
      wrap.classList.add("hidden");
    }

    updateCommentFormUI(currentUser);
    subscribeComments(id);
  }catch(err){
    console.error(err);
    showToast("Lỗi tải bài viết","error");
  }
};

window.closePostDetail=()=>{
  document.getElementById("postDetail").classList.add("hidden");
  currentPostId=null;
  if(commentsUnsub){commentsUnsub();commentsUnsub=null;}
};

window.slideMedia=(dir)=>{
  if(!detailMediaList.length) return;
  detailSlideIndex=(detailSlideIndex+dir+detailMediaList.length)%detailMediaList.length;
  updateDetailSlider();
};
window.goToSlide=(i)=>{detailSlideIndex=i;updateDetailSlider();};
function updateDetailSlider(){
  document.getElementById("detailSlider").style.transform=`translateX(-${detailSlideIndex*100}%)`;
  document.querySelectorAll(".dot").forEach((d,i)=>d.classList.toggle("active",i===detailSlideIndex));
}

// ===== REACTIONS =====
const REACTIONS=[
  {key:"like",  emoji:"👍", label:"Thích"},
  {key:"love",  emoji:"❤️", label:"Yêu thích"},
  {key:"rocket",emoji:"🚀", label:"Tuyệt vời"},
  {key:"think", emoji:"🤔", label:"Cần suy nghĩ"},
  {key:"down",  emoji:"📉", label:"Không khả quan"},
];

async function loadReactions(postId){
  const wrap=document.getElementById("reactionsWrap");
  if(!wrap) return;

  // Load counts from Firestore
  let counts={};
  let userReacted=null;
  try{
    const rDoc=await getDoc(doc(db,"reactions",postId));
    if(rDoc.exists()) counts=rDoc.data().counts||{};
    if(currentUser){
      const uDoc=await getDoc(doc(db,"reactions",postId,"users",currentUser.uid));
      if(uDoc.exists()) userReacted=uDoc.data().reaction;
    }
  }catch{}

  wrap.innerHTML=`
    <div class="reactions-bar">
      ${REACTIONS.map(r=>`
        <button class="reaction-btn ${userReacted===r.key?"reacted":""}"
          onclick="toggleReaction('${postId}','${r.key}')"
          title="${r.label}">
          <span class="reaction-emoji">${r.emoji}</span>
          <span class="reaction-count">${counts[r.key]||0}</span>
        </button>`).join("")}
    </div>
    <div class="share-bar">
      <span class="share-label">Chia sẻ:</span>
      <button class="share-btn" onclick="sharePost('facebook')" title="Facebook">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
      </button>
      <button class="share-btn" onclick="sharePost('twitter')" title="X/Twitter">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </button>
      <button class="share-btn" onclick="sharePost('copy')" title="Sao chép link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    </div>`;
}

window.toggleReaction=async(postId, reactionKey)=>{
  if(!currentUser) return showAuthModal("login");

  try{
    const rRef=doc(db,"reactions",postId);
    const uRef=doc(db,"reactions",postId,"users",currentUser.uid);
    const uDoc=await getDoc(uRef);
    const rDoc=await getDoc(rRef);

    let counts=rDoc.exists()?rDoc.data().counts||{}:{};
    const prev=uDoc.exists()?uDoc.data().reaction:null;

    if(prev===reactionKey){
      // Remove reaction
      counts[reactionKey]=Math.max((counts[reactionKey]||1)-1,0);
      await deleteDoc(uRef);
    } else {
      if(prev) counts[prev]=Math.max((counts[prev]||1)-1,0);
      counts[reactionKey]=(counts[reactionKey]||0)+1;
      await setDoc(uRef,{reaction:reactionKey,uid:currentUser.uid});
    }
    await setDoc(rRef,{counts},{merge:true});
    loadReactions(postId);
  }catch(err){
    console.error(err);
  }
};

window.sharePost=(platform)=>{
  const url=encodeURIComponent(location.href);
  const title=encodeURIComponent(document.getElementById("detailTitle")?.innerText||"Binh Blog");
  if(platform==="facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`,"_blank");
  else if(platform==="twitter") window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`,"_blank");
  else if(platform==="copy"){
    navigator.clipboard.writeText(location.href).then(()=>showToast("✅ Đã sao chép link!"));
  }
};

// ===== PAYMENT MODAL (Req 4) =====
window.showPaymentModal=(postId, ticker)=>{
  let modal=document.getElementById("paymentModal");
  if(!modal){
    modal=document.createElement("div");
    modal.id="paymentModal";
    modal.className="modal-overlay hidden";
    modal.onclick=(e)=>{if(e.target.id==="paymentModal") closePaymentModal();};
    modal.innerHTML=`
      <div class="modal-card payment-card">
        <button class="modal-close" onclick="closePaymentModal()">×</button>
        <div class="payment-header">
          <div class="payment-icon">🤖</div>
          <h2>Công cụ AI hỗ trợ ra quyết định</h2>
          <p class="payment-sub">Dự đoán xu hướng <strong id="payTicker"></strong> trong 1 tháng tới</p>
        </div>
        <div class="payment-price-row">
          <div class="payment-price">50.000 đ</div>
          <div class="payment-price-note">/ 1 tháng · 1 mã chứng khoán</div>
        </div>
        <div class="payment-qr-wrap">
          <div class="payment-qr-label">Quét mã QR BIDV để thanh toán</div>
          <div class="payment-qr-box">
            <img src="https://img.vietqr.io/image/BIDV-8807351188-compact2.png?amount=50000&addInfo=BinhBlog AI &accountName=BUI THANH BINH"
                 alt="QR BIDV" class="payment-qr-img"
                 onerror="this.outerHTML='<div class=qr-fallback>📱 QR BIDV<br>STK: 8803751188<br>50.000đ</div>'">
          </div>
          <div class="payment-bank-info">
            <div class="bank-row"><span>Ngân hàng:</span><strong>BIDV</strong></div>
            <div class="bank-row"><span>Số tài khoản:</span><strong>8803751188</strong></div>
            <div class="bank-row"><span>Số tiền:</span><strong>50.000 đ</strong></div>
            <div class="bank-row"><span>Nội dung:</span><strong>BinhBlog AI <span id="payTickerNote"></span></strong></div>
          </div>
        </div>
        <button class="btn-submit btn-paid" onclick="confirmPayment()">
          ✅ Tôi đã thanh toán — Xem dự đoán
        </button>
        <p class="payment-note">Sau khi xác nhận, biểu đồ dự đoán sẽ hiển thị ngay. Admin sẽ kiểm tra giao dịch và khoá nếu phát hiện gian lận.</p>
      </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById("payTicker").textContent = ticker||"chứng khoán";
  document.getElementById("payTickerNote").textContent = ticker||"";
  modal.setAttribute("data-postid", postId);
  modal.setAttribute("data-ticker", ticker||"");
  modal.classList.remove("hidden");
};

window.closePaymentModal=()=>{
  const m=document.getElementById("paymentModal");
  if(m) m.classList.add("hidden");
};

window.confirmPayment=async()=>{
  const modal=document.getElementById("paymentModal");
  const postId=modal.getAttribute("data-postid");
  const ticker=modal.getAttribute("data-ticker");
  closePaymentModal();
  // Show prediction chart for this post
  showPaidForecastChart(postId, ticker);
};

async function showPaidForecastChart(postId, ticker){
  // Try load saved prediction for this post from Firestore (admin saved)
  let predictedData=[];
  let stockData=[];
  try{
    const sDoc=await getDoc(doc(db,"stockPredictions",postId));
    if(sDoc.exists()){
      stockData=sDoc.data().historical||[];
      predictedData=sDoc.data().predicted||[];
    }
  }catch{}

  let overlay=document.getElementById("forecastOverlay");
  if(!overlay){
    overlay=document.createElement("div");
    overlay.id="forecastOverlay";
    overlay.className="modal-overlay";
    overlay.onclick=(e)=>{if(e.target.id==="forecastOverlay") overlay.classList.add("hidden");};
    overlay.innerHTML=`
      <div class="modal-card stock-viewer-card">
        <button class="modal-close" onclick="document.getElementById('forecastOverlay').classList.add('hidden')">×</button>
        <div class="stock-viewer-header">
          <div>
            <h2 id="forecastTitle">Dự báo AI</h2>
            <p class="stock-viewer-sub" id="forecastSub"></p>
          </div>
        </div>
        <div class="stock-chart-container">
          <canvas id="forecastChart"></canvas>
        </div>
        <div id="forecastSummary" class="predict-summary"></div>
      </div>`;
    document.body.appendChild(overlay);
  }

  document.getElementById("forecastTitle").textContent=`🤖 Dự báo ${ticker||"chứng khoán"} — 1 tháng tới`;
  document.getElementById("forecastSub").textContent=`${stockData.length} phiên lịch sử · ${predictedData.length} phiên dự đoán`;
  overlay.classList.remove("hidden");

  if(stockData.length===0 && predictedData.length===0){
    document.getElementById("forecastSummary").innerHTML=`
      <div style="text-align:center;padding:32px;color:var(--text-muted)">
        <div style="font-size:40px;margin-bottom:12px">⏳</div>
        Admin chưa cập nhật dự đoán cho bài viết này.<br>Vui lòng liên hệ admin hoặc quay lại sau.
      </div>`;
    return;
  }

  // Draw chart
  await ensureChartJsGlobal();
  drawForecastLineChart(stockData, predictedData, ticker);
}

async function ensureChartJsGlobal(){
  if(window.Chart) return;
  await new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
    s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });
}

function drawForecastLineChart(historical, predicted, ticker){
  const canvas=document.getElementById("forecastChart");
  if(!canvas) return;
  if(canvas._chartInst){canvas._chartInst.destroy();}

  const isDark=document.documentElement.getAttribute("data-theme")!=="light";
  const gridC=isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)";
  const textC=isDark?"#94a3b8":"#475569";

  const histLabels=historical.map(d=>d.date);
  const histClose=historical.map(d=>d.c);
  const predLabels=predicted.map(d=>d.date);
  const predClose=predicted.map(d=>d.c);
  const allLabels=[...histLabels,...predLabels];

  // Pad historical with nulls for pred length and vice versa
  const histDataFull=[...histClose,...new Array(predLabels.length).fill(null)];
  const predDataFull=[...new Array(histLabels.length-1).fill(null),histClose[histClose.length-1],...predClose];

  canvas._chartInst=new window.Chart(canvas,{
    type:"line",
    data:{
      labels:allLabels,
      datasets:[
        {
          label:"Lịch sử",
          data:histDataFull,
          borderColor:"#3b82f6",
          backgroundColor:"rgba(59,130,246,0.08)",
          borderWidth:2,
          pointRadius:0,
          fill:true,
          tension:0.3,
        },
        {
          label:"Dự báo AI",
          data:predDataFull,
          borderColor:"#f59e0b",
          backgroundColor:"rgba(245,158,11,0.08)",
          borderWidth:2,
          borderDash:[6,3],
          pointRadius:0,
          fill:true,
          tension:0.3,
        },
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{labels:{color:textC}},
        tooltip:{callbacks:{label:(c)=>` ${c.dataset.label}: ${c.raw?.toFixed(2)||""}`}}
      },
      scales:{
        x:{ticks:{color:textC,maxTicksLimit:16,maxRotation:45},grid:{color:gridC}},
        y:{ticks:{color:textC},grid:{color:gridC}}
      }
    }
  });
}

// Wire up pay button inside post detail
document.addEventListener("click",(e)=>{
  const btn=e.target.closest("#postPayBtn");
  if(btn){
    const ticker=btn.getAttribute("data-ticker")||"";
    const postId=btn.getAttribute("data-postid")||currentPostId||"";
    showPaymentModal(postId, ticker);
  }
});

// ===== ADMIN =====
window.showAdmin=()=>{
  if(!isAdmin(currentUser)) return showToast("Không có quyền admin","error");
  resetForm();
  document.getElementById("admin").classList.remove("hidden");
  window.scrollTo(0,0);
};
window.closeAdmin=()=>document.getElementById("admin").classList.add("hidden");

window.addPost=async()=>{
  if(!isAdmin(currentUser)) return showToast("Không có quyền","error");
  const title=document.getElementById("title").value.trim();
  const content=document.getElementById("content").value.trim();
  if(!title) return showToast("Vui lòng nhập tiêu đề","error");

  const btn=document.getElementById("submitBtn");
  document.getElementById("submitText").classList.add("hidden");
  document.getElementById("submitLoading").classList.remove("hidden");
  btn.disabled=true;

  try{
    const newUrls=await Promise.all(selectedFiles.map(f=>uploadFile(f.file)));
    const allMedia=[...editingMediaUrls,...newUrls];
    const editId=document.getElementById("editPostId").value;
    if(editId){
      await updateDoc(doc(db,"posts",editId),{title,content,media:allMedia});
      showToast("✅ Đã cập nhật bài viết!");
    } else {
      await addDoc(collection(db,"posts"),{title,content,media:allMedia,createdAt:Date.now()});
      showToast("🚀 Đăng bài thành công!");
    }
    resetForm(); closeAdmin(); navigateTo("posts");
  }catch(err){showToast("Lỗi: "+err.message,"error");}
  finally{
    btn.disabled=false;
    document.getElementById("submitText").classList.remove("hidden");
    document.getElementById("submitLoading").classList.add("hidden");
  }
};

function resetForm(){
  document.getElementById("title").value="";
  document.getElementById("content").value="";
  document.getElementById("editPostId").value="";
  document.getElementById("adminFormTitle").textContent="✏️ Đăng bài mới";
  document.getElementById("submitText").textContent="🚀 Đăng bài";
  selectedFiles=[]; editingMediaUrls=[];
  renderFilePreview();
}

window.editPost=async(id)=>{
  if(!isAdmin(currentUser)) return;
  const s=await getDoc(doc(db,"posts",id));
  if(!s.exists()) return showToast("Không tìm thấy bài viết","error");
  const p=s.data();
  document.getElementById("editPostId").value=id;
  document.getElementById("title").value=p.title;
  document.getElementById("content").value=p.content;
  document.getElementById("adminFormTitle").textContent="✏️ Chỉnh sửa bài viết";
  document.getElementById("submitText").textContent="💾 Lưu thay đổi";
  editingMediaUrls=Array.isArray(p.media)?[...p.media]:(p.media?[p.media]:[]);
  selectedFiles=[];
  renderFilePreview();
  window.showAdmin();
};

window.confirmDelete=async(id)=>{
  if(!confirm("Xác nhận xoá bài viết?")) return;
  await deleteDoc(doc(db,"posts",id));
  showToast("🗑 Đã xoá bài viết");
  loadAndRenderPosts();
};

// ===== FILE UPLOAD =====
const fileInput=document.getElementById("file");
const fileDrop=document.getElementById("fileDrop");
fileInput.addEventListener("change",(e)=>{handleNewFiles(Array.from(e.target.files));fileInput.value="";});
fileDrop.addEventListener("dragover",(e)=>{e.preventDefault();fileDrop.classList.add("dragover");});
fileDrop.addEventListener("dragleave",()=>fileDrop.classList.remove("dragover"));
fileDrop.addEventListener("drop",(e)=>{e.preventDefault();fileDrop.classList.remove("dragover");handleNewFiles(Array.from(e.dataTransfer.files));});

function handleNewFiles(files){
  files.forEach(f=>{
    if(!f.type.startsWith("image/")&&!f.type.startsWith("video/")) return;
    selectedFiles.push({file:f,previewUrl:URL.createObjectURL(f)});
  });
  renderFilePreview();
}
function renderFilePreview(){
  const c=document.getElementById("filePreview");
  if(!c) return;
  c.innerHTML="";
  editingMediaUrls.forEach((url,i)=>{
    const w=document.createElement("div");w.className="preview-item";
    w.innerHTML=isVideo(url)?`<video src="${url}" muted></video>`:`<img src="${url}">`;
    const b=document.createElement("button");b.className="preview-remove";b.innerHTML="×";
    b.onclick=()=>{editingMediaUrls.splice(i,1);renderFilePreview();};
    w.appendChild(b);c.appendChild(w);
  });
  selectedFiles.forEach((item,i)=>{
    const w=document.createElement("div");w.className="preview-item";
    w.innerHTML=item.file.type.startsWith("video/")?`<video src="${item.previewUrl}" muted></video>`:`<img src="${item.previewUrl}">`;
    const b=document.createElement("button");b.className="preview-remove";b.innerHTML="×";
    b.onclick=()=>{selectedFiles.splice(i,1);renderFilePreview();};
    w.appendChild(b);c.appendChild(w);
  });
}
async function uploadFile(file){
  const fd=new FormData();
  fd.append("file",file);fd.append("upload_preset",UPLOAD_PRESET);
  const type=file.type.startsWith("video/")?"video":"image";
  const res=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,{method:"POST",body:fd});
  return(await res.json()).secure_url;
}

// ===== COMMENTS =====
function updateCommentFormUI(user){
  const form=document.getElementById("commentForm");
  const prompt=document.getElementById("commentLoginPrompt");
  if(!form||!prompt) return;
  if(user){
    form.classList.remove("hidden");prompt.classList.add("hidden");
    const name=user.displayName||user.email.split("@")[0];
    document.getElementById("commentAvatar").textContent=getInitial(name);
    document.getElementById("commentUserName").textContent=name;
  } else {
    form.classList.add("hidden");prompt.classList.remove("hidden");
    cancelReply();
  }
}

function subscribeComments(postId){
  if(commentsUnsub){commentsUnsub();commentsUnsub=null;}
  const list=document.getElementById("commentList");
  const badge=document.getElementById("commentCount");
  if(!list) return;
  list.innerHTML=`<div class="comment-empty">⏳ Đang tải bình luận...</div>`;
  const q=query(collection(db,"posts",postId,"comments"),orderBy("createdAt","asc"));
  commentsUnsub=onSnapshot(q,
    (snap)=>{const all=[];snap.forEach(d=>all.push({id:d.id,...d.data()}));if(badge)badge.textContent=all.length;renderThreadedComments(all,list);},
    (err)=>{console.error(err);list.innerHTML=`<div class="comment-empty">Không thể tải bình luận.</div>`;}
  );
}

function renderThreadedComments(allComments,list){
  if(allComments.length===0){list.innerHTML=`<div class="comment-empty">Chưa có bình luận nào. 👇</div>`;return;}
  const top=allComments.filter(c=>!c.parentId);
  const rm={};
  allComments.filter(c=>c.parentId).forEach(c=>{if(!rm[c.parentId])rm[c.parentId]=[];rm[c.parentId].push(c);});
  list.innerHTML="";
  top.forEach(c=>{
    const el=buildCommentEl(c,false);
    list.appendChild(el);
    const rw=document.createElement("div");rw.className="replies-wrap";rw.id=`replies-${c.id}`;
    (rm[c.id]||[]).forEach(r=>rw.appendChild(buildCommentEl(r,true)));
    el.appendChild(rw);
  });
}

function buildCommentEl(c,isReply){
  const canDel=currentUser&&(currentUser.uid===c.userId||isAdmin(currentUser));
  const el=document.createElement("div");
  el.className=isReply?"comment-item comment-reply-item":"comment-item";
  el.id=`cmt-${c.id}`;
  const replyParentId=isReply?c.parentId:c.id;
  el.innerHTML=`
    <div class="comment-item-avatar${c.isAdmin?" admin-avatar":""}"
         style="${isReply?"width:30px;height:30px;font-size:12px;":""}">
      ${getInitial(c.userName)}
    </div>
    <div class="comment-item-body">
      <div class="comment-bubble">
        <div class="comment-bubble-header">
          <span class="comment-item-name${c.isAdmin?" admin-name":""}">${escapeHtml(c.userName)}</span>
          ${c.isAdmin?`<span class="admin-badge">ADMIN</span>`:""}
        </div>
        ${isReply&&c.replyTo?.userName?`<span class="reply-mention">@${escapeHtml(c.replyTo.userName)}</span> `:""}
        <span class="comment-item-text">${escapeHtml(c.text)}</span>
      </div>
      <div class="comment-actions-row">
        <span class="comment-item-date">${timeAgo(c.createdAt)}</span>
        ${currentUser?`<button class="reply-btn" onclick="startReply('${replyParentId}','${escapeHtml(c.userName)}')">Trả lời</button>`:""}
        ${canDel?`<button class="comment-delete-btn" onclick="deleteComment('${c.id}')">Xoá</button>`:""}
      </div>
    </div>`;
  return el;
}

window.submitComment=async()=>{
  if(!currentUser) return showAuthModal("login");
  const text=document.getElementById("commentText").value.trim();
  if(!text) return showToast("Vui lòng nhập nội dung","error");
  if(!currentPostId) return;
  const btn=document.querySelector(".btn-comment-submit");
  btn.disabled=true;
  try{
    const name=currentUser.displayName||currentUser.email.split("@")[0];
    await addDoc(collection(db,"posts",currentPostId,"comments"),{
      text,userName:name,userId:currentUser.uid,isAdmin:isAdmin(currentUser),
      createdAt:Date.now(),parentId:null,replyTo:null
    });
    document.getElementById("commentText").value="";
    showToast("💬 Đã gửi bình luận!");
  }catch{showToast("Lỗi gửi bình luận","error");}
  finally{btn.disabled=false;}
};

window.startReply=(parentId,targetName)=>{
  if(!currentUser) return showAuthModal("login");
  document.querySelectorAll(".inline-reply-box").forEach(e=>e.remove());
  replyToComment={id:parentId,userName:targetName};
  const parentEl=document.getElementById(`cmt-${parentId}`);
  if(!parentEl) return;
  const myName=currentUser.displayName||currentUser.email.split("@")[0];
  const box=document.createElement("div");
  box.className="inline-reply-box";box.id=`reply-box-${parentId}`;
  box.innerHTML=`
    <div class="inline-reply-inner">
      <div class="comment-item-avatar" style="width:28px;height:28px;font-size:11px;flex-shrink:0;margin-top:2px">${getInitial(myName)}</div>
      <div style="flex:1">
        <textarea class="inline-reply-textarea" id="reply-text-${parentId}"
          placeholder="Trả lời @${escapeHtml(targetName)}..." rows="2"></textarea>
        <div class="inline-reply-footer">
          <button class="btn-reply-cancel" onclick="cancelReply()">Huỷ</button>
          <button class="btn-reply-send" onclick="submitReply('${parentId}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>Gửi
          </button>
        </div>
      </div>
    </div>`;
  const rw=parentEl.querySelector(".replies-wrap");
  if(rw) parentEl.insertBefore(box,rw); else parentEl.appendChild(box);
  setTimeout(()=>document.getElementById(`reply-text-${parentId}`)?.focus(),50);
};
window.cancelReply=()=>{
  replyToComment=null;
  document.querySelectorAll(".inline-reply-box").forEach(e=>e.remove());
};
window.submitReply=async(parentId)=>{
  if(!currentUser) return showAuthModal("login");
  const ta=document.getElementById(`reply-text-${parentId}`);
  const text=ta?ta.value.trim():"";
  if(!text) return showToast("Vui lòng nhập nội dung","error");
  if(!currentPostId) return;
  const btn=document.querySelector(`#reply-box-${parentId} .btn-reply-send`);
  if(btn) btn.disabled=true;
  try{
    const name=currentUser.displayName||currentUser.email.split("@")[0];
    await addDoc(collection(db,"posts",currentPostId,"comments"),{
      text,userName:name,userId:currentUser.uid,isAdmin:isAdmin(currentUser),
      createdAt:Date.now(),parentId,replyTo:{id:parentId,userName:replyToComment?.userName||""}
    });
    cancelReply();showToast("💬 Đã gửi trả lời!");
  }catch{showToast("Lỗi gửi trả lời","error");if(btn)btn.disabled=false;}
};
window.deleteComment=async(commentId)=>{
  if(!currentUser||!currentPostId) return;
  if(!confirm("Xoá bình luận này?")) return;
  try{await deleteDoc(doc(db,"posts",currentPostId,"comments",commentId));showToast("🗑 Đã xoá");}
  catch{showToast("Lỗi xoá","error");}
};

window.goHome=()=>navigateTo("posts");

// ===== INIT =====
const urlPost=new URLSearchParams(location.search).get("post");
if(urlPost){navigateTo("posts");setTimeout(()=>openPost(urlPost),500);}
else navigateTo("home");
