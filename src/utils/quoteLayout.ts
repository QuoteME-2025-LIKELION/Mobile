export const quoteMetrics = {
  archive: { markWidth: 11, markHeight: 10, gap: 20, minHeight: 50 },
  feed: { markWidth: 16, markHeight: 14, gap: 16, minHeight: 24 },
} as const;

export type QuoteVariant = keyof typeof quoteMetrics;

/** 본문에 할당한 폭은 유지하고, 측정된 글자 폭으로 따옴표만 배치한다. */
export function getQuoteMarkPositions(
  rowWidth: number,
  textWidth: number,
  variant: QuoteVariant,
) {
  const { markWidth, gap } = quoteMetrics[variant];
  const reserve = markWidth + gap;
  const available = Math.max(0, rowWidth - reserve * 2 - 8);
  const visibleWidth = Math.max(0, Math.min(textWidth, available));
  const textLeft =
    variant === 'feed' ? reserve + 4 : (rowWidth - visibleWidth) / 2;
  return {
    left: Math.max(0, textLeft - gap - 4 - markWidth),
    right: Math.min(
      Math.max(0, rowWidth - markWidth),
      textLeft + visibleWidth + gap + 4,
    ),
  };
}
