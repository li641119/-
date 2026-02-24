// --- 全域變數 ---
let courses = [];
let viewDate = new Date(); 
let editingId = null; // 【編輯功能關鍵】用於追蹤正在編輯的行程 ID

const presetColors = [
    '#c2bcbc', '#b5e3db', '#d5e3c7', '#efe78e', '#fad595', 
    '#ffc0c7', '#f5c5ff', '#b2ceff', '#c4cbff'
];

// --- 1. 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    updateWeekDates();
    loadData();
    
    // 監聽點擊空白處新增
    document.getElementById('dropzone').addEventListener('click', (e) => {
        if (e.target.id === 'dropzone' || e.target.classList.contains('grid-lines')) {
            openModal(); // 新增模式
        }
    });

    // 自動帶入顏色與學生清單輔助
    document.getElementById('m-name').addEventListener('blur', function() {
        const name = this.value.trim();
        const lastCourse = courses.find(c => c.name === name);
        if (lastCourse && lastCourse.color) {
            setupColorPalette(lastCourse.color);
        }
    });
});

// --- 2. 彈窗控制 (整合編輯模式) ---
function openModal(isEdit = false, courseData = null) { 
    const modal = document.getElementById('eventModal');
    const submitBtn = modal.querySelector('button[onclick="saveFromModal()"]');
    editingId = isEdit ? courseData.id : null; // 設定目前是否為編輯模式

    modal.style.display = 'block'; 

    // 更新學生姓名下拉選單 (避免打錯字)
    const list = document.getElementById('student-list') || createStudentList();
    const names = [...new Set(courses.map(c => c.name))];
    list.innerHTML = names.map(n => `<option value="${n}">`).join('');

    if (isEdit && courseData) {
        // --- 編輯模式：填入舊資料 ---
        document.getElementById('m-name').value = courseData.name;
        // 地點判斷
        const isStandardLoc = ["中正高中", "秀峰高中"].includes(courseData.loc);
        document.getElementById('m-loc').value = isStandardLoc ? courseData.loc : "CUSTOM";
        if (!isStandardLoc) {
            document.getElementById('m-loc-custom').value = courseData.loc;
            document.getElementById('m-loc-custom').style.display = 'block';
        } else {
            document.getElementById('m-loc-custom').style.display = 'none';
        }
        
        document.getElementById('m-day').value = courseData.day;
        document.getElementById('m-type').value = courseData.type;
        document.getElementById('m-start').value = courseData.start;
        document.getElementById('m-end').value = courseData.end;
        document.getElementById('m-repeat').checked = courseData.isRepeating;
        setupColorPalette(courseData.color);
        submitBtn.innerText = "更新行程"; // 改變按鈕文字
    } else {
        // --- 新增模式：重置欄位 ---
        document.getElementById('m-name').value = "";
        document.getElementById('m-loc-custom').value = "";
        document.getElementById('m-loc-custom').style.display = 'none';
        document.getElementById('m-repeat').checked = false;
        submitBtn.innerText = "儲存行程";
        setupColorPalette(); 
    }
}

function createStudentList() {
    const dl = document.createElement('datalist');
    dl.id = 'student-list';
    document.body.appendChild(dl);
    document.getElementById('m-name').setAttribute('list', 'student-list');
    return dl;
}

function closeModal() { 
    document.getElementById('eventModal').style.display = 'none'; 
    editingId = null;
}

function setupColorPalette(selectedColor = presetColors[0]) {
    const palette = document.getElementById('color-palette');
    if (!palette) return;
    palette.innerHTML = ''; 
    presetColors.forEach(color => {
        const btn = document.createElement('div');
        btn.className = 'color-circle';
        btn.style.backgroundColor = color;
        if (color === selectedColor) btn.classList.add('active');
        btn.onclick = (e) => {
            e.stopPropagation();
            selectColor(color, btn);
        };
        palette.appendChild(btn);
    });
    document.getElementById('m-color').value = selectedColor;
}

