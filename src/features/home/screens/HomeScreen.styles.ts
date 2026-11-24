import { StyleSheet } from "react-native";
import { colors, fonts } from "@/styles/theme";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  statusBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  statusText: { color: colors.primary, textAlign: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 60,
  },
  headerActions: { flexDirection: "row" },
  headerButton: {
    minWidth: 40,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: { width: 20, height: 22 },
  scroll: { flex: 1, backgroundColor: colors.secondary },
  scrollContent: { flexGrow: 1 },
  feed: {
    zIndex: 3,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  dismissFilter: { ...StyleSheet.absoluteFill, zIndex: 1 },
  emptySubText: {
    color: colors["grey-400"],
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    letterSpacing: -0.28,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontFamily: fonts.quoteBold,
    color: colors["grey-400"],
    textAlign: "center",
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.36,
  },
});
