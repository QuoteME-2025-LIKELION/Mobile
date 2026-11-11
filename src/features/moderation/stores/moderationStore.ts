import { useSyncExternalStore } from "react";
export type ModerationMember = {
  id: number;
  nickname: string;
  introduction?: string;
};
export type ModerationSnapshot = {
  blocked: ModerationMember[];
  formerFriendIds: number[];
};
const EMPTY: ModerationSnapshot = { blocked: [], formerFriendIds: [] };
let snapshot = EMPTY;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
export function blockFixtureMember(member: ModerationMember) {
  if (!__DEV__ || snapshot.blocked.some((item) => item.id === member.id))
    return false;
  snapshot = {
    blocked: [
      ...snapshot.blocked,
      {
        id: member.id,
        nickname: member.nickname,
        introduction: member.introduction,
      },
    ],
    formerFriendIds: [...new Set([...snapshot.formerFriendIds, member.id])],
  };
  emit();
  return true;
}
export function unblockFixtureMember(id: number) {
  if (!__DEV__ || !snapshot.blocked.some((item) => item.id === id))
    return false;
  // 차단 해제로 친구 관계를 복구하지 않는다. 서버/영구 저장과는 무관한 개발 상태.
  snapshot = {
    ...snapshot,
    blocked: snapshot.blocked.filter((item) => item.id !== id),
  };
  emit();
  return true;
}
export const getModerationSnapshot = () => (__DEV__ ? snapshot : EMPTY);
export const subscribeModeration = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useModerationState() {
  return useSyncExternalStore(
    subscribeModeration,
    getModerationSnapshot,
    () => EMPTY
  );
}