function selectColor(color, element) {
    document.querySelectorAll('.color-circle').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    document.getElementById('m-color').value = color;
}

// --- 3. 時間運算與儲存 ---
function timeToRow(timeStr) {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return 2 + (((hrs - 8) * 60 + mins) / 10);
}

function saveFromModal() {
    const name = document.getElementById('m-name').value.trim();
    const locSelect = document.getElementById('m-loc');
    let loc = locSelect.value === 'CUSTOM' ? (document.getElementById('m-loc-custom').value.trim() || "自定義地點") : locSelect.value;
    const day = document.getElementById('m-day').value;
    const type = document.getElementById('m-type').value;
    const start = document.getElementById('m-start').value;
    const end = document.getElementById('m-end').value;
    const isRepeating = document.getElementById('m-repeat').checked;
    const eventColor = document.getElementById('m-color').value;

    if (!name || !start || !end) return alert("請填寫完整資訊");

    const startRow = timeToRow(start);
    const endRow = timeToRow(end);
    const duration = (endRow - startRow) * 10;
    if (duration <= 0) return alert("結束時間必須晚於開始時間");

    // 重疊檢查 (Conflict Check)
    const hasConflict = courses.find(c => {
        if (c.id === editingId) return false; 
        return c.day === day && (startRow < c.endRow && endRow > c.startRow);
    });
    if (hasConflict) {
        if (!confirm(`⚠️ 時段與 [${hasConflict.name}] 衝突，確定要排入嗎？`)) return;
    }

    const dayHeaders = document.querySelectorAll('.day-header');
    const targetHeader = Array.from(dayHeaders).find(h => h.dataset.day === (day === "8" ? "0" : (parseInt(day)-1).toString()) );
    const dateStr = targetHeader ? targetHeader.dataset.fullDate : new Date().toLocaleDateString('en-CA');

    if (editingId) {
        // 【編輯模式】
        const idx = courses.findIndex(c => c.id === editingId);
        courses[idx] = { 
            ...courses[idx], 
            name, loc, day, type, startRow, endRow, start, end, duration, 
            date: dateStr, isRepeating, color: eventColor 
        };
    } else {
        // 【新增模式】
        const newCourse = { 
            id: Date.now(), name, loc, day, type, startRow, endRow, start, end, 
            duration, date: dateStr, isRepeating, color: eventColor, exceptions: [] 
        };
        courses.push(newCourse);
    }
    
    renderAndSave();
    closeModal();
}

// --- 4. 核心渲染 (整合全月與本週統計) ---
function renderAll() {
    const container = document.getElementById('dropzone');
    container.querySelectorAll('.placed-event').forEach(el => el.remove());
    
    const dayHeaders = document.querySelectorAll('.day-header');
    const weekDates = Array.from(dayHeaders).map(h => h.dataset.fullDate);
    
    // 取得畫面上主要月份
    const middleDate = new Date(dayHeaders[3].dataset.fullDate);
    const currentYear = middleDate.getFullYear();
    const currentMonth = middleDate.getMonth();

    let weekTotalMinutes = 0;

    courses.forEach(course => {
        const isException = (dStr) => course.exceptions && course.exceptions.includes(dStr);
        if (course.isRepeating) {
            dayHeaders.forEach(header => {
                const dStr = header.dataset.fullDate;
                const hDay = header.dataset.day; 
                let isMatch = (course.day === "8" && hDay === "0") || (parseInt(course.day)-1).toString() === hDay;
                if (isMatch && !isException(dStr)) {
                    drawEvent(course, container, dStr, parseInt(course.day));
                    if (course.type === 'work') weekTotalMinutes += Number(course.duration);
                }
            });
        } else if (weekDates.includes(course.date)) {
            drawEvent(course, container, course.date, parseInt(course.day));
            if (course.type === 'work') weekTotalMinutes += Number(course.duration);
        }
    });

    // 計算全月數據與學生排名
    const monthData = calculateMonthlyData(currentYear, currentMonth);

    document.getElementById('week-total').innerText = (weekTotalMinutes / 60).toFixed(1);
    document.getElementById('month-total').innerText = (monthData.totalMinutes / 60).toFixed(1);
    if(document.getElementById('month-income')) {
        document.getElementById('month-income').innerText = Math.round(monthData.totalIncome).toLocaleString();
    }
    renderSidebar(monthData.studentStats);
}

