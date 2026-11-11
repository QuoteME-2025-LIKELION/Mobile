import { Image } from "expo-image";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { colors, withOpacity } from "@/styles/theme";
import { EmptyInputCaret } from "../components/EmptyInputCaret";
import { RecommendationList } from "../components/RecommendationList";
import { FriendTagSelector } from "../components/FriendTagSelector";
import { WriteAction } from "../components/WriteAction";
import { LINE_HEIGHT } from "../constants/writeLayout";
import { styles } from "./WriteScreen.styles";
import { useWrite } from "../hooks/useWrite";

export function WriteScreen(options: Parameters<typeof useWrite>[0] = {}) {
  const {
    text,
    step,
    setStep,
    recommendationStatus,
    recommendationIndex,
    setRecommendationIndex,
    recommendations,
    displayedText,
    selected,
    showInfo,
    setShowInfo,
    message,
    exitOpen,
    inputFocused,
    setInputFocused,
    inputHeight,
    scrollRef,
    inputScrollRef,
    insets,
    today,
    displayedLength,
    trimmedLength,
    canGoNext,
    useEmptyCaret,
    nativeMaxLength,
    close,
    recommend,
    backFromTag,
    next,
    handleInputContentSizeChange,
    handleTextLayout,
    handleChangeText,
    handleSelectionChange,
    cancelExit,
    confirmExit,
    refreshRecommendations,
    acceptRecommendation,
    toggleFriendTag,
  } = useWrite(options);
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={styles.screen}
      onTouchStart={() => {
        if (showInfo) setShowInfo(false);
      }}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={close}
            style={styles.close}
          >
            <Image
              source={require("@/assets/images/write/close.svg")}
              style={styles.closeIcon}
              accessible={false}
            />
          </Pressable>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          onScrollBeginDrag={() => setShowInfo(false)}
        >
          <View style={styles.inputCard}>
            <View style={styles.dateBox}>
              <AppText style={styles.month}>
                {today.getMonth() + 1}/{today.getDate()}
              </AppText>
              <AppText style={styles.weekday}>
                {today.toLocaleDateString("ko-KR", { weekday: "long" })}
              </AppText>
            </View>
            <ScrollView
              ref={inputScrollRef}
              style={styles.inputBox}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              snapToInterval={LINE_HEIGHT}
              decelerationRate="fast"
              disableIntervalMomentum
              onContentSizeChange={handleInputContentSizeChange}
            >
              <View style={{ height: inputHeight }}>
                <AppText
                  pointerEvents="none"
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  textBreakStrategy="simple"
                  lineBreakStrategyIOS="none"
                  style={[styles.input, styles.measurement]}
                  onTextLayout={handleTextLayout}
                >
                  {displayedText || " "}
                </AppText>
                <View pointerEvents="none" style={styles.lines}>
                  {Array.from(
                    { length: inputHeight / LINE_HEIGHT + 1 },
                    (_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.line,
                          {
                            top: Math.min(index * LINE_HEIGHT, inputHeight - 1),
                          },
                        ]}
                      />
                    )
                  )}
                </View>
                <TextInput
                  accessibilityLabel="명언 내용"
                  accessibilityHint="최대 50자 입력, 직접 게시할 명언은 30자 이하"
                  multiline
                  scrollEnabled={false}
                  editable={step === "write"}
                  value={displayedText}
                  onChangeText={handleChangeText}
                  onFocus={() => {
                    setShowInfo(false);
                    setInputFocused(true);
                  }}
                  onBlur={() => setInputFocused(false)}
                  onSelectionChange={handleSelectionChange}
                  textBreakStrategy="simple"
                  lineBreakStrategyIOS="none"
                  maxLength={nativeMaxLength}
                  underlineColorAndroid="transparent"
                  cursorColor={colors.white}
                  selectionHandleColor={colors.white}
                  caretHidden={useEmptyCaret}
                  selectionColor={
                    Platform.OS === "android"
                      ? withOpacity(colors.white, 0.25)
                      : colors.white
                  }
                  textAlignVertical="top"
                  style={[styles.input, { height: inputHeight }]}
                />
                {step === "write" && text.length === 0 && (
                  <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={styles.placeholder}
                  >
                    <AppText style={styles.placeholderLine}>
                      오늘 있었던 일을 바탕으로
                    </AppText>
                    <AppText style={styles.placeholderLine}>
                      나만의 명언을 남겨보세요.
                    </AppText>
                  </View>
                )}
                {useEmptyCaret && inputFocused && <EmptyInputCaret />}
              </View>
            </ScrollView>
            <AppText style={styles.count}>{displayedLength}자/50자</AppText>
          </View>
          <View style={[styles.body, { paddingBottom: 39 + insets.bottom }]}>
            {step === "write" ? (
              <>
                <View style={styles.guideArea}>
                  <AppText style={styles.guide}>
                    오늘의 명언을 직접 적고{"\n"}그대로 게시하거나{"\n"}AI에게
                    명언을 추천 받을 수 있어요.
                  </AppText>
                </View>
                <View
                  style={styles.infoWrap}
                  onTouchStart={(event) => event.stopPropagation()}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="명언 작성 안내"
                    accessibilityState={{ expanded: showInfo }}
                    onPress={() => setShowInfo((value) => !value)}
                    style={styles.infoTouch}
                  >
                    <View style={styles.infoCircle}>
                      <AppText style={styles.infoLetter}>i</AppText>
                    </View>
                  </Pressable>
                  {showInfo && (
                    <View
                      style={styles.infoBubble}
                      onAccessibilityEscape={() => setShowInfo(false)}
                    >
                      <AppText style={styles.infoText}>
                        30자가 넘어가는 글은 AI 추천 받기를 사용해야 등록할 수
                        있습니다.
                      </AppText>
                    </View>
                  )}
                </View>
                <View style={styles.actions}>
                  <WriteAction
                    title="AI 추천 받기"
                    onPress={recommend}
                    disabled={trimmedLength === 0}
                  />
                  <WriteAction
                    title="다음으로"
                    onPress={next}
                    disabled={!canGoNext}
                  />
                </View>
              </>
            ) : step === "recommend" ? (
              <RecommendationList
                status={recommendationStatus}
                recommendations={recommendations}
                selectedIndex={recommendationIndex}
                onSelect={setRecommendationIndex}
                onRefresh={refreshRecommendations}
                onBack={() => setStep("write")}
                onNext={acceptRecommendation}
              />
            ) : (
              <>
                <FriendTagSelector
                  selected={selected}
                  onToggle={toggleFriendTag}
                />
                <View style={styles.tagActions}>
                  <WriteAction title="뒤로가기" onPress={backFromTag} />
                  <WriteAction title="게시하기" />
                </View>
              </>
            )}
          </View>
        </ScrollView>
        {message !== "" && (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.toast, { bottom: insets.bottom + 16 }]}
          >
            <AppText style={styles.toastText}>{message}</AppText>
          </View>
        )}
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={exitOpen}
        onClose={cancelExit}
        onConfirm={confirmExit}
      />
    </SafeAreaView>
  );
}
