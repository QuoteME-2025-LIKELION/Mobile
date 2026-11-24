import { StyleSheet } from "react-native";
import { colors, fonts } from "@/styles/theme";

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 36,
  },
  search: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors["grey-00"],
    paddingHorizontal: 10,
    gap: 8,
  },
  searchIcon: { width: 14, height: 14 },
  searchInput: { fontFamily: fonts.body, color: colors["grey-950"], flex: 1 },
  clear: {
    minWidth: 32,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.quoteBold,
    color: colors.black,
    fontSize: 16,
    letterSpacing: -0.32,
  },
  guide: {
    paddingVertical: 64,
    textAlign: "center",
    color: colors.territory,
    fontSize: 14,
  },
  pending: { gap: 15 },
  footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  link: {
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: -0.28,
  },
});
