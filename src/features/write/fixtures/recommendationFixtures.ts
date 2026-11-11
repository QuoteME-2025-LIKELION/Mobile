// 개발 전용 작성 미리보기 데이터. AI 응답이나 실제 계정 사용량이 아니다.
// WriteScreen의 recommendationScenario로 각 결과 상태를 확인할 수 있다.
export type RecommendationScenario =
  | "success"
  | "empty"
  | "error"
  | "exhausted";
export type RecommendationStatus = "idle" | "loading" | RecommendationScenario;

export const recommendationFixtures: readonly (readonly string[])[] = [
  [
    "작은 걸음도 나를 앞으로 데려간다.",
    "오늘의 용기가 내일의 나를 만든다.",
    "흔들려도 나의 방향을 잃지 말자.",
  ],
  [
    "천천히 가도 나의 길은 이어진다.",
    "평범한 하루에도 빛나는 순간이 있다.",
    "다시 시작하는 마음도 하나의 성장이다.",
  ],
];
