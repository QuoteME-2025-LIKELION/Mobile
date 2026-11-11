import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { LoginSheet } from '@/features/auth/components/LoginSheet';
import { SocialButtons } from '@/features/auth/components/SocialButtons';
import { styles } from './StartScreen.styles';
import { useStart } from '../hooks/useStart';

export function StartScreen() {
  const { loginOpen, openHome, openProfileSetup, openLogin, closeLogin } =
    useStart();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <AppText
            accessibilityRole="header"
            style={styles.logo}
            onLongPress={__DEV__ ? openHome : undefined}
          >
            QuoteMe
          </AppText>
          <AppText
            style={styles.tagline}
            onLongPress={__DEV__ ? openProfileSetup : undefined}
          >
            소소한 생각도 쿼트미로 소중하게 모아보세요.
          </AppText>
        </View>
        <View style={styles.actions}>
          <SocialButtons mode="signup" />
          <View style={styles.loginRow}>
            <AppText style={styles.tagline}>기존 회원이신가요?</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: loginOpen }}
              onPress={openLogin}
              style={styles.textButton}
            >
              <AppText style={styles.login}>로그인</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <LoginSheet visible={loginOpen} onClose={closeLogin} />
    </SafeAreaView>
  );
}
