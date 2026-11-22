import { Image } from "expo-image";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AccountHeader } from "../components/AccountHeader";
import { AccountPicker } from "../components/AccountPicker";
import { GENDER_OPTIONS } from "../constants/accountOptions";
import { useAccountSettings } from "../hooks/useAccountSettings";
import { styles } from "./AccountSettingsScreen.styles";

export function AccountSettingsScreen() {
  const account = useAccountSettings();
  return (
    <SafeAreaView style={styles.screen}>
      <AccountHeader onBack={account.goBack} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AppText accessibilityRole="header" style={styles.sectionTitle}>
            계정 정보
          </AppText>
          {account.loading ? (
            <AppText>계정 정보를 불러오는 중이에요.</AppText>
          ) : null}
          {account.loadError ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void account.retry()}
            >
              <AppText>계정 정보를 불러오지 못했어요. 다시 시도</AppText>
            </Pressable>
          ) : null}
          <Pressable
            disabled={account.loading || account.loadError || account.saving}
            accessibilityRole="button"
            accessibilityLabel="성별 변경"
            accessibilityState={{ expanded: account.sheet === "gender" }}
            onPress={() => account.openSheet("gender")}
            style={styles.infoRow}
          >
            <AppText style={styles.label}>성별</AppText>
            <AppText style={styles.value}>
              {GENDER_OPTIONS.find((option) => option.value === account.gender)
                ?.label ?? "—"}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={account.loading || account.loadError || account.saving}
            accessibilityLabel="출생연도 변경"
            accessibilityState={{ expanded: account.sheet === "birth" }}
            onPress={() => account.openSheet("birth")}
            style={styles.infoRow}
          >
            <AppText style={styles.label}>출생연도</AppText>
            <AppText style={styles.value}>
              {account.birthYear ? `${account.birthYear}년` : "—"}
            </AppText>
          </Pressable>
          <Pressable
            onPress={account.openBlocked}
            accessibilityRole="button"
            accessibilityLabel={`차단 목록 ${account.blockedCount}명`}
            style={styles.infoRow}
          >
            <AppText style={styles.label}>차단 목록</AppText>
            <View style={styles.blockedValue}>
              <AppText style={styles.value}>{account.blockedCount}명</AppText>
              <View style={styles.chevron} />
            </View>
          </Pressable>
          <View style={styles.linkedSection}>
            <AppText accessibilityRole="header" style={styles.sectionTitle}>
              계정 연동
            </AppText>
            {[
              {
                provider: "GOOGLE",
                label: "구글",
                icon: require("@/assets/images/account/google.png"),
              },
              {
                provider: "KAKAO",
                label: "카카오",
                icon: require("@/assets/images/account/kakao.png"),
              },
            ].map((item) => (
              <View key={item.provider} style={styles.providerRow}>
                <View style={styles.providerIconFrame}>
                  <Image
                    source={item.icon}
                    style={styles.providerIcon}
                    contentFit="contain"
                    accessible={false}
                  />
                </View>
                <AppText style={styles.providerName}>{item.label}</AppText>
                {account.linkedProviders?.includes(item.provider) ? (
                  <AppText style={styles.value}>연동됨</AppText>
                ) : account.linkedProviders ? (
                  <Pressable
                    disabled
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label} 계정 연동하기`}
                    accessibilityState={{ disabled: true }}
                    style={styles.linkButton}
                  >
                    <AppText style={styles.value}>연동하기</AppText>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>
        <View style={styles.bottomActions}>
          <Pressable
            accessibilityRole="button"
            onPress={account.openLogout}
            style={styles.action}
          >
            <AppText style={styles.actionLabel}>
              {account.logoutPending ? "로그아웃 중…" : "로그아웃"}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={account.openDelete}
            style={styles.action}
          >
            <AppText style={[styles.actionLabel, styles.danger]}>
              계정삭제
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
      {account.logoutError ? (
        <AppText accessibilityRole="alert" style={styles.logoutError}>
          {account.logoutError}
        </AppText>
      ) : null}
      <AccountPicker
        sheet={account.sheet}
        gender={account.draftGender}
        birthYear={account.draftBirthYear}
        years={account.years}
        onGender={account.setDraftGender}
        onBirthYear={account.setDraftBirthYear}
        onClose={account.closeSheet}
        onDone={() => void account.finishSheet()}
        error={account.saveError}
        saving={account.saving}
      />
      <ConfirmDialog
        visible={account.logoutOpen}
        title="로그아웃할까요?"
        description=""
        dismissLabel="돌아가기"
        confirmLabel="로그아웃"
        confirmDisabled={!account.canLogout}
        onClose={account.closeLogout}
        onConfirm={() => {
          void account.confirmLogout();
        }}
      />
    </SafeAreaView>
  );
}
