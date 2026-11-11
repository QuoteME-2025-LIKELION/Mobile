import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import type { NotificationItem } from "../constants/notificationTypes";
import {
  getNotificationCategory,
  formatNotificationTime,
} from "../utils/notificationPresentation";
import { styles } from "./NotificationRow.styles";
export function NotificationRow({
  item,
  onPress,
  last = false,
}: {
  item: NotificationItem;
  onPress: () => void;
  last?: boolean;
}) {
  const groupIcon = item.category === "GROUP" || item.category === "TAG";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${getNotificationCategory(item)}, ${item.message}, ${formatNotificationTime(item.createdAt)}, ${item.isRead ? "읽은 알림" : "읽지 않은 알림"}`}
      onPress={onPress}
      style={[styles.row, last && styles.last]}
    >
      <View
        accessible={false}
        style={[styles.icon, groupIcon && !item.isRead && styles.unreadGroup]}
      >
        <AppText
          style={[
            styles.iconText,
            item.isRead && styles.readIcon,
            groupIcon && !item.isRead && styles.lightIcon,
          ]}
        >
          {groupIcon ? "G" : "Q"}
        </AppText>
      </View>
      <View style={styles.body}>
        <View style={styles.textBox}>
          <AppText style={styles.category}>
            {getNotificationCategory(item)}
          </AppText>
          <AppText style={styles.message}>{item.message}</AppText>
        </View>
        <AppText style={styles.time}>
          {formatNotificationTime(item.createdAt)}
        </AppText>
      </View>
    </Pressable>
  );
}
