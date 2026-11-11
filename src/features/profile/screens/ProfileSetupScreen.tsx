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
import { colors } from "@/styles/theme";
import { styles } from "./ProfileSetupScreen.styles";
import { useProfileSetup } from "../hooks/useProfileSetup";

export function ProfileSetupScreen(
  options: Parameters<typeof useProfileSetup>[0] = {}
) {
  const {
    step,
    image,
    setImage,
    imageError,
    setImageError,
    picking,
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
