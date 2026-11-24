import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import { colors } from "@/styles/theme";
import { ListRow, RowAction } from "../components/FriendGroupRows";
import { countGroupCharacters, useCreateGroup } from "../hooks/useCreateGroup";
import { styles } from "./CreateGroupScreen.styles";

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
  const {
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
    busy,
    toast,
    friends,
    availableFriends,
    close,
    nextFromName,
    advance,
    stepBack,
    changeName,
    changeMotto,
    setKeyword,
    chooseInvite,
    confirmInvite,
    cancelInvite,
    removeInvite,
    cancelSubmit,
    confirmSubmit,
    clearToast,
  } = useCreateGroup();
  const hasCreatedGroup = createdGroupId !== null;

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
                onChangeText={changeName}
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
                  {countGroupCharacters(name)}자/10자
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
                onChangeText={changeMotto}
                placeholder="그룹 메시지를 자유롭게 적어주세요"
                placeholderTextColor={colors["grey-400"]}
                style={styles.field}
              />
              <AppText style={styles.fieldLimit}>
                {countGroupCharacters(motto)}자/20자
              </AppText>
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
                        onPress={() => chooseInvite(member)}
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
                          onPress={() => removeInvite(member.id)}
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
                disabled={busy || hasCreatedGroup}
                onPress={stepBack}
              />
              <GroupStepButton
                label={
                  step === 2
                    ? trimmedMotto
                      ? "다음으로"
                      : "건너뛰기"
                    : hasCreatedGroup
                      ? pendingInvites.length
                        ? "초대 다시 보내기"
                        : "완료"
                      : pendingInvites.length
                        ? "그룹 만들기"
                        : "건너뛰기"
                }
                disabled={busy}
                onPress={advance}
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
          onClose={cancelInvite}
          onConfirm={confirmInvite}
        />
      )}
      {showCreateConfirm && (
        <ConfirmDialog
          visible
          title={
            hasCreatedGroup
              ? "남은 초대를 다시 보낼까요?"
              : "이대로 그룹을 만들까요?"
          }
          description={
            hasCreatedGroup
              ? ""
              : `그룹 이름: ${trimmedName}${trimmedMotto ? `\n메시지: ${trimmedMotto}` : ""}`
          }
          confirmLabel={hasCreatedGroup ? "다시 보내기" : "만들기"}
          confirmTone="primary"
          onClose={cancelSubmit}
          onConfirm={confirmSubmit}
        />
      )}
      <ToastMessage
        message={toast}
        errorMessage={
          step === 3 && friends.status === "error"
            ? "친구 목록을 불러오지 못했어요."
            : ""
        }
        onClose={clearToast}
      />
    </SafeAreaView>
  );
}
