import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { QuoteText } from "@/components/QuoteText";
import type { ArchiveQuote } from "../fixtures/archiveFixtures";
import { styles } from "./ArchiveQuoteCard.styles";

export function ArchiveQuoteCard({
  quote,
  showOriginalContent = false,
}: {
  quote: ArchiveQuote;
  showOriginalContent?: boolean;
}) {
  return (
    <View style={styles.card}>
      <AppText style={styles.author}>
        {quote.nickname} ({quote.birthYear}~)
      </AppText>
      <QuoteText key={quote.content} content={quote.content} />
      {showOriginalContent && quote.isAiGenerated && quote.originalContent ? (
        <AppText style={styles.original}>{quote.originalContent}</AppText>
      ) : null}
      <View style={styles.actions}>
        <View style={styles.tags}>
          <Image
            source={require("@/assets/images/feed/own-user.svg")}
            style={styles.icon}
            accessible={false}
          />
          <View style={styles.names}>
            {quote.tags.map((name) => (
              <AppText key={name} style={styles.tag}>
                {name}
              </AppText>
            ))}
            {quote.tags.length > 0 && <AppText style={styles.tag}>+</AppText>}
          </View>
        </View>
        <View style={styles.buttons}>
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel={quote.isBookmarked ? "북마크 취소" : "북마크"}
            accessibilityState={{
              disabled: true,
              selected: Boolean(quote.isBookmarked),
            }}
            hitSlop={8}
          >
            <Image
              source={
                quote.isBookmarked
                  ? require("@/assets/images/archive/bookmark-filled.svg")
                  : require("@/assets/images/feed/own-bookmark-outline.svg")
              }
              style={styles.icon}
              accessible={false}
            />
          </Pressable>
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel="공유하기"
            accessibilityState={{ disabled: true }}
            hitSlop={8}
          >
            <Image
              source={require("@/assets/images/feed/own-share.svg")}
              style={styles.icon}
              accessible={false}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
