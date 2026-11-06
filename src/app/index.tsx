import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, fonts } from '@/constants/theme';
import { LoginSheet } from '@/features/auth/LoginSheet';
import { SocialButtons } from '@/features/auth/SocialButtons';

export default function StartScreen() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <AppText accessibilityRole="header" style={styles.logo}
            onLongPress={__DEV__ ? () => router.push('/home') : undefined}>QuoteMe</AppText>
          <AppText style={styles.tagline}>소소한 생각도 쿼트미로 소중하게 모아보세요.</AppText>
        </View>
        <View style={styles.actions}>
          <SocialButtons mode="signup" />
          <View style={styles.loginRow}>
            <AppText style={styles.tagline}>기존 회원이신가요?</AppText>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: loginOpen }}
              onPress={() => setLoginOpen(true)} style={styles.textButton}>
              <AppText style={styles.login}>로그인</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <LoginSheet visible={loginOpen} onClose={() => setLoginOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 76 },
  brand: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24, gap: 0 },
  // 공통 본문 줄 높이를 해제하고 글꼴 고유 높이로 Q의 아래 꼬리까지 표시한다.
  logo: { fontFamily: fonts.quote, fontSize: 48, lineHeight: undefined, includeFontPadding: true, color: colors.white },
  tagline: { color: colors.white, textAlign: 'center', fontWeight: '500' },
  actions: { gap: 14 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22 },
  textButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  login: { color: colors.white, fontSize: 14, lineHeight: 21, fontWeight: '500' },
});
