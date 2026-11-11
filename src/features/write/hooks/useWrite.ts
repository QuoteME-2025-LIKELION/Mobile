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
import {
  recommendationFixtures,
  type RecommendationScenario,
  type RecommendationStatus,
} from "../fixtures/recommendationFixtures";
import {
  countCodePoints,
  getQuoteInputError,
  limitQuoteInput,
} from "../utils/quoteInput";
import { INPUT_HEIGHT, LINE_HEIGHT } from "../constants/writeLayout";

export function useWrite({
  recommendationScenario = "success",
}: { recommendationScenario?: RecommendationScenario } = {}) {
  const [text, setText] = useState("");
  const [step, setStep] = useState<"write" | "recommend" | "tag">("write");
  const [source, setSource] = useState<"direct" | "ai">("direct");
  const [recommendationStatus, setRecommendationStatus] =
    useState<RecommendationStatus>("idle");
  const [recommendationIndex, setRecommendationIndex] = useState<number | null>(
    null
  );
  const [recommendationRound, setRecommendationRound] = useState(0);
  const recommendations =
    recommendationFixtures[recommendationRound % recommendationFixtures.length];
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
  useEffect(() => {
    if (step !== "recommend" || recommendationStatus !== "loading") return;
    const timer = setTimeout(
      () => setRecommendationStatus(recommendationScenario),
      600
    );
    return () => clearTimeout(timer);
  }, [step, recommendationStatus, recommendationScenario]);
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
  const recommend = () => {
    const error = getQuoteInputError(text, "ai");
    if (error) {
      setMessage(error);
      return;
    }
    Keyboard.dismiss();
    setShowInfo(false);
    setMessage("");
    setRecommendationIndex(null);
    setRecommendationStatus("loading");
    setStep("recommend");
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
  const refreshRecommendations = () => {
    setRecommendationIndex(null);
    setRecommendationRound((round) => round + 1);
    setRecommendationStatus("loading");
  };
  const acceptRecommendation = () => {
    if (recommendationStatus !== "success" || recommendationIndex === null)
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
