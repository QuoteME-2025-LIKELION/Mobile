import { Image } from "expo-image";
import { usePreventRemove } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ComponentRef } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { colors, fonts, withOpacity } from "@/constants/theme";

import { pickProfileImage } from "./pickProfileImage";
import {
  isValidBirthYear,
  limitProfileText,
  sanitizeBirthYear,
  validateProfileImage,
  type ProfileImage,
} from "./profileInput";

const steps = [
  {
    title: "쿼트미에서 사용할\n닉네임을 설정해 주세요.",
    help: "닉네임은 언제든 수정할 수 있어요.",
    label: "닉네임",
    placeholder: "닉네임을 입력해 주세요",
    limit: 10,
  },
  {
    title: "다른 사람들에게 보여줄\n자기소개를 설정해 주세요.",
    help: "자기소개는 언제든 수정할 수 있어요.",
    label: "자기소개",
    placeholder: "자기소개를 입력해주세요",
    limit: 20,
  },
  {
    title: "내 명언에 표시할\n출생연도를 입력해 주세요.",
    help: "태어난 연도를 네 자리로 입력해 주세요.",
    label: "출생연도",
    placeholder: "출생연도(yyyy) 입력",
    limit: 4,
  },
  {
    title: "다른 사람들에게 보여줄\n프로필 이미지를 설정해 주세요.",
    help: "이미지는 언제든 수정할 수 있어요.",
    label: "프로필 이미지",
    placeholder: "",
    limit: 0,
  },
];

export function ProfileSetupPreview({
  selectImage = pickProfileImage,
}: { selectImage?: () => Promise<ProfileImage | null> } = {}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(["", "", ""]);
  const [touched, setTouched] = useState([false, false, false]);
  const [image, setImage] = useState<ProfileImage | null>(null);
  const [imageError, setImageError] = useState("");
  const [picking, setPicking] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const field = steps[step];
  const value = values[step] ?? "";
  const valid = step === 2 ? isValidBirthYear(value) : value.trim().length > 0;
  const error =
    step < 3 && !valid && (touched[step] || (step === 2 && value.length === 4))
      ? step === 2
        ? `1900년부터 ${new Date().getFullYear()}년 사이의 출생연도를 숫자 4자리로 입력해 주세요.`
        : `${field.label}${step === 0 ? "을" : "를"} 입력해 주세요.`
      : "";

  usePreventRemove(step > 0 || picking, () => {
    if (busy.current) return;
    Keyboard.dismiss();
    setFocused(false);
    setStep((current) => Math.max(0, current - 1));
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (step > 0 && step < 3) inputRef.current?.focus();
  }, [step]);

  const next = () => {
    if (step >= 3 || !valid) return;
    Keyboard.dismiss();
    setFocused(false);
    setStep((current) => current + 1);
  };
  const chooseImage = async () => {
    if (busy.current) return;
    busy.current = true;
    setPicking(true);
    setImageError("");
    try {
      const selected = await selectImage();
      if (!mounted.current || !selected) return;
      const validationError = validateProfileImage(selected);
      if (validationError) {
        setImageError(validationError);
        return;
      }
      setImage(selected);
    } catch (error) {
      if (mounted.current)
        setImageError(
          error instanceof Error &&
            /ExponentImagePicker|native module/i.test(error.message)
            ? "사진 선택을 사용하려면 개발 앱을 다시 빌드·설치해 주세요."
            : "이미지 선택을 열지 못했어요. 잠시 후 다시 시도해 주세요.",
        );
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
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
                  onChangeText={(text) =>
                    setValues((current) =>
                      current.map((previous, index) =>
                        index === step
                          ? step === 2
                            ? sanitizeBirthYear(text)
                            : limitProfileText(text, field.limit)
                          : previous,
                      ),
                    )
                  }
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    setTouched((current) =>
                      current.map((previous, index) =>
                        index === step ? true : previous,
                      ),
                    );
                  }}
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
                              "이미지를 표시하지 못했어요. 다른 이미지를 선택해 주세요.",
                            );
                          }
                        : undefined
                    }
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: picking, busy: picking }}
                  disabled={picking}
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
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: step === 3 || !valid }}
              disabled={step === 3 || !valid}
              onPress={next}
              style={({ pressed }) => [
                styles.button,
                (step === 3 || !valid) && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                style={[
                  styles.buttonText,
                  (step === 3 || !valid) && styles.disabledText,
                ]}
              >
                {step === 3 ? "쿼트미 시작하기" : "다음으로"}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  fill: { flex: 1 },
  content: { flexGrow: 1 },
  fields: { paddingTop: 80, paddingHorizontal: 24, gap: 32 },
  step: {
    fontFamily: fonts.quote,
    fontSize: 20,
    lineHeight: 30,
    color: colors["grey-950"],
  },
  title: {
    fontFamily: fonts.quote,
    fontSize: 20,
    lineHeight: 30,
    color: colors["grey-950"],
  },
  help: { fontSize: 14, lineHeight: 21, color: colors["grey-400"] },
  field: { gap: 8 },
  input: {
    minHeight: 46,
    padding: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.white,
    backgroundColor: colors.white,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: "500",
    color: colors.black,
  },
  focused: { borderColor: colors.primary, backgroundColor: colors["grey-00"] },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "baseline",
  },
  error: { color: colors.red, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  count: {
    marginLeft: "auto",
    color: colors["grey-400"],
    fontSize: 12,
    lineHeight: 18,
  },
  profile: { alignItems: "center", gap: 16, paddingTop: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  avatarImage: { width: 80, height: 80 },
  upload: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  uploadText: { fontSize: 14, fontWeight: "500", color: colors.territory },
  footer: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 66,
  },
  button: {
    minHeight: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: withOpacity(colors.primary, 0.55),
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  disabledButton: { borderColor: withOpacity(colors["grey-400"], 0.24) },
  buttonText: { fontSize: 14, fontWeight: "500", color: colors["grey-950"] },
  disabledText: { color: colors["grey-200"] },
  pressed: { backgroundColor: colors["grey-100"] },
});
