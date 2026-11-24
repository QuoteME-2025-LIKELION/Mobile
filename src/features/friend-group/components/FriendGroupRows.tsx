import { Image } from "expo-image";
import { useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import type { MenuAnchor } from "@/features/moderation/hooks/useFeedModeration";
import { styles } from "../screens/FriendGroupScreen.styles";

export function RowAction({
  label,
  accessibilityLabel,
  onPress,
  disabled,
  tone,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "danger" | "primary";
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
      <AppText
        style={[
          styles.actionLabel,
          tone === "danger" && styles.actionDanger,
          tone === "primary" && styles.actionPrimary,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export function FriendMoreButton({
  name,
  disabled,
  onOpen,
}: {
  name: string;
  disabled: boolean;
  onOpen: (anchor: MenuAnchor) => void;
}) {
  const trigger = useRef<ComponentRef<typeof View>>(null);
  return (
    <Pressable
      ref={trigger}
      accessibilityRole="button"
      accessibilityLabel={`${name} 친구 더보기`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      style={styles.moreButton}
      onPress={() =>
        trigger.current?.measureInWindow((x, y, width, height) => {
          onOpen({ x, y, width, height });
        })
      }
    >
      <AppText style={styles.inactive}>⋮</AppText>
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
