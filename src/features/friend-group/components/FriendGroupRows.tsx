import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { styles } from "../screens/FriendGroupScreen.styles";

export function RowAction({
  label,
  accessibilityLabel,
  onPress,
  disabled,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, disabled && styles.disabled]}
    >
      <AppText style={styles.actionLabel}>{label}</AppText>
    </Pressable>
  );
}

export function ListRow({
  name,
  subtitle,
  image,
  children,
}: {
  name: string;
  subtitle?: string | null;
  image?: string | null;
  children?: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Image
        source={
          image
            ? { uri: image }
            : require("@/assets/images/profile/default-profile.png")
        }
        style={styles.avatar}
      />
      <View style={styles.description}>
        <AppText numberOfLines={1} style={styles.rowName}>
          {name}
        </AppText>
        {subtitle ? (
          <AppText numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function RequestTabs({
  receivedLabel,
  sentLabel,
  received,
  sent,
}: {
  receivedLabel: string;
  sentLabel: string;
  received: ReactNode[];
  sent: ReactNode[];
}) {
  const [showSent, setShowSent] = useState(false);
  const activeSent = sent.length > 0 && (showSent || !received.length);
  if (!received.length && !sent.length) return null;

  return (
    <View style={styles.section}>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {received.length > 0 && (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: !activeSent }}
            onPress={() => setShowSent(false)}
          >
            <AppText style={[styles.title, activeSent && styles.inactive]}>
              {receivedLabel}
            </AppText>
          </Pressable>
        )}
        {sent.length > 0 && (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSent }}
            onPress={() => setShowSent(true)}
          >
            <AppText style={[styles.title, !activeSent && styles.inactive]}>
              {sentLabel}
            </AppText>
          </Pressable>
        )}
      </View>
      <View>{activeSent ? sent : received}</View>
    </View>
  );
}
