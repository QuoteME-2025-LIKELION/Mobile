# QuoteMe Mobile

Expo / React Native로 개발하는 QuoteMe 앱 저장소입니다. 웹 `Frontend/`와 Git 저장소·이슈 번호가 별개입니다.

## 개발 실행

PC와 폰을 같은 Wi-Fi에 연결하고, 이 저장소에서 실행합니다.

```bash
npx expo start --dev-client
```

폰에 설치한 개발 앱에서 현재 서버를 선택하거나 QR을 스캔합니다. 기존 Metro가 실행 중이면 중복 실행하지 않습니다.

## 코드 검사

```bash
npx tsc --noEmit
npm run lint
```

앱 소스는 `src/`, Expo Router 화면은 `src/app/`에서 관리합니다. 변경한 동작은 관련 기기에서 확인하고, 확인하지 못한 플랫폼·기능은 PR에 명시합니다. 코드 검사 통과와 실제 기기 동작 확인은 구분합니다.

## 커밋 컨벤션, 브랜치 전략

웹 저장소와 같은 커밋·브랜치 형식을 사용합니다. 브랜치의 이슈 번호는 이 Mobile 저장소에 생성된 실제 번호를 사용합니다. 아래 번호는 예시이며 Frontend 이슈 번호를 그대로 가져오지 않습니다.

### 커밋 메세지 컨벤션

- 커밋의 시작은 아래의 목록을 참고하여 gitmoji & 커밋이름 삽입
- 커밋의 끝맺음은 "~ 기능 추가", "~ 작업", "~ 개발" 과 같이 명사로 통일

```
🎉 Init: 프로젝트 세팅
✨ Feat: 새로운 기능 추가
🐛 Fix: 버그 수정
💄 Design: UI 스타일/디자인 수정
♻️ Refactor: 코드 리팩토링
✏️ Typo: 오타 수정,타입 수정
🚚 Rename: 폴더 구조 이동, 파일명 변경
🍱 Assets: 이미지, 폰트 등 리소스 추가/삭제
🔥 Del: 파일 삭제
📝 Docs: 문서 수정, 목데이터 작업 등
🔧 Chore: 설정파일 보완, 환경 설정
➕ Deps: 새로운 라이브러리 설치
➖ Deps: 불필요한 라이브러리 삭제
🔙 : 커밋 내용 복구
```

예시

```
✨ Feat: 메인페이지 개발
♻️ Refactor: 등록 플로우 - 글 작성 페이지 로직 정리
```

### 브랜치 전략

| 태그이름                   | 설명                       |
| -------------------------- | -------------------------- |
| main                       | 실제 배포용 브랜치         |
| develop                    | 개발용 브랜치(기능 통합용) |
| feat/이슈번호/기능이름     | 새로운 기능 개발 시        |
| refactor/이슈번호/기능이름 | 코드 리팩토링              |
| fix/이슈번호/버그이름      | 버그 수정                  |
| design/이슈번호/요소       | 디자인 및 스타일 변경      |
| chore/이슈번호/내용        | 설정, 의존성 등 기타 작업  |

예시

```
feat/#12/login-page  // 로그인 기능 개발
refactor/#34/reduce-duplicated-code  // 코드 리팩토링
chore/#56/update-eslint  // eslint 설정 수정
```

PR은 `develop`을 대상으로 작업 범위별로 나눕니다.

## 이슈와 PR 작성

- 이슈 템플릿: `.github/ISSUE_TEMPLATE/issue_template.md`
- PR 템플릿: `.github/pull_request_template.md`
- 이슈가 남아 있으면 번호만 연결하고, 이슈 전체를 완료한 PR에서만 `Closes #번호`를 사용합니다.
- 실제 기기 확인 결과, 타입·린트 결과, 미검증 범위를 구분해 기록합니다.

---

## 초기 Expo 템플릿 참고 문서

아래는 프로젝트 생성 시 포함된 문서입니다. 일상 개발의 실행·검사·협업 기준은 위 내용을 우선합니다.

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
