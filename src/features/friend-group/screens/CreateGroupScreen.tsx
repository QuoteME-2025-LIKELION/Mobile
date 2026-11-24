import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "@/api/createApiClient";
import { AppText } from "@/components/AppText";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors } from "@/styles/theme";
import { RowAction } from "../components/FriendGroupRows";
import { friendGroupApi } from "../services/friendGroupApi";
import { styles } from "./FriendGroupScreen.styles";

export function CreateGroupScreen() {
  const [name, setName] = useState("");
  const [motto, setMotto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const trimmedName = name.trim();
  const valid =
    Boolean(trimmedName) &&
    Array.from(trimmedName).length <= 10 &&
    Array.from(motto.trim()).length <= 20;
  const back = () =>
    router.canGoBack() ? router.back() : router.replace("/friend-group");
  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      await friendGroupApi.createGroup(trimmedName, motto.trim());
      back();
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 409
          ? "이미 사용 중인 그룹 이름입니다."
          : "그룹을 만들지 못했습니다."
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader title="그룹 만들기" onBack={back} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppText>그룹 이름 ({Array.from(trimmedName).length}/10)</AppText>
        <TextInput
          accessibilityLabel="그룹 이름"
          value={name}
          onChangeText={setName}
          placeholder="그룹 이름을 입력해 주세요"
          placeholderTextColor={colors["grey-400"]}
          style={[styles.search, styles.name]}
        />
        <AppText>그룹 좌우명 ({Array.from(motto.trim()).length}/20)</AppText>
        <TextInput
          accessibilityLabel="그룹 좌우명"
          value={motto}
          onChangeText={setMotto}
          placeholder="그룹 좌우명을 입력해 주세요"
          placeholderTextColor={colors["grey-400"]}
          style={[styles.search, styles.name]}
        />
        {error && (
          <AppText accessibilityLiveRegion="polite" style={styles.message}>
            {error}
          </AppText>
        )}
        <RowAction
          label="만들기"
          disabled={!valid || busy}
          onPress={() => void submit()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
