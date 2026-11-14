import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { AppText } from "@/components/AppText";
import { useTestLogin } from "../hooks/useTestLogin";
import { styles } from "./TestLoginDialog.styles";
export function TestLoginDialog({ onClose }: { onClose: () => void }) {
  const form = useTestLogin();
  if (!__DEV__) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card} accessibilityViewIsModal>
            <AppText accessibilityRole="header" style={styles.title}>
              테스트 계정 로그인
            </AppText>
            <TextInput
              style={styles.input}
              accessibilityLabel="이메일"
              placeholder="이메일"
              value={form.email}
              onChangeText={form.setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!form.busy}
              autoFocus
            />
            <TextInput
              style={styles.input}
              accessibilityLabel="비밀번호"
              placeholder="비밀번호"
              value={form.password}
              onChangeText={form.setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!form.busy}
              returnKeyType="go"
              onSubmitEditing={() => {
                void form.submit();
              }}
            />
            {form.error ? (
              <AppText accessibilityRole="alert" style={styles.error}>
                {form.error}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                style={styles.button}
                accessibilityRole="button"
                disabled={form.busy}
                onPress={onClose}
              >
                <AppText>취소</AppText>
              </Pressable>
              <Pressable
                style={styles.button}
                accessibilityRole="button"
                accessibilityState={{ disabled: form.busy, busy: form.busy }}
                disabled={form.busy}
                onPress={() => {
                  void form.submit();
                }}
              >
                <AppText>{form.busy ? "로그인 중…" : "로그인"}</AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