function calculateMonthlyData(targetYear, targetMonth) {
    let totalMinutes = 0;
    let totalIncome = 0; 
    let studentStats = {};

    const specialPrices = {
        "賴文協": 700,
        "台大86": 750
    };

    courses.forEach(course => {
        if (course.type !== 'work') return;
        const pricePerHour = specialPrices[course.name] || 600;

        if (course.isRepeating) {
            let d = new Date(targetYear, targetMonth, 1);
            while (d.getMonth() === targetMonth) {
                const dDay = d.getDay();
                const tDay = (course.day === "8" ? 0 : parseInt(course.day) - 1);
                const dStr = d.toLocaleDateString('en-CA');

                if (dDay === tDay && (!course.exceptions || !course.exceptions.includes(dStr))) {
                    const duration = Number(course.duration);
                    const hours = duration / 60;
                    
                    totalMinutes += duration;
                    totalIncome += hours * pricePerHour;

                    if (!studentStats[course.name]) {
                        studentStats[course.name] = { mins: 0, money: 0 };
                    }
                    studentStats[course.name].mins += duration;
                    studentStats[course.name].money += hours * pricePerHour;
                }
                d.setDate(d.getDate() + 1);
            }
        } else {
            const p = course.date.split('-');
            if (parseInt(p[0]) === targetYear && (parseInt(p[1]) - 1) === targetMonth) {
                const duration = Number(course.duration);
                const hours = duration / 60;

                totalMinutes += duration;
                totalIncome += hours * pricePerHour;

                if (!studentStats[course.name]) {
                    studentStats[course.name] = { mins: 0, money: 0 };
                }
                studentStats[course.name].mins += duration;
                studentStats[course.name].money += hours * pricePerHour;
            }
        }
    });
    return { totalMinutes, totalIncome, studentStats };
}

