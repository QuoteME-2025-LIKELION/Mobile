import { router, usePreventRemove } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  Keyboard,
  Platform,
  type ScrollView,
  type TextInputSelectionChangeEvent,
  type TextLayoutEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAiRecommendations } from "./useAiRecommendations";
import {
  countCodePoints,
  getQuoteInputError,
  limitQuoteInput,
} from "../utils/quoteInput";
import { INPUT_HEIGHT, LINE_HEIGHT } from "../constants/writeLayout";

export function useWrite() {
  const ai = useAiRecommendations();
  const [text, setText] = useState("");
  const [step, setStep] = useState<"write" | "recommend" | "tag">("write");
  const [source, setSource] = useState<"direct" | "ai">("direct");
  const recommendationStatus = ai.status;
  const recommendations = ai.recommendations;
  const [recommendationIndex, setRecommendationIndex] = useState<number | null>(
    null
  );
  const resultText =
    step === "tag" && source === "ai" && recommendationIndex !== null
      ? recommendations[recommendationIndex]
      : text.trim();
  const displayedText = step === "tag" ? resultText : text;
  const [selected, setSelected] = useState<number[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [message, setMessage] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const [allowExit, setAllowExit] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(INPUT_HEIGHT);
  const [hasSelection, setHasSelection] = useState(false);
  const exitAction = useRef<(() => void) | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const inputScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const inputAtEnd = useRef(true);
  const acceptedText = useRef("");
  const insets = useSafeAreaInsets();
  const hasDraft = text.trim().length > 0;
  const disablePrevention = usePreventRemove(
    !allowExit && (hasDraft || step !== "write"),
    ({ repeat }) => {
      Keyboard.dismiss();
      if (step !== "write") {
        setStep(step === "tag" && source === "ai" ? "recommend" : "write");
        return;
      }
      exitAction.current = repeat;
      setExitOpen(true);
    }
  );
  const today = new Date();
  const length = countCodePoints(text);
  const displayedLength = countCodePoints(displayedText);
  const trimmedLength = countCodePoints(text.trim());
  const canGoNext = trimmedLength > 0 && trimmedLength <= 30;
  const useEmptyCaret =
    Platform.OS === "android" && step === "write" && text.length === 0;
  const nativeMaxLength = length === 50 && !hasSelection ? text.length : 100;
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);
  const goHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/home");
  };
  const close = () => {
    Keyboard.dismiss();
    if (!hasDraft) {
      goHome();
      return;
    }
    exitAction.current = () => {
      disablePrevention();
      goHome();
    };
    setExitOpen(true);
  };
  const recommend = async () => {
    const error = getQuoteInputError(text, "ai");
    if (error) {
      setMessage(error);
      return;
    }
    Keyboard.dismiss();
    setShowInfo(false);
    setMessage("");
    setRecommendationIndex(null);
    const cached = ai.status === "success" && ai.content === text.trim();
    if (!cached && ai.usageStatus !== "success") {
      if (ai.usageStatus === "error") void ai.loadUsage();
      setMessage("AI 사용량을 확인한 뒤 다시 시도해 주세요.");
      return;
    }
    if (!cached && (ai.status === "exhausted" || ai.usage?.remaining === 0)) {
      setMessage("오늘 AI 추천 횟수를 모두 사용했어요.");
      return;
    }
    if (ai.status === "loading" && ai.content !== text.trim()) {
      setMessage("진행 중인 AI 추천을 받은 뒤 다시 시도해 주세요.");
      return;
    }
    setStep("recommend");
    const message = await ai.generate(text);
    if (message) setMessage(message);
  };
  const backFromTag = () => {
    Keyboard.dismiss();
    setStep(source === "ai" ? "recommend" : "write");
  };
  const next = () => {
    const error = getQuoteInputError(text, "quote");
    if (error) {
      setMessage(error);
      return;
    }
    Keyboard.dismiss();
    setShowInfo(false);
    setMessage("");
    setSource("direct");
    setStep("tag");
  };
  const handleInputContentSizeChange = () => {
    if (inputAtEnd.current)
      inputScrollRef.current?.scrollTo({
        y: Math.max(0, inputHeight - INPUT_HEIGHT),
        animated: false,
      });
  };
  const handleTextLayout = (event: TextLayoutEvent) => {
    if (step === "write" && text !== acceptedText.current) return;
    const lineCount = event.nativeEvent.lines.length;
    if (lineCount > 0) setInputHeight(Math.max(2, lineCount) * LINE_HEIGHT);
  };
  const handleChangeText = (value: string) => {
    const limited = limitQuoteInput(value);
    acceptedText.current = limited;
    setText(limited);
    setMessage("");
  };
  const handleSelectionChange = (event: TextInputSelectionChangeEvent) => {
    const { start, end } = event.nativeEvent.selection;
    inputAtEnd.current = end >= text.length;
    setHasSelection(start !== end);
  };
  const cancelExit = () => {
    setExitOpen(false);
    exitAction.current = null;
  };
  const confirmExit = () => {
    const action = exitAction.current;
    exitAction.current = null;
    setExitOpen(false);
    setAllowExit(true);
    action?.();
  };
  const refreshRecommendations = async () => {
    if (ai.usageStatus !== "success") {
      await ai.loadUsage();
      return;
    }
    if (ai.usage?.remaining === 0 || ai.status === "loading") return;
    setRecommendationIndex(null);
    const message = await ai.generate(text, true);
    if (message) setMessage(message);
  };
  const acceptRecommendation = () => {
    if (
      recommendationStatus !== "success" ||
      recommendationIndex === null ||
      !recommendations[recommendationIndex] ||
      ai.content !== text.trim()
    )
      return;
    setSource("ai");
    setStep("tag");
  };
  const toggleFriendTag = (id: number) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  return {
    text,
    step,
    setStep,
    recommendationStatus,
    aiUsage: ai.usage,
    aiUsageStatus: ai.usageStatus,
    recommendationIndex,
    setRecommendationIndex,
    recommendations,
    displayedText,
    selected,
    showInfo,
    setShowInfo,
    message,
    clearMessage: () => setMessage(""),
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
  };
}
