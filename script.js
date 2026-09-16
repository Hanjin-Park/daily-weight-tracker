// 상태 관리
let weightData = [];
let chart = null;
let currentUser = null;

// Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// DOM 요소
const dateInput = document.getElementById('date');
const weightInput = document.getElementById('weight');
const memoInput = document.getElementById('memo');
const addBtn = document.getElementById('addBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const exportBtn = document.getElementById('exportBtn');
const tableBody = document.getElementById('tableBody');
const currentWeightEl = document.getElementById('currentWeight');
const maxWeightEl = document.getElementById('maxWeight');
const minWeightEl = document.getElementById('minWeight');
const weightChangeEl = document.getElementById('weightChange');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userEmailEl = document.getElementById('userEmail');
const mainContent = document.getElementById('mainContent');
const loginNotice = document.getElementById('loginNotice');

// 초기화
function init() {
    // 오늘 날짜를 기본값으로 설정
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today;

    // 이벤트 리스너 등록
    addBtn.addEventListener('click', addWeight);
    clearAllBtn.addEventListener('click', clearAllData);
    exportBtn.addEventListener('click', exportToCSV);
    loginBtn.addEventListener('click', signIn);
    logoutBtn.addEventListener('click', () => auth.signOut());

    // Enter 키로 데이터 추가
    weightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addWeight();
    });

    memoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addWeight();
    });

    // 로그인 상태 변화 감지
    auth.onAuthStateChanged(handleAuthChange);
}

// Google 로그인
function signIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((e) => {
        console.error('로그인 실패:', e);
        alert('로그인에 실패했습니다: ' + e.message);
    });
}

// 로그인 상태에 따른 화면 전환
async function handleAuthChange(user) {
    currentUser = user;

    if (user) {
        loginBtn.hidden = true;
        userInfo.hidden = false;
        userEmailEl.textContent = user.email;
        mainContent.hidden = false;
        loginNotice.hidden = true;

        await loadData();
        renderData();
    } else {
        loginBtn.hidden = false;
        userInfo.hidden = true;
        mainContent.hidden = true;
        loginNotice.hidden = false;
        weightData = [];
    }
}

// Firestore에서 데이터 불러오기
async function loadData() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        const saved = doc.exists ? doc.data().weightData : null;
        weightData = (saved || []).sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (e) {
        console.error('데이터 로드 실패:', e);
        alert('데이터를 불러오지 못했습니다: ' + e.message);
        weightData = [];
    }
}

// Firestore에 데이터 저장
async function saveData() {
    try {
        await db.collection('users').doc(currentUser.uid).set({ weightData });
    } catch (e) {
        console.error('데이터 저장 실패:', e);
        alert('저장에 실패했습니다: ' + e.message);
    }
}

// 체중 데이터 추가
function addWeight() {
    const date = dateInput.value;
    const weight = parseFloat(weightInput.value);
    const memo = memoInput.value.trim();

    // 유효성 검사
    if (!date) {
        alert('날짜를 선택해주세요');
        dateInput.focus();
        return;
    }

    if (isNaN(weight) || weight <= 0) {
        alert('올바른 체중을 입력해주세요');
        weightInput.focus();
        return;
    }

    // 중복 날짜 확인 및 업데이트
    const existingIndex = weightData.findIndex(d => d.date === date);
    if (existingIndex !== -1) {
        if (confirm(`${date}의 기록이 이미 존재합니다. 수정하시겠습니까?`)) {
            weightData[existingIndex] = { date, weight, memo };
        } else {
            return;
        }
    } else {
        weightData.push({ date, weight, memo });
        weightData.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    saveData();
    renderData();

    // 입력 폼 초기화
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    dateInput.value = tomorrowStr <= dateInput.max ? tomorrowStr : dateInput.max;
    weightInput.value = '';
    memoInput.value = '';
    weightInput.focus();
}

// 특정 날짜의 데이터 삭제
function deleteWeight(date) {
    if (confirm(`${date}의 기록을 삭제하시겠습니까?`)) {
        weightData = weightData.filter(d => d.date !== date);
        saveData();
        renderData();
    }
}

// 모든 데이터 삭제
function clearAllData() {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        weightData = [];
        saveData();
        renderData();
    }
}

// 데이터 렌더링 (테이블 + 차트 + 통계)
function renderData() {
    renderTable();
    renderChart();
    updateStats();
}

// 테이블 렌더링
function renderTable() {
    if (weightData.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="4">기록된 데이터가 없습니다</td></tr>';
        return;
    }

    tableBody.innerHTML = weightData.map(data => `
        <tr>
            <td>${formatDate(data.date)}</td>
            <td><strong>${data.weight.toFixed(1)}</strong></td>
            <td>${data.memo || '-'}</td>
            <td>
                <button class="delete-btn" onclick="deleteWeight('${data.date}')">삭제</button>
            </td>
        </tr>
    `).join('');
}

// 차트 렌더링
function renderChart() {
    const ctx = document.getElementById('weightChart').getContext('2d');

    if (weightData.length === 0) {
        if (chart) chart.destroy();
        chart = null;
        return;
    }

    const labels = weightData.map(d => formatDate(d.date));
    const data = weightData.map(d => d.weight);

    const minWeight = Math.min(...data);
    const maxWeight = Math.max(...data);
    const padding = (maxWeight - minWeight) * 0.1 || 5;

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.options.scales.y.min = minWeight - padding;
        chart.options.scales.y.max = maxWeight + padding;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '체중 (kg)',
                        data: data,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        borderColor: '#667eea',
                        borderWidth: 1,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: minWeight - padding,
                        max: maxWeight + padding,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                }
            }
        });
    }
}

// 통계 업데이트
function updateStats() {
    if (weightData.length === 0) {
        currentWeightEl.textContent = '-';
        maxWeightEl.textContent = '-';
        minWeightEl.textContent = '-';
        weightChangeEl.textContent = '-';
        return;
    }

    const weights = weightData.map(d => d.weight);
    const current = weights[weights.length - 1];
    const max = Math.max(...weights);
    const min = Math.min(...weights);
    const change = current - weights[0];

    currentWeightEl.textContent = current.toFixed(1);
    maxWeightEl.textContent = max.toFixed(1);
    minWeightEl.textContent = min.toFixed(1);

    const changeText = change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
    const changeColor = change >= 0 ? '#f56565' : '#48bb78';
    weightChangeEl.textContent = changeText;
    weightChangeEl.style.color = changeColor;
}

// CSV 내보내기
function exportToCSV() {
    if (weightData.length === 0) {
        alert('내보낼 데이터가 없습니다');
        return;
    }

    // CSV 헤더
    const headers = ['날짜', '체중(kg)', '메모'];
    const rows = weightData.map(data => [
        formatDate(data.date),
        data.weight.toFixed(1),
        data.memo || ''
    ]);

    // CSV 문자열 생성
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        // 메모에 쉼표나 개행이 있을 수 있으므로 따옴표로 감싸기
        const escapedRow = row.map(cell => {
            const str = String(cell);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        });
        csvContent += escapedRow.join(',') + '\n';
    });

    // 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `weight-tracker-${today}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('CSV 파일이 다운로드되었습니다!');
}

// 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);
