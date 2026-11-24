import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { useSession } from "@/features/auth/stores/useSession";
import { friendGroupApi } from "../services/friendGroupApi";
import { useFriendGroupData } from "./useFriendGroupData";

export function useGroupDetail(id: number) {
  const { member } = useSession();
  const valid = Number.isSafeInteger(id) && id > 0;
  const load = useCallback(
    (signal: AbortSignal) => friendGroupApi.detail(id, signal),
    [id]
  );
  const group = useFriendGroupData(load, valid);
  const myId = member?.id;
  const isMember = group.data?.members.some((entry) => entry.id === myId);
  return { group, valid, isMember, myId };
}

export function useGroupRequests(id: number, enabled: boolean) {
  const loadJoinRequests = useCallback(
    (signal: AbortSignal) => friendGroupApi.groupJoinRequests(id, signal),
    [id]
  );
  const loadInvitations = useCallback(
    (signal: AbortSignal) => friendGroupApi.groupSentInvitations(id, signal),
    [id]
  );
  const joinRequests = useFriendGroupData(loadJoinRequests, enabled);
  const invitations = useFriendGroupData(loadInvitations, enabled);
  // 닉네임이 중복될 수 있어 서버가 그룹장에게만 반환하는 목록으로 권한을 확인한다.
  const isLeader =
    Array.isArray(joinRequests.data) || Array.isArray(invitations.data);
  const isRegularMember =
    !isLeader && (joinRequests.data === null || invitations.data === null);
  const hasError =
    enabled &&
    !isRegularMember &&
    (joinRequests.status === "error" || invitations.status === "error");
  return { joinRequests, invitations, isLeader, isRegularMember, hasError };
}

export function useGroupScreenFocus() {
  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, [])
  );
  return focused;
}

export function closeGroupDetail() {
  if (router.canGoBack()) router.back();
  else router.replace("/friend-group");
}

export function closeGroupSubpage(id: number) {
  if (router.canGoBack()) router.back();
  else if (Number.isSafeInteger(id) && id > 0) {
    router.replace({ pathname: "/friend-group/detail", params: { id } });
  } else router.replace("/friend-group");
}
