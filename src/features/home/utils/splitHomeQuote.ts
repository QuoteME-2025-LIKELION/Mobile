/** 공백을 우선해 두 줄로 나누고 이모지 코드포인트를 자르지 않는다. */
export function splitHomeQuote(content: string): [string, string] {
  const points = Array.from(content);
  if (points.length <= 10) return [content, ""];
  const middle = Math.floor(points.length / 2);
  const space = points.slice(0, middle + 1).lastIndexOf(" ");
  return space > 0
    ? [points.slice(0, space).join(""), points.slice(space + 1).join("")]
    : [points.slice(0, middle).join(""), points.slice(middle).join("")];
}
