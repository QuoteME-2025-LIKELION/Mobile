import { Image } from "expo-image";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { colors } from "@/styles/theme";
import { useReportForm } from "../hooks/useReportForm";
import { styles } from "./ReportDialog.styles";
export function ReportDialog({
  authorName,
  isAiGenerated = false,
  onClose,
  onSubmit,
}: {
  authorName: string;
  isAiGenerated?: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const insets = useSafeAreaInsets();
  const form = useReportForm(isAiGenerated, onSubmit);
  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.overlay,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="신고 취소"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            accessibilityLabel={`${authorName}님의 명언 신고 사유`}
            onAccessibilityEscape={onClose}
            style={styles.panel}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              contentContainerStyle={styles.content}
            >
              <AppText accessibilityRole="header" style={styles.title}>
                신고사유
              </AppText>
              {form.reasons.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: form.reason === item.id }}
                  onPress={() => form.select(item.id)}
                  style={styles.reason}
                >
                  <AppText style={styles.reasonText}>{item.label}</AppText>
                  <Image
                    source={
                      form.reason === item.id
                        ? require("@/assets/images/write/tag-checkbox-checked.svg")
                        : require("@/assets/images/write/tag-checkbox-unchecked.svg")
                    }
                    style={styles.checkbox}
                    accessible={false}
                  />
                </Pressable>
              ))}
              {form.reason === "other" && (
                <TextInput
                  accessibilityLabel="기타 신고 사유"
                  placeholder="신고 사유를 작성해 주세요"
                  placeholderTextColor={colors["grey-400"]}
                  multiline
                  maxLength={500}
                  value={form.details}
                  onChangeText={form.setDetails}
                  style={styles.details}
                />
              )}
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={styles.action}
                >
                  <AppText style={styles.actionLabel}>취소</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!form.canSubmit}
                  accessibilityState={{ disabled: !form.canSubmit }}
                  onPress={form.submit}
                  style={styles.action}
                >
                  <AppText
                    style={[
                      styles.actionLabel,
                      styles.danger,
                      !form.canSubmit && styles.disabled,
                    ]}
                  >
                    신고하기
                  </AppText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