// --- 5. 繪製行程方塊 (整合編輯點擊) ---
function drawEvent(course, container, dStr, col) {
    const div = document.createElement('div');
    div.className = 'placed-event';
    div.style.backgroundColor = course.color || '#828181';
    div.style.gridColumn = col;
    div.style.gridRow = `${course.startRow} / ${course.endRow}`;
    
    const isShort = course.duration <= 90; 
    const repeatTag = course.isRepeating ? "🔄" : "";

    if (isShort) {
        // 短時間：簡約顯示，把地點跟時間併排或精簡
        div.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <strong style="font-size: 10px; font-weight: 700">${course.name}${repeatTag}</strong>
                <span style="font-size: 10px; scale: 0.9; transform-origin: left;">${course.start} | ${course.loc}</span>
            </div>
        `;
    } else {
        // 標準時間：正常顯示
        div.innerHTML = `
            <strong>${course.name} ${repeatTag}</strong>
            <span>📍 ${course.loc}</span>
            <span>⏰ ${course.start}-${course.end}</span>
        `;
    }

    // ... 其餘 onclick 與 oncontextmenu 邏輯保持不變 ...
    div.onclick = (e) => { e.stopPropagation(); openModal(true, course); };
    // ...
    div.oncontextmenu = (e) => {
        e.preventDefault(); // 阻止瀏覽器原生的右鍵選單
        e.stopPropagation();

        // 特別注意：這裡要確認變數名稱是 course 還是 c (建議統一用 course)
        if (!course.isRepeating) {
            if (confirm(`確定要刪除 [${course.name}] 的這筆行程嗎？`)) {
                courses = courses.filter(x => x.id !== course.id);
                renderAndSave();
            }
        } else {
            const action = prompt(
                `這是重複行程 [${course.name}]\n\n` +
                `請輸入數字選擇操作：\n` +
                `1. 僅刪除「本週」(${dStr})\n` +
                `2. 永久刪除`, 
                "1"
            );

            if (action === "1") {
                if (!course.exceptions) course.exceptions = [];
                course.exceptions.push(dStr);
                renderAndSave();
            } else if (action === "2") {
                if (confirm(`確定要永久刪除 [${course.name}] 的所有重複行程嗎？`)) {
                    courses = courses.filter(x => x.id !== course.id);
                    renderAndSave();
                }
            }
        }
    };
    container.appendChild(div);
}

// --- 6. 側邊欄渲染 ---
function renderSidebar(studentStats) {
    const statsDiv = document.getElementById('monthly-stats');
    if (!statsDiv) return;
    statsDiv.innerHTML = "";
    
const entries = Object.entries(studentStats).sort((a, b) => b[1].mins - a[1].mins);    
if (entries.length === 0) { 
        statsDiv.innerHTML = "<p style='color:#888; text-align:center; margin-top:20px;'>本月尚無教球紀錄</p>"; 
        return; 
    }

    entries.forEach(([name, data]) => {
        const student = courses.find(c => c.name === name);
        const color = student ? student.color : '#c4c4c4';
        const p = document.createElement('div');
        p.className = 'stat-item';
        // 側邊欄每一列的樣式
        p.style.cssText = 'display:flex; align-items:center; gap:12px; padding:10px; margin-bottom:8px; background:#fff; border-radius:10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);';
        
        p.innerHTML = `
            <input type="color" value="${color}" 
                onchange="updateStudentColor('${name}', this.value)"
                style="
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    background-color: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    border-radius: 50%;
                    overflow: hidden;
                ">
            <span style="flex-grow: 1; font-weight: 500; color: #333;">${name}</span>
            <strong style="color: #555;">${(data.mins / 60).toFixed(1)} <span style="font-size:12px; font-weight:normal;">hr</span></strong>
        `;
        
        // 針對 Chrome/Edge/Safari 的顏色選取器圓角處理
        const colorInput = p.querySelector('input[type="color"]');
        colorInput.style.setProperty('--round', '50%');
        
        statsDiv.appendChild(p);
    });
}

function updateStudentColor(name, newColor) {
    courses = courses.map(c => c.name === name ? { ...c, color: newColor } : c);
    renderAndSave();
}

// --- 7. 日期與儲存 ---
function updateWeekDates() {
    const dayOfWeek = viewDate.getDay(); 
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(viewDate);
    monday.setDate(viewDate.getDate() + offset);

    const dayHeaders = document.querySelectorAll('.day-header');
    dayHeaders.forEach((header, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        header.querySelector('.date-label').innerText = `${date.getMonth() + 1}/${date.getDate()}`;
        header.dataset.fullDate = date.toLocaleDateString('en-CA');
    });

    const middleDate = new Date(monday); middleDate.setDate(monday.getDate() + 3);
    document.getElementById('current-month-range').innerText = `📅 ${middleDate.getFullYear()}年 ${middleDate.getMonth() + 1}月行程`;
}

function changeWeek(direction) {
    viewDate.setDate(viewDate.getDate() + (direction * 7));
    updateWeekDates(); renderAll();
}

function goToday() {
    viewDate = new Date();
    updateWeekDates(); renderAll();
}

function toggleCustomLoc() {
    const select = document.getElementById('m-loc');
    document.getElementById('m-loc-custom').style.display = (select.value === 'CUSTOM') ? 'block' : 'none';
}

function saveToStorage() { localStorage.setItem('coach_data_v3', JSON.stringify(courses)); }
function loadData() {
    const data = localStorage.getItem('coach_data_v3');
    if (data) { courses = JSON.parse(data); renderAll(); }
}
function renderAndSave() { renderAll(); saveToStorage(); }