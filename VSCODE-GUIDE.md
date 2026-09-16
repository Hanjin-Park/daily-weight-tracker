# 📝 VS Code 개발 가이드

## 🚀 빠른 시작

### 1. 프로젝트 열기
```bash
cd daily-weight-tracker
code .
```

### 2. 권장 확장 설치
VS Code가 권장 확장을 설치하라는 알림을 표시합니다. **"Install All"** 클릭:
- **Prettier** - 코드 포맷팅
- **Live Server** - 로컬 웹 서버
- **Korean Language Pack** - 한국어 인터페이스

### 3. 로컬 서버 실행
1. `index.html` 우클릭
2. **"Open with Live Server"** 선택
3. 자동으로 브라우저에서 `http://localhost:5500` 열림

---

## 📂 프로젝트 구조

```
daily-weight-tracker/
├── index.html          # 메인 HTML 파일
├── style.css           # CSS 스타일
├── script.js           # JavaScript 기능
├── README.md           # 프로젝트 설명
├── VSCODE-GUIDE.md     # 이 파일
├── .gitignore          # Git 무시 파일
└── .vscode/
    ├── settings.json   # VS Code 설정
    └── extensions.json # 권장 확장
```

---

## 💡 개발 팁

### 파일 수정 시 자동 저장 및 포맷팅
- VS Code의 **자동 저장** 설정됨
- **Prettier**가 자동으로 코드 포맷팅

### Hot Reload
- **Live Server**를 사용하면 파일 저장 시 자동 새로고침
- 브라우저 새로고침 불필요

### 디버깅
1. **F12** 또는 **Ctrl+Shift+I** (Chrome DevTools 열기)
2. **Console** 탭에서 에러 확인
3. **Network** 탭에서 리소스 로딩 확인

---

## 🔧 자주 수정하는 부분

### 색상 변경 (style.css)
```css
:root {
    --primary-color: #667eea;      /* 주 색상 */
    --secondary-color: #764ba2;    /* 보조 색상 */
    --danger-color: #f56565;       /* 위험 색상 */
    --success-color: #48bb78;      /* 성공 색상 */
}
```

### 폰트 변경 (style.css)
```css
body {
    font-family: /* 원하는 폰트 */;
}
```

### 차트 설정 (script.js)
```javascript
// renderChart() 함수에서 차트 색상/스타일 변경
borderColor: '#667eea',           /* 차트 라인 색상 */
backgroundColor: 'rgba(102, 126, 234, 0.1)',  /* 배경 색상 */
```

---

## 🐛 문제 해결

### Live Server가 안 켜질 때
```bash
# 포트 변경
# settings.json에 추가:
"liveServer.settings.port": 3000
```

### LocalStorage 데이터 초기화
```javascript
// 개발자 도구 콘솔에서:
localStorage.clear();
```

### 캐시 문제
- **Ctrl+Shift+Delete** (Chrome)
- **캐시 비우기** 클릭
- 또는 **Hard Refresh**: Ctrl+Shift+R

---

## 📤 GitHub 배포 (또는 다시 푸시)

### 코드 수정 후 GitHub에 반영
```bash
# 변경 사항 확인
git status

# 변경 사항 추가
git add .

# 커밋
git commit -m "수정 내용 설명"

# GitHub에 푸시
git push origin main
```

### GitHub Pages 자동 업데이트
- 푸시 후 약 1-2분 후 웹사이트에 반영됨
- `https://[username].github.io/daily-weight-tracker/`

---

## 🎯 다음 개선 아이디어

- [ ] 다크 모드 지원
- [ ] 목표 체중 설정 기능
- [ ] 일주일/월 평균 계산
- [ ] 모바일 앱화 (PWA)
- [ ] 클라우드 동기화 (Firebase)
- [ ] 운동 기록 추가
- [ ] 음식 칼로리 기록
- [ ] 데이터 백업 기능

---

## 🔗 유용한 링크

- [Chart.js 문서](https://www.chartjs.org/)
- [MDN Web Docs - LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [VS Code 공식 문서](https://code.visualstudio.com/docs)
- [GitHub Pages 문서](https://pages.github.com/)

---

**Happy Coding! 🎉**
