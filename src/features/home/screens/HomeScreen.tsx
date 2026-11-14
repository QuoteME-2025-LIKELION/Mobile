import { Image, type ImageSource } from "expo-image";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { FeedCard } from "../components/FeedCard";
import { HomeDrawer } from "../components/HomeDrawer";
import { GroupFilter } from "../components/GroupFilter";
import { TodayQuote } from "../components/TodayQuote";
import { FeedActionsMenu } from "@/features/moderation/components/FeedActionsMenu";
import { ReportDialog } from "@/features/moderation/components/ReportDialog";
import { useFeedModeration } from "@/features/moderation/hooks/useFeedModeration";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ToastMessage } from "@/components/ToastMessage";
import { styles } from "./HomeScreen.styles";
import { useHomeFeed } from "../hooks/useHomeFeed";

// 표시 데이터는 현재 로그인 세션의 서버 응답만 사용한다.
export function HomeScreen() {
  const moderation = useFeedModeration();
  const {
    hasUnreadNotifications,
    openNotifications,
    status,
    date,
    profile,
    myQuote,
    retry,
    drawerOpen,
    tagMenuOpen,
    setTagMenuOpen,
    filterOpen,
    selectedGroupId,
    groups,
    items,
    closeMenus,
    openArchive,
    openDrawer,
    closeDrawer,
    closeFilter,
    closeTags,
    toggleFilter,
    selectGroup,
  } = useHomeFeed();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header} onTouchStart={closeMenus}>
        <HeaderButton
          label="아카이브"
          source={require("@/assets/images/home/archive.svg")}
          onPress={openArchive}
        />
        <View style={styles.headerActions}>
          <HeaderButton
            label={
              hasUnreadNotifications ? "알림, 읽지 않은 알림 있음" : "알림"
            }
            source={
              hasUnreadNotifications
                ? require("@/assets/images/home/notification-unread.svg")
                : require("@/assets/images/home/notification.svg")
            }
            onPress={openNotifications}
          />
          <HeaderButton
            label="메뉴"
            source={require("@/assets/images/home/menu.svg")}
            onPress={openDrawer}
          />
        </View>
      </View>
      <ScrollView
        onScrollBeginDrag={closeMenus}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={{ zIndex: tagMenuOpen ? 4 : 0 }}
          onTouchStart={closeFilter}
        >
          {status === "success" ? (
            <TodayQuote
              quote={myQuote}
              date={date}
              tagMenuOpen={tagMenuOpen}
              onTagMenuChange={setTagMenuOpen}
            />
          ) : (
            <View style={styles.statusBox}>
              {status === "error" ? (
                <>
                  <AppText accessibilityRole="alert" style={styles.statusText}>
                    홈을 불러오지 못했어요.
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.addFriend}
                    onPress={retry}
                  >
                    <AppText style={styles.statusText}>다시 시도</AppText>
                  </Pressable>
                </>
              ) : (
                <ActivityIndicator accessibilityLabel="홈 불러오는 중" />
              )}
            </View>
          )}
        </View>
        <View style={styles.feed} onTouchStart={closeTags}>
          {filterOpen && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="그룹 필터 닫기"
              style={styles.dismissFilter}
              onPress={closeFilter}
            />
          )}
          <GroupFilter
            groups={groups}
            selectedId={selectedGroupId}
            open={filterOpen}
            onToggle={toggleFilter}
            onSelect={selectGroup}
          />
          {status !== "success" ? null : items.length === 0 ? (
            <View style={styles.empty}>
              <AppText style={styles.emptyText}>
                {selectedGroupId === null
                  ? "친구를 추가하면 매일 피드에서\n명언을 확인할 수 있어요"
                  : "아직 함께 볼 그룹 멤버가 없어요."}
              </AppText>
              {selectedGroupId === null ? (
                <Pressable
                  accessibilityRole="button"
                  disabled
                  accessibilityState={{ disabled: true }}
                  style={styles.addFriend}
                >
                  <AppText style={styles.addFriendText}>친구 추가</AppText>
                </Pressable>
              ) : (
                <AppText style={styles.emptySubText}>
                  다른 멤버가 참여하면 서로의 명언을 이곳에서 볼 수 있어요.
                </AppText>
              )}
            </View>
          ) : (
            items.map((item) => (
              <FeedCard
                key={`${item.content === null ? "member" : "quote"}-${item.id}`}
                item={item}
                onMore={(target, anchor) => {
                  closeMenus();
                  moderation.openMenu(
                    {
                      ...target,
                      quoteId: target.content === null ? undefined : target.id,
                    },
                    anchor
                  );
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
      <HomeDrawer
        visible={drawerOpen}
        onClose={closeDrawer}
        profile={profile}
      />
      {moderation.menu && (
        <FeedActionsMenu
          anchor={moderation.menu.anchor}
          canReport={moderation.menu.target.content !== null}
          onReport={() => moderation.choose("report")}
          onBlock={() => moderation.choose("block")}
          onClose={moderation.closeMenu}
        />
      )}
      {moderation.dialog?.kind === "report" && (
        <ReportDialog
          authorName={moderation.dialog.target.nickname}
          isAiGenerated={moderation.dialog.target.isAiGenerated === true}
          onClose={moderation.closeDialog}
          onSubmit={moderation.confirm}
        />
      )}
      <ConfirmDialog
        visible={moderation.dialog?.kind === "block"}
        title={`${moderation.dialog?.target.nickname ?? ""}님을 차단하시겠어요?`}
        description="차단하면 친구 관계가 해제되며, 차단 목록은 계정 관리에서 확인할 수 있습니다"
        dismissLabel="돌아가기"
        confirmLabel="차단"
        onClose={moderation.closeDialog}
        onConfirm={moderation.confirm}
      />
      <ToastMessage
        message={moderation.toast}
        onClose={moderation.closeToast}
      />
    </SafeAreaView>
  );
}

function HeaderButton({
  label,
  source,
  onPress,
}: {
  label: string;
  source: ImageSource;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress}
      accessibilityState={{ disabled: !onPress }}
      style={styles.headerButton}
    >
      <Image
        source={source}
        style={styles.headerIcon}
        contentFit="contain"
        accessible={false}
      />
    </Pressable>
  );
}
