// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, setDoc, doc, deleteDoc, getDocs } 
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCvtWTmqmJt10icRtFRWg58SWf4JE1hXmc",
    authDomain: "calendar-2026-5ba8e.firebaseapp.com",
    projectId: "calendar-2026-5ba8e",
    storageBucket: "calendar-2026-5ba8e.firebasestorage.app",
    messagingSenderId: "357308222372",
    appId: "1:357308222372:web:153a95f8f544e6a59ecf31",
    measurementId: "G-0EP154JP2Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 導出功能給 cal-gemini.js 使用 ---

// 1. 上傳單一行程
window.uploadEvent = async (eventData) => {
    try {
        const eventId = eventData.id.toString(); // 轉為字串確保格式一致
        await setDoc(doc(db, "events", eventId), eventData);
    } catch (e) {
        console.error("同步失敗:", e);
    }
};

// 2. 刪除單一行程
window.removeEventFromCloud = async (eventId) => {
    await deleteDoc(doc(db, "events", eventId));
};

// 3. 監聽雲端所有變化 (核心)
onSnapshot(collection(db, "events"), (snapshot) => {
    const cloudEvents = [];
    snapshot.forEach((doc) => cloudEvents.push(doc.data()));
    
    // 這裡通知你的 cal-gemini.js 更新畫面
    if (window.updateCalendarUI) {
        window.updateCalendarUI(cloudEvents);
    }
});

console.log("Firebase 雲端模組已就緒");