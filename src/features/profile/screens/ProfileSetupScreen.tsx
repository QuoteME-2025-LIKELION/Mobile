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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AppText } from "@/components/AppText";
import { ToastMessage } from "@/components/ToastMessage";
import { colors } from "@/styles/theme";
import { RemoveProfileImageButton } from "../components/RemoveProfileImageButton";
import { styles } from "./ProfileSetupScreen.styles";
import { useProfileSetup } from "../hooks/useProfileSetup";

export function ProfileSetupScreen(
  options: Parameters<typeof useProfileSetup>[0] = {}
) {
  const {
    step,
    exitOpen,
    exiting,
    exitError,
    openExit,
    closeExit,
    confirmExit,
    image,
    setImage,
    imageError,
    setImageError,
    picking,
    saving,
    saveError,
    clearImage,
    uploadToast,
    clearUploadToast,
    submit,
    focused,
    setFocused,
    inputRef,
    scrollRef,
    field,
    value,
    valid,
    error,
    next,
    chooseImage,
    handleChangeText,
    handleBlur,
  } = useProfileSetup(options);
  const pending = picking || saving || exiting;
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          disabled={pending}
          onPress={openExit}
          style={styles.closeButton}
        >
          <Image
            source={require("@/assets/images/write/close.svg")}
            tintColor={colors["grey-950"]}
            style={styles.closeIcon}
            accessible={false}
          />
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.fields}>
            <AppText accessibilityLiveRegion="polite" style={styles.step}>
              {step + 1}/4
            </AppText>
            <View>
              <AppText accessibilityRole="header" style={styles.title}>
                {field.title}
              </AppText>
              <AppText style={styles.help}>{field.help}</AppText>
            </View>
            {step < 3 ? (
              <View style={styles.field}>
                <TextInput
                  key={step}
                  ref={inputRef}
                  accessibilityLabel={field.label}
                  accessibilityHint={`${field.help} ${step === 2 ? "1900년부터 올해까지 숫자 4자리" : `공백 포함 최대 ${field.limit}자`}${error ? `. ${error}` : ""}`}
                  value={value}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.territory}
                  onChangeText={handleChangeText}
                  onFocus={() => setFocused(true)}
                  onBlur={handleBlur}
                  maxLength={step === 2 ? 4 : field.limit * 2}
                  inputMode={step === 2 ? "numeric" : "text"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={next}
                  selectionColor={colors.primary}
                  style={[styles.input, focused && styles.focused]}
                />
                <View style={styles.meta}>
                  {error !== "" && (
                    <AppText
                      accessibilityLiveRegion="polite"
                      style={styles.error}
                    >
                      {error}
                    </AppText>
                  )}
                  {step === 1 && (
                    <AppText style={styles.count}>
                      {Array.from(value).length}/20자
                    </AppText>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.profile}>
                <View>
                  <View
                    accessibilityRole="image"
                    accessibilityLabel={
                      image ? "선택한 프로필 이미지" : "기본 프로필 이미지"
                    }
                    style={styles.avatar}
                  >
                    <Image
                      source={
                        image
                          ? { uri: image.uri }
                          : require("@/assets/images/profile/default-profile.png")
                      }
                      style={styles.avatarImage}
                      contentFit="cover"
                      accessible={false}
                      onError={
                        image
                          ? () => {
                              setImage(null);
                              setImageError(
                                "이미지를 표시하지 못했어요. 다른 이미지를 선택해 주세요."
                              );
                            }
                          : undefined
                      }
                    />
                  </View>
                  {image ? (
                    <RemoveProfileImageButton
                      disabled={pending}
                      onPress={clearImage}
                    />
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: pending,
                    busy: picking,
                  }}
                  disabled={pending}
                  onPress={chooseImage}
                  style={styles.upload}
                >
                  <AppText style={styles.uploadText}>이미지 업로드하기</AppText>
                </Pressable>
                {imageError !== "" && (
                  <AppText
                    accessibilityLiveRegion="polite"
                    style={styles.error}
                  >
                    {imageError}
                  </AppText>
                )}
              </View>
            )}
          </View>
          <View style={styles.footer}>
            {exitError ? (
              <AppText style={styles.error} accessibilityRole="alert">
                {exitError}
              </AppText>
            ) : null}
            {saveError ? (
              <AppText style={styles.error} accessibilityRole="alert">
                {saveError}
              </AppText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: pending || (step < 3 && !valid),
              }}
              disabled={pending || (step < 3 && !valid)}
              onPress={step === 3 ? () => void submit() : next}
              style={({ pressed }) => [
                styles.button,
                (pending || (step < 3 && !valid)) && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[
                  styles.buttonText,
                  (pending || (step < 3 && !valid)) && styles.disabledText,
                ]}
              >
                {saving
                  ? "저장 중…"
                  : step === 3
                    ? image
                      ? "쿼트미 시작하기"
                      : "이미지 없이 시작하기"
                    : "다음으로"}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
        <ToastMessage message={uploadToast} onClose={clearUploadToast} />
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={exitOpen}
        title="첫 화면으로 돌아갈까요?"
        description=""
        dismissLabel="머무르기"
        cancelLabel="머무르기"
        confirmLabel="돌아가기"
        onClose={closeExit}
        onConfirm={() => void confirmExit()}
      />
    </SafeAreaView>
  );
}
