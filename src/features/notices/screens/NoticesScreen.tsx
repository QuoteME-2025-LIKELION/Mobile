import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@/components/AppText";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useNotices } from "../hooks/useNotices";
import { styles } from "./NoticesScreen.styles";
export function NoticesScreen() {
  const notices = useNotices();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScreenHeader
        title="공지사항"
        light
        onBack={notices.goBack}
        onTitleLongPress={__DEV__ ? notices.nextScenario : undefined}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {notices.loading ? (
          <AppText accessibilityRole="progressbar" style={styles.loading}>
            공지사항을 불러오는 중입니다.
          </AppText>
        ) : notices.error ? (
          <View style={styles.errorBox}>
            <AppText accessibilityRole="alert" style={styles.errorText}>
              공지사항을 불러오지 못했습니다.
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={notices.retry}
              style={styles.retry}
            >
              <AppText style={styles.errorText}>다시 시도</AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.top}>
              <AppText
                accessibilityRole="header"
                style={[styles.sectionTitle, styles.light]}
              >
                중요 공지
              </AppText>
              <View style={styles.importantList}>
                {notices.important.length ? (
                  notices.important.map((item) => (
                    <View key={item.id} style={styles.importantRow}>
                      <AppText style={styles.importantTitle}>
                        {item.title}
                      </AppText>
                      <AppText style={styles.importantDate}>
                        {item.date}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText style={styles.empty}>
                    등록된 중요 공지가 없습니다.
                  </AppText>
                )}
              </View>
            </View>
            <View style={styles.news}>
              <AppText accessibilityRole="header" style={styles.sectionTitle}>
                소식
              </AppText>
              <View style={styles.newsList}>
                {notices.news.length ? (
                  notices.news.map((item) => (
                    <View key={item.id} style={styles.newsItem}>
                      <AppText style={styles.newsTitle}>{item.title}</AppText>
                      <AppText style={styles.newsDate}>{item.date}</AppText>
                      <AppText style={styles.newsContent}>
                        {item.content}
                      </AppText>
                    </View>
                  ))
                ) : (
                  <AppText style={styles.empty}>
                    등록된 소식이 없습니다.
                  </AppText>
                )}
              </View>
              {notices.hasMore && (
                <Pressable
                  accessibilityRole="button"
                  onPress={notices.more}
                  style={styles.more}
                >
                  <AppText style={styles.moreText}>더보기</AppText>
                </Pressable>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
