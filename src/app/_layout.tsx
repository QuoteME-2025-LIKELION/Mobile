import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { session } from "@/features/auth/services/session";
import { useSession } from "@/features/auth/stores/useSession";
import { SessionRecovery } from "@/features/auth/components/SessionRecovery";
import { AccountDeleteCompleteScreen } from "@/features/account/screens/AccountDeleteCompleteScreen";
import { colors, fontSources } from "@/styles/theme";

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.primary,
    primary: colors.primary,
  },
};

export default function RootLayout() {
  const auth = useSession();
  useEffect(() => {
    void session.initialize();
  }, []);
  const [fontsLoaded, fontError] = useFonts(fontSources);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // 로딩 실패 시에도 네이티브 스플래시에 멈추지 않게 한다.
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      {auth.status === "loading" || auth.status === "error" ? (
        <SessionRecovery />
      ) : auth.accountDeleted ? (
        <AccountDeleteCompleteScreen onDone={session.dismissAccountDeletion} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.primary },
          }}
        >
          <Stack.Protected guard={auth.status !== "authenticated" || !__DEV__}>
            <Stack.Screen name="index" />
          </Stack.Protected>
          <Stack.Protected
            guard={
              auth.status === "authenticated" &&
              __DEV__ &&
              auth.member?.profileCompleted === false
            }
          >
            <Stack.Screen name="profile" />
          </Stack.Protected>
          <Stack.Protected
            guard={
              auth.status === "authenticated" &&
              __DEV__ &&
              auth.member?.profileCompleted === true
            }
          >
            <Stack.Screen name="home" />
            <Stack.Screen name="archive" />
            <Stack.Screen name="write" />
            <Stack.Screen name="profile-center" />
            <Stack.Screen name="notice/index" />
            <Stack.Screen name="notification-setting" />
            <Stack.Screen name="notification" />
            <Stack.Screen name="blocked-members" />
            <Stack.Screen name="account-setting" />
            <Stack.Screen name="account-delete" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}
