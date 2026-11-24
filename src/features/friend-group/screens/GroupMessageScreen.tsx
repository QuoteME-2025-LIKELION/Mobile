import { usePreventRemove } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionButton } from "@/components/ActionButton";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { QuoteText } from "@/components/QuoteText";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToastMessage } from "@/components/ToastMessage";
import { colors } from "@/styles/theme";
import {
  closeGroupSubpage,
  useGroupDetail,
  useGroupScreenFocus,
} from "../hooks/useGroupDetail";
import { friendGroupApi } from "../services/friendGroupApi";
import { messagePlaceholder, styles } from "./GroupMessageScreen.styles";

export function GroupMessageScreen({ id }: { id: number }) {
  const { group, valid, isMember } = useGroupDetail(id);
  const focused = useGroupScreenFocus();
  const saving = useRef(false);
  const exitAction = useRef<() => void>(() => closeGroupSubpage(id));
  const [draft, setDraft] = useState<string>();
  const [inputFocused, setInputFocused] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const editing = draft !== undefined;
  const motto = draft ?? group.data?.motto ?? "";
  const placeholder = "어떤 이야기를 나눌까요?";
  const unavailable =
    !valid || group.status === "error"
      ? "그룹을 불러오지 못했어요."
      : group.data && !isMember
        ? "그룹 멤버만 메시지를 수정할 수 있어요."
        : "";

  const disablePrevention = usePreventRemove(
    editing || busy || saved,
    ({ repeat }) => {
      if (saving.current || saved) return;
      Keyboard.dismiss();
      exitAction.current = repeat;
      setConfirmExit(true);
    }
  );
  const close = () => {
    if (saving.current || saved) return;
    if (!editing) {
      closeGroupSubpage(id);
      return;
    }
    Keyboard.dismiss();
    exitAction.current = () => closeGroupSubpage(id);
    setConfirmExit(true);
  };
  const save = async () => {
    if (saving.current || saved || !isMember) return;
    const value = motto.trim();
    if (Array.from(value).length > 20) {
      setMessage("메시지는 20자 이내로 입력해 주세요.");
      return;
    }
    saving.current = true;
    setBusy(true);
    Keyboard.dismiss();
    try {
      await friendGroupApi.updateGroupMotto(id, value);
      if (!focused.current) return;
      setSaved(true);
      setMessage("그룹 메시지가 저장되었습니다.");
    } catch {
      if (focused.current) setMessage("그룹 메시지 변경에 실패했어요.");
    } finally {
      saving.current = false;
      if (focused.current) setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader title="그룹 메시지 수정" close onBack={close} />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {isMember && (
          <>
            <View style={styles.content}>
              <View
                style={[styles.messageField, inputFocused && styles.focused]}
              >
                <QuoteText
                  content={motto || placeholder}
                  variant="groupMessage"
                  markColor={inputFocused ? colors["grey-950"] : colors.white}
                  input={
                    <TextInput
                      accessibilityLabel="그룹 메시지"
                      placeholder={placeholder}
                      placeholderTextColor={
                        inputFocused ? colors["grey-400"] : messagePlaceholder
                      }
                      value={motto}
                      editable={!busy && !saved}
                      onChangeText={(value) =>
                        setDraft(Array.from(value).slice(0, 20).join(""))
                      }
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      style={[
                        styles.fieldText,
                        inputFocused && styles.focusedText,
                      ]}
                    />
                  }
                />
              </View>
              {inputFocused && (
                <AppText style={styles.counter}>
                  {Array.from(motto).length}자/20자
                </AppText>
              )}
            </View>
            <View style={styles.footer}>
              <ActionButton
                title="저장하기"
                variant="ruled"
                backgroundColor={colors.secondary}
                onPress={busy || saved ? undefined : () => void save()}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={confirmExit}
        onClose={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          disablePrevention();
          exitAction.current();
        }}
      />
      <ToastMessage
        message={message}
        errorMessage={unavailable}
        onClose={() => {
          setMessage("");
          if (saved && focused.current) {
            disablePrevention();
            closeGroupSubpage(id);
          }
        }}
      />
    </SafeAreaView>
  );
}
