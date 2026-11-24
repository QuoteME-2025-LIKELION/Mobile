// 직접 게시의 문자 제한은 현재 서버 정책과 차이가 있다.
export const countCodePoints = (value: string) => Array.from(value).length;
export const limitQuoteInput = (value: string) =>
  Array.from(value).slice(0, 50).join("");

export function hasQuoteText(value: string): boolean {
  const withoutJamo = value
    .normalize("NFC")
    .replace(
      /[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\ud7b0-\ud7ff\uffa0-\uffdc]/gu,
      ""
    );
  return /\p{L}/u.test(withoutJamo);
}

export function getQuoteInputError(
  value: string,
  mode: "quote" | "ai"
): string | null {
  const text = value.trim();
  const length = countCodePoints(text);
  if (!hasQuoteText(text))
    return "초성·숫자·특수문자·이모지만으로는 작성할 수 없어요.";
  if (mode === "ai" && length < 16) return "16자 이상부터 추천받을 수 있어요.";
  if (length > (mode === "ai" ? 50 : 30)) {
    return mode === "ai"
      ? "AI 추천 원문은 50자 이하로 입력해 주세요."
      : "명언은 30자 이하로 입력해 주세요.";
  }
  return null;
}
