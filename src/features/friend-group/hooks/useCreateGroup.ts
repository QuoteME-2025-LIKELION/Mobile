import { router, useFocusEffect, usePreventRemove } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/api/createApiClient";
import { friendGroupApi, type Member } from "../services/friendGroupApi";
import { useFriendGroupData } from "./useFriendGroupData";

const MAX_INVITES = 4;
export const countGroupCharacters = (value: string) => Array.from(value).length;
type RequestKind = "checking" | "submitting";

export function useCreateGroup() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pendingInvites, setPendingInvites] = useState<Member[]>([]);
  const [invitedIds, setInvitedIds] = useState<number[]>([]);
  const [inviteTarget, setInviteTarget] = useState<Member | null>(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);
  const [request, setRequest] = useState<RequestKind | null>(null);
  const [nameError, setNameError] = useState("");
  const [toast, setToast] = useState("");
  const focus = useRef<object | null>(null);
  const requestLock = useRef<RequestKind | null>(null);
  const disablePrevention = usePreventRemove(
    request === "submitting",
    () => {}
  );
  useFocusEffect(
    useCallback(() => {
      focus.current = {};
      return () => {
        focus.current = null;
      };
    }, [])
  );

  const friends = useFriendGroupData(friendGroupApi.friends, step === 3);
  const trimmedName = name.trim();
  const trimmedMotto = motto.trim();
  const trimmedKeyword = keyword.trim().toLowerCase();
  const selectedIds = new Set([
    ...invitedIds,
    ...pendingInvites.map(({ id }) => id),
  ]);
  const availableFriends =
    friends.data?.filter(
      (member) =>
        !selectedIds.has(member.id) &&
        member.nickname.toLowerCase().includes(trimmedKeyword)
    ) ?? [];

  const leave = () => {
    focus.current = null;
    if (router.canGoBack()) router.back();
    else router.replace("/friend-group");
  };

  const close = () => {
    if (requestLock.current !== "submitting") leave();
  };

  const nextFromName = async () => {
    const submittedFocus = focus.current;
    if (
      !submittedFocus ||
      !trimmedName ||
      countGroupCharacters(trimmedName) > 10 ||
      requestLock.current
    )
      return;
    requestLock.current = "checking";
    setRequest("checking");
    setNameError("");
    try {
      const { groups } = await friendGroupApi.search(trimmedName);
      if (focus.current !== submittedFocus) return;
      if (
        groups.some(
          (group) =>
            group.name.trim().toLowerCase() === trimmedName.toLowerCase()
        )
      ) {
        setNameError("이미 사용 중인 그룹 이름입니다.");
        return;
      }
      setName(trimmedName);
      setStep(2);
    } catch {
      if (focus.current === submittedFocus)
        setToast("그룹 이름을 확인하지 못했어요.");
    } finally {
      requestLock.current = null;
      setRequest(null);
    }
  };

  const submit = async () => {
    const submittedFocus = focus.current;
    if (!submittedFocus || requestLock.current) return;
    requestLock.current = "submitting";
    setRequest("submitting");
    try {
      const groupId =
        createdGroupId ??
        (await friendGroupApi.createGroup(trimmedName, trimmedMotto)).id;
      setCreatedGroupId(groupId);
      const outcomes = await Promise.allSettled(
        pendingInvites.map(({ id }) => friendGroupApi.inviteMember(groupId, id))
      );
      const failed = pendingInvites.filter((_, index) => {
        const result = outcomes[index];
        return (
          result.status === "rejected" &&
          !(
            result.reason instanceof ApiError &&
            result.reason.status === 400 &&
            result.reason.code === "400-4"
          )
        );
      });
      const failedIds = new Set(failed.map(({ id }) => id));
      setInvitedIds((current) => [
        ...current,
        ...pendingInvites
          .filter(({ id }) => !failedIds.has(id))
          .map(({ id }) => id),
      ]);
      setPendingInvites(failed);
      if (focus.current !== submittedFocus) return;
      if (failed.length) setToast("일부 친구 초대에 실패했어요.");
      else {
        disablePrevention();
        leave();
      }
    } catch (error) {
      if (focus.current !== submittedFocus) return;
      if (error instanceof ApiError && error.status === 409) {
        setNameError("이미 사용 중인 그룹 이름입니다.");
        setStep(1);
      } else {
        setToast("그룹을 만들지 못했어요.");
      }
    } finally {
      requestLock.current = null;
      setRequest(null);
    }
  };

  const chooseInvite = (member: Member) => {
    if (selectedIds.size >= MAX_INVITES)
      setToast("친구는 최대 4명까지 초대할 수 있어요.");
    else setInviteTarget(member);
  };

  const confirmInvite = () => {
    if (!inviteTarget) return;
    setPendingInvites((current) =>
      current.length + invitedIds.length < MAX_INVITES &&
      !current.some(({ id }) => id === inviteTarget.id)
        ? [...current, inviteTarget]
        : current
    );
    setInviteTarget(null);
  };

  const advance = () => {
    if (step === 2) setStep(3);
    else if (createdGroupId !== null && pendingInvites.length === 0) close();
    else setShowCreateConfirm(true);
  };

  return {
    step,
    name,
    motto,
    keyword,
    trimmedName,
    trimmedMotto,
    trimmedKeyword,
    nameError,
    pendingInvites,
    inviteTarget,
    showCreateConfirm,
    createdGroupId,
    busy: request !== null,
    toast,
    friends,
    availableFriends,
    close,
    nextFromName,
    advance,
    stepBack: () => setStep(step === 2 ? 1 : 2),
    changeName: (value: string) => {
      setName(Array.from(value).slice(0, 10).join(""));
      setNameError("");
    },
    changeMotto: (value: string) =>
      setMotto(Array.from(value).slice(0, 20).join("")),
    setKeyword,
    chooseInvite,
    confirmInvite,
    cancelInvite: () => setInviteTarget(null),
    removeInvite: (memberId: number) =>
      setPendingInvites((current) =>
        current.filter(({ id }) => id !== memberId)
      ),
    cancelSubmit: () => setShowCreateConfirm(false),
    confirmSubmit: () => {
      setShowCreateConfirm(false);
      void submit();
    },
    clearToast: () => setToast(""),
  };
}
