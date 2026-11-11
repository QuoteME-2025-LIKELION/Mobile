import { Image, type ImageSource } from "expo-image";
import { useRef, type ComponentRef } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { QuoteText } from "@/components/QuoteText";
import type { FeedItem } from "../fixtures/homeFixtures";
import { styles } from "./FeedCard.styles";
import type { MenuAnchor } from "@/features/moderation/hooks/useFeedModeration";
// 공유·서버 쓰기는 미연동. 더보기는 개발용 신고/차단 흐름만 연다.
export function FeedCard({
  item,
  onMore,
}: {
  item: FeedItem;
  onMore?: (item: FeedItem, anchor: MenuAnchor) => void;
}) {
  const moreRef = useRef<ComponentRef<typeof View>>(null);
  const silenced = item.content === null;
  const content = item.content ?? "때로는 침묵이 가장 큰 지혜다";
  return (
    <View style={styles.card}>
      <View style={styles.profile}>
        <Image
          source={require("@/assets/images/profile/default-profile.png")}
          style={styles.avatar}
          accessible={false}
        />
        <View style={styles.profileInfo}>
          <AppText style={styles.nickname}>{item.nickname}</AppText>
          {item.introduction ? (
            <AppText numberOfLines={1} style={styles.bio}>
              {item.introduction}
            </AppText>
          ) : null}
        </View>
        {item.timeAgo ? (
          <AppText style={styles.time}>{item.timeAgo}</AppText>
        ) : null}
        <Pressable
          ref={moreRef}
          disabled={!onMore}
          onPress={
            onMore
              ? () =>
                  moreRef.current?.measureInWindow((x, y, width, height) =>
                    onMore(item, { x, y, width, height })
                  )
              : undefined
          }
          accessibilityRole="button"
          accessibilityLabel={`${item.nickname} 더보기`}
          accessibilityState={{ disabled: !onMore }}
          hitSlop={8}
        >
          <AppText style={styles.more}>⋮</AppText>
        </Pressable>
      </View>
      <QuoteText
        key={content}
        content={content}
        variant="feed"
        muted={silenced}
      />
      <View style={styles.bottom}>
        <View style={styles.tags}>
          <Image
            source={
              silenced
                ? require("@/assets/images/feed/nudge-outline.svg")
                : item.tags.length
                  ? require("@/assets/images/feed/user-active.svg")
                  : require("@/assets/images/feed/user-disabled.svg")
            }
            style={styles.icon}
            accessible={false}
          />
          {item.tags.length ? (
            <>
              <View style={styles.names}>
                {item.tags.map((name) => (
                  <AppText key={name} style={styles.name}>
                    {name}
                  </AppText>
                ))}
              </View>
              <DisabledText label="태그 요청하기">+</DisabledText>
            </>
          ) : (
            <DisabledText>
              {silenced ? "콕 찌르기" : "태그 요청하기"}
            </DisabledText>
          )}
        </View>
        {!silenced && (
          <View style={styles.actions}>
            <FeedIcon
              label="북마크"
              source={require("@/assets/images/feed/bookmark-outline.svg")}
            />
            <FeedIcon
              label="공유하기"
              source={require("@/assets/images/feed/share.svg")}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function DisabledText({
  children,
  label,
}: {
  children: string;
  label?: string;
}) {
  return (
    <Pressable
      disabled
      accessibilityRole="button"
      accessibilityLabel={label ?? children}
      accessibilityState={{ disabled: true }}
      hitSlop={6}
    >
      <AppText style={styles.request}>{children}</AppText>
    </Pressable>
  );
}

export function FeedIcon({
  label,
  source,
}: {
  label: string;
  source: ImageSource;
}) {
  return (
    <Pressable
      disabled
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: true }}
      hitSlop={8}
    >
      <Image source={source} style={styles.icon} accessible={false} />
    </Pressable>
  );
}
