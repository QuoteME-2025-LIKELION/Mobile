import { userFixture } from "@/fixtures/userFixture";

// 개발 화면 비교 전용. 서버 데이터/인증 상태/게시 결과로 사용하지 않는다.
export type FeedItem = {
  id: number;
  nickname: string;
  introduction?: string;
  content: string | null;
  tags: string[];
  timeAgo?: string;
};

export const feedFixtures: FeedItem[] = [
  {
    id: 1,
    nickname: "듀랄라",
    introduction: "Positive Thinking",
    content: "작은 시작이 내일의 나를 만든다",
    tags: ["라라진", "어푸"],
    timeAgo: "2시간 전",
  },
  {
    id: 2,
    nickname: "라라진",
    introduction: "Seize the day",
    content: "오늘의 나를 믿고 한 걸음 더",
    tags: [],
    timeAgo: "3시간 전",
  },
  // 미작성 introduction은 시안 확인용. 현재 서버 응답에 이 필드가 있다는 뜻은 아니다.
  {
    id: 3,
    nickname: "어푸",
    introduction: "작심삼일의 권위자",
    content: null,
    tags: [],
  },
];

export type FeedGroup = { id: number; name: string; memberIds: number[] };
export const groupFixtures: FeedGroup[] = [
  { id: 1, name: "매일 한 문장", memberIds: [1, 3] },
  { id: 2, name: "오늘의 지혜", memberIds: [2] },
  { id: 3, name: "나의 첫 그룹", memberIds: [] },
];

export function filterFeedFixtures(
  items: FeedItem[],
  groups: FeedGroup[],
  selectedId: number | null
): FeedItem[] {
  if (selectedId === null) return items;
  const members =
    groups.find((group) => group.id === selectedId)?.memberIds ?? [];
  return items.filter((item) => members.includes(item.id));
}

export const myQuoteFixture = {
  content: "작은 시작이 내일의 나를 만든다",
  nickname: userFixture.nickname,
  birthYear: userFixture.birthYear,
  tags: ["듀랄라", "라라진"],
};

/** 웹 HomeBox의 공백 우선 2줄 분리를 유지하되 이모지 코드포인트를 자르지 않는다. */
export function splitHomeQuote(content: string): [string, string] {
  const points = Array.from(content);
  if (points.length <= 10) return [content, ""];
  const middle = Math.floor(points.length / 2);
  const space = points.slice(0, middle + 1).lastIndexOf(" ");
  return space > 0
    ? [points.slice(0, space).join(""), points.slice(space + 1).join("")]
    : [points.slice(0, middle).join(""), points.slice(middle).join("")];
}
