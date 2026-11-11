# Mobile 코드 구조

이 문서는 2026-11-11 구조 정리에서 선택한 프로젝트 기준이다. React Native가 강제하는 폴더 규칙은 아니며, 기능이 늘어날 때도 화면과 동작을 함께 찾기 쉽게 유지하기 위한 기준이다.

```text
src/
  app/                       Expo Router 경로·개발 접근 제한·공통 레이아웃
  styles/theme.ts            공통 색상·폰트·투명도·브랜드/달력 강조색
  components/                공용 UI와 각 컴포넌트의 .styles.ts
  fixtures/                  기능 간 공유하는 개발용 예시 데이터
  utils/                     공용 순수 계산 함수
  features/
    auth/
    home/
    archive/
    profile/
    write/
      screens/               화면 JSX와 같은 이름의 .styles.ts
      components/            해당 기능의 작은 UI 구성요소와 .styles.ts
      hooks/                 화면 상태·effect·이벤트/비동기 처리
      fixtures/              개발용 예시 목록·강제 상태 데이터
      utils/                 해당 기능의 검증·변환·날짜 계산
      services/              사진 선택 등 외부 기능 접근이 필요한 경우
      constants/             단계 정의·입력 레이아웃처럼 필요한 고정 설정
```

모든 기능에 위 하위 폴더를 기계적으로 만들지는 않는다. 현재 사용하는 역할만 둔다.

## 화면과 동작

- `app/home.tsx` 등은 `HomeScreen` 같은 실제 화면을 연결한다. 경로 파일 안에 스타일·fixture·일반 컴포넌트를 만들지 않는다.
- 화면은 `HomeScreen`, `WriteScreen`, `ArchiveScreen`, `ProfileSetupScreen`, `ProfileCenterScreen`, `StartScreen`으로 이름을 붙인다. API 연동 전이라는 이유로 화면 이름에 `Preview`를 붙이지 않는다.
- 화면의 상태와 동작은 `useHomeFeed`, `useWrite`, `useArchive`, `useProfileSetup`, `useProfileCenter`, `useStart`에 둔다. 화면에는 JSX, 조건부 표시, 스타일 조합, 간단한 UI 이벤트 연결을 둔다.
- 사진 선택·이탈 방지·추천 상태 전환·입력 제한·날짜 이동 같은 동작은 훅/유틸에서 관리한다. 화면과 훅 사이에서 mutable ref를 직접 수정하지 않는다.
- 작은 UI 컴포넌트의 로컬 상태(아바타 오류, 검색 포커스, 애니메이션 등)는 해당 컴포넌트에 둘 수 있다. 같은 동작을 공유하지 않는데 추상화만을 위해 훅을 늘리지 않는다.

## 스타일과 테마

- `*.tsx`의 고정 스타일은 같은 위치의 `*.styles.ts`에서 `StyleSheet.create`로 정의하고 named export `styles`를 사용한다.
- 화면 크기, Safe Area, 선택 상태 등 런타임 값은 JSX에서 기존 styles와 조합한다. 스타일 분리 때문에 값·우선순위·텍스트 폭을 바꾸지 않는다.
- 테마는 `@/styles/theme`에서 가져온다. 기존 웹 팔레트의 모든 키·값은 유지하고, 기본 팔레트 밖의 브랜드색/강조색도 이 모듈에서 관리한다. Frontend 소스를 직접 import하지 않는다.
- 합의된 명언·따옴표 배치는 `components/QuoteText.tsx`, `utils/quoteLayout.ts` 및 해당 스타일에 있다. 구조 변경을 이유로 크기·줄 높이·본문 가용 폭·정렬을 다시 보정하지 않는다.

## 개발 데이터와 실제 연동

- 예시 데이터는 `fixtures`로 드러낸다. `userFixture`, `homeFixtures`, `archiveFixtures`, `friendFixtures`, `recommendationFixtures`는 실제 로그인 사용자/서버 응답이 아니다.
- `profileSetupSteps`는 실제 화면 단계/문구이고, `writeLayout`은 실제 입력 레이아웃 상수이므로 fixture와 구분한다.
- 이번 구조 정리는 개발 접근 제한·길게 누르기·추천 지연/시나리오·비활성 저장/게시 버튼을 제거하지 않았다. 이름 변경 자체가 인증/API 연동 완료를 뜻하지 않는다.
- 실제 연동 때 fixture·개발 진입 동작을 종합 점검하고 서비스/쿼리 계층을 확정한다. 현재 존재하지 않는 API 계약을 구조 이름만으로 확정하지 않는다.

## 검증

- 기본 확인: `npm run lint`, `npx tsc --noEmit`, `node --test tests/*.test.mjs`.
- `tests/helpers/readSource.mjs`는 분리된 실제 훅·스타일·fixture·상수를 함께 읽어 기존 RN 대체 요소 하네스로 검사한다. 훅 동작을 복사해 테스트하지 않는다.
- Node 검사는 실제 RN 글꼴·터치·네이티브 렌더링을 증명하지 않는다. 화면 변경은 폰 확인 결과와 자동 검사를 구분해서 기록한다.
