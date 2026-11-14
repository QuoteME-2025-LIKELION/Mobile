import { getQuoteInputError } from "../utils/quoteInput";
import type { QuotePayload, WriteFriend } from "../types/writeTypes";
export function createQuotePayload({
  content,
  originalContent,
  source,
  selectedIds,
  friends,
  myId,
}: {
  content: string;
  originalContent: string;
  source: "direct" | "ai";
  selectedIds: number[];
  friends: WriteFriend[];
  myId: number;
}): QuotePayload {
  const error =
    getQuoteInputError(content, "quote") ??
    (source === "ai" ? getQuoteInputError(originalContent, "ai") : null);
  if (error) throw new Error(error);
  const candidates = new Set(friends.map((friend) => friend.id));
  if (selectedIds.some((id) => id === myId || !candidates.has(id)))
    throw new Error(
      "친구 목록이 변경됐어요. 태그를 확인하고 다시 게시해 주세요."
    );
  return {
    content: content.trim(),
    ...(source === "ai"
      ? { originalContent: originalContent.trim(), summary: content.trim() }
      : {}),
    taggedMemberIds: [...new Set(selectedIds)],
  };
}
