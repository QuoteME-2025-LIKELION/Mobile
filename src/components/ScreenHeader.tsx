import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { styles } from "./ScreenHeader.styles";
export function ScreenHeader({
  onBack,
  title,
  light = false,
  onTitleLongPress,
  rightElement,
  close = false,
}: {
  onBack: () => void;
  title: string;
  light?: boolean;
  onTitleLongPress?: () => void;
  rightElement?: ReactNode;
  close?: boolean;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={close ? "닫기" : "뒤로"}
        onPress={onBack}
        hitSlop={10}
        style={styles.backButton}
      >
        {close ? (
          <Image
            source={require("@/assets/images/notifications/close.svg")}
            style={styles.closeIcon}
            accessible={false}
          />
        ) : (
          <View style={[styles.chevron, light && styles.lightChevron]} />
        )}
      </Pressable>
      <AppText
        accessibilityRole="header"
        onLongPress={onTitleLongPress}
        style={[styles.title, light && styles.lightTitle]}
      >
        {title}
      </AppText>
      <View style={styles.spacer}>{rightElement}</View>
    </View>
  );
}
