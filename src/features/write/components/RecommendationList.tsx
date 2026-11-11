import { Image } from "expo-image";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/styles/theme";
import type { RecommendationStatus } from "../fixtures/recommendationFixtures";
import { WriteAction } from "./WriteAction";
import { styles } from "./RecommendationList.styles";
type Props = {
  status: RecommendationStatus;
  recommendations: readonly string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onRefresh: () => void;
  onBack: () => void;
  onNext: () => void;
};

const messages: Partial<Record<RecommendationStatus, string>> = {
  loading: "AI 추천을 불러오는 중입니다.",
  empty:
    "추천 결과가 없어요. 사용 횟수는 차감되지 않았으니 다시 시도해 주세요.",
  error: "AI 추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  exhausted: "오늘 AI 추천 횟수를 모두 사용했어요.",
};

export function RecommendationList({
  status,
  recommendations,
  selectedIndex,
  onSelect,
  onRefresh,
  onBack,
  onNext,
}: Props) {
  const busy = status === "loading";
  const refreshDisabled = busy || status === "exhausted";
  const canContinue =
    status === "success" &&
    selectedIndex !== null &&
    recommendations[selectedIndex] !== undefined;
  return (
    <View style={styles.container}>
      <AppText accessibilityRole="header" style={styles.title}>
        AI 명언 추천
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          status === "exhausted"
            ? "오늘 AI 추천 횟수 소진"
            : "AI 추천 다시 받기"
        }
        accessibilityState={{ disabled: refreshDisabled, busy }}
        disabled={refreshDisabled}
        onPress={onRefresh}
        style={[styles.refresh, refreshDisabled && styles.disabled]}
      >
        <Image
          source={require("@/assets/images/write/refresh.svg")}
          style={styles.refreshIcon}
          accessible={false}
        />
        <AppText style={styles.usage}>-/-</AppText>
      </Pressable>
      {messages[status] && (
        <View accessibilityLiveRegion="polite" style={styles.status}>
          {busy && <ActivityIndicator color={colors.primary} />}
          <AppText style={styles.statusText}>{messages[status]}</AppText>
        </View>
      )}
      {status === "success" &&
        recommendations.map((text, index) => {
          const selected = selectedIndex === index;
          return (
            <Pressable
              key={text}
              accessibilityRole="button"
              accessibilityLabel={text}
              accessibilityState={{ selected }}
              onPress={() => onSelect(index)}
              style={({ pressed }) => [
                styles.card,
                selected && styles.selectedCard,
                pressed && !selected && styles.pressedCard,
              ]}
            >
              <Image
                source={require("@/assets/images/write/quote-open.svg")}
                accessible={false}
                tintColor={selected ? colors.white : colors.black}
                style={styles.quoteIcon}
              />
              <AppText style={[styles.quote, selected && styles.selectedText]}>
                {text}
              </AppText>
              <Image
                source={require("@/assets/images/write/quote-close.svg")}
                accessible={false}
                tintColor={selected ? colors.white : colors.black}
                style={styles.quoteIcon}
              />
            </Pressable>
          );
        })}
      <View style={styles.actions}>
        <WriteAction title="뒤로가기" onPress={onBack} />
        <WriteAction
          title="다음으로"
          disabled={!canContinue}
          onPress={() => {
            if (canContinue) onNext();
          }}
        />
      </View>
    </View>
  );
}
