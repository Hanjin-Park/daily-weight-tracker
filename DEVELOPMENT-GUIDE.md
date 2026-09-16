# 🛠️ 개발 매뉴얼: GitHub Pages + Firebase(Auth + Firestore)로 개인용 웹앱 만들기

이 문서는 `daily-weight-tracker`를 만들면서 실제로 거친 과정과 겪었던 오류를 정리한 매뉴얼입니다. 서버 없이 **정적 프론트엔드(HTML/CSS/JS) + GitHub Pages 호스팅 + Firebase(로그인/DB)** 조합으로 "어디서나 접속 가능하고, 로그인한 본인 데이터만 기기 간 동기화되는" 개인용 웹앱을 만들 때 그대로 재사용할 수 있습니다.

## 아키텍처 요약

```
[브라우저] --정적 파일 요청--> [GitHub Pages]
[브라우저] --로그인/데이터 요청--> [Firebase Auth / Firestore]
```

- 서버(백엔드)를 직접 운영하지 않음 — GitHub Pages는 정적 파일만 제공
- 로그인, 데이터 저장/조회는 모두 브라우저에서 Firebase SDK로 직접 호출
- 빌드 도구 없이 순수 HTML/CSS/JS로 구성 (프레임워크 불필요)

---

## 1단계. GitHub 저장소 생성 및 코드 push

1. GitHub에서 새 저장소 생성 (Public 권장 — 이유는 2단계 참고)
2. 로컬 프로젝트 폴더에서:
```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## 2단계. GitHub Pages 활성화

**⚠️ 중요한 함정**: 개인(Personal) 계정의 GitHub **Free 플랜에서는 private 저장소가 Pages를 사용할 수 없습니다.** 저장소를 public으로 바꾸거나, private을 유지하려면 GitHub Pro(월 $4, 계정 단위 구독이라 이후 만드는 모든 저장소에 적용됨)로 업그레이드해야 합니다.

- Public repo + Pages → 무료, 소스 코드도 사이트도 모두 공개
- Private repo + Pro + Pages → 소스 코드는 비공개, **배포된 사이트 URL 자체는 여전히 누구나 접속 가능** (완전 비공개 사이트는 GitHub Enterprise 전용 기능)

설정 방법: `Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save`
배포 URL: `https://<username>.github.io/<repo>/`

## 3단계. Firebase 프로젝트 생성

1. https://console.firebase.google.com 에서 새 프로젝트 생성
2. 왼쪽 메뉴에서 **Authentication**, **Firestore Database** 두 제품을 각각 "시작하기"로 활성화
3. 프로젝트 개요 화면 → **+ 앱 추가 → 웹(`</>`)** 선택 → 앱 등록 → `firebaseConfig` 객체 복사 (apiKey 등은 공개되어도 괜찮은 값이며, 보안은 Firestore 규칙으로 처리함)

## 4단계. Authentication 설정 (로그인 방식: Google 예시)

1. **Authentication → Sign-in method → Google** 클릭 → **사용 설정** 토글 ON → 프로젝트 지원 이메일 선택 → 저장
   - 이걸 빼먹으면 로그인 시도 시 `auth/operation-not-allowed` 오류 발생
2. **Authentication → Settings → 승인된 도메인(Authorized domains)**에 배포 도메인 추가 (예: `<username>.github.io`)
   - 이걸 빼먹으면 로그인 팝업에서 `auth/unauthorized-domain` 오류 발생
   - `localhost`는 기본으로 이미 포함되어 있어 로컬 테스트는 별도 설정 없이 가능

## 5단계. Firestore Database 생성 + 보안 규칙

1. **Firestore Database → 데이터베이스 만들기** → 가까운 리전 선택 → 테스트 모드로 시작 가능
2. **⚠️ 테스트 모드는 모든 로그인 사용자가 서로의 데이터를 읽고 쓸 수 있고, 30일 후 자동으로 전체 차단됩니다.** 반드시 아래처럼 사용자별 접근 제한 규칙으로 교체:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

→ 데이터를 `users/{uid}` 문서 단위로 저장하는 구조와 짝을 이루는 규칙입니다. 컬렉션/문서는 코드에서 `set()`을 처음 호출할 때 자동 생성되므로 콘솔에서 미리 만들 필요 없음.

## 6단계. 코드에 Firebase SDK 연동

빌드 도구 없이 쓸 때는 **compat SDK**를 CDN `<script>` 태그로 불러오는 게 가장 간단합니다.

