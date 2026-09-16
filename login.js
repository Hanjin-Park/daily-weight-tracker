const auth = firebase.auth();

const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

// 이미 로그인되어 있으면 바로 메인 페이지로 이동
auth.onAuthStateChanged((user) => {
    if (user) {
        window.location.replace('index.html');
    }
});

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((e) => {
        console.error('로그인 실패:', e);
        loginError.textContent = '로그인에 실패했습니다: ' + e.message;
        loginError.hidden = false;
    });
});
