import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import appConfig from '../../../app.json';
import { AppText } from '@/components/AppText';
import { colors, fonts, withOpacity } from '@/constants/theme';

import { previewMyQuote } from './homePreviewData';

type Props = { visible: boolean; onClose: () => void };
const MENU_ITEMS = ['친구 및 그룹', '계정 관리', '알림 설정', '공지사항'];
// 웹 시안의 임시 주소. 실제 문의 주소 확정/복사 연결은 후속 작업.
const CONTACT_EMAIL = 'abc123456@gmail.com';

export function HomeDrawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  useEffect(() => {
    if (visible) {
      closing.current = false;
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    }
    return () => progress.stopAnimation();
  }, [progress, visible]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true })
      .start(({ finished }) => {
        closing.current = false;
        if (finished) onClose();
      });
  };

  return <Modal visible={visible} transparent animationType="none" onRequestClose={close}
    statusBarTranslucent navigationBarTranslucent>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="내 메뉴 닫기" onPress={close} style={StyleSheet.absoluteFill} />
      <Animated.View accessibilityViewIsModal accessibilityLabel="내 메뉴" onAccessibilityEscape={close}
        style={[styles.panel, { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [270, 0] }) }] }]}>
        <ScrollView bounces={false} style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: 80 + insets.top, paddingBottom: 52 + insets.bottom }]}>
          <View style={styles.profile}>
            <View style={styles.avatarBox}>
              <Image source={require('@/assets/images/profile/default-profile.png')} style={styles.avatar} accessible={false} />
              <Pressable disabled accessibilityRole="button" accessibilityLabel="프로필 관리" accessibilityState={{ disabled: true }} style={styles.settings}>
                <Image source={require('@/assets/images/home/settings.svg')} style={styles.settingsIcon} accessible={false} />
              </Pressable>
            </View>
            <AppText style={styles.nickname}>{previewMyQuote.nickname}</AppText>
            <AppText style={styles.introduction}>매일 한 문장씩 남겨요</AppText>
          </View>
          <View style={styles.menu}>
            {MENU_ITEMS.map((label, index) => <Pressable key={label} disabled accessibilityRole="button" accessibilityState={{ disabled: true }}
              style={[styles.menuItem, index === MENU_ITEMS.length - 1 && styles.lastItem]}>
              <AppText style={styles.menuText}>{label}</AppText>
            </Pressable>)}
          </View>
          <View style={styles.footer}>
            <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }}>
              <AppText style={styles.footerText}>이용약관 및 개인정보 처리</AppText>
            </Pressable>
            <View style={styles.contactRow}>
              <AppText style={[styles.footerText, styles.contactLabel]}>문의</AppText>
              <Pressable disabled accessibilityRole="button" accessibilityLabel={`문의 이메일 ${CONTACT_EMAIL} 복사`} accessibilityState={{ disabled: true }}>
                <AppText style={[styles.footerText, styles.contactEmail]}>{CONTACT_EMAIL}</AppText>
              </Pressable>
            </View>
            {/* 서버 최신 버전이 아닌 현재 앱 설정의 버전. */}
            <AppText style={styles.footerText}>버전 {appConfig.expo.version}</AppText>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: withOpacity(colors.black, 0.45), alignItems: 'flex-end' },
  panel: { width: 270, maxWidth: '100%', height: '100%', backgroundColor: colors.secondary, boxShadow: `-4px 0 12px ${withOpacity(colors.black, 0.15)}` },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 15 },
  profile: { alignItems: 'center', width: '100%' },
  avatarBox: { position: 'relative', width: 80, height: 80 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  settings: { position: 'absolute', top: 0, right: -24, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { width: 20, height: 20 },
  nickname: { width: '100%', paddingHorizontal: 4, marginTop: 12, fontFamily: fonts.quote, color: colors['grey-950'], fontSize: 16, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  introduction: { width: '100%', paddingHorizontal: 4, marginTop: 10, color: colors['grey-400'], fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: -0.24, textAlign: 'center' },
  menu: { marginTop: 55, width: '100%' },
  menuItem: { width: '100%', paddingVertical: 20, alignItems: 'center', borderBottomWidth: 0.5, borderColor: colors['grey-200'] },
  lastItem: { borderBottomWidth: 0 },
  menuText: { alignSelf: 'stretch', paddingHorizontal: 4, color: colors['grey-950'], fontFamily: fonts.quote, fontSize: 18, lineHeight: 22, fontWeight: '700', letterSpacing: -0.28, textAlign: 'center' },
  footer: { width: '100%', marginTop: 'auto', paddingTop: 32, alignItems: 'center', gap: 12 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  contactLabel: { paddingRight: 0 },
  contactEmail: { paddingLeft: 0 },
  footerText: { paddingHorizontal: 4, color: colors['grey-400'], fontSize: 12, lineHeight: 18, fontWeight: '500', letterSpacing: -0.24, textAlign: 'center' },
});
