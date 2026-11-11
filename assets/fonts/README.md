# 앱 폰트

사용자가 제공한 프로젝트 루트 `fonts/`의 원본 TTF를 복사했습니다. 루트 파일은 보존합니다.

- `PretendardVariable.ttf`: 본문·버튼, fontWeight로 굵기 선택
- `KoPubWorld-Batang-Medium.ttf`: QuoteMe 로고·명언·요일
- `HSBombaram5.0-Bold.ttf`: 홈 월·일 숫자 (원본 파일의 기본 weight는 400)

`src/styles/theme.ts`의 이름과 파일 매핑을 `expo-font`의 useFonts로 로드합니다. 현재 화면에서 쓰지 않는 돋움·바탕 Light/Bold·봄바람 BigBold는 번들에 추가하지 않았습니다.
