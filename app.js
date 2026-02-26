// app.js

// --- 第一段：導入工具 ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// --- 第二段：你的 Firebase 設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyCvtWTmqmJt10icRtFRWg58SWf4JE1hXmc",
    authDomain: "calendar-2026-5ba8e.firebaseapp.com",
    projectId: "calendar-2026-5ba8e",
    storageBucket: "calendar-2026-5ba8e.firebasestorage.app",
    messagingSenderId: "357308222372",
    appId: "1:357308222372:web:153a95f8f544e6a59ecf31",
    measurementId: "G-0EP154JP2Z"
};

// --- 第三段：初始化 ---
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // 這就是你要用來操作資料庫的變數

// --- 下方開始寫你原本網頁的邏輯 ---
// 例如：按鈕點擊事件、處理待辦清單的程式碼...
console.log("Firebase 已經成功連線！");