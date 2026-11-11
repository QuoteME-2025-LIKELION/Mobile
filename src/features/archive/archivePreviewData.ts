import { archiveDateKey } from './archiveDate';

export type PreviewArchiveQuote = {
  id: number;
  nickname: string;
  birthYear: number;
  content: string;
  tags: string[];
};

// 서버 조회가 아닌 개발용 표시 데이터. 오늘/각 월 7일만 목록이 있고 나머지는 빈 상태.
export function getPreviewArchives(date: Date, today = new Date()): PreviewArchiveQuote[] {
  if (archiveDateKey(date) !== archiveDateKey(today) && date.getDate() !== 7) return [];
  return [
    { id: 1, nickname: '듀가나다', birthYear: 2000, content: '작은 시작이 내일의 나를 만든다', tags: ['듀랄라', '라라진'] },
    { id: 2, nickname: '라라진', birthYear: 1999, content: '오늘의 나를 믿고 한 걸음 더', tags: ['어푸'] },
    { id: 3, nickname: '듀랄라', birthYear: 2001, content: '잠시 쉬어가도 괜찮아', tags: [] },
  ];
}
