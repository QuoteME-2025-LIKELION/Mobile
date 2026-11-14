import type { WriteFriend } from "../types/writeTypes";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import type { ComponentRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { AppText } from "@/components/AppText";
import { colors } from "@/styles/theme";
import { styles } from "./FriendTagSelector.styles";

type Props = {
  selected: number[];
  onToggle: (id: number) => void;
  friends: WriteFriend[];
  status: "idle" | "loading" | "success" | "error";
  onRetry: () => void;
  disabled?: boolean;
};

function Avatar({ uri, size }: { uri?: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      style={[
        styles.avatar,
        { height: size, width: size, borderRadius: size / 2 },
      ]}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          accessible={false}
          onError={() => setFailed(true)}
        />
      ) : (
        <AppText
          style={[styles.avatarText, { fontSize: size === 32 ? 16 : 28 }]}
        >
          Q
        </AppText>
      )}
    </View>
  );
}

export function FriendTagSelector({
  selected,
  onToggle,
  friends,
  status,
  onRetry,
  disabled = false,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null);
  const members = friends.filter((friend) =>
    friend.nickname.includes(keyword.trim())
  );
  return (
    <View style={styles.container}>
      <AppText accessibilityRole="header" style={styles.title}>
        친구 태그
      </AppText>
      <AppText style={styles.description}>
        나중에 태그를 추가하거나 수정할 수 있어요.
      </AppText>
      {status !== "success" ? (
        <View>
          {status === "error" ? (
            <>
              <AppText accessibilityRole="alert" style={styles.empty}>
                친구 목록을 불러오지 못했어요.
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                disabled={disabled}
              >
                <AppText style={styles.empty}>다시 시도</AppText>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator
              accessibilityLabel="친구 목록 불러오는 중"
              color={colors.primary}
            />
          )}
        </View>
      ) : (
        <>
          <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
            <Image
              source={require("@/assets/images/write/search.svg")}
              style={styles.searchIcon}
              tintColor={colors.territory}
              accessible={false}
            />
            <TextInput
              ref={searchRef}
              accessibilityLabel="태그할 친구 검색"
              placeholder="태그할 친구를 검색하세요"
              placeholderTextColor={colors.territory}
              editable={!disabled}
              value={keyword}
              onChangeText={setKeyword}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              underlineColorAndroid="transparent"
              style={styles.searchInput}
            />
            {keyword !== "" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="검색어 지우기"
                onPress={() => {
                  setKeyword("");
                  searchRef.current?.focus();
                }}
                style={styles.clearButton}
              >
                <Image
                  source={require("@/assets/images/write/search-clear.svg")}
                  style={styles.searchIcon}
                  tintColor={colors.territory}
                  accessible={false}
                />
              </Pressable>
            )}
          </View>
          <ScrollView
            horizontal
            style={styles.selectedScroll}
            contentContainerStyle={styles.selectedList}
            keyboardShouldPersistTaps="handled"
          >
            {friends
              .filter((friend) => selected.includes(friend.id))
              .map((friend) => (
                <Pressable
                  key={friend.id}
                  accessibilityRole="button"
                  disabled={disabled}
                  accessibilityLabel={`${friend.nickname} 태그 제거`}
                  onPress={() => onToggle(friend.id)}
                  style={styles.selected}
                >
                  <Avatar uri={friend.profileImage} size={32} />
                  <View style={styles.removeMark}>
                    <AppText style={styles.removeText}>×</AppText>
                  </View>
                  <AppText style={styles.selectedName}>
                    {friend.nickname}
                  </AppText>
                </Pressable>
              ))}
          </ScrollView>
          {members.map((friend, index) => (
            <Pressable
              key={friend.id}
              accessibilityRole="checkbox"
              disabled={disabled}
              accessibilityState={{
                checked: selected.includes(friend.id),
                disabled,
              }}
              accessibilityLabel={`${friend.nickname} 태그`}
              onPress={() => onToggle(friend.id)}
              style={[
                styles.row,
                index < members.length - 1 && styles.rowBorder,
              ]}
            >
              <Avatar uri={friend.profileImage} size={45} />
              <View style={styles.user}>
                <AppText style={styles.nickname}>{friend.nickname}</AppText>
                <AppText numberOfLines={1} style={styles.introduction}>
                  {friend.introduction}
                </AppText>
              </View>
              <Image
                source={
                  selected.includes(friend.id)
                    ? require("@/assets/images/write/tag-checkbox-checked.svg")
                    : require("@/assets/images/write/tag-checkbox-unchecked.svg")
                }
                style={styles.checkbox}
                accessible={false}
              />
            </Pressable>
          ))}
          {members.length === 0 && (
            <AppText style={styles.empty}>
              {keyword.trim()
                ? "검색 결과가 없습니다."
                : "태그할 수 있는 친구가 없어요."}
            </AppText>
          )}
        </>
      )}
    </View>
  );
}
