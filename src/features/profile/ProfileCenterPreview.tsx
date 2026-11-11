import { Image } from 'expo-image';
import { router, usePreventRemove } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { colors, fonts, withOpacity } from '@/constants/theme';

import { previewMyQuote } from '../home/homePreviewData';
import { pickProfileImage } from './pickProfileImage';
import { limitProfileText, validateProfileImage, type ProfileImage } from './profileInput';

const initialProfile = { nickname: previewMyQuote.nickname, introduction: '매일 한 문장씩 남겨요' };

export function ProfileCenterPreview({ selectImage = pickProfileImage }: { selectImage?: () => Promise<ProfileImage | null> } = {}) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(initialProfile.nickname);
  const [introduction, setIntroduction] = useState(initialProfile.introduction);
  const [image, setImage] = useState<ProfileImage | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageError, setImageError] = useState('');
  const [picking, setPicking] = useState(false);
  const [focused, setFocused] = useState<'nickname' | 'introduction' | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [allowExit, setAllowExit] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const exitAction = useRef<(() => void) | null>(null);
  const nicknameEmpty = nickname.trim().length === 0;
  const changed = nickname.trim() !== initialProfile.nickname || introduction !== initialProfile.introduction || image !== null;
  const dirty = editing && changed;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const disablePrevention = usePreventRemove(!allowExit && (dirty || picking), ({ repeat }) => {
    if (busy.current) return;
    Keyboard.dismiss();
    exitAction.current = repeat;
    setExitOpen(true);
  });
  const goBack = () => { if (router.canGoBack()) router.back(); else router.replace('/home'); };
  const close = () => {
    if (busy.current) return;
    Keyboard.dismiss();
    if (!dirty) { goBack(); return; }
    exitAction.current = goBack;
    setExitOpen(true);
  };
  const chooseImage = async () => {
    if (!editing || busy.current) return;
    busy.current = true;
    setPicking(true);
    Keyboard.dismiss();
    setFocused(null);
    setImageError('');
    try {
      const selected = await selectImage();
      if (!mounted.current || !selected) return;
      const error = validateProfileImage(selected);
      if (error) { setImageError(error); return; }
      setImage(selected);
      setImageFailed(false);
    } catch {
      if (mounted.current) setImageError('이미지를 불러오지 못했어요. 다시 선택해 주세요.');
    } finally {
      busy.current = false;
      if (mounted.current) setPicking(false);
    }
  };

  return <SafeAreaView edges={['top']} style={styles.screen}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <AppText accessibilityRole="header" style={styles.title}>프로필 관리</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="프로필 관리 닫기" disabled={picking} accessibilityState={{ disabled: picking }} onPress={close} hitSlop={8}>
          <Image source={require('@/assets/images/write/close.svg')} tintColor={colors['grey-950']} style={styles.closeIcon} accessible={false} />
        </Pressable>
      </View>
      <ScrollView style={styles.fill} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
        <View style={styles.profile}>
          <Pressable accessibilityRole="button" accessibilityLabel={editing ? '프로필 이미지 변경' : '프로필 이미지'}
            disabled={!editing || picking} accessibilityState={{ disabled: !editing || picking, busy: picking }} onPress={chooseImage} style={styles.avatarBox}>
            <Image source={image && !imageFailed ? { uri: image.uri } : require('@/assets/images/profile/default-profile.png')}
              contentFit="cover" style={styles.avatar} accessible={false} onError={() => {
                if (image) { setImageFailed(true); setImageError('이미지를 표시하지 못했어요. 다시 선택해 주세요.'); }
              }} />
          </Pressable>
          <Pressable disabled={!editing || picking} accessibilityRole="button" accessibilityLabel="이미지 바꾸기"
            accessibilityState={{ disabled: !editing || picking }} accessibilityElementsHidden={!editing}
            importantForAccessibility={editing ? 'auto' : 'no-hide-descendants'} onPress={chooseImage} hitSlop={6}
            style={!editing && styles.hidden}>
            <AppText style={styles.changeImage}>이미지 바꾸기</AppText>
          </Pressable>
          {imageError ? <AppText accessibilityLiveRegion="polite" style={styles.imageError}>{imageError}</AppText> : null}
        </View>
        <View style={styles.fields}>
          <AppText style={styles.label}>닉네임</AppText>
          {editing ? <TextInput accessibilityLabel="닉네임" value={nickname} onChangeText={value => setNickname(limitProfileText(value, 10))}
            maxLength={20} editable={!picking} autoCapitalize="none" autoCorrect={false} placeholder="닉네임" placeholderTextColor={colors.territory}
            onFocus={() => setFocused('nickname')} onBlur={() => setFocused(null)}
            style={[styles.input, focused === 'nickname' && styles.focused, nicknameEmpty && styles.invalid]} />
            : <View style={styles.info}><AppText style={styles.value}>{nickname}</AppText></View>}
          <View style={[styles.meta, !editing && styles.hidden]} accessibilityElementsHidden={!editing} importantForAccessibility={editing ? 'auto' : 'no-hide-descendants'}>
            {editing && nicknameEmpty ? <AppText style={styles.error}>닉네임을 비워둘 수 없어요.</AppText> : null}
            <AppText style={styles.count}>{Array.from(nickname).length}자/10자</AppText>
          </View>
          <AppText style={styles.label}>자기소개</AppText>
          {editing ? <TextInput accessibilityLabel="자기소개" value={introduction} onChangeText={value => setIntroduction(limitProfileText(value, 20))}
            maxLength={40} editable={!picking} placeholder="자기소개" placeholderTextColor={colors.territory}
            onFocus={() => setFocused('introduction')} onBlur={() => setFocused(null)}
            style={[styles.input, focused === 'introduction' && styles.focused]} />
            : <View style={styles.info}><AppText style={styles.value}>{introduction}</AppText></View>}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: 40 + insets.bottom }]}>
        {/* 서버 미연동: 실제 저장/가짜 성공 처리를 하지 않는다. */}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: editing || picking }} disabled={editing || picking}
          onPress={editing ? undefined : () => setEditing(true)} style={[styles.button, (editing || picking) && styles.disabledButton]}>
          <AppText style={[styles.buttonText, (editing || picking) && styles.disabledText]}>{editing ? '저장하기' : '편집하기'}</AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    <ConfirmDialog visible={exitOpen} title={'저장하지 않고\n나가시겠어요?'} description="변경된 정보는 저장되지 않아요." dismissLabel="계속 편집하기"
      onClose={() => setExitOpen(false)} onConfirm={() => {
        setExitOpen(false);
        setAllowExit(true);
        disablePrevention();
        exitAction.current?.();
      }} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  fill: { flex: 1 },
  header: { minHeight: 44, paddingTop: 20, paddingHorizontal: 25, flexDirection: 'row', alignItems: 'center' },
  headerSpacer: { width: 24 },
  title: { flex: 1, paddingHorizontal: 4, fontFamily: fonts.quote, color: colors['grey-950'], fontSize: 20, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' },
  closeIcon: { width: 24, height: 24 },
  content: { flexGrow: 1, paddingBottom: 32 },
  profile: { marginTop: 48, alignItems: 'center', paddingHorizontal: 24, gap: 14 },
  avatarBox: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: colors['grey-100'] },
  avatar: { width: 80, height: 80 },
  changeImage: { paddingHorizontal: 4, fontSize: 14, lineHeight: 18.9, fontWeight: '500', letterSpacing: -0.28, color: colors['grey-300'] },
  hidden: { opacity: 0 },
  fields: { marginTop: 34, paddingHorizontal: 24, gap: 14 },
  label: { alignSelf: 'stretch', paddingHorizontal: 4, marginTop: 12, fontFamily: fonts.quote, color: colors['grey-950'], fontSize: 18, lineHeight: 24.3, fontWeight: '700', letterSpacing: -0.36 },
  info: { minHeight: 52, paddingVertical: 10, paddingHorizontal: 15, justifyContent: 'center', backgroundColor: colors.white },
  value: { alignSelf: 'stretch', fontSize: 14, lineHeight: 18.9, fontWeight: '500', letterSpacing: -0.28, color: colors.black },
  input: { minHeight: 52, borderRadius: 2, borderWidth: 0.5, borderColor: 'transparent', paddingVertical: 10, paddingHorizontal: 15, backgroundColor: colors.white, fontFamily: fonts.body, color: colors.black, fontSize: 14, lineHeight: 18.9, fontWeight: '500', letterSpacing: -0.28 },
  focused: { borderColor: colors.primary, backgroundColor: colors['grey-00'] },
  invalid: { borderColor: colors.red },
  meta: { minHeight: 18, marginTop: -10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { marginLeft: 'auto', color: colors['grey-400'], fontSize: 12, lineHeight: 16.2, fontWeight: '500', letterSpacing: -0.24 },
  error: { color: colors.red, fontSize: 12, lineHeight: 16.2, fontWeight: '500', letterSpacing: -0.24, flexShrink: 1 },
  imageError: { alignSelf: 'stretch', color: colors.red, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  footer: { paddingTop: 16, paddingHorizontal: 24 },
  button: { minHeight: 44, borderTopWidth: 1, borderBottomWidth: 1, borderColor: withOpacity(colors.primary, 0.55), justifyContent: 'center', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 10 },
  buttonText: { alignSelf: 'stretch', color: colors['grey-950'], fontSize: 14, lineHeight: 20, fontWeight: '500', textAlign: 'center' },
  disabledButton: { borderColor: withOpacity(colors['grey-400'], 0.24) },
  disabledText: { color: colors['grey-200'] },
});
