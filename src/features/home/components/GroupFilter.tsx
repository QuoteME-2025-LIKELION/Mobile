import { Image } from "expo-image";
import { Pressable, ScrollView, View } from "react-native";
import { AppText } from "@/components/AppText";
import type { FeedGroup } from "../fixtures/homeFixtures";
import { styles } from "./GroupFilter.styles";
type Props = {
  groups: FeedGroup[];
  selectedId: number | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: number | null) => void;
};

export function GroupFilter({
  groups,
  selectedId,
  open,
  onToggle,
  onSelect,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="피드 그룹 필터"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        hitSlop={8}
        style={styles.trigger}
      >
        <Image
          source={require("@/assets/images/home/funnel.svg")}
          style={styles.icon}
          accessible={false}
        />
        <AppText numberOfLines={1} style={styles.label}>
          {groups.find((group) => group.id === selectedId)?.name ?? "전체보기"}
        </AppText>
      </Pressable>
      {open && (
        <View style={styles.menu}>
          <ScrollView nestedScrollEnabled style={styles.options}>
            {[{ id: null, name: "전체보기" }, ...groups].map((group, index) => (
              <Pressable
                key={group.id ?? "all"}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedId === group.id }}
                onPress={() => onSelect(group.id)}
                style={[
                  styles.option,
                  index === groups.length && groups.length > 0 && styles.last,
                ]}
              >
                <AppText
                  style={[
                    styles.optionText,
                    selectedId === group.id && styles.active,
                  ]}
                >
                  {group.name}
                </AppText>
              </Pressable>
            ))}
            {groups.length === 0 && (
              <Pressable
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                style={[styles.option, styles.last]}
              >
                <AppText style={styles.create}>그룹 만들기</AppText>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
