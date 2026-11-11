import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/styles/theme";
import {
  getQuoteMarkPositions,
  quoteMetrics,
  type QuoteVariant,
} from "../utils/quoteLayout";
import { styles } from "./QuoteText.styles";
type Props = { content: string; variant?: QuoteVariant; muted?: boolean };

/** 본문은 항상 가용 폭 전체를 사용하고 따옴표만 실제 글자 폭을 따른다. */
export function QuoteText({
  content,
  variant = "archive",
  muted = false,
}: Props) {
  const [rowWidth, setRowWidth] = useState(0);
  const [textWidth, setTextWidth] = useState<number | null>(null);
  const metrics = quoteMetrics[variant];
  const positions = getQuoteMarkPositions(rowWidth, textWidth ?? 0, variant);
  const color = muted
    ? colors.territory
    : variant === "archive"
      ? colors.white
      : colors.black;
  const markStyle = {
    position: "absolute" as const,
    top: "50%" as const,
    width: metrics.markWidth,
    height: metrics.markHeight,
    marginTop: -metrics.markHeight / 2 - 2,
    ...(variant === "feed" ? { transform: [{ scale: 10 / 14 }] } : {}),
    opacity: rowWidth > 0 && textWidth !== null ? 1 : 0,
  };

  return (
    <View
      onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
      style={[
        styles.row,
        {
          minHeight: metrics.minHeight,
          paddingHorizontal: metrics.markWidth + metrics.gap,
        },
      ]}
    >
      <AppText
        onTextLayout={(event) => {
          const width = Math.max(
            0,
            ...event.nativeEvent.lines.map((line) => line.width)
          );
          setTextWidth((previous) => (previous === width ? previous : width));
        }}
        style={[
          styles.content,
          variant === "archive" ? styles.archive : styles.feed,
          { color },
        ]}
      >
        {content}
      </AppText>
      <Image
        source={require("@/assets/images/write/quote-open.svg")}
        tintColor={color}
        contentFit="contain"
        accessible={false}
        style={[markStyle, { left: positions.left }]}
      />
      <Image
        source={require("@/assets/images/write/quote-close.svg")}
        tintColor={color}
        contentFit="contain"
        accessible={false}
        style={[markStyle, { left: positions.right }]}
      />
    </View>
  );
}
