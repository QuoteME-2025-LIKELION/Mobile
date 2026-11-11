import { archiveDateKey } from './archiveDate';

export type PreviewArchiveQuote = {
  id: number;
  nickname: string;
  birthYear: number;
  content: string;
  tags: string[];
  createdAt?: string;
  originalContent?: string;
  isAiGenerated?: boolean;
  isBookmarked?: boolean;
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


export type ArchiveTab = 'all' | 'mine' | 'bookmarks';

// 월별 목록도 개발 데이터다. 이번 달·지난달만 채우고 이전 달은 빈 상태로 둔다.
export function getPreviewMonthlyArchives(month: Date, tab: Exclude<ArchiveTab, 'all'>, today = new Date()): PreviewArchiveQuote[] {
  const current = new Date(today.getFullYear(), today.getMonth(), 1);
  const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const key = archiveDateKey(month).slice(0, 7);
  const currentKey = archiveDateKey(current).slice(0, 7);
  if (key !== currentKey && key !== archiveDateKey(previous).slice(0, 7)) return [];
  const latestDay = key === currentKey ? Math.min(today.getDate(), 7) : 7;
  const dayKey = (day: number) => archiveDateKey(new Date(month.getFullYear(), month.getMonth(), day));
  const aiQuote: PreviewArchiveQuote = {
    id: 101, nickname: '듀가나다', birthYear: 2000, content: '작은 시작이 내일의 나를 만든다', tags: ['듀랄라', '라라진'],
    createdAt: dayKey(latestDay), isAiGenerated: true, isBookmarked: true,
    originalContent: '오늘은 미루던 일을 조금 시작했어. 작은 한 걸음이라도 내일의 나에게 도움이 됐으면 좋겠어.',
  };
  const quotes: PreviewArchiveQuote[] = tab === 'mine' ? [aiQuote] : [
    aiQuote,
    { id: 201, nickname: '라라진', birthYear: 1999, content: '오늘의 나를 믿고 한 걸음 더', tags: ['어푸'], createdAt: dayKey(1), isBookmarked: true },
  ];
  if (tab === 'mine' && latestDay > 1) quotes.push({
    id: 102, nickname: '듀가나다', birthYear: 2000, content: '잠시 쉬어가도 괜찮아', tags: [], createdAt: dayKey(1), isAiGenerated: false,
  });
  return quotes.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}
