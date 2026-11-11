import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import appConfig from "../../../../app.json";
import { AppText } from "@/components/AppText";
import { userFixture } from "@/fixtures/userFixture";
import { styles } from "./HomeDrawer.styles";
type Props = { visible: boolean; onClose: () => void };

const MENU_ROUTES = {
  "계정 관리": "/account-setting",
  "알림 설정": "/notification-setting",
  공지사항: "/notice",
} as const;
const MENU_ITEMS = ["친구 및 그룹", "계정 관리", "알림 설정", "공지사항"];

// 웹 시안의 임시 주소. 실제 문의 주소 확정/복사 연결은 후속 작업.
const CONTACT_EMAIL = "abc123456@gmail.com";

export function HomeDrawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  useEffect(() => {
    if (visible) {
      closing.current = false;
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
    return () => progress.stopAnimation();
  }, [progress, visible]);

  const dismiss = (action: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      closing.current = false;
      if (finished) action();
    });
  };

  const close = () => dismiss(onClose);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="내 메뉴 닫기"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel="내 메뉴"
          onAccessibilityEscape={close}
          style={[
            styles.panel,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [270, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            bounces={false}
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: 80 + insets.top,
                paddingBottom: 52 + insets.bottom,
              },
            ]}
          >
            <View style={styles.profile}>
              <View style={styles.avatarBox}>
                <Image
                  source={require("@/assets/images/profile/default-profile.png")}
                  style={styles.avatar}
                  accessible={false}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="프로필 관리"
                  onPress={() =>
                    dismiss(() => {
                      onClose();
                      router.push("/profile-center");
                    })
                  }
                  style={styles.settings}
                >
                  <Image
                    source={require("@/assets/images/home/settings.svg")}
                    style={styles.settingsIcon}
                    accessible={false}
                  />
                </Pressable>
              </View>
              <AppText style={styles.nickname}>{userFixture.nickname}</AppText>
              <AppText style={styles.introduction}>
                {userFixture.introduction}
              </AppText>
            </View>
            <View style={styles.menu}>
              {MENU_ITEMS.map((label, index) => (
                <Pressable
                  key={label}
                  disabled={!(label in MENU_ROUTES)}
                  onPress={
                    label in MENU_ROUTES
                      ? () =>
                          dismiss(() => {
                            onClose();
                            router.push(
                              MENU_ROUTES[label as keyof typeof MENU_ROUTES]
                            );
                          })
                      : undefined
                  }
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !(label in MENU_ROUTES) }}
                  style={[
                    styles.menuItem,
                    index === MENU_ITEMS.length - 1 && styles.lastItem,
                  ]}
                >
                  <AppText style={styles.menuText}>{label}</AppText>
                </Pressable>
              ))}
            </View>
            <View style={styles.footer}>
              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
              >
                <AppText style={styles.footerText}>
                  이용약관 및 개인정보 처리
                </AppText>
              </Pressable>
              <View style={styles.contactRow}>
                <AppText style={[styles.footerText, styles.contactLabel]}>
                  문의
                </AppText>
                <Pressable
                  disabled
                  accessibilityRole="button"
                  accessibilityLabel={`문의 이메일 ${CONTACT_EMAIL} 복사`}
                  accessibilityState={{ disabled: true }}
                >
                  <AppText style={[styles.footerText, styles.contactEmail]}>
                    {CONTACT_EMAIL}
                  </AppText>
                </Pressable>
              </View>
              {/* 서버 최신 버전이 아닌 현재 앱 설정의 버전. */}
              <AppText style={styles.footerText}>
                버전 {appConfig.expo.version}
              </AppText>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
