import { StyleSheet } from "react-native";
import { colors } from "@/styles/theme";
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.secondary },
  list: { padding: 24, paddingBottom: 60 },
  empty: {
    marginVertical: 48,
    paddingHorizontal: 4,
    textAlign: "center",
    color: colors.territory,
    fontSize: 14,
    lineHeight: 22.4,
  },
  row: {
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors["grey-100"],
  },
  avatar: { width: 45, height: 45, borderRadius: 23 },
  info: { flex: 1, minWidth: 0, gap: 4, paddingHorizontal: 4 },
  name: {
    fontSize: 14,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: -0.28,
    color: colors.black,
  },
  bio: {
    fontSize: 12,
    lineHeight: 14.4,
    fontWeight: "400",
    letterSpacing: -0.28,
    color: colors.territory,
  },
  action: { minHeight: 44, paddingHorizontal: 4, justifyContent: "center" },
  actionText: {
    fontSize: 13,
    lineHeight: 18.2,
    fontWeight: "500",
    letterSpacing: -0.28,
    color: colors.territory,
  },
});
