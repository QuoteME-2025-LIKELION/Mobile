import { Image } from "expo-image";
import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppText } from "@/components/AppText";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ToastMessage } from "@/components/ToastMessage";
import { NOTIFICATION_FILTERS } from "../constants/notificationTypes";
import { NotificationRow } from "../components/NotificationRow";
import { useNotifications } from "../hooks/useNotifications";
import { styles } from "./NotificationsScreen.styles";
export function NotificationsScreen({
  hasWrittenToday = false,
}: { hasWrittenToday?: boolean } = {}) {
  const state = useNotifications({ hasWrittenToday });
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="알림 닫기"
          onPress={state.close}
          style={styles.close}
          hitSlop={10}
        >
          <Image
            source={require("@/assets/images/notifications/close.svg")}
            style={styles.closeIcon}
            accessible={false}
          />
        </Pressable>
        <AppText
          accessibilityRole="header"
          onLongPress={__DEV__ ? state.nextScenario : undefined}
          style={styles.title}
        >
          알림
        </AppText>
        <View style={styles.spacer} />
      </View>
      <View accessibilityRole="tablist" style={styles.filters}>
        {NOTIFICATION_FILTERS.map((tab) => (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: state.filter === tab.value }}
            onPress={() => state.selectFilter(tab.value)}
            style={[
              styles.filter,
              state.filter === tab.value && styles.activeFilter,
            ]}
          >
            <AppText
              numberOfLines={1}
              style={[
                styles.filterText,
                state.filter === tab.value && styles.activeFilterText,
              ]}
            >
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>
      {state.loading ? (
        <View style={styles.empty}>
          <AppText accessibilityRole="progressbar" style={styles.emptyTitle}>
            알림을 불러오는 중이에요
          </AppText>
        </View>
      ) : state.error ? (
        <View style={styles.empty}>
          <AppText accessibilityRole="alert" style={styles.emptyTitle}>
            알림을 불러오지 못했어요
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={state.retry}
            style={styles.retry}
          >
            <AppText style={styles.emptySub}>다시 시도</AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={state.filter ?? "all"}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            width <= 360 && styles.narrowList,
            state.notifications.length === 0 && styles.emptyList,
          ]}
          data={state.notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <NotificationRow
              item={item}
              last={index === state.notifications.length - 1}
              onPress={() => state.openItem(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText style={styles.emptyTitle}>도착한 알림이 없어요</AppText>
              <AppText style={styles.emptySub}>
                알림이 오면 바로 알려드릴게요
              </AppText>
            </View>
          }
        />
      )}
      <ConfirmDialog
        visible={state.invitation !== null}
        title={`${state.invitation?.groupName ?? ""} 그룹 초대를 수락할까요?`}
        description={`그룹장 ${state.invitation?.leaderName ?? ""}\n멤버 ${state.invitation?.memberCount ?? 0}명`}
        dismissLabel="취소"
        confirmLabel="수락"
        confirmDisabled
        onClose={state.closeInvitation}
        onConfirm={state.closeInvitation}
      />
      <ToastMessage message={state.toast} onClose={state.closeToast} />
    </SafeAreaView>
  );
}
