import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/createApiClient";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import { colors } from "@/styles/theme";
import { ListRow, RowAction } from "../components/FriendGroupRows";
import { useFriendGroupData } from "../hooks/useFriendGroupData";
import { friendGroupApi, type Member } from "../services/friendGroupApi";
import { styles } from "./CreateGroupScreen.styles";

const MAX_INVITES = 4;
const count = (value: string) => Array.from(value).length;

function GroupStepButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
    >
      <AppText style={[styles.buttonLabel, disabled && styles.disabledText]}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function CreateGroupScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pendingInvites, setPendingInvites] = useState<Member[]>([]);
  const [invitedIds, setInvitedIds] = useState<number[]>([]);
  const [inviteTarget, setInviteTarget] = useState<Member | null>(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [nameError, setNameError] = useState("");
  const [toast, setToast] = useState("");
  const focus = useRef<object | null>(null);
  const requestLock = useRef(false);
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

  const close = () => {
    focus.current = null;
    if (router.canGoBack()) router.back();
    else router.replace("/friend-group");
  };

  const nextFromName = async () => {
    const submittedFocus = focus.current;
    if (
      !submittedFocus ||
      !trimmedName ||
      count(trimmedName) > 10 ||
      requestLock.current
    )
      return;
    requestLock.current = true;
    setBusy(true);
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
      requestLock.current = false;
      setBusy(false);
    }
  };

  const submit = async () => {
    const submittedFocus = focus.current;
    if (!submittedFocus || requestLock.current) return;
    requestLock.current = true;
    setBusy(true);
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
      else close();
    } catch (error) {
      if (focus.current !== submittedFocus) return;
      if (error instanceof ApiError && error.status === 409) {
        setNameError("이미 사용 중인 그룹 이름입니다.");
        setStep(1);
      } else {
        setToast("그룹을 만들지 못했어요.");
      }
    } finally {
      requestLock.current = false;
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader title="그룹 만들기" onBack={close} close />
      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          key={step}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <>
              <AppText accessibilityRole="header" style={styles.title}>
                {"그룹 이름을\n설정해 주세요"}
              </AppText>
              <AppText style={styles.hint}>
                그룹 이름은 한 번 정하면 바꿀 수 없어요.
              </AppText>
              <TextInput
                accessibilityLabel="그룹 이름"
                value={name}
                onChangeText={(value) => {
                  setName(Array.from(value).slice(0, 10).join(""));
                  setNameError("");
                }}
                editable={!busy}
                placeholder="그룹 이름을 입력해 주세요"
                placeholderTextColor={colors["grey-400"]}
                style={styles.field}
              />
              {nameError ? (
                <AppText accessibilityRole="alert" style={styles.error}>
                  {nameError}
                </AppText>
              ) : (
                <AppText style={styles.fieldLimit}>
                  {count(name)}자/10자
                </AppText>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <AppText accessibilityRole="header" style={styles.title}>
                {"그룹 메시지를\n설정해 주세요"}
              </AppText>
              <AppText style={styles.hint}>
                그룹 메시지는 누구나 언제든 수정할 수 있어요.
              </AppText>
              <TextInput
                accessibilityLabel="그룹 메시지"
                value={motto}
                onChangeText={(value) =>
                  setMotto(Array.from(value).slice(0, 20).join(""))
                }
                placeholder="그룹 메시지를 자유롭게 적어주세요"
                placeholderTextColor={colors["grey-400"]}
                style={styles.field}
              />
              <AppText style={styles.fieldLimit}>{count(motto)}자/20자</AppText>
            </>
          )}
          {step === 3 && (
            <>
              <AppText accessibilityRole="header" style={styles.title}>
                {"함께할 멤버를\n초대해 보세요"}
              </AppText>
              <AppText style={styles.hint}>
                그룹의 최대 정원은 5명이에요.
              </AppText>
              <View style={styles.search}>
                <Image
                  source={require("@/assets/images/write/search.svg")}
                  style={styles.searchIcon}
                  accessible={false}
                />
                <TextInput
                  accessibilityLabel="그룹에 초대할 친구 검색"
                  value={keyword}
                  onChangeText={setKeyword}
                  placeholder="검색어를 입력해 주세요"
                  placeholderTextColor={colors["grey-400"]}
                  style={styles.searchInput}
                />
              </View>
              <View style={styles.members}>
                {friends.data?.length === 0 && (
                  <AppText style={styles.emptyFriends}>
                    아직 추가된 친구가 없습니다.
                  </AppText>
                )}
                {friends.data &&
                  friends.data.length > 0 &&
                  trimmedKeyword &&
                  !availableFriends.length && (
                    <AppText style={styles.hint}>검색 결과가 없습니다.</AppText>
                  )}
                {availableFriends.map((member, index) => (
                  <View
                    key={member.id}
                    style={
                      index < availableFriends.length - 1 && styles.rowBorder
                    }
                  >
                    <ListRow
                      name={member.nickname}
                      subtitle={member.introduction}
                      image={member.profileImage}
                    >
                      <RowAction
                        label="초대"
                        disabled={busy}
                        onPress={() => {
                          if (selectedIds.size >= MAX_INVITES)
                            setToast("친구는 최대 4명까지 초대할 수 있어요.");
                          else setInviteTarget(member);
                        }}
                      />
                    </ListRow>
                  </View>
                ))}
                {pendingInvites.length > 0 && (
                  <>
                    <AppText
                      accessibilityRole="header"
                      style={styles.pendingTitle}
                    >
                      초대 대기
                    </AppText>
                    {pendingInvites.map((member) => (
                      <ListRow
                        key={member.id}
                        name={member.nickname}
                        subtitle={member.introduction}
                        image={member.profileImage}
                      >
                        <RowAction
                          label="취소"
                          disabled={busy}
                          onPress={() =>
                            setPendingInvites((current) =>
                              current.filter(({ id }) => id !== member.id)
                            )
                          }
                        />
                      </ListRow>
                    ))}
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
        <View style={styles.actions}>
          {step === 1 ? (
            <GroupStepButton
              label={busy ? "확인 중" : "다음으로"}
              disabled={!trimmedName || busy}
              onPress={() => void nextFromName()}
            />
          ) : (
            <>
              <GroupStepButton
                label="뒤로가기"
                disabled={busy || createdGroupId !== null}
                onPress={() => setStep(step === 2 ? 1 : 2)}
              />
              <GroupStepButton
                label={
                  step === 2
                    ? trimmedMotto
                      ? "다음으로"
                      : "건너뛰기"
                    : pendingInvites.length
                      ? "그룹 만들기"
                      : "건너뛰기"
                }
                disabled={busy}
                onPress={() => {
                  if (step === 2) setStep(3);
                  else setShowCreateConfirm(true);
                }}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      {inviteTarget && (
        <ConfirmDialog
          visible
          title={`${inviteTarget.nickname}님을 그룹에\n초대하시겠어요?`}
          description=""
          confirmLabel="초대하기"
          confirmTone="primary"
          onClose={() => setInviteTarget(null)}
          onConfirm={() => {
            setPendingInvites((current) =>
              current.length + invitedIds.length < MAX_INVITES &&
              !current.some(({ id }) => id === inviteTarget.id)
                ? [...current, inviteTarget]
                : current
            );
            setInviteTarget(null);
          }}
        />
      )}
      {showCreateConfirm && (
        <ConfirmDialog
          visible
          title="이대로 그룹을 만들까요?"
          description={`그룹 이름: ${trimmedName}${trimmedMotto ? `\n메시지: ${trimmedMotto}` : ""}`}
          confirmLabel="만들기"
          confirmTone="primary"
          onClose={() => setShowCreateConfirm(false)}
          onConfirm={() => {
            setShowCreateConfirm(false);
            void submit();
          }}
        />
      )}
      <ToastMessage
        message={toast}
        errorMessage={
          step === 3 && friends.status === "error"
            ? "친구 목록을 불러오지 못했어요."
            : ""
        }
        onClose={() => setToast("")}
      />
    </SafeAreaView>
  );
}
