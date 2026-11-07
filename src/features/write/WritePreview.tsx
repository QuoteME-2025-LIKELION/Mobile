import { Image } from 'expo-image';
import { router, usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { colors, fonts, withOpacity } from '@/constants/theme';

import { EmptyInputCaret } from './EmptyInputCaret';
import { countCodePoints, getQuoteInputError, limitQuoteInput } from './quoteInput';
import { TagPreview } from './TagPreview';
import { WriteAction } from './WriteAction';

const LINE_HEIGHT = 40;
const INPUT_HEIGHT = LINE_HEIGHT * 2;

export function WritePreview() {
  const [text, setText] = useState('');
  const [step, setStep] = useState<'write' | 'tag'>('write');
  const [selected, setSelected] = useState<number[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [message, setMessage] = useState('');
  const [exitOpen, setExitOpen] = useState(false);
  const [allowExit, setAllowExit] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(INPUT_HEIGHT);
  const [hasSelection, setHasSelection] = useState(false);
  const exitAction = useRef<(() => void) | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const inputScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const inputAtEnd = useRef(true);
  const acceptedText = useRef('');
  const insets = useSafeAreaInsets();
  const hasDraft = text.trim().length > 0;
  const disablePrevention = usePreventRemove(!allowExit && (hasDraft || step === 'tag'), ({ repeat }) => {
    Keyboard.dismiss();
    if (step === 'tag') {
      setStep('write');
      return;
    }
    exitAction.current = repeat;
    setExitOpen(true);
  });
  const today = new Date();
  const length = countCodePoints(text);
  const trimmedLength = countCodePoints(text.trim());
  const canGoNext = trimmedLength > 0 && trimmedLength <= 30;
  const useEmptyCaret = Platform.OS === 'android' && step === 'write' && text.length === 0;
  // 한도에 도달한 일반 타이핑은 네이티브에서 막는다. 선택 교체·붙여넣기는
  // 이모지 50개(UTF-16 100개)를 허용한 뒤 코드포인트 기준으로 검사한다.
  const nativeMaxLength = length === 50 && !hasSelection ? text.length : 100;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  const goHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };
  const close = () => {
    Keyboard.dismiss();
    if (!hasDraft) {
      goHome();
      return;
    }
    exitAction.current = () => { disablePrevention(); goHome(); };
    setExitOpen(true);
  };
  const next = () => {
    const error = getQuoteInputError(text, 'quote');
    if (error) {
      setMessage(error);
      return;
    }
    Keyboard.dismiss();
    setShowInfo(false);
    setMessage('');
    setStep('tag');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}
      onTouchStart={() => { if (showInfo) setShowInfo(false); }}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={close} style={styles.close}>
            <Image source={require('@/assets/images/write/close.svg')} style={styles.closeIcon} accessible={false} />
          </Pressable>
        </View>
        <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onScrollBeginDrag={() => setShowInfo(false)}>
          <View style={styles.inputCard}>
            <View style={styles.dateBox}>
              <AppText style={styles.month}>{today.getMonth() + 1}/{today.getDate()}</AppText>
              <AppText style={styles.weekday}>{today.toLocaleDateString('ko-KR', { weekday: 'long' })}</AppText>
            </View>
            <ScrollView ref={inputScrollRef} style={styles.inputBox} nestedScrollEnabled
              keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
              snapToInterval={LINE_HEIGHT} decelerationRate="fast" disableIntervalMomentum
              onContentSizeChange={() => {
                if (inputAtEnd.current) inputScrollRef.current?.scrollTo({ y: Math.max(0, inputHeight - INPUT_HEIGHT), animated: false });
              }}>
              <View style={{ height: inputHeight }}>
                <AppText pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                  textBreakStrategy="simple" lineBreakStrategyIOS="none"
                  style={[styles.input, styles.measurement]}
                  onTextLayout={(event) => {
                    if (text !== acceptedText.current) return;
                    const lineCount = event.nativeEvent.lines.length;
                    if (lineCount > 0) setInputHeight(Math.max(2, lineCount) * LINE_HEIGHT);
                  }}>{(step === 'tag' ? text.trim() : text) || ' '}</AppText>
                <View pointerEvents="none" style={styles.lines}>
                  {Array.from({ length: inputHeight / LINE_HEIGHT + 1 }, (_, index) => (
                    <View key={index} style={[styles.line, { top: Math.min(index * LINE_HEIGHT, inputHeight - 1) }]} />
                  ))}
                </View>
              <TextInput accessibilityLabel="명언 내용" accessibilityHint="최대 50자 입력, 직접 게시할 명언은 30자 이하"
                multiline scrollEnabled={false} editable={step === 'write'} value={step === 'tag' ? text.trim() : text}
                onChangeText={(value) => {
                  const limited = limitQuoteInput(value);
                  acceptedText.current = limited;
                  setText(limited);
                  setMessage('');
                }}
                onFocus={() => { setShowInfo(false); setInputFocused(true); }}
                onBlur={() => setInputFocused(false)}
                onSelectionChange={(event) => {
                  const { start, end } = event.nativeEvent.selection;
                  inputAtEnd.current = end >= text.length;
                  setHasSelection(start !== end);
                }}
                textBreakStrategy="simple" lineBreakStrategyIOS="none"
                maxLength={nativeMaxLength} underlineColorAndroid="transparent"
                cursorColor={colors.white} selectionHandleColor={colors.white}
                caretHidden={useEmptyCaret}
                selectionColor={Platform.OS === 'android' ? withOpacity(colors.white, 0.25) : colors.white}
                textAlignVertical="top"
                style={[styles.input, { height: inputHeight }]} />
              {step === 'write' && text.length === 0 && (
                <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                  style={styles.placeholder}>
                  <AppText style={styles.placeholderLine}>오늘 있었던 일을 바탕으로</AppText>
                  <AppText style={styles.placeholderLine}>나만의 명언을 남겨보세요.</AppText>
                </View>
              )}
              {useEmptyCaret && inputFocused && <EmptyInputCaret />}
              </View>
            </ScrollView>
            <AppText style={styles.count}>{length}자/50자</AppText>
          </View>
          <View style={[styles.body, { paddingBottom: 39 + insets.bottom }]}>
            {step === 'write' ? <>
              <View style={styles.guideArea}>
                <AppText style={styles.guide}>오늘의 명언을 직접 적고{'\n'}그대로 게시하거나{'\n'}AI에게 명언을 추천 받을 수 있어요.</AppText>
              </View>
              <View style={styles.infoWrap} onTouchStart={(event) => event.stopPropagation()}>
                <Pressable accessibilityRole="button" accessibilityLabel="명언 작성 안내" accessibilityState={{ expanded: showInfo }}
                  onPress={() => setShowInfo((value) => !value)} style={styles.infoTouch}>
                  <View style={styles.infoCircle}><AppText style={styles.infoLetter}>i</AppText></View>
                </Pressable>
                {showInfo && <View style={styles.infoBubble} onAccessibilityEscape={() => setShowInfo(false)}>
                  <AppText style={styles.infoText}>30자가 넘어가는 글은 AI 추천 받기를 사용해야 등록할 수 있습니다.</AppText>
                </View>}
              </View>
              <View style={styles.actions}>
                <WriteAction title="AI 추천 받기" />
                <WriteAction title="다음으로" onPress={next} disabled={!canGoNext} />
              </View>
            </> : <>
              <TagPreview selected={selected} onToggle={(id) => setSelected((current) => current.includes(id)
                ? current.filter((value) => value !== id) : [...current, id])} />
              <View style={styles.tagActions}>
                <WriteAction title="뒤로가기" onPress={() => { Keyboard.dismiss(); setStep('write'); }} />
                <WriteAction title="게시하기" />
              </View>
            </>}
          </View>
        </ScrollView>
        {message !== '' && <View accessibilityLiveRegion="polite" style={[styles.toast, { bottom: insets.bottom + 16 }]}>
          <AppText style={styles.toastText}>{message}</AppText>
        </View>}
      </KeyboardAvoidingView>
      <ConfirmDialog visible={exitOpen} onClose={() => { setExitOpen(false); exitAction.current = null; }}
        onConfirm={() => {
          const action = exitAction.current;
          exitAction.current = null;
          setExitOpen(false);
          setAllowExit(true);
          action?.();
        }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  fill: { flex: 1, backgroundColor: colors.secondary },
  header: { height: 60, flexShrink: 0, backgroundColor: colors.primary, paddingHorizontal: 15, alignItems: 'flex-end', justifyContent: 'center' },
  close: { minWidth: 44, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { width: 24, height: 24 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inputCard: { backgroundColor: colors.primary, paddingBottom: 16, minHeight: 180 },
  dateBox: { alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 },
  month: { fontFamily: fonts.date, color: colors.white, fontSize: 36, lineHeight: 40, textAlign: 'center' },
  weekday: { fontFamily: fonts.quote, color: withOpacity(colors.white, 0.6), fontSize: 12, lineHeight: 16, marginTop: 5 },
  inputBox: { height: INPUT_HEIGHT, flexGrow: 0, marginHorizontal: 33 },
  lines: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  line: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.white },
  input: { padding: 0, fontFamily: fonts.quote, fontSize: 14, lineHeight: LINE_HEIGHT, color: colors.white, textAlign: 'center', includeFontPadding: false },
  measurement: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 },
  placeholder: { position: 'absolute', top: 0, left: 0, right: 0 },
  placeholderLine: { fontFamily: fonts.quote, fontSize: 14, lineHeight: LINE_HEIGHT, height: LINE_HEIGHT, textAlign: 'center', includeFontPadding: false, color: withOpacity(colors.white, 0.6) },
  count: { marginTop: 12, textAlign: 'center', fontSize: 11, lineHeight: 14, color: withOpacity(colors.white, 0.7) },
  body: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, minHeight: 260 },
  guideArea: { flex: 1, minHeight: 140, justifyContent: 'center', alignItems: 'center' },
  guide: { color: colors.territory, textAlign: 'center', fontSize: 13, lineHeight: 21.5 },
  infoWrap: { alignSelf: 'flex-end', marginBottom: 24, position: 'relative' },
  infoTouch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  infoCircle: { width: 14, height: 14, borderWidth: 1, borderColor: colors.territory, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  infoLetter: { fontSize: 10, lineHeight: 12, fontWeight: '700', color: colors.territory },
  infoBubble: { position: 'absolute', right: 8, bottom: 44, width: 216, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4, backgroundColor: colors.primary },
  infoText: { fontSize: 12, lineHeight: 18, color: colors.white },
  actions: { flexDirection: 'row', gap: 12 },
  tagActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  toast: { position: 'absolute', left: 24, right: 24, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 4, backgroundColor: colors.secondary, elevation: 5, boxShadow: `0 2px 10px ${withOpacity(colors.black, 0.12)}` },
  toastText: { fontSize: 14, lineHeight: 21 },
});
