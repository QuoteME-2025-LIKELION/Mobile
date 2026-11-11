export type NoticeFixture = {
  id: number;
  title: string;
  date: string;
  important: boolean;
  content: string;
};
// 화면 비교 전용 예시이며 실제 운영 공지나 배포 일정이 아니다.
export const noticeFixtures: NoticeFixture[] = [
  {
    id: 1,
    title: "쿼트미 이용 안내",
    date: "2026.11.11",
    important: true,
    content:
      "하루의 생각을 한 문장으로 남겨 보세요.\n친구와 함께 서로의 문장을 나눌 수 있어요.",
  },
  {
    id: 2,
    title: "커뮤니티 이용 안내",
    date: "2026.11.10",
    important: true,
    content:
      "서로를 존중하는 문장으로 이야기를 나눠 주세요.\n불편한 내용을 발견하면 신고하거나 작성자를 차단할 수 있어요.",
  },
  {
    id: 3,
    title: "오늘의 한 문장을 남겨 보세요",
    date: "2026.11.11",
    important: false,
    content:
      "평범했던 하루에도 기억하고 싶은 순간이 있어요.\n오늘 떠오른 생각을 쿼트미에 남겨 보세요.",
  },
  {
    id: 4,
    title: "친구와 나누는 작은 생각",
    date: "2026.11.10",
    important: false,
    content:
      "친구의 하루를 한 문장으로 만나 보세요.\n서로 다른 생각이 새로운 영감이 될 수 있어요.",
  },
  {
    id: 5,
    title: "지난 문장을 다시 만나는 시간",
    date: "2026.11.09",
    important: false,
    content:
      "아카이브에서 지난 날짜의 문장을 다시 살펴보세요.\n그날의 생각을 천천히 돌아볼 수 있어요.",
  },
  {
    id: 6,
    title: "새로운 소식을 전해 드려요",
    date: "2026.11.08",
    important: false,
    content: "쿼트미의 새로운 소식을 이곳에서 확인해 주세요.",
  },
];
