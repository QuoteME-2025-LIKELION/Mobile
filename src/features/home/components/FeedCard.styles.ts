import { StyleSheet } from "react-native";
import { colors } from "@/styles/theme";

export const styles = StyleSheet.create({
  card: { gap: 20, width: "100%" },
  profile: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  profileInfo: { flex: 1, minWidth: 0, gap: 4 },
  nickname: {
    color: colors.black,
    fontSize: 13,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: -0.28,
  },
  bio: {
    color: colors.territory,
    fontSize: 11,
    lineHeight: 13.2,
    fontWeight: "500",
    letterSpacing: -0.28,
  },
  time: { color: colors.territory, fontSize: 11, fontWeight: "500" },
  more: { color: colors.territory, fontSize: 20 },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.territory,
    paddingVertical: 6,
    minHeight: 32,
  },
  tags: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  names: { flexShrink: 1, flexDirection: "row", flexWrap: "wrap", gap: 5 },
  name: {
    color: colors.black,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.24,
  },
  request: {
    color: colors.territory,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: -0.24,
  },
  icon: { width: 20, height: 20 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
});
