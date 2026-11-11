import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { FeedIcon } from "./FeedCard";
import { myQuoteFixture, splitHomeQuote } from "../fixtures/homeFixtures";
import { styles } from "./TodayQuote.styles";
type Props = {
  posted: boolean;
  removedNames?: string[];
  onNextScenario: () => void;
  tagMenuOpen: boolean;
  onTagMenuChange: (open: boolean) => void;
};

export function TodayQuote({
  posted,
  removedNames = [],
  onNextScenario,
  tagMenuOpen,
  onTagMenuChange,
}: Props) {
  const tags = myQuoteFixture.tags.filter(
    (name) => !removedNames.includes(name)
  );
  const today = new Date();
  const lines = posted
    ? splitHomeQuote(myQuoteFixture.content)
    : ["오늘 있었던 일을 바탕으로", "명언을 남겨보세요"];
  const closeTags = () => onTagMenuChange(false);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel="월 표시, 길게 눌러 개발 화면 전환"
        accessibilityRole="button"
        onPress={closeTags}
        onLongPress={() => {
          closeTags();
          onNextScenario();
        }}
      >
        <AppText style={styles.month}>
          {today.toLocaleDateString("en-US", { month: "short" }).toLowerCase()}
        </AppText>
      </Pressable>
      <AppText style={styles.weekday}>
        {today.toLocaleDateString("ko-KR", { weekday: "long" })}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={posted ? "오늘의 명언" : "오늘의 명언 작성"}
        disabled={posted}
        accessibilityState={{ disabled: posted }}
        onPress={() => router.push("/write")}
        style={styles.quoteRow}
      >
        <AppText
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={styles.day}
        >
          {today.getDate()}
        </AppText>
        <View style={styles.lines}>
          {lines.map((line, index) => (
            <View key={index} style={styles.line}>
              <AppText style={[styles.text, !posted && styles.placeholder]}>
                {line}
              </AppText>
            </View>
          ))}
        </View>
      </Pressable>
      <View style={styles.bottom}>
        {posted && (
          <>
            <View style={styles.tagAnchor}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`태그된 친구 ${tags.length}명`}
                accessibilityState={{ expanded: tagMenuOpen }}
                onPress={() => onTagMenuChange(!tagMenuOpen)}
                style={styles.tagButton}
                hitSlop={8}
              >
                <Image
                  source={require("@/assets/images/feed/own-user.svg")}
                  style={styles.userIcon}
                  accessible={false}
                />
                <AppText style={styles.tagCount}>{tags.length}</AppText>
              </Pressable>
              {tagMenuOpen && (
                <View style={styles.tagMenu}>
                  {tags.map((name) => (
                    <View key={name} style={styles.tagName}>
                      <AppText style={styles.tagNameText}>{name}</AppText>
                    </View>
                  ))}
                  <Pressable
                    disabled
                    accessibilityRole="button"
                    accessibilityState={{ disabled: true }}
                    style={styles.editTag}
                  >
                    <AppText style={styles.editText}>수정하기</AppText>
                  </Pressable>
                </View>
              )}
            </View>
            <View style={styles.author} onTouchStart={closeTags}>
              <View style={styles.divider} />
              <AppText numberOfLines={1} style={styles.authorText}>
                {myQuoteFixture.nickname}({myQuoteFixture.birthYear}~)
              </AppText>
            </View>
            <View style={styles.actions} onTouchStart={closeTags}>
              <FeedIcon
                label="내 명언 북마크"
                source={require("@/assets/images/feed/own-bookmark-outline.svg")}
              />
              <FeedIcon
                label="내 명언 공유하기"
                source={require("@/assets/images/feed/own-share.svg")}
              />
            </View>
          </>
        )}
      </View>
      {posted && tagMenuOpen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="태그 목록 닫기"
          style={styles.dismiss}
          onPress={closeTags}
        />
      )}
    </View>
  );
}
