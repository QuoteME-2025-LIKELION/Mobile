import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
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
import { colors } from "@/styles/theme";
import { RemoveProfileImageButton } from "../components/RemoveProfileImageButton";
import { ToastMessage } from "@/components/ToastMessage";
import { styles } from "./ProfileCenterScreen.styles";
import { useProfileCenter } from "../hooks/useProfileCenter";

export function ProfileCenterScreen(
  options: Parameters<typeof useProfileCenter>[0] = {}
) {
  const {
    loading,
    loadError,
    retry,
    profileImage,
    insets,
    editing,
    nickname,
    introduction,
    image,
    imageFailed,
    imageError,
    picking: selecting,
    saving,
    saveToast,
    clearSaveToast,
    saveDisabled,
    save,
    clearImage,
    focused,
    setFocused,
    exitOpen,
    nicknameEmpty,
    close,
    chooseImage,
    handleImageError,
    confirmExit,
    changeNickname,
    changeIntroduction,
    cancelExit,
    beginEditing,
  } = useProfileCenter(options);
  const picking = selecting || saving;
  const disabled = picking || loading || loadError || (editing && saveDisabled);
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <StatusBar style="dark" />
      {loading || loadError ? (
        <View style={styles.loadState}>
          {loading ? (
            <ActivityIndicator accessibilityLabel="프로필 불러오는 중" />
          ) : (
            <>
              <AppText accessibilityRole="alert">
                프로필을 불러오지 못했어요.
              </AppText>
              <Pressable accessibilityRole="button" onPress={retry}>
                <AppText>다시 시도</AppText>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.fill}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <AppText accessibilityRole="header" style={styles.title}>
            프로필 관리
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="프로필 관리 닫기"
            disabled={picking}
            accessibilityState={{ disabled: picking }}
            onPress={close}
            hitSlop={8}
          >
            <Image
              source={require("@/assets/images/write/close.svg")}
              tintColor={colors["grey-950"]}
              style={styles.closeIcon}
              accessible={false}
            />
          </Pressable>
        </View>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          <View style={styles.profile}>
            <View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  editing ? "프로필 이미지 변경" : "프로필 이미지"
                }
                disabled={!editing || picking}
                accessibilityState={{
                  disabled: !editing || picking,
                  busy: picking,
                }}
                onPress={chooseImage}
                style={styles.avatarBox}
              >
                <Image
                  source={
                    image && !imageFailed
                      ? { uri: image.uri }
                      : profileImage && !imageFailed
                        ? { uri: profileImage }
                        : require("@/assets/images/profile/default-profile.png")
                  }
                  contentFit="cover"
                  style={styles.avatar}
                  accessible={false}
                  onError={handleImageError}
                />
              </Pressable>
              {editing && (image || profileImage) ? (
                <RemoveProfileImageButton
                  disabled={picking}
                  onPress={clearImage}
                />
              ) : null}
            </View>
            <Pressable
              disabled={!editing || picking}
              accessibilityRole="button"
              accessibilityLabel="이미지 바꾸기"
              accessibilityState={{ disabled: !editing || picking }}
              accessibilityElementsHidden={!editing}
              importantForAccessibility={
                editing ? "auto" : "no-hide-descendants"
              }
              onPress={chooseImage}
              hitSlop={6}
              style={!editing && styles.hidden}
            >
              <AppText style={styles.changeImage}>이미지 바꾸기</AppText>
            </Pressable>
            {imageError ? (
              <AppText
                accessibilityLiveRegion="polite"
                style={styles.imageError}
              >
                {imageError}
              </AppText>
            ) : null}
          </View>
          <View style={styles.fields}>
            <AppText style={styles.label}>닉네임</AppText>
            {editing ? (
              <TextInput
                accessibilityLabel="닉네임"
                value={nickname}
                onChangeText={changeNickname}
                maxLength={20}
                editable={!picking}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="닉네임"
                placeholderTextColor={colors.territory}
                onFocus={() => setFocused("nickname")}
                onBlur={() => setFocused(null)}
                style={[
                  styles.input,
                  focused === "nickname" && styles.focused,
                  nicknameEmpty && styles.invalid,
                ]}
              />
            ) : (
              <View style={styles.info}>
                <AppText style={styles.value}>{nickname}</AppText>
              </View>
            )}
            <View
              style={[styles.meta, !editing && styles.hidden]}
              accessibilityElementsHidden={!editing}
              importantForAccessibility={
                editing ? "auto" : "no-hide-descendants"
              }
            >
              {editing && nicknameEmpty ? (
                <AppText style={styles.error}>
                  닉네임을 비워둘 수 없어요.
                </AppText>
              ) : null}
              <AppText style={styles.count}>
                {Array.from(nickname).length}자/10자
              </AppText>
            </View>
            <AppText style={styles.label}>자기소개</AppText>
            {editing ? (
              <TextInput
                accessibilityLabel="자기소개"
                value={introduction}
                onChangeText={changeIntroduction}
                maxLength={40}
                editable={!picking}
                placeholder="자기소개"
                placeholderTextColor={colors.territory}
                onFocus={() => setFocused("introduction")}
                onBlur={() => setFocused(null)}
                style={[
                  styles.input,
                  focused === "introduction" && styles.focused,
                ]}
              />
            ) : (
              <View style={styles.info}>
                <AppText style={styles.value}>{introduction}</AppText>
              </View>
            )}
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: 40 + insets.bottom }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: disabled,
            }}
            disabled={disabled}
            onPress={editing ? () => void save() : beginEditing}
            style={[styles.button, disabled && styles.disabledButton]}
          >
            <AppText
              style={[styles.buttonText, disabled && styles.disabledText]}
            >
              {saving ? "저장 중…" : editing ? "저장하기" : "편집하기"}
            </AppText>
          </Pressable>
        </View>
        <ToastMessage message={saveToast} onClose={clearSaveToast} />
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={exitOpen}
        title={"저장하지 않고\n나가시겠어요?"}
        description="변경된 정보는 저장되지 않아요."
        dismissLabel="머무르기"
        cancelLabel="머무르기"
        onClose={cancelExit}
        onConfirm={confirmExit}
      />
    </SafeAreaView>
  );
}