```html
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="script.js"></script>
```

`firebase-config.js` (설정값만 담당, 프로젝트마다 이 파일만 교체하면 재사용 가능):
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
firebase.initializeApp(firebaseConfig);
```

## 7단계. 로그인 페이지를 분리하는 패턴

같은 페이지 안에서 로그인 버튼을 보였다 숨겼다 하는 대신, **로그인 전용 페이지(login.html)를 따로 두고 미인증 사용자는 메인 페이지에서 리다이렉트**시키는 패턴을 사용했습니다.

- `login.html` + `login.js`: Google 로그인 버튼만 존재. `onAuthStateChanged`로 이미 로그인된 상태면 바로 메인 페이지로 이동.
- `index.html` + `script.js`: 앱의 본체. `onAuthStateChanged`에서 `user`가 없으면 `window.location.replace('login.html')`로 즉시 이동.

```js
auth.onAuthStateChanged((user) => {
    if (user) {
        // 메인 화면 표시 + 데이터 로드
    } else {
        window.location.replace('login.html'); // 미인증 시 로그인 페이지로
    }
});
```

## 8단계. 데이터 CRUD를 Firestore로 연동 (localStorage 대체 패턴)

기존에 `localStorage.getItem/setItem`으로 하던 걸 아래처럼 1:1로 치환하면 됩니다.

```js
// 불러오기
async function loadData() {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    myData = doc.exists ? doc.data().myData : [];
}

// 저장하기
async function saveData() {
    await db.collection('users').doc(currentUser.uid).set({ myData });
}
```

화면 반응성을 위해 로컬 배열을 먼저 수정하고 `renderData()`를 바로 호출한 뒤, `saveData()`는 await 없이 백그라운드로 호출해도 됩니다 (내부에서 에러를 alert로 처리).

---

## 🐛 실제로 겪은 트러블슈팅 모음

| 증상 | 원인 | 해결 |
|---|---|---|
| Pages 설정 화면에 "Upgrade or make this repository public to enable Pages" | Free 플랜 + private 저장소는 Pages 자체가 비활성화됨 | 저장소를 public으로 전환하거나 GitHub Pro 업그레이드 |
| `저장에 실패했습니다: Cannot read properties of null (reading 'uid')` | 로그인 안 된 상태인데도 입력 폼이 화면에 보여서 데이터 추가가 시도됨 | CSS에서 `main { display: flex }`처럼 `display`를 지정한 요소는 `hidden` 속성이 무시됨(author CSS가 브라우저 기본 `[hidden]` 규칙보다 우선). `main[hidden] { display: none; }`처럼 명시적으로 덮어써야 함 |
| `Firebase: The given sign-in provider is disabled ... (auth/operation-not-allowed)` | Authentication에서 Google 로그인 제공자를 켜지 않음 | Authentication → Sign-in method → Google → 사용 설정 |
| 로그인 팝업에서 도메인 오류 | 배포 도메인이 승인된 도메인 목록에 없음 | Authentication → Settings → 승인된 도메인에 배포 도메인 추가 |
| Firestore 콘솔에서 "컬렉션 시작" 창이 뜸 | 아직 한 번도 저장이 성공한 적이 없어 컬렉션이 비어 있음 | 수동 생성 불필요 — 로그인 후 정상적으로 저장에 성공하면 코드가 자동으로 컬렉션/문서를 만듦 |

---

## ✅ 새 프로젝트에 재사용할 때 체크리스트

- [ ] GitHub 저장소 생성 및 push (public 여부 결정)
- [ ] GitHub Pages 활성화
- [ ] Firebase 프로젝트 생성 + 웹 앱 등록 → `firebaseConfig` 확보
- [ ] Authentication에서 원하는 로그인 방식 활성화
- [ ] 승인된 도메인에 GitHub Pages 도메인 추가
- [ ] Firestore Database 생성
- [ ] Firestore 보안 규칙을 `request.auth.uid` 기준으로 제한
- [ ] `firebase-config.js` + compat SDK `<script>` 태그 추가
- [ ] `login.html`(로그인 전용) / 메인 페이지(미인증 시 리다이렉트) 분리
- [ ] localStorage 기반 저장/불러오기 함수를 Firestore `get()`/`set()`으로 교체
- [ ] `main[hidden]`처럼, `display`를 지정한 요소에는 `[hidden]` 덮어쓰기 규칙 추가했는지 확인
