/** 웹의 기존 규칙과 같이 기기의 현지 날짜를 기준으로 비교한다. */
export function isFutureArchiveDate(date: Date, today = new Date()) {
  return (
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() >
    new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  );
}

/** 월말을 보정하고, 자동 선택되는 날짜가 오늘을 넘지 않도록 한다. */
export function getArchiveDateInMonth(
  baseDate: Date,
  year: number,
  month: number,
  today = new Date(),
) {
  const lastDate = new Date(year, month + 1, 0).getDate();
  const candidate = new Date(
    year,
    month,
    Math.min(baseDate.getDate(), lastDate),
  );
  return isFutureArchiveDate(candidate, today)
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
    : candidate;
}

/** 날짜가 아닌 월 단위로 미래 이동을 검사한다. */
export function isFutureArchiveMonth(date: Date, today = new Date()) {
  return (
    new Date(date.getFullYear(), date.getMonth(), 1).getTime() >
    new Date(today.getFullYear(), today.getMonth(), 1).getTime()
  );
}

/** 연도 이동 시 올해의 미래 월은 현재 월로 보정하고 미래 연도는 차단한다. */
export function getArchiveMonthInYear(
  baseMonth: Date,
  year: number,
  today = new Date(),
) {
  if (year > today.getFullYear()) return null;
  const month =
    year === today.getFullYear()
      ? Math.min(baseMonth.getMonth(), today.getMonth())
      : baseMonth.getMonth();
  return new Date(year, month, 1);
}

export function archiveDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 웹과 동일하게 인접 월 날짜를 포함한 최소 5주, 필요하면 6주를 표시한다. */
export function getCalendarDates(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const weeks = Math.max(5, Math.ceil((firstWeekday + lastDay) / 7));
  return Array.from(
    { length: weeks * 7 },
    (_, index) => new Date(year, month, 1 - firstWeekday + index),
  );
}
