import { Image } from "expo-image";
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
import { colors } from "@/styles/theme";
import { AccountHeader } from "../components/AccountHeader";
import { DELETE_REASONS } from "../constants/accountOptions";
import { useAccountDelete } from "../hooks/useAccountDelete";
import { styles } from "./AccountDeleteScreen.styles";
export function AccountDeleteScreen() {
  const form = useAccountDelete();
  return (
    <SafeAreaView style={styles.screen}>
      <AccountHeader onBack={form.goBack} />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <AppText accessibilityRole="header" style={styles.title}>
              {"쿼트미 계정을\n삭제하시겠어요?"}
            </AppText>
            <AppText style={styles.description}>
              {
                "계정을 삭제하면 모든 계정 정보와\n작성한 글이 삭제되며 복구가 불가능 합니다."
              }
            </AppText>
            <AppText accessibilityRole="header" style={styles.reasonTitle}>
              서비스 탈퇴 사유
            </AppText>
            {DELETE_REASONS.map((reason) => (
              <Pressable
                key={reason}
                disabled={form.pending}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: form.selectedReasons.includes(reason),
                }}
                onPress={() => form.toggleReason(reason)}
                style={styles.reasonRow}
              >
                <AppText style={styles.reasonText}>{reason}</AppText>
                <Image
                  source={
                    form.selectedReasons.includes(reason)
                      ? require("@/assets/images/write/tag-checkbox-checked.svg")
                      : require("@/assets/images/write/tag-checkbox-unchecked.svg")
                  }
                  style={styles.checkbox}
                  accessible={false}
                />
              </Pressable>
            ))}
            {form.otherSelected && (
              <TextInput
                accessibilityLabel="기타 탈퇴 사유"
                value={form.otherReason}
                onChangeText={form.setOtherReason}
                placeholder="탈퇴 사유를 작성해 주세요"
                placeholderTextColor={colors["grey-400"]}
                editable={!form.pending}
                multiline
                style={styles.otherInput}
              />
            )}
          </View>
          {form.error ? (
            <AppText accessibilityRole="alert">{form.error}</AppText>
          ) : null}
          <Pressable
            disabled={!form.validReasons || form.pending}
            onPress={form.openConfirm}
            accessibilityRole="button"
            accessibilityLabel="계정 삭제"
            accessibilityState={{
              disabled: !form.validReasons || form.pending,
              busy: form.pending,
            }}
            style={styles.deleteButton}
          >
            <AppText
              style={[styles.deleteLabel, !form.validReasons && styles.invalid]}
            >
              {form.pending ? "계정 삭제 중…" : "계정 삭제"}
            </AppText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={form.confirmOpen}
        title="계정을 삭제할까요?"
        description="삭제한 계정은 복구할 수 없어요."
        dismissLabel="돌아가기"
        confirmLabel="계정 삭제"
        onClose={form.closeConfirm}
        onConfirm={() => void form.confirmDelete()}
      />
    </SafeAreaView>
  );
}
