// ===== 전체화면 토글 =====
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`전체화면 에러: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// ===== Firebase 및 데이터 연동 =====
// 로그인되지 않았을 때 이동할 로그인 페이지 경로 (이 페이지 기준 상대경로)
const LOGIN_PAGE_URL = "index.html";

const firebaseConfig = {
    apiKey: "AIzaSyA_JNWO5Ke5ZVJDnwP06QW9WsZXNZFv0bc",
    authDomain: "sundochem-dashboard.firebaseapp.com",
    databaseURL: "https://sundochem-dashboard-default-rtdb.firebaseio.com",
    projectId: "sundochem-dashboard",
    storageBucket: "sundochem-dashboard.firebasestorage.app",
    messagingSenderId: "360796635566",
    appId: "1:360796635566:web:d3bf85eb5e5e1574b5483f"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('log-date');
    const dayDisplay = document.getElementById('log-day'); 
    const displayJobDate = document.getElementById('display-job-date');
    const syncItems = document.querySelectorAll('.sync-item');

    let currentRef = null;

    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

    // null 및 undefined 안전 제거 함수
    function sanitizeValue(val) {
        if (val === null || val === undefined || val === 'null' || val === 'undefined') {
            return '';
        }
        return val;
    }

    // 날짜 및 요일 텍스트 업데이트
    function updateDayDisplay(dateStr) {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj)) {
            const dayName = daysOfWeek[dateObj.getDay()] + '요일';
            dayDisplay.textContent = dayName;
            displayJobDate.textContent = `${dateStr} (${dayName})`;
        }
    }

    // 날짜 변경 함수 (화살표 버튼용)
    window.changeDate = function(offsetDays) {
        const currentDate = new Date(dateInput.value);
        if (!isNaN(currentDate)) {
            currentDate.setDate(currentDate.getDate() + offsetDays);
            const yyyy = currentDate.getFullYear();
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const newDateStr = `${yyyy}-${mm}-${dd}`;
            
            dateInput.value = newDateStr;
            loadLogData(newDateStr);
            updateDayDisplay(newDateStr);
        }
    };

    // 오늘 날짜 바로가기
    window.goToday = function() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        dateInput.value = todayStr;
        loadLogData(todayStr);
        updateDayDisplay(todayStr);
    };

    // 초기 오늘 날짜 세팅
    goToday();

    // Firebase 실시간 데이터 로드
    function loadLogData(dateStr) {
        if (currentRef) currentRef.off();
        // 노드 경로: job_sheets/YYYY-MM-DD
        currentRef = db.ref('job_sheets/' + dateStr);
        
        currentRef.on('value', snapshot => {
            const data = snapshot.val() || {};
            syncItems.forEach(item => {
                if (document.activeElement !== item) {
                    item.value = sanitizeValue(data[item.id]);
                }
            });
        });
    }

    // 인증 상태 감지 및 이벤트 리스너 등록
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            syncItems.forEach(item => {
                item.addEventListener('input', e => {
                    if (currentRef) {
                        currentRef.child(e.target.id).set(e.target.value)
                            .catch(err => {
                                console.error("저장 오류:", err);
                            });
                    }
                });
            });

            dateInput.addEventListener('change', e => {
                loadLogData(e.target.value);
                updateDayDisplay(e.target.value);
            });

            loadLogData(dateInput.value);
            updateDayDisplay(dateInput.value);
        } else {
            // 로그인 페이지로 이동 (자기 자신이면 무한 새로고침이 되므로 이동하지 않음)
            const loginUrl = new URL(LOGIN_PAGE_URL, window.location.href);
            if (loginUrl.pathname !== window.location.pathname) {
                window.location.replace(loginUrl.href);
            } else {
                console.warn("로그인되지 않았습니다. script.js의 LOGIN_PAGE_URL에 로그인 페이지 경로를 지정하세요.");
            }
        }
    });

    // 단축키 (Alt + Left / Alt + Right) 날짜 이동 지원
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            changeDate(-1);
        } else if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            changeDate(1);
        }
    });
});
